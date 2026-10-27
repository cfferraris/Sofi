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


## Diagnóstico ampliado — revisión de arquitectura, UX, accesibilidad, SEO y operación

**Fecha de revisión:** 2026-10-27.  
**Base inspeccionada:** rama `audit/fix-site-baseline`, commit `f2faaff19b4d15791a6bca707331cc75f38f17dc` para el último run de CI; los documentos de esta auditoría pueden tener commits posteriores.  
**Tamaño del árbol de archivos:** 16.821.918 bytes (aprox. 16,04 MiB), con 80 archivos versionados en el árbol inspeccionado. La carpeta `assets` concentra aproximadamente 16,68 MB.

### Estado de verificación

- GitHub Actions ejecutó `node --test tests/site-smoke.test.mjs`: **8 pruebas aprobadas, 0 fallidas**. Evidencia: https://github.com/cfferraris/Sofi/actions/runs/40528243160
- Las pruebas comprueban rutas locales de HTML/CSS, IDs y anclas, la referencia del botón del slider, el año del footer, el nombre exacto del icono y algunos patrones de autoplay/teclado.
- Estas pruebas son estáticas y varias comprueban expresiones regulares del código; no ejecutan el DOM ni validan el comportamiento real de un navegador.
- No hay evidencia aún de pruebas end-to-end, inspección visual en viewports, auditoría automática de accesibilidad, mediciones de rendimiento o prueba integral del dominio publicado.
- La herramienta de consulta web no pudo recuperar `https://www.pieldemar.com/`; esto **no demuestra** que el dominio esté caído. La disponibilidad, TLS, redirecciones, configuración DNS y contenido publicado quedan sin verificar.
- El repositorio no contiene un proceso de build ni un gestor de dependencias para la aplicación. Es un sitio estático HTML/CSS/JS.

### Hallazgos adicionales por prioridad

#### P0 — función de negocio incompleta

1. **Solicitud de turnos no implementada.** La sección `#consulta` sólo abre un mensaje genérico de WhatsApp. No permite seleccionar fecha/hora, capturar nombre, obra social ni motivo, ni muestra el aviso de confirmación manual. El archivo `data/appointments.json` contiene sólo fechas del 10 al 18 de marzo de 2025 y no es consumido por la aplicación. La especificación aprobada está en `docs/ESPECIFICACION-TURNOS.md`.
   - Próximo paso: implementar el formulario de preferencia de fecha/hora y datos mínimos, generar el mensaje codificado, y aclarar que sólo la respuesta de la propietaria confirma el turno. No almacenar los datos personales en el repositorio, navegador, analítica ni logs.
   - La primera versión no tendrá disponibilidad en tiempo real ni prevención automática de superposiciones. El cliente solicitará un horario preferido y la propietaria confirmará o propondrá otro por WhatsApp.

#### P1 — experiencia, accesibilidad y confianza

2. **La transición inicial depende de JavaScript.** El CSS/HTML ocultan inicialmente navegación y contenido principal; JavaScript bloquea el scroll y dispara la transición al hacer clic en el hero o después de cinco segundos. Si el script no carga o falla antes de terminar la transición, la página puede quedar en un estado que impida acceder al contenido. No hay fallback progresivo explícito.
   - Aceptación: el contenido principal debe seguir siendo accesible cuando JavaScript o la CDN de iconos fallen; el hero no debe bloquear indefinidamente el scroll.

3. **Promesa comercial por confirmar.** La sección de consulta dice «Te atendemos hoy» y promete respuesta «en el día». La información estructurada declara horario de lunes a viernes, 09:00–18:00. Confirmar que ambas afirmaciones reflejen la operación real y no se contradigan en fines de semana o feriados.

