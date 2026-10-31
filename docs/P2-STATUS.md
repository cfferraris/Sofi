# P2 — estado de ejecución

Fecha: 2026-10-29
Rama: `audit/fix-site-baseline`
Base: `b2791dc577bc029c7a2a30d591adbca092e5dbcc`

## Verificaciones

- Las imágenes críticas ya tienen variantes WebP de 800 px y `srcset` responsive en la portada.
- La primera imagen de la portada y el logo tienen preload/fetch priority para el primer render.
- Las imágenes secundarias del carrusel usan carga diferida.
- El CSS servido por la portada está minificado (`css/styles.min.css`).
- Lucide está fijado a `0.468.0`; no se mantiene `@latest`.
- `robots.txt` y `sitemap.xml` existen y el sitemap incluye la biblioteca de recursos.
- El HTML principal ya usa dimensiones explícitas en las imágenes relevantes para reducir cambios de layout.
- Las pruebas de staging del commit base pasan: smoke/static, Playwright desktop/mobile, auditoría HTTP y Lighthouse.

## Resultado P2

No se aplica una limpieza masiva del CSS ni se eliminan assets originales en esta pasada porque no existe evidencia suficiente para demostrar que sean completamente huérfanos sin riesgo de regresión visual. La auditoría registra CSS repetido y assets originales junto con sus derivados optimizados, pero la eliminación requiere una comprobación global de referencias y una revisión visual posterior.

El principal problema de rendimiento que permanece es LCP variable. Las mediciones registradas muestran variación significativa y parte del coste está asociada a la experiencia visual del hero/transición. Cambiar esa experiencia para forzar una mejora de LCP requiere decisión visual del PM y no se ejecuta unilateralmente.

## Pendiente después de esta ejecución

1. Revisión visual del hero y decisión sobre si se permite modificar la transición para reducir LCP.
2. Limpieza conservadora de CSS sólo después de capturar y comparar comportamiento en los breakpoints definidos.
3. Eliminación de assets originales únicamente después de comprobar referencias globales.
4. Validación externa del JSON-LD y datos comerciales.
5. Validación humana de perfiles sociales, testimonios y datos de contacto.

No se modificaron `main` ni producción.
