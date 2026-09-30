# Entrega: traducción automática local

## Resultado

Náhuatl y zapoteco ya modifican los textos de la interfaz. Se usan catálogos automáticos parciales obtenidos de Google Translate, guardados localmente, junto al original en español. No requieren clave de API ni transmiten datos del paciente. Mixteco permanece pendiente porque no se encontró un traductor disponible en el servicio utilizado.

- Náhuatl: Huasteca oriental, 436 de 497 claves con salida automática.
- Zapoteco: denominación del proveedor sin variante especificada, 430 de 497 claves.
- Los fragmentos restantes y las advertencias de idioma permanecen en español.
- No hay traducción humana revisada ni validación clínica de estos catálogos.

## Archivos cambiados

- `frontend/src/i18n/catalog.ts`: modo automático bilingüe independiente de la publicación revisada, cobertura y migración de preferencias.
- `frontend/src/i18n/runtime.ts`: compatibilidad con preferencias guardadas anteriormente.
- `frontend/src/i18n/LanguageBar.tsx`: opciones automáticas, procedencia, cobertura y limitaciones visibles.
- `frontend/src/i18n/locales/nhe-machine.json` y `zap-machine.json`: nuevos catálogos con procedencia y estado real; sustituyen los archivos vacíos `nah-021130.json` y `zap-051362.json`.
- `frontend/src/i18n/locales/es-MX.json` y `mix-051601.json`: nuevas claves y huella fuente.
- `frontend/src/styles/language.css`: textos largos, etiquetas y acceso al cierre de sesión.
- `frontend/scripts/check-i18n.mjs` y `i18n.test.mjs`: validación de procedencia y pruebas del modo automático.
- `frontend/tests/language.spec.ts` y `flow.spec.ts`: cambio real de textos y flujos completos en ambos catálogos.
- `README.md`, `docs/IDIOMAS.md`, `docs/VALIDATION.md` y este documento: estado actualizado, fuentes y limitaciones.
- `.gitignore`: excluye los archivos temporales de obtención de traducciones.

## Comprobaciones

Compilación y control de catálogos correctos. Se ejecutaron 6 pruebas unitarias y 8 pruebas de navegador satisfactorias (6 de idiomas/acceso y 2 de seguimiento). El recorrido de seguimiento usa datos e imágenes sintéticos y verifica la intervención del profesional. No se cambió ni volvió a probar el backend.

## Pendientes

Traducción mixteca, confirmación de comunidades y variantes destinatarias, revisión de traducciones por hablantes competentes y revisión específica de consentimiento, privacidad y salud. Las cifras de cobertura no miden calidad lingüística. No se anuncia que las variantes escogidas sean las más habladas. El bundle principal supera el umbral informativo de 500 kB de Vite; carga aproximada comprimida 147 kB.
