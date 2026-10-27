# Piel de Mar — sitio web

Sitio institucional estático de Piel de Mar, orientado a presentar los servicios de acompañamiento familiar y facilitar el contacto.

## Estructura

- `index.html`: contenido, metadatos SEO, datos estructurados y navegación.
- `css/styles.css`: estilos, identidad visual, tipografías locales y comportamiento responsive.
- `js/main.js`: transición inicial, navegación móvil, carrusel de testimonios y slider introductorio.
- `assets/img/`: imágenes, fondos y variantes de logotipos.
- `assets/icons/`: iconos SVG.
- `assets/tipografias/`: fuentes locales.
- `data/appointments.json`: datos históricos de disponibilidad; actualmente no son consumidos por el sitio.

## Ejecución local

No se identifica un paso de compilación ni un gestor de paquetes para este sitio estático. Desde la raíz del repositorio, ejecutar:

```bash
python -m http.server 8000
```

Abrir `http://localhost:8000`. Para una validación real, probar también en un navegador móvil y en uno de escritorio. Abrir el HTML directamente mediante `file://` no reemplaza la prueba con servidor HTTP.

## Pruebas estáticas

Con Node.js instalado, ejecutar desde la raíz:

```bash
node --test tests/site-smoke.test.mjs
```

Las pruebas comprueban rutas locales, referencias internas, IDs duplicados y regresiones concretas de los controles del slider y del año del footer. No reemplazan las pruebas visuales y funcionales en navegador.

## Dependencias externas

- Lucide se carga desde unpkg. Si el proveedor externo no está disponible, los iconos pueden no inicializarse.
- Los enlaces de contacto y redes sociales dependen de los destinos externos configurados en `index.html`.

## Estado de calidad

Consultar [la auditoría inicial y el plan de remediación](docs/AUDITORIA-BASE.md). El análisis estático no equivale a una validación funcional completa: no se debe declarar listo para producción sin probar navegación, carruseles, enlaces, responsive, accesibilidad y carga de recursos en navegador.
