# Nota de despliegue — diseño de API descartado

**Estado: obsoleto. No aplicar las instrucciones históricas de este documento.**

El flujo aprobado para solicitar turnos es estático y utiliza WhatsApp con un mensaje precargado. No requiere servicio Node.js, endpoint `/api/appointments`, PostgreSQL, SMTP, credenciales ni un Blueprint de Render. La configuración de backend fue retirada de la rama de auditoría porque no corresponde al alcance funcional.

Para el comportamiento vigente, consultar [la especificación de turnos](ESPECIFICACION-TURNOS.md). La publicación del sitio debe realizarse mediante el servicio estático ya configurado, después de revisar y aprobar los cambios de la rama de auditoría. No fusionar ni desplegar esta rama sin autorización explícita.