4. **Autoplay de carruseles no dispone de control de pausa visible.** El carrusel de testimonios avanza indefinidamente cada cinco segundos. Aunque se intenta pausar por hover/foco, los manejadores de mouseleave, focusout, teclado y touch pueden reiniciar autoplay mientras otra interacción sigue activa. El slider introductorio también reinicia autoplay desde su manejador de flechas mientras el foco permanece dentro.
   - Aceptación: agregar un control de pausa/reanudación o un comportamiento accesible equivalente, coordinar las causas de pausa, y probar teclado, toque, lector de pantalla y `prefers-reduced-motion`.

5. **Semántica de menú tipo aplicación.** La navegación normal del sitio utiliza `role="menubar"`, `role="menuitem"` y `role="none"` sin implementar el modelo de teclado habitual de un menú de aplicación. En un sitio institucional conviene usar la semántica nativa `nav > ul > li > a`, reservando roles ARIA para componentes que implementen por completo su patrón interactivo.

6. **Tabs ARIA incompletos en indicadores.** Los puntos de ambos carruseles se generan como `role="tab"` dentro de `role="tablist"`, pero no se observa implementación completa de navegación por flechas, gestión de foco roving ni relación `aria-controls`/panel. Si se mantienen como tabs, deben cumplir el patrón de tabs; si sólo son botones de navegación, usar semántica de botones.

7. **Testimonios con referencias a menores.** El HTML muestra nombres parciales y edades de niños, junto con afirmaciones sobre resultados. La auditoría técnica no puede verificar que sean testimonios reales ni que haya consentimiento de las familias. Confirmar autorización, exactitud y vigencia antes de publicar; no inventar ni completar identidades.

8. **Privacidad y tratamiento de datos.** No se encuentra un enlace o documento de política de privacidad ni información visible sobre el uso de WhatsApp. El formulario de turnos solicitará obra social y motivo de consulta, que pueden revelar información sensible. Antes de lanzar, informar de manera breve qué datos se envían, a quién y para qué; minimizar el detalle clínico solicitado y no persistirlo en el sitio.

9. **Dependencia externa no fijada.** Lucide se carga desde `https://unpkg.com/lucide@latest/`. La etiqueta `latest` puede cambiar sin un commit del proyecto y el sitio depende de una CDN para los iconos. Fijar una versión conocida y, preferentemente, evaluar alojar localmente la dependencia para reproducibilidad y menor exposición a cambios externos.

#### P2 — rendimiento, mantenimiento y SEO

10. **Peso de imágenes.** Ocho PNG de contenido superan 1 MB; varios están entre 1,4 y 1,9 MB. Las imágenes principales de la secuencia introductoria no declaran atributos `width`/`height`. Revisar dimensiones reales y uso visual, producir versiones WebP/AVIF cuando corresponda, preservar el original y comparar calidad/performance. No convertir por lote sin inspección visual.

11. **CSS heredado de turnos.** Permanecen reglas para `.appointments-container`, `.calendar-wrapper`, `.calendar-day`, `.time-slots`, `.appointments-placeholder` y `.form-actions`, aunque el HTML actual ya no contiene el calendario. Son candidatos a limpieza después de la implementación nueva y de confirmar que no se reutilizan. Se detectaron bloques repetidos de selectores como `.intro-slider-container`, `.whatsapp-float`, `.main-logo` y `.contact-section`; parte puede ser una sobreescritura intencional por breakpoint, así que no debe consolidarse a ciegas.

12. **Nombres inconsistentes de archivos.** Ejemplos: `familia en consullta.png`, `Niño sobre estimulado.png`, `Celeleste.png`. No son fallos de carga cuando la ruta coincide exactamente, pero aumentan el riesgo de errores futuros. Renombrar sólo con actualización global de referencias y prueba en entorno sensible a mayúsculas/minúsculas.

13. **SEO básico presente; validación pendiente.** Hay title, description, canonical, Open Graph, Twitter Cards y JSON-LD. No se encontraron `robots.txt` ni `sitemap.xml` en el árbol. El marcado estructurado declara dirección, teléfono, email, horario y perfiles sociales que deben verificarse con la propietaria y con los datos publicados. No se ha validado el JSON-LD con una herramienta de resultados enriquecidos ni se conoce el estado de indexación.

