# Verificación de la entrega

Fecha: 29 de septiembre de 2026. Pruebas técnicas, no evaluación clínica.

| Verificación | Resultado observado |
|---|---|
| Reglas, endpoints, permisos, sesiones, archivos y eliminación | 34 pruebas pytest correctas con SQLite efímera y claves foráneas activadas |
| Ruff | Sin errores |
| Alembic upgrade head | Ejecutado correctamente sobre base local de vista previa |
| Alembic check | Sin diferencias entre migraciones y modelos en la base local |
| TypeScript y compilación Vite | Compilación correcta; configLoader runner necesario en el sandbox Windows |
| Flujo de navegador escritorio | Paciente → envío real a API → revisión profesional → lectura del paciente → eliminación |
| Flujo de navegador móvil | Mismo recorrido; sin desbordamiento horizontal de página en el detalle |
| Dataset/modelo clínico | No se entrenó ni evaluó un modelo; no hay métricas clínicas |

Las cuatro pruebas de navegador usan Chromium, una imagen geométrica sintética y la misma API que el producto. La vista previa local persiste en SQLite. Se comprobó la recuperación del registro mediante otra sesión de base de datos y entre sesiones de usuario.

## Verificaciones pendientes del entorno

La inicialización de PostgreSQL nativo fue bloqueada por el sandbox de Windows (`could not create restricted token`). Docker no está instalado. **No se afirma haber ejecutado PostgreSQL ni Docker localmente.** El repositorio incluye Compose con PostgreSQL 17 y GitHub Actions con pruebas de backend, migraciones y navegador sobre PostgreSQL; su resultado debe consultarse después de publicar y ejecutar el workflow.

Starlette emite una advertencia de deprecación sobre el cliente de pruebas httpx; las pruebas pasan. No se ha hecho una auditoría de accesibilidad completa, prueba de carga ni evaluación de seguridad independiente. La inspección visual y la comprobación de tamaños de pantalla no equivalen a certificación de accesibilidad.

Antes de dar por cerrada la aceptación en PostgreSQL: ejecutar el workflow o levantar Compose desde cero, repetir el recorrido y confirmar persistencia tras reiniciar servicios. Ningún resultado técnico acredita seguridad o eficacia clínica.

## Segunda pasada

También se verificaron creación de cuenta sin escalamiento de rol, preservación de espacios en contraseñas, Argon2id y sal distinta, reautenticación, revocación de todas las sesiones al cambiar contraseña, aislamiento de solicitudes ARCO, revocación de consentimiento y bloqueo de envíos, confirmación/cancelación de baja, borrado físico y atención por CLI. La CLI impide eliminar antes de 24 horas o con solicitudes ARCO abiertas.

Los cuatro recorridos Chromium (dos por tamaño) cubren seguimiento y privacidad/cuenta. Se inspeccionaron capturas de consentimiento, dashboard y revisión profesional; se aumentó tipografía y ajustó navegación móvil. Las capturas y los datos son sintéticos. Se comprobó Alembic tanto sobre la base existente como desde una SQLite vacía; PostgreSQL sigue pendiente de ejecución en este entorno.

Skills: guías de Emil, Impeccable y criterios compatibles de Taste aplicados manualmente. El motor automático de Impeccable no se ejecutó: su launcher no pudo crear la caché. No se reportan resultados de ese detector ni conformidad WCAG.

## Idiomas, paleta y acceso

- 490 claves fuente en español; 0 traducciones publicadas en cada una de las tres variantes preparadas. El control de catálogos detecta claves ausentes, parámetros incompatibles, textos JSX/atributos no extraídos y cambios de la huella fuente.
- 4 pruebas del resolver: fallback, bloqueo de fragmentos no revisados, detección de errores de clave/parámetro y conservación literal de parámetros. TypeScript y Vite compilan.
- 8 pruebas Playwright correctas: seguimiento con variante pendiente elegida, cuenta/privacidad, selección persistente de las tres variantes, aviso global, validación de formulario en español y ausencia de solicitudes externas. Los recorridos se ejecutaron en Chromium de escritorio y emulación Pixel 7.
- Geometría de acceso comprobada a 360, 768 y 1440 px, con texto ampliado en enlaces: sin solapamiento entre Crear cuenta/Privacidad y el título, ni desbordamiento de página. Se inspeccionaron capturas en móvil y escritorio. No se probó un dispositivo físico ni se afirma conformidad WCAG completa.
- Las 34 pruebas del backend siguen pasando. No hubo cambios de esquema ni nuevas migraciones en esta etapa.
- Paleta solo documental, con contrastes sRGB calculados; no existe página ni muestra de paleta dentro de la app.

## Traducción automática local — 29 de septiembre de 2026

Esta verificación sustituye el estado lingüístico de la pasada anterior: 497 claves fuente, 436 salidas automáticas incorporadas para náhuatl de la Huasteca oriental y 430 para el zapoteco ofrecido por Google. Mixteco sigue pendiente. Las salidas se presentan junto al español; no tienen validación lingüística.

- Compilación TypeScript/Vite y control de catálogos correctos. Vite advierte que el bundle principal supera 500 kB (aproximadamente 147 kB gzip); no se modificó artificialmente el umbral.
- 6 pruebas unitarias de internacionalización correctas: catálogos pendientes, borradores bilingües, invalidación por huella, migración de preferencias, parámetros y tratamiento literal de texto.
- 6 pruebas Playwright de idiomas/acceso correctas en escritorio y móvil: cambio real, persistencia, registro, validaciones, privacidad, ausencia de solicitudes externas y layout.
- 2 recorridos Playwright completos correctos: náhuatl en escritorio y zapoteco en móvil, envío de imagen sintética, prioridad, revisión profesional y eliminación del registro de prueba.
- Las primeras pruebas de seguimiento detectaron desbordamiento móvil y cierre de sesión inaccesible en el lateral de escritorio con textos largos. Se corrigieron ajuste de línea de etiquetas, encabezados flexibles y desplazamiento del lateral; ambos recorridos pasaron al repetirlos.

No se cambió el backend ni la base de datos. No se repitió su batería en esta entrega. No hay API de traducción en ejecución ni pruebas de calidad lingüística: los resultados anteriores son verificaciones de software.
