# Despliegue, verificación y rollback — Piel de Mar

## Alcance y reglas

- Repositorio: `cfferraris/Sofi`.
- Rama de trabajo autorizada: `audit/fix-site-baseline`.
- El servicio de Render publica una versión de prueba desde esa rama. Cada commit puede disparar un despliegue de staging.
- No modificar `main`, fusionar el PR ni cambiar la configuración del servicio sin autorización explícita.
- El sitio es estático. El formulario prepara un mensaje y abre WhatsApp; no hay backend ni confirmación automática de turnos.
- `pieldemar.com` todavía no está habilitado como dominio de producción. No verificar ni dar por publicado ese dominio durante esta etapa.

## Procedimiento de despliegue a staging

1. Confirmar que los cambios están en `audit/fix-site-baseline` y revisar el diff del commit.
2. Esperar a que Render termine el despliegue automático iniciado por el commit. No iniciar despliegues manuales simultáneos.
3. En Render, abrir el servicio estático correspondiente y verificar que el último despliegue figure como exitoso.
4. Registrar el SHA completo del commit que se pretende publicar y compararlo con el commit asociado al despliegue.
5. Abrir la URL de staging: https://sofi-ywgo.onrender.com/
6. Ejecutar las verificaciones de publicación que siguen. No considerar el cambio validado solo porque Render informa `Live`.

## Verificación posterior al despliegue

### Integridad de publicación

- Confirmar que el SHA publicado corresponde al commit esperado.
- Comparar el HTML servido con el archivo `index.html` de ese commit.
- Verificar que los recursos CSS y JS servidos corresponden a los archivos de la misma versión.
- Comprobar que `/robots.txt`, `/sitemap.xml` y `/privacidad.html` responden correctamente.
- Comprobar que no hay errores de consola, errores de carga de recursos ni rutas locales rotas.

### Prueba funcional mínima

- Abrir la página en escritorio y móvil.
- Comprobar navegación principal, menú móvil y carruseles manuales.
- Completar el formulario con datos ficticios, verificar la selección de franja y horario y comprobar que se prepara la URL de WhatsApp para el número confirmado `5493425004018`.
- No enviar el mensaje real. La prueba debe detenerse antes del envío.
- Verificar que el turno se presenta como pendiente de confirmación manual.
- Abrir la política de privacidad y comprobar el enlace de regreso al formulario.

### SEO de staging

- En esta etapa, las páginas llevan `noindex, follow` para evitar indexar la URL de staging antes de habilitar el dominio final.
- El canonical y el sitemap usan el dominio planificado `https://www.pieldemar.com`. No afirmar que el dominio esté registrado o publicado.
- **Antes de lanzar el dominio final:** quitar `noindex` de `index.html` y `privacidad.html`, verificar el canonical y el sitemap contra las URLs reales, y comprobar que el dominio final sirve HTTPS. Esa tarea requiere un cambio explícito de lanzamiento.
- `robots.txt` permite el rastreo para que los motores puedan leer la directiva `noindex`; no sustituirla por `Disallow: /` en esta estrategia.

## Cabeceras HTTP (configuradas en el panel de Render, no en el repositorio)

Render las aplica desde *Settings → Headers* del servicio estático `Sofi`. Si se recrea el servicio, hay que volver a cargarlas; sin ellas el sitio sigue funcionando pero pierde estas protecciones:

| Cabecera | Valor esperado |
|---|---|
| `X-Robots-Tag` | `noindex, follow` solo en staging. **Quitarla al lanzar el dominio final.** |
| `Content-Security-Policy` | Debe ser igual o más permisiva que la `<meta>` del HTML: `script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-src https://www.youtube.com https://wordwall.net https://www.youtube-nocookie.com`. `recursos.html` lleva su propia `<meta>` CSP con `frame-src https://wordwall.net https://www.youtube-nocookie.com` (juego y video incrustados); si la cabecera de Render fija un `frame-src`, debe incluir esos dos orígenes o el navegador los bloqueará. Ya no hace falta `unpkg.com` ni `unsafe-inline`. |
| `Strict-Transport-Security` | `max-age=31536000` (agregar `includeSubDomains` solo si todo el dominio es HTTPS) |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Mínimo necesario (p. ej. `camera=(), microphone=(), geolocation=()`) |

La auditoría `tests/production-audit.mjs` comprueba su presencia en cada push.

## Lighthouse y Core Web Vitals

La auditoría automatizada de publicación no equivale a una medición de Core Web Vitals. Antes de cerrar P2-A, ejecutar Lighthouse en la URL de staging en móvil y escritorio, guardar el informe JSON/HTML y registrar Performance, LCP, CLS, TBT como proxy de INP y oportunidades principales. INP real requiere datos de interacción de campo; no se debe presentar TBT como si fuera INP.

## Criterios de aprobación

El despliegue de staging puede considerarse aprobado solo si:

- el SHA publicado coincide con el esperado;
- CI está verde;
- no hay errores de consola, recursos o rutas;
- el flujo de turnos pasa sin enviar un mensaje real;
- `robots.txt`, `sitemap.xml` y la política de privacidad responden correctamente;
- se guardan enlaces al commit, ejecución de CI y evidencia de auditoría.

Si un control falla, no promover ni fusionar el cambio. Registrar el fallo y el SHA afectado.

## Rollback

1. Identificar el último SHA conocido como bueno a partir del historial de commits y de la ejecución CI asociada.
2. Preferir una reversión explícita del commit defectuoso mediante un nuevo commit de revert en `audit/fix-site-baseline`; no reescribir el historial ni usar force-push.
3. Si Render publicó una versión equivocada, confirmar primero qué SHA sirve realmente el sitio. No repetir el despliegue a ciegas.
4. Esperar a que Render termine el despliegue del revert y repetir las verificaciones de integridad y la prueba funcional mínima.
5. Si no se puede determinar el SHA publicado o el rollback no restaura la versión conocida como buena, detenerse y documentar el estado antes de continuar.

## Límites conocidos de P2

- Las imágenes originales se conservan; no se eliminan ni sobrescriben.
- La optimización binaria de las imágenes pesadas y la medición real de Lighthouse/CWV siguen pendientes hasta que se generen y validen derivados optimizados. No marcar P2-A como cerrado sin esos artefactos y mediciones.
- La titularidad legal, la titularidad del canal de YouTube y la publicación del dominio final quedan fuera del alcance de este procedimiento.
