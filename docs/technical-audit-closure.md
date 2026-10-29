# Piel de Mar — auditoría técnica y de diseño

## Entorno y límites

- Rama de trabajo: `audit/fix-site-baseline`.
- Staging: https://sofi-ywgo.onrender.com/
- Pull request: https://github.com/cfferraris/Sofi/pull/1
- Producción y `main` permanecen fuera del alcance. No fusionar ni desplegar sin autorización explícita del PM.

## Estado verificado

Última revisión integral automatizada: commit `afed8307cd7dec9626c276893e025e33f8d8a5f6` (29 de octubre de 2026).

| Área | Resultado | Evidencia |
|---|---|---|
| Navegación y biblioteca | Aprobado en pruebas automatizadas | La biblioteca abre en una pestaña nueva, contiene 6 categorías ancladas y 18 recursos. Cada recurso tiene una ilustración SVG distinta. |
| Turnos y WhatsApp | Aprobado en staging | Flujo verificado con el navegador interceptando `window.open`; no se envió ningún mensaje real. El sitio no muestra el texto del mensaje ni botones de depuración en la confirmación. |
| Accesibilidad automatizada | Aprobado en las comprobaciones ejecutadas | Pruebas Playwright de escritorio/móvil y análisis Axe pasaron; no se encontraron errores de consola, errores de página, solicitudes fallidas ni imágenes fallidas en el informe publicado. Esto no certifica por sí solo conformidad WCAG. |
| Cabeceras y recursos desplegados | Aprobado en staging | La auditoría HTTP de staging pasó, incluidos los controles de seguridad y la verificación de los recursos desplegados. `X-Robots-Tag: noindex, follow` es una regla exclusiva de staging. |
| Lighthouse | Ejecutado; rendimiento por mejorar | Última medición: móvil Performance 77, Accessibility 100, SEO 69; escritorio Performance 60, Accessibility 100, SEO 69. LCP 4,4 s en ambos; CLS 0 móvil / 0,001 escritorio; TBT 80 ms móvil / 0 ms escritorio; FCP 2,8 s móvil / 2,7 s escritorio. Son mediciones puntuales, sujetas a variación. El SEO de staging está afectado por el noindex intencional. |

## Revisión de diseño pendiente del PM

- El LCP de 4,4 s sigue siendo el principal punto de rendimiento. Auditorías anteriores relacionaron parte del retraso con la transición de hero/contenido y la primera diapositiva. No se modificó esa experiencia visual sin decisión del PM.
- Las miniaturas únicas de los 18 recursos ya están implementadas con una hoja SVG compartida; las tarjetas mantienen el título, el contenido y los enlaces propios.
- La aprobación visual final de la biblioteca y del comportamiento del hero corresponde al PM.

## Reglas técnicas

- No usar `!important` en HTML ni CSS.
- No modificar imágenes/logos que el PM ya validó salvo evidencia de un fallo reproducible.
- No cambiar `main` ni producción durante esta auditoría.
- Ante una falla, corregir la causa y repetir la prueba; no alterar una expectativa para ocultar el defecto.

## Cierre

- [x] Pruebas estáticas y de navegador para escritorio/móvil aprobadas en staging.
- [x] Flujo de turnos comprobado sin enviar mensajes reales.
- [x] Cabeceras y recursos de staging comprobados.
- [x] Lighthouse ejecutado y métricas documentadas.
- [ ] PM revisa/aprueba el comportamiento visual del hero si se propone cambiarlo para mejorar LCP.
- [ ] PM da autorización explícita para la revisión final y cualquier fusión a `main`.

La política de privacidad, los datos comerciales y la identidad de los enlaces sociales requieren validación humana por la persona responsable antes de una publicación final.
