# Piel de Mar — sitio web

Sitio institucional estático de Piel de Mar, orientado a presentar los servicios de acompañamiento familiar y facilitar el contacto.

## Estructura

- `index.html`: contenido, metadatos SEO, datos estructurados y navegación.
- `css/styles.css`: estilos, identidad visual, tipografías locales y comportamiento responsive.
- `js/main.js`: iconos, solicitud de turnos por WhatsApp, transición inicial, navegación móvil y slider introductorio.
- `css/noscript.css`: estilos de respaldo cuando JavaScript está desactivado.
- `assets/img/`: imágenes, fondos y variantes de logotipos.
- `assets/icons/`: iconos SVG.
- `assets/tipografias/`: fuentes locales.
- `data/appointments.json`: datos históricos de disponibilidad de 2025; no son consumidos por el sitio y no deben mostrarse como horarios actuales.
- `privacidad.html`: aviso sobre el tratamiento de datos al preparar una solicitud por WhatsApp.
- `docs/ESPECIFICACION-TURNOS.md`: flujo funcional y criterios de aceptación de turnos.

## Ejecución local

No se identifica un paso de compilación ni un gestor de paquetes para este sitio estático. Desde la raíz del repositorio, ejecutar:

```bash
python -m http.server 8000
```

Abrir `http://localhost:8000`. Para una validación real, probar también en un navegador móvil y en uno de escritorio. Abrir el HTML directamente mediante `file://` no reemplaza la prueba con servidor HTTP.

## Accesibilidad

Los sliders son manuales y no rotan automáticamente. El workflow ejecuta una comprobación automatizada axe-core sobre la página principal y la política de privacidad; esto no sustituye una revisión manual con teclado, lector de pantalla y comprobación visual de contraste.

## Pruebas estáticas

Con Node.js instalado, ejecutar desde la raíz:

```bash
node --test tests/*.test.mjs
```

Las pruebas comprueban rutas locales, referencias internas, IDs duplicados y regresiones concretas de los controles del slider y del año del footer. No reemplazan las pruebas visuales y funcionales en navegador.

## Dependencias externas

- No hay scripts de terceros. Los iconos (Lucide v0.468.0, licencia ISC) están incluidos en `js/main.js` como `LUCIDE_ICONS`; para agregar uno, copiar su contenido SVG desde `lucide-static@0.468.0` y usar `<i data-lucide="nombre">`.
- La CSP (`<meta>`) es estricta: `script-src 'self'` y `style-src 'self'`; no se permiten estilos ni scripts en línea. El respaldo sin JavaScript vive en `css/noscript.css`.
- El contacto publicado se limita al WhatsApp confirmado y a la dirección confirmada. El email y los perfiles sociales no se publican como datos verificados hasta que se confirme su titularidad.

## Estado de calidad

Consultar [la auditoría inicial y el plan de remediación](docs/AUDITORIA-BASE.md). Las pruebas estáticas no reemplazan las pruebas de navegador. Antes de publicar, verificar en escritorio y móvil el selector de franja y horario, el número de WhatsApp, el enlace precargado y la alternativa de copia.


## SEO y publicación

- `robots.txt` y `sitemap.xml` describen las URLs previstas del dominio final.
- Mientras se trabaja únicamente en la URL de staging, el `noindex, follow` se aplica con la cabecera HTTP `X-Robots-Tag` configurada en Render (no hay etiqueta `<meta name="robots">` en el HTML). Ver «Cabeceras HTTP» en [DEPLOY-RENDER.md](docs/DEPLOY-RENDER.md).
- Antes de habilitar el dominio final, revisar las instrucciones de lanzamiento y verificación en [DEPLOY-RENDER.md](docs/DEPLOY-RENDER.md). No quitar `noindex` hasta que el dominio final esté listo.
