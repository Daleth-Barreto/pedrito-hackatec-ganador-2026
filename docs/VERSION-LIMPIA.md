# Versión de presentación para pacientes y personal de salud

## Cambios

- Acceso sin instrucciones de hackatón ni credenciales de ejemplo.
- Se retiró la etiqueta de entorno de demostración del encabezado.
- Registro de cuenta, seguimiento, consentimiento y reportes con redacción dirigida a la persona usuaria.
- Las cuentas y registros sintéticos se identifican como «Cuenta de prueba» o «Datos de prueba». No se han modificado nombres, notas ni otros datos ya guardados por los usuarios.
- Se conserva la explicación de que no hay análisis clínico automatizado de fotografías, que las reglas no tienen validación clínica y que la valoración corresponde al personal de salud.
- El selector contiene español, náhuatl y zapoteco. Las preferencias anteriores de mixteco vuelven a español.
- Las traducciones de frases modificadas se invalidaron individualmente. El resto conserva su origen y estado automático; las frases sin traducción se muestran en español. Cobertura actual: 492 claves fuente, 419 salidas automáticas en náhuatl y 413 en zapoteco.
- Los mensajes antiguos persistidos del análisis se presentan con la nueva redacción mediante una tabla de compatibilidad, sin alterar el historial almacenado.

## Archivos principales

`frontend/src/features/auth/LoginPage.tsx`, `frontend/src/app/Layout.tsx`, `frontend/src/i18n/locales/*.json`, `frontend/src/i18n/runtime.ts`, `frontend/src/i18n/server-sources.json`, `frontend/src/i18n/legacy-sources.json`, `frontend/src/i18n/catalog.ts`, `backend/app/main.py`, `backend/app/ml/inference.py`, `backend/app/services/reports.py` y las pruebas de idiomas y privacidad.

Se conservan las claves de traducción estables aunque su identificador técnico contenga palabras de la redacción anterior. Esos identificadores no se muestran en la interfaz. El código y la documentación técnica conservan la procedencia del proyecto y la separación de datos de prueba.

## Verificaciones ejecutadas

- Compilación TypeScript y Vite, con validación de catálogos: correctas.
- 6 pruebas unitarias de internacionalización: correctas.
- 34 pruebas del backend: correctas.
- 10 pruebas Playwright en escritorio y móvil: correctas; incluyen envío de fotografía, revisión profesional, cuenta, consentimiento, ARCO, idiomas y privacidad.
- Inspección visual del acceso a 360 y 1440 px: sin bloque de credenciales, etiquetas de evento ni superposición de enlaces.

Advertencias de herramientas: Vite señala un bundle principal de unos 504 kB antes de compresión; Starlette informa de una deprecación del cliente de pruebas httpx. No impidieron las verificaciones.

## Alcance de esta versión

Esta es una limpieza de presentación, no una declaración de aptitud clínica ni una habilitación para tratar datos reales. Continúan pendientes el nombre/razón social, domicilio y contacto del responsable, revisión jurídica, revisión lingüística de textos críticos y los controles de producción documentados en SECURITY.md y PRIVACY-OPERATIONS.md. Los avisos correspondientes permanecen visibles. La autenticación, permisos, consentimiento y políticas de conservación no se relajaron.
