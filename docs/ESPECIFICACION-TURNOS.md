# Especificación funcional — Solicitud y registro de turnos

**Estado:** requisito confirmado; implementación pendiente de auditoría técnica y validación en navegador.  
**Objetivo:** reemplazar el enlace genérico de WhatsApp y el archivo de horarios legado por un flujo claro para solicitar un turno, sin dar a entender que la cita está confirmada automáticamente.

## Flujo del paciente

1. En la sección «Consulta», el usuario elige una fecha futura y una franja horaria (mañana o tarde). Luego elige un horario en intervalos de 30 minutos: mañana de 08:00 a 11:30 (último inicio dentro de la franja 08:00–12:00) o tarde de 16:00 a 19:30 (último inicio dentro de la franja 16:00–20:00). Esos controles registran una preferencia; no representan disponibilidad verificada ni una confirmación.
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
- Franja horaria: [mañana/tarde]\n- Horario deseado: [hora]

Entiendo que este mensaje es una solicitud y que el turno queda confirmado únicamente cuando reciba una respuesta de Piel de Mar por WhatsApp.

## Reglas de producto

- No marcar un turno como reservado o confirmado al seleccionar fecha/hora, ni al abrir WhatsApp, ni al enviar el mensaje.
- No afirmar que un horario está disponible en tiempo real a menos que exista una fuente de disponibilidad fiable y actualizada. En la primera versión, el cliente solicita el día y la hora que prefiere, sujetos a confirmación.
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

## Alcance de la primera versión

La primera versión usa un selector de fecha futura, un selector de franja (mañana/tarde) y un selector de horario con intervalos de 30 minutos: 08:00–11:30 y 16:00–19:30. No consulta ni promete disponibilidad en tiempo real. La propietaria verifica la solicitud al recibir el mensaje y responde por WhatsApp confirmando el horario o proponiendo otro. Así se elimina la necesidad de auditar manualmente `data/appointments.json` para leer solicitudes, aunque la confirmación y la prevención de superposiciones siguen siendo manuales.

Si más adelante se necesita mostrar únicamente horarios realmente disponibles o evitar reservas superpuestas, deberá añadirse una agenda centralizada o backend. No implementar una falsa «disponibilidad en tiempo real» con un JSON estático desactualizado.


## Estado de implementación — rama de auditoría (2026-10-27)

El flujo debe ser completamente estático y funcionar en el navegador: no se envían datos a una API, base de datos ni correo electrónico. La persona elige fecha futura, franja (mañana o tarde) y luego un horario de inicio en intervalos de 30 minutos; el formulario prepara un mensaje codificado para el WhatsApp configurado, muestra el mensaje y ofrece enlaces de apertura y copia como respaldo. La persona debe enviarlo manualmente.

La lista de horarios es una preferencia solicitada, no disponibilidad real. El turno solo se confirma cuando Piel de Mar responde. El número configurado es el que ya utiliza el sitio (`5493425004018`) y debe ser confirmado por la propietaria antes del lanzamiento. No se persisten los datos del formulario en el navegador ni en un backend del sitio.

La validación final requiere pruebas de navegador en escritorio y móvil, incluido el caso en que WhatsApp no se abra, además de confirmar el número y publicar la política de privacidad.


## Ajuste de selector horario — 2026-10-27

Requisito confirmado: separar la elección en franja horaria (mañana o tarde) y horario. Los turnos comienzan cada 30 minutos, entre 08:00 y 11:30 por la mañana y entre 16:00 y 19:30 por la tarde. El último turno puede comenzar a las 11:30 o 19:30, respectivamente. El formulario no afirma que esos horarios estén disponibles; quedan sujetos a confirmación manual.
