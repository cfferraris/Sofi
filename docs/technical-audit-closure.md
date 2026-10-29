# Piel de Mar — auditoría técnica y de diseño

## Entorno y límites

- Rama de trabajo: `audit/fix-site-baseline`.
- Staging: https://sofi-ywgo.onrender.com/
- Pull request: https://github.com/cfferraris/Sofi/pull/1
- Producción y `main` permanecen fuera del alcance. No fusionar ni desplegar sin autorización explícita del PM.

## Estado verificado

Última revisión funcional y HTTP de staging: commit `b560eb64b3d2c4de28db5c184f0e5797e66f7a09` (29 de octubre de 2026). Las mediciones Lighthouse recientes cubren el mismo código de aplicación; los commits intermedios posteriores al SHA `7e8bed5d94fb7c57b2e3f21bfe6f31537bb7d2cc` ajustaron automatización de CI, documentación y pruebas, no el comportamiento visual.

| Área | Resultado | Evidencia |
|---|---|---|
| Navegación y biblioteca | Aprobado en pruebas automatizadas | La biblioteca abre en una pestaña nueva, contiene 6 categorías ancladas y 18 recursos. Cada recurso tiene una ilustración SVG distinta. |
| Turnos y WhatsApp | Aprobado en staging | Flujo verificado con el navegador interceptando `window.open`; no se envió ningún mensaje real. El sitio no muestra el texto del mensaje ni botones de depuración en la confirmación. |
| Accesibilidad automatizada | Aprobado en las comprobaciones ejecutadas | Pruebas Playwright de escritorio/móvil y análisis Axe pasaron; no se encontraron errores de consola, errores de página, solicitudes fallidas ni imágenes fallidas en el informe publicado. Esto no certifica por sí solo conformidad WCAG. |
| Cabeceras y recursos desplegados | Aprobado en staging | La auditoría HTTP de staging pasó, incluidos los controles de seguridad y la verificación de los recursos desplegados. `X-Robots-Tag: noindex, follow` es una regla exclusiva de staging. |
| Lighthouse | Ejecutado; rendimiento por mejorar | En ejecuciones registradas hasta el 29/10/2026 02:40 UTC, Performance osciló entre 47 y 81 en móvil y entre 60 y 67 en escritorio; Accessibility fue 100 y SEO 69. Medición de referencia (run [40807622268](https://github.com/cfferraris/Sofi/actions/runs/40807622268)): móvil Performance 81, LCP 4,2 s, CLS 0, TBT 30 ms y FCP 2,4 s; escritorio Performance 67, LCP 4,5 s, CLS 0,001, TBT 20 ms y FCP 1,1 s. En el conjunto observado, LCP varió entre 4,2 y 5,5 s y TBT móvil entre 30 y 1.160 ms. La variación es alta y no permite afirmar una mejora estable. El SEO de staging está afectado por el noindex intencional. |

## Revisión de diseño pendiente del PM

- El LCP más reciente fue de 5,5 s en móvil y 4,2 s en escritorio, con variaciones grandes entre ejecuciones; sigue siendo el principal punto de rendimiento. Auditorías anteriores relacionaron parte del retraso con la transición de hero/contenido y la primera diapositiva. No se modificó esa experiencia visual sin decisión del PM.
- Las miniaturas únicas de los 18 recursos ya están implementadas con una hoja SVG compartida; las tarjetas mantienen el título, el contenido y los enlaces propios.
- La aprobación visual final de la biblioteca y del comportamiento del hero corresponde al PM.

## Reglas técnicas

- No usar `!important` en HTML ni CSS; una prueba estática verifica que no reaparezca.
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


## Estado de preparación P1 — revisión de código 2026-10-29

La inspección estática confirma que la rama contiene los controles P1 principales: fallback `noscript`, CSP sin scripts inline ejecutables, JSON-LD válido separado, Lucide con versión fijada, navegación HTML nativa, controles de carrusel manuales con estado accesible, política de privacidad y formulario sin persistencia ni llamadas a API. Los testimonios identificables no se presentan como reseñas verificadas. El sitemap público incluye `/`, `/recursos.html` y `/privacidad.html`.

**La fase P1 no se declara aprobada todavía:** queda pendiente la batería acordada de pruebas de cierre en staging. También quedan como bloqueos de aprobación humana la confirmación de los datos comerciales, horario, número de WhatsApp y propiedad de perfiles sociales. La medición Lighthouse se hará al cierre de la fase, no después de cada cambio. No se tocó `main` ni producción.
