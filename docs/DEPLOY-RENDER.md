# Despliegue de prueba — formulario de turnos

Esta configuración es para la rama de auditoría y no modifica ni despliega `main`.

## Servicios

El archivo `render.yaml` define:
- Un servicio web Node.js que sirve el sitio y expone `POST /api/appointments`.
- Una base PostgreSQL para registrar solicitudes.
- Un control de salud en `/api/health`.

Aplicar el Blueprint de Render desde el repositorio y seleccionar la rama `audit/fix-site-baseline`. El Blueprint crea un servicio de prueba separado llamado `sofi-appointments-audit`; no reemplaza automáticamente el servicio estático existente.

## Variables SMTP obligatorias

Completar en el servicio web, sin subirlas al repositorio:

- `SMTP_HOST`: servidor SMTP del proveedor de correo.
- `SMTP_PORT`: normalmente 587 para STARTTLS o 465 para TLS implícito; usar el valor documentado por el proveedor.
- `SMTP_SECURE`: `false` para STARTTLS en 587 o `true` para TLS implícito en 465.
- `SMTP_USER` y `SMTP_PASS`: credenciales SMTP.
- `SMTP_FROM`: remitente autorizado por el proveedor; opcional si `SMTP_USER` sirve como remitente.
- `CONTACT_EMAIL`: destino de las notificaciones; el valor inicial es `contacto@pieldemar.com`.
- `DATA_RETENTION_DAYS`: período de retención de la base; el valor inicial es 90 días.

No usar la contraseña habitual de la cuenta de correo si el proveedor ofrece credenciales SMTP específicas o contraseñas de aplicación. No incluir credenciales en GitHub, documentos públicos ni mensajes del formulario.

## Verificación antes de aceptar la etapa

1. Esperar a que el servicio web y PostgreSQL estén disponibles.
2. Abrir `/api/health`; debe responder HTTP 200 con `{"ok":true}`.
3. Enviar una solicitud de prueba con datos ficticios.
4. Confirmar que aparece el mensaje exacto de registro y el único botón «Explorar el contenido gratuito».
5. Confirmar que llega un correo a `CONTACT_EMAIL` y que el registro existe en PostgreSQL.
6. Probar datos inválidos, fecha pasada, horarios cruzados, campo honeypot y límites de envío.
7. Confirmar que las rutas `/server.js`, `/data/appointments.json`, `/docs/`, `/tests/` y `/.env.example` no son accesibles públicamente.
8. Verificar en escritorio y móvil, y revisar el texto de privacidad con la responsable antes de producción.

## Estado y límites

Las pruebas automáticas verifican sintaxis, validación de datos y estructura estática. No reemplazan una prueba real de SMTP y PostgreSQL. Hasta completar los pasos anteriores, el formulario no debe anunciarse como operativo. No fusionar el PR ni publicar en producción sin autorización explícita.
