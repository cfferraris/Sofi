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
