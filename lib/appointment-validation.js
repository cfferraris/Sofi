const SLOTS = {
  morning: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
  afternoon: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30']
};

function argentineToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function validateAppointment(body, now = new Date()) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const insurance = typeof body.insurance === 'string' ? body.insurance.trim() : '';
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  const date = typeof body.date === 'string' ? body.date : '';
  const period = typeof body.period === 'string' ? body.period : '';
  const time = typeof body.time === 'string' ? body.time : '';
  const consent = body.consent === true;
  const website = typeof body.website === 'string' ? body.website.trim() : '';

  if (website) return { ok: false, message: 'No pudimos procesar la solicitud.' };
  if (!name || !insurance || !reason || !date || !period || !time || !consent) {
    return { ok: false, message: 'Completá todos los campos obligatorios y aceptá el aviso de privacidad.' };
  }
  if (name.length > 120 || insurance.length > 120 || reason.length > 500) {
    return { ok: false, message: 'Revisá la longitud de los campos ingresados.' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, message: 'Elegí una fecha válida.' };
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    return { ok: false, message: 'Elegí una fecha válida.' };
  }
  if (date < argentineToday(now)) return { ok: false, message: 'La fecha elegida ya pasó.' };
  if (date === argentineToday(now)) return { ok: false, message: 'Elegí una fecha a partir de mañana.' };
  if (!Object.hasOwn(SLOTS, period) || !SLOTS[period].includes(time)) {
    return { ok: false, message: 'Elegí una franja y un horario válido.' };
  }
  return { ok: true, value: { name, insurance, reason, date, period, time } };
}

export { SLOTS, argentineToday };
