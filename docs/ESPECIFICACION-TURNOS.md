# Especificación funcional — Solicitud de turnos por WhatsApp

**Estado:** requisito confirmado; implementación pendiente de auditoría técnica y validación en navegador.  
**Objetivo:** reemplazar el enlace genérico de WhatsApp y el archivo de horarios legado por un flujo claro para solicitar un turno, sin dar a entender que la cita está confirmada automáticamente.

## Flujo del paciente

1. En la sección «Consulta», el usuario elige una fecha y un horario deseados entre las opciones que el sitio ofrece.
2. Completa los campos requeridos:
   - Nombre.
   - Obra social.
   - Motivo de la consulta/turno.
3. El sitio valida los campos y construye un mensaje legible con fecha, hora y datos ingresados.
4. El sitio abre un enlace de WhatsApp dirigido al número de contacto de Piel de Mar ya configurado en el sitio, con el mensaje precargado. El usuario debe enviarlo manualmente.
5. Después de abrir WhatsApp, la página informa claramente: **«Tu solicitud todavía no es un turno confirmado. El turno queda confirmado únicamente cuando recibas una respuesta de Piel de Mar por WhatsApp.»**
6. El texto precargado también debe indicar que se está solicitando un turno y que queda pendiente de confirmación.

## Mensaje de WhatsApp

Plantilla orientativa:

Hola, quiero solicitar un turno con Piel de Mar.

- Nombre: [nombre]
- Obra social: [obra social]
- Motivo de la consulta: [motivo]
- Fecha deseada: [fecha]
- Horario deseado: [hora]

Entiendo que este mensaje es una solicitud y que el turno queda confirmado únicamente cuando reciba una respuesta de Piel de Mar por WhatsApp.

## Reglas de producto

- No marcar un turno como reservado o confirmado al seleccionar fecha/hora, ni al abrir WhatsApp, ni al enviar el mensaje.
- No afirmar que un horario está disponible en tiempo real a menos que exista una fuente de disponibilidad fiable y actualizada.
- Las fechas y horarios deben mostrarse en la zona horaria local de la atención (Argentina, salvo que la propietaria indique otra).
- Mostrar fechas y horas en formato local legible; no depender de la interpretación de formatos ambiguos.
- Validar campos obligatorios y prevenir que texto ingresado rompa la URL de WhatsApp; codificar el mensaje completo con el mecanismo estándar de URL encoding.
- Proporcionar etiquetas accesibles, mensajes de validación claros, navegación por teclado y diseño usable en móvil.
- No guardar nombre, obra social ni motivo de consulta en `localStorage`, logs, analítica ni archivos públicos.
- El motivo puede incluir información personal sensible. Solicitar sólo el detalle necesario para que la propietaria entienda el motivo, informar que se enviará por WhatsApp y evitar pedir información clínica detallada en este formulario.
- Mantener el número de WhatsApp como configuración única; validar con la propietaria que el número existente siga siendo el correcto antes del lanzamiento.
- Si WhatsApp no está instalado o disponible, el usuario debe poder copiar el mensaje o ver una alternativa de contacto clara.
- No borrar ni reutilizar como disponibilidad actual las fechas de 2025 presentes en `data/appointments.json`.

## Restricción técnica importante

El sitio actual es estático (HTML, CSS y JavaScript). Un formulario que sólo abre WhatsApp **no puede confirmar disponibilidad ni bloquear un horario**. Tampoco puede saber si el cliente finalmente envió el mensaje. El aviso posterior debe decir «si ya enviaste el mensaje...» o aclarar que se abrió WhatsApp para completar el envío.

Este flujo elimina la necesidad de revisar el JSON para interpretar solicitudes sólo si se abandona el archivo como registro de solicitudes. Sin embargo, la propietaria todavía tendrá que revisar los mensajes de WhatsApp y confirmar cada turno manualmente. Para impedir superposiciones de horarios se necesitaría además una agenda centralizada, integración de calendario o backend que gestione disponibilidad y reservas.

## Criterios de aceptación

- El usuario puede seleccionar una fecha y un horario deseados desde controles accesibles.
- El formulario requiere nombre, obra social y motivo; muestra errores sin perder los datos ingresados.
- El enlace generado abre el número correcto y contiene todos los campos, correctamente codificados y legibles.
- El formulario no declara el turno confirmado ni asegura disponibilidad real.
- La pantalla informa que el usuario debe enviar el mensaje en WhatsApp y esperar la respuesta de la propietaria.
- No se exponen datos del paciente en archivos públicos ni se persisten en el navegador.
- Las fechas antiguas de `data/appointments.json` no se ofrecen como turnos disponibles.
- Se prueba en móvil y escritorio, con teclado y con WhatsApp instalado y no instalado.
- La propietaria valida el texto, el número de destino, la forma de mostrar disponibilidad y el mensaje de confirmación antes de publicar.

## Decisión pendiente antes de implementación

Definir quién mantiene el calendario de fechas y horarios que el sitio permite solicitar. Opciones:
1. Lista editable por la propietaria (fácil de implementar, pero no evita solapamientos por sí sola).
2. Agenda/calendario integrado como fuente real de disponibilidad.
3. Backend de turnos que gestione disponibilidad, solicitudes y confirmaciones.

No implementar una falsa «disponibilidad en tiempo real» con un JSON estático desactualizado.
