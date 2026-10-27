# P1-B / P1-C — ejecución y evidencia

**Fecha:** 2026-10-27  
**Rama:** `audit/fix-site-baseline`  
**Alcance:** remediaciones técnicas y de contenido que pueden realizarse sin inventar información comercial ni afirmar consentimientos no verificados.

## P1-B — Accesibilidad

### Cambios ejecutados
- Los dos sliders pasan a navegación manual. No existe autoplay, temporizador de rotación ni botón visible de pausa. Esto evita movimiento automático persistente sin añadir el control de pausa que se había descartado por requisito visual.
- Se añadió un fallback `noscript`: la pantalla hero se oculta y navegación/contenido quedan visibles cuando JavaScript está deshabilitado.
- Se añadieron pruebas de navegador para el fallback sin JavaScript y axe-core para la página principal y la política de privacidad, con etiquetas WCAG 2.0/2.1/2.2 A/AA.
- Se conservan los controles nativos de botones, los nombres accesibles y los indicadores de foco ya presentes.
- Se añadieron verificaciones de regresión para asegurar que no se reintroduzca autoplay ni controles de pausa.

### Evidencia
- Evidencia CI final: commit `da4f98f5ea7c4bc9831e1cd7faa1598161a21ad3`; [workflow completo](https://github.com/cfferraris/Sofi/actions/runs/40588918915). Sintaxis JavaScript, pruebas estáticas, Playwright escritorio/móvil y axe-core pasaron. axe-core no reportó violaciones WCAG 2.0/2.1/2.2 A/AA en la página principal ni en `privacidad.html`.
- Los tests automatizados no certifican por sí solos WCAG 2.2 AA. Requieren revisión manual de teclado, orden de foco, zoom/reflow, lector de pantalla, contraste en todos los estados y dispositivos reales.

### Hallazgo automatizado corregido
La primera ejecución de axe-core detectó contraste insuficiente en el enlace de WhatsApp verde (#25D366 sobre blanco; ratio 1,98:1). Se cambió el color del texto a #107568, con contraste calculado superior a 4,5:1 sobre blanco. La suite debe repetirse para confirmar que no queden otros hallazgos.

### Estado
**Remediación técnica implementada; cierre integral condicionado a pruebas automatizadas exitosas y revisión manual.** No se declara conformidad WCAG completa sólo por ejecutar axe-core.

## P1-C — Contenido, privacidad y confianza

### Cambios ejecutados
- Se retiraron testimonios identificados por iniciales junto con nombres/edades de menores y afirmaciones de resultados, ya que no había evidencia verificable de autorización para publicarlos. Se reemplazaron por una descripción neutral del enfoque de acompañamiento.
- Se retiró el email `contacto@pieldemar.com` de la página y de los datos estructurados porque no estaba confirmado por la titular.
- Se retiraron accesos sociales de la navegación y el enlace social del footer; también se eliminó `sameAs` del JSON-LD para no presentar perfiles sin verificar como oficiales.
- La política de privacidad conserva la explicación del formulario estático, del envío voluntario por WhatsApp, de la finalidad y de la ausencia de almacenamiento en servidor/localStorage. El contacto para consultas de privacidad usa el WhatsApp confirmado: `+54 9 3425 004018`.
- Se agregó enlace visible a la política de privacidad en el footer.

### Pendiente de validación de la titular
- Identidad legal completa y persona responsable del tratamiento de datos, domicilio legal si corresponde y canal de contacto formal.
- Autorizaciones expresas y vigentes para testimonios; sólo deberían re-publicarse con aprobación documentada y sin datos identificatorios de menores innecesarios.
- Titularidad y vigencia de los enlaces externos de YouTube que aparecen en la sección de recursos.
- Confirmación de afirmaciones operativas/comerciales sobre modalidades de atención y horarios de respuesta.
- Revisión legal final de la política de privacidad conforme a la actividad y al tratamiento real de datos. Esta auditoría técnica no sustituye asesoramiento legal.

### Evidencia de publicación
La auditoría de solo lectura de `https://sofi-ywgo.onrender.com/` del commit `da4f98f5ea7c4bc9831e1cd7faa1598161a21ad3` observó HTTP 200, coincidencia exacta del HTML publicado con la rama, cabeceras de seguridad sin hallazgos, cero errores de consola/página/solicitudes/recursos y JSON-LD válido. [Workflow y artefacto de auditoría](https://github.com/cfferraris/Sofi/actions/runs/40588918915).

**Límite de alcance:** la URL de producción comprobada por el workflow es `sofi-ywgo.onrender.com`. Esta evidencia no demuestra por sí sola que el dominio personalizado `www.pieldemar.com` sirva la misma versión; ese dominio requiere verificación independiente.

### Estado
**Remediación de exposición no verificada implementada; P1-C no puede cerrarse al 100% sin evidencia de identidad/responsable y confirmación de los datos comerciales pendientes.**

## Restricciones respetadas
- Sin backend, base de datos, API, analítica, SMTP ni almacenamiento de solicitudes.
- No se envían mensajes reales de WhatsApp durante las pruebas.
- No se modificó `main`, no se fusionó el PR y no se cambió el flujo de solicitud de turnos.