14. **Perfiles sociales sin verificación externa.** El HTML y `sameAs` incluyen Facebook, Instagram, YouTube, Twitch y X. Confirmar que cada perfil pertenece al negocio y está activo; retirar enlaces que no sean canales oficiales. La existencia de un enlace en el repositorio no prueba que el destino sea correcto.

15. **Mapeo y ubicación.** El mapa se presenta como una imagen estática, no como un mapa interactivo; existe un enlace separado a Google Maps. Confirmar dirección, acceso y si la imagen representa correctamente la ubicación actual. No es necesario incorporar un iframe de mapa si el enlace de indicaciones satisface el objetivo.

16. **Cobertura de pruebas insuficiente para release.** El workflow sólo ejecuta ocho pruebas estáticas con Node. No hay dependencias de test de navegador, lint, validador HTML, axe, Lighthouse ni chequeo automatizado de enlaces externos. El aviso de deprecación de Node 20 en las acciones del runner no hizo fallar esta ejecución, pero conviene revisar versiones soportadas de runtime/acciones en una tarea separada.

### Matriz de áreas

| Área | Estado | Evidencia / próximo paso |
|---|---|---|
| Estructura del sitio | Implementada | HTML único con 8 secciones principales |
| Identidad visual y responsive | Parcialmente implementada | CSS contiene breakpoints 1024/768/480; falta regresión visual real |
| Navegación y sliders | Implementados con riesgos | Código JS y controles presentes; revisar autoplay, teclado y semántica ARIA |
| Contacto | Implementado parcialmente | WhatsApp, email, dirección y horario presentes; confirmar datos |
| Solicitud de turnos | Pendiente | Requisito aprobado; sólo existe enlace genérico |
| SEO on-page | Parcialmente implementado | Metadatos presentes; faltan validación externa, sitemap/robots y revisión de datos |
| Accesibilidad | Parcial / no certificada | Alt e IDs correctos en pruebas estáticas; falta prueba real y arreglar patrones de menú/tabs/autoplay |
| Rendimiento | Pendiente de medir | Recursos pesados; no hay LCP/CLS/INP ni auditoría Lighthouse |
| Privacidad | Pendiente | Sin política visible; definir tratamiento de datos de turnos y testimonios |
| Seguridad | Básica, requiere revisión | CSP en meta; CDN no fijada; revisar cabeceras en servidor y política de datos |
| CI | Inicial y funcional | 8 pruebas pasan en GitHub Actions; falta suite de navegador |
| Despliegue | No verificado | Dominio publicado no pudo inspeccionarse con la herramienta disponible |

### Orden recomendado de trabajo

1. Implementar el formulario de turnos aprobado y el aviso inequívoco de confirmación manual.
2. Validar teléfono de WhatsApp, datos de contacto, horario de respuesta y política de privacidad con la propietaria.
3. Corregir accesibilidad de menú, tabs/indicadores y controles de autoplay; garantizar fallback cuando JavaScript/CDN no esté disponible.
4. Incorporar pruebas de navegador (desktop/móvil), errores de consola, CSP, enlaces y flujos de WhatsApp.
5. Optimizar imágenes y medir rendimiento antes/después.
6. Revisar SEO técnico, datos estructurados y canales sociales oficiales.
7. Limpiar CSS heredado y estandarizar nombres de archivos con pruebas de regresión.
8. Ejecutar checklist de lanzamiento y dejar evidencia reproducible por requisito.

**Criterio de cierre:** no declarar el sitio listo por tener código o por pasar pruebas estáticas. Cada requisito debe contar con evidencia de funcionamiento y la propietaria debe validar datos comerciales, testimonios y el flujo de turnos.
