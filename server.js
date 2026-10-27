import express from 'express';
import pg from 'pg';
import nodemailer from 'nodemailer';
import { validateAppointment } from './lib/appointment-validation.js';

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 3000);
const retentionDays = Number(process.env.DATA_RETENTION_DAYS || 90);
const recipient = process.env.CONTACT_EMAIL || 'contacto@pieldemar.com';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
for (const key of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']) {
  if (!process.env[key]) throw new Error(`${key} is required`);
}
if (!Number.isInteger(retentionDays) || retentionDays < 30 || retentionDays > 365) {
  throw new Error('DATA_RETENTION_DAYS must be an integer between 30 and 365');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});
const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: String(process.env.SMTP_SECURE || 'false') === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000
});

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(express.json({ limit: '12kb', type: 'application/json' }));

const rateBuckets = new Map();
function rateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const windowMs = 15 * 60 * 1000;
  const current = rateBuckets.get(key);
  if (!current || current.expiresAt <= now) {
    rateBuckets.set(key, { count: 1, expiresAt: now + windowMs });
    return next();
  }
  current.count += 1;
  if (current.count > 8) return res.status(429).json({ ok: false, message: 'Se recibieron demasiados intentos. Esperá unos minutos e intentá nuevamente.' });
  next();
}
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateBuckets) if (value.expiresAt <= now) rateBuckets.delete(key);
}, 5 * 60 * 1000).unref();

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

app.post('/api/appointments', rateLimit, async (req, res) => {
  if (!req.is('application/json')) {
    return res.status(415).json({ ok: false, message: 'Formato de solicitud no válido.' });
  }
  const validation = validateAppointment(req.body || {});
  if (!validation.ok) {
    return res.status(400).json({ ok: false, message: validation.message });
  }

  const { name, insurance, reason, date, period, time } = validation.value;
  let saved;
  try {
    const result = await pool.query(
      `INSERT INTO appointment_requests
       (name, insurance, reason, requested_date, period, requested_time, notification_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, created_at`,
      [name, insurance, reason, date, period, time]
    );
    saved = result.rows[0];
  } catch {
    return res.status(503).json({ ok: false, message: 'No pudimos registrar la solicitud en este momento. Intentá nuevamente más tarde o contactanos por los medios del sitio.' });
  }

  const dateLabel = new Date(`${date}T12:00:00-03:00`).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires'
  });
  const periodLabel = period === 'morning' ? 'Mañana' : 'Tarde';
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipient,
      subject: `Nueva solicitud de turno #${saved.id} — Piel de Mar`,
      text: [
        'Se registró una nueva solicitud de turno.',
        '',
        `Número de solicitud: ${saved.id}`,
        `Fecha de recepción: ${new Date(saved.created_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`,
        `Nombre: ${name}`,
        `Obra social o cobertura: ${insurance}`,
        `Motivo: ${reason}`,
        `Fecha deseada: ${dateLabel}`,
        `Franja horaria: ${periodLabel}`,
        `Horario deseado: ${time}`,
        '',
        'La solicitud no es una reserva confirmada. Contactá a la persona para confirmar o proponer otro horario.'
      ].join('\n')
    });
    await pool.query('UPDATE appointment_requests SET notification_status = $1, notified_at = NOW() WHERE id = $2', ['sent', saved.id]);
  } catch {
    // No se registran datos personales en logs. La solicitud permanece guardada para revisión.
    await pool.query('UPDATE appointment_requests SET notification_status = $1 WHERE id = $2', ['failed', saved.id]).catch(() => {});
    return res.status(503).json({ ok: false, message: 'La solicitud quedó registrada, pero falló el aviso automático. Por favor contactanos por el correo o teléfono publicado en el sitio antes de volver a enviarla.' });
  }

  return res.status(201).json({ ok: true });
});

app.use(express.static('.', {
  dotfiles: 'deny',
  index: 'index.html',
  extensions: ['html'],
  setHeaders(res, path) {
    if (path.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  }
}));

app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.too.large') return res.status(413).json({ ok: false, message: 'El formulario supera el tamaño permitido.' });
  res.status(400).json({ ok: false, message: 'No pudimos procesar la solicitud.' });
});

async function start() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointment_requests (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      name VARCHAR(120) NOT NULL,
      insurance VARCHAR(120) NOT NULL,
      reason VARCHAR(500) NOT NULL,
      requested_date DATE NOT NULL,
      period VARCHAR(20) NOT NULL CHECK (period IN ('morning', 'afternoon')),
      requested_time VARCHAR(5) NOT NULL,
      notification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
      notified_at TIMESTAMPTZ
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS appointment_requests_created_at_idx ON appointment_requests (created_at)');
  await pool.query('DELETE FROM appointment_requests WHERE created_at < NOW() - ($1::integer * INTERVAL \'1 day\')', [retentionDays]);
  setInterval(() => {
    pool.query('DELETE FROM appointment_requests WHERE created_at < NOW() - ($1::integer * INTERVAL \'1 day\')', [retentionDays]).catch(() => {});
  }, 24 * 60 * 60 * 1000).unref();
  app.listen(port, '0.0.0.0', () => {
    // Do not print user-submitted data or credentials.
    console.log(`Piel de Mar appointment service listening on port ${port}`);
  });
}

start().catch(() => {
  console.error('Appointment service startup failed: check database and SMTP configuration.');
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await pool.end().catch(() => {});
  process.exit(0);
});
