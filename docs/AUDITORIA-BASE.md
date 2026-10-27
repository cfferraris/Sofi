# Piel de Mar — auditoría base y plan de remediación

**Alcance:** inspección estática de la rama `main` antes de cambios.  
**Estado:** hallazgos preliminares; la ejecución en navegador y las pruebas de rendimiento siguen pendientes.  
**Regla de aceptación:** no marcar una tarea como terminada sin evidencia reproducible.

## Inventario verificado

- Sitio estático: `index.html`, `css/styles.css`, `js/main.js`.
- 80 archivos versionados y 15 directorios en el árbol inspeccionado.
- Recursos visuales: logotipos en varias paletas, fondos, ilustraciones y tipografías locales.
- Secciones: hero, presentación, “Tu hij@ y vos”, servicios, testimonios, recursos, consulta y contacto.
- Contacto: enlaces a WhatsApp, correo y Google Maps.
- SEO básico: title, description, canonical, Open Graph, Twitter Cards y JSON-LD.
- No se identificaron archivos de pruebas, instrucciones de desarrollo ni configuración de compilación en el árbol inicial.
- `data/appointments.json` contiene horarios de marzo de 2025, pero el HTML y el JavaScript actuales no lo consumen. La sección de consulta deriva a WhatsApp; no es una reserva online.

## Hallazgos priorizados

### P0 — bloqueante funcional

1. **Slider introductorio: referencia incorrecta de botón.** En `updateIntroButtons()`, la versión inicial modificaba `nextBtn` (del carrusel de testimonios) en lugar de `introNextBtn`. Si el inicializador del slider se ejecutaba, podía lanzar un `ReferenceError` y detener el resto de la inicialización de ese slider.
   - Corrección propuesta/aplicada en rama de auditoría: usar `introNextBtn`.
   - Aceptación: navegar todas las diapositivas con botones, indicadores, swipe y redimensionamiento sin errores de consola.

### P1 — calidad y compatibilidad

2. **Política CSP y script en línea.** La página declara `script-src 'self' https://unpkg.com`, pero tenía un script inline que inicializaba Lucide y completaba el año del footer. La inicialización de iconos ya se realiza desde el JavaScript externo; el bloque inline se retiró y el año se inicializa desde `js/main.js`.
   - Aceptación: CSP activa sin violaciones inesperadas; año correcto y los iconos se inicializan cuando la dependencia está disponible.
   - Pendiente de revisión: comprobar la compatibilidad de los datos estructurados JSON-LD con la política CSP y validar los metadatos con herramientas de buscadores.

3. **Mayúsculas/minúsculas en icono de Instagram.** El HTML inicial referenciaba `assets/icons/instagram.svg`, pero el archivo versionado es `assets/icons/Instagram.svg`. Las rutas ya se alinearon en la rama de auditoría.
   - Aceptación: ninguna petición de recurso local devuelve 404 en un entorno sensible a mayúsculas/minúsculas.

4. **Imágenes pesadas.** Varias ilustraciones PNG pesan entre aproximadamente 1,1 y 1,9 MB cada una.
   - Aceptación: medir LCP y transferencia total; generar versiones optimizadas (WebP/AVIF cuando sea apropiado), preservar calidad y dimensiones de visualización y usar carga diferida sólo en imágenes fuera del primer viewport.

### P2 — mantenibilidad y experiencia

5. **CSS con reglas repetidas.** Se detectaron selectores repetidos en distintas zonas del archivo. No implica automáticamente un defecto visual, pero hace más difícil predecir la cascada.
   - Aceptación: consolidar sólo después de capturar el comportamiento actual; evitar rediseños accidentales y comprobar breakpoints 320, 375, 768, 1024 y escritorio amplio.

6. **Carruseles y accesibilidad.** Ambos sliders tienen autoplay y controles. En la rama de auditoría se agregó pausa al hover y al foco dentro de cada sección, se evita iniciar autoplay cuando el documento está oculto y se limitó el manejo de flechas del slider introductorio a su propia sección. El comportamiento aún requiere prueba en navegador.
   - Aceptación: controles con nombres accesibles, estado anunciado correcto, autoplay que no interfiera con usuarios de teclado y respeto de `prefers-reduced-motion`.

7. **Recursos “próximamente”.** Artículos, guías descargables y tips se presentan como futuros. Debe decidirse si permanecen como hoja de ruta visible o se publican antes del lanzamiento.
   - Aceptación: ningún elemento aparenta ser un enlace activo si no lleva a un recurso disponible.

8. **Testimonios.** Hay nombres y referencias a menores. Verificar que sean reales, que exista autorización de publicación y que el contenido sea fiel; no inventar reseñas ni atribuciones.
   - Aceptación: cada testimonio publicado cuenta con aprobación de la persona responsable o se reemplaza por contenido aprobado.

9. **Disponibilidad de turnos.** Requisito confirmado: permitir que el cliente elija fecha y hora deseadas, complete nombre, obra social y motivo, y abra WhatsApp con una solicitud precargada. El sitio debe aclarar que el turno sólo se confirma cuando la propietaria responde por WhatsApp. `data/appointments.json` contiene fechas antiguas de 2025 y no debe presentarse como disponibilidad actual. La especificación completa está en `docs/ESPECIFICACION-TURNOS.md`.
   - Aceptación: validar el flujo, el número de WhatsApp y la fuente de disponibilidad con la propietaria. Como el sitio es estático, el formulario no puede bloquear horarios ni confirmar disponibilidad real. Elegir una fuente de calendario actualizada antes de prometer disponibilidad. No guardar datos personales en el repositorio ni en el navegador.

10. **Perfiles sociales y datos comerciales.** Revisar que los enlaces de redes, dirección, teléfono, correo, horarios y URLs canónicas sean correctos y estén controlados por el titular.

## Plan de trabajo

1. Reparar y validar los defectos P0/P1 sin alterar el diseño aprobado.
2. Ejecutar pruebas funcionales manuales en escritorio y móvil, con registro de errores de consola y solicitudes fallidas.
3. Revisar accesibilidad: teclado, foco visible, lectores de pantalla, contraste y movimiento reducido.
4. Optimizar recursos visuales y medir rendimiento antes/después.
5. Consolidar CSS de manera incremental y con comprobación visual.
6. Validar SEO técnico, JSON-LD, enlaces externos, privacidad y contenido.
7. Implementar y validar el flujo de solicitud por WhatsApp según `docs/ESPECIFICACION-TURNOS.md`, y definir la fuente de disponibilidad real.
8. Publicar un checklist de lanzamiento con resultados, bloqueantes y evidencia.

## Limitaciones de esta auditoría

La inspección del repositorio permite verificar archivos, referencias y lógica estática, pero no demuestra el comportamiento del sitio publicado. No se ha afirmado que pasen pruebas de navegador, accesibilidad automatizada, rendimiento, SEO externo ni despliegue. Esas comprobaciones deben ejecutarse y registrarse antes de declarar el sitio listo para producción.
