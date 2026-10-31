# Piel de Mar — cierre de auditoría técnica P0/P1

## Entorno y límites

- Rama de trabajo: `audit/fix-site-baseline`.
- Staging: https://sofi-ywgo.onrender.com/
- Pull request: https://github.com/cfferraris/Sofi/pull/1
- `main` y producción permanecen fuera del alcance. No fusionar ni desplegar sin autorización explícita.

## Estado verificado — 29 de octubre de 2026

| Área | Resultado | Evidencia |
|---|---|---|
| Turnos y WhatsApp | Aprobado en staging | Selector de franja y horario en el mismo cuadro; validación de campos; mensaje preparado para WhatsApp; al continuar, formulario y botón se ocultan y queda el estado de solicitud con el enlace a recursos. La prueba intercepta la apertura y no envía mensajes reales. |
| Privacidad técnica del formulario | Aprobado | El sitio no envía los campos a una API, no usa backend ni persiste los datos en almacenamiento local o base de datos. El usuario decide si envía el mensaje por WhatsApp. |
| Biblioteca de recursos | Implementado y probado | Abre en pestaña aparte; menú lateral con seis anclas y seis categorías: Desarrollo infantil, Crianza respetuosa, Regulación emocional, Juego y estimulación, Lecturas y explicaciones, Guías y materiales. Hay 18 tarjetas de recursos con contenido y destinos propios. Cada categoría tiene una ilustración SVG; no hay una miniatura distinta por cada recurso. |
| Accesibilidad automatizada | Aprobado en las comprobaciones ejecutadas | Pruebas estáticas y Playwright en escritorio/móvil aprobadas; Lighthouse Accessibility 100 y Best Practices 100 en la última medición. No equivale a certificación completa WCAG 2.2 AA. |
| Cabeceras y recursos publicados | Aprobado en staging | La auditoría HTTP más reciente dio `PASS`. Confirmó `X-Robots-Tag: noindex, follow`, CSP HTTP, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY` y `Permissions-Policy`. El noindex se aplica exclusivamente a staging. |
| Logos aprobados | Restaurados y protegidos | Los archivos `assets/img/logos/Isotipo2/Azul.webp` y `assets/img/logos/LogoPrincipal/Verde.webp` se restauraron a sus versiones anteriores. El workflow de pruebas ya no vuelve a generarlos automáticamente. |
| Hero y rendimiento | Optimización aplicada; resultado variable | Se simplificó la transición de entrada para evitar revelar el contenido con temporizadores y desplazar toda la página. Una ejecución de referencia (29/10/2026, 11:21 UTC; [run 40864645809](https://github.com/cfferraris/Sofi/actions/runs/40864645809)) midió móvil: Performance 81, LCP 4,2 s, CLS 0, TBT 0 ms, FCP 2,7 s; escritorio: Performance 79, LCP 2,3 s, CLS 0, TBT 40 ms, FCP 1,0 s. Otras ejecuciones recientes dieron resultados distintos; una sola corrida no demuestra una mejora estable. SEO 69 en staging está afectado por el noindex intencional. |

## Validaciones humanas que siguen pendientes

- La política de privacidad `privacidad.html` necesita revisión final de la persona responsable/legal, especialmente identidad del responsable del tratamiento y datos de contacto para ejercer derechos. No inventar esa identidad ni publicar datos de prueba como confirmados.
- Correo electrónico y perfiles sociales siguen siendo provisionales; confirmar titularidad y datos antes de una publicación final.
- Si se requiere aprobación visual final, revisar en staging la biblioteca y la transición del hero en dispositivos reales.

## Reglas técnicas

- No usar `!important` en HTML ni CSS.
- No modificar imágenes o logos previamente validados salvo fallo reproducible y autorización.
- No tocar `main` ni producción durante esta auditoría.
- Ante una falla, corregir la causa y repetir la prueba; no alterar una expectativa para ocultar el defecto.

## Cierre

- [x] Pruebas estáticas: 31 pasaron, 0 fallaron.
- [x] Prueba de navegador del flujo de turnos: 5 pasaron, 0 fallaron; sin mensajes reales enviados.
- [x] Auditoría HTTP de staging: `PASS`.
- [x] Lighthouse ejecutado en móvil y escritorio; métricas registradas con su variabilidad.
- [x] Logos restaurados y automatización corregida para no reescribirlos.
- [ ] Revisión legal/comercial de los datos pendientes.
- [ ] Autorización explícita para sacar el PR del borrador o fusionar a `main`.

El PR permanece abierto y en borrador. No se fusiona sin autorización explícita.

## Actualización — 30 de octubre de 2026 (auditoría completa y ajustes)

- Horario de atención confirmado por la propietaria: lunes a viernes, horario cortado (8:00–12:00 y 16:00–20:00). El formulario valida día hábil y fecha desde mañana; el texto de contacto y el JSON-LD usan el mismo horario.
- Nueva transición de presentación de marca (logo con desenfoque suave, línea de marca y telón que sube). Solo usa `transform` y `opacity`, se omite con `prefers-reduced-motion` y se puede saltear con un clic. Medir Lighthouse antes de dar por cerrada su incidencia en LCP.
- Pruebas: 31 estáticas y 7 de navegador aprobadas en local.

### Resuelto después de la auditoría completa

- **Logos con recuadro (causa raíz):** `scripts/optimize_images.py` convertía los PNG de paleta a RGB (perdía la transparencia) y los reducía antes de convertir. Se corrigió, los logos se guardan sin pérdida con alfa y coinciden pixel a pixel con los PNG aprobados. El umbral de CI del isotipo pasó de 5 KB a 10 KB (el archivo con transparencia pesa 8 KB).
- **Fuentes:** las 13 tipografías de marca se sirven en WOFF2 sin recortar glyphs (1,1 MB → 0,4 MB); los TTF quedan como respaldo.
- **Formulario de turnos:** si WhatsApp no se abre hay «Abrir WhatsApp», «Copiar mensaje» y «Editar mis datos»; el mensaje no se renderiza ni se guarda.
- **Accesibilidad:** el menú móvil cerrado ya no recibe foco; el `h1` vive en `main`.
- **Iconos y CSP:** sin scripts de terceros; la CSP queda en `script-src 'self'` y `style-src 'self'`, sin `unsafe-inline`.
- **Metadatos:** canonical y Open Graph en `recursos.html` y `privacidad.html`.
- **CI:** se retiraron 5 workflows de un solo uso con permiso de escritura. `finalize-browser-tests` reescribía `package.json` y quitaba la prueba de turnos de `test:e2e`.
- **Testimonios:** se retiró la sección vacía «Opiniones de las familias» y su JavaScript. Reincorporarla solo con testimonios reales y autorizados.
- **Ronda de ajustes de UX:** el menú «Recursos» lleva a la sección del home; el botón flotante abre WhatsApp; el formulario de turnos es compacto (visible entero en escritorio; en celular de 360 px aún requiere un poco de scroll); el contacto no repite datos; el home muestra 6 recursos, uno por sección de la biblioteca.
- **Biblioteca de recursos:** secciones colapsadas, un recurso por vez, ilustración de la sección en cada ítem y en el encabezado, lecturas con panel de scroll interno y juego/video incrustados al abrir (Wordwall y YouTube con `youtube-nocookie`). La CSP de Render debe permitir `https://wordwall.net` y `https://www.youtube-nocookie.com` en `frame-src`. Textos de los recursos: borrador para revisión de la profesional.
- **Modo oscuro forzado en móviles:** `color-scheme: only light` para evitar que Samsung Internet oscurezca los tonos arena (sin verificar en dispositivo).

### Pendientes

- CSS duplicado y reglas sin uso (incluidas las de testimonios): limpiar solo con comparación visual.
- PNG originales sin referencia y logos de otras paletas: eliminar solo con autorización.
- Revisión legal de `privacidad.html`, correo y redes sociales (titularidad).
- Cabeceras HTTP: viven en el panel de Render; ver `docs/DEPLOY-RENDER.md`.
- Medir Lighthouse con la nueva transición y las fuentes WOFF2.
