# Entrega: idiomas, acceso y paleta

Se modificó la aplicación existente, sin rehacer backend, persistencia ni lógica clínica.

## Resultado

- Paleta exclusivamente documental, con HEX, usos y pares de contraste; no se añadió una pantalla de colores.
- Selector de idioma en todas las rutas, preferencia persistente y aviso de español para variantes pendientes.
- 490 claves fuente en español y archivos separados para las propuestas de mexicano de la Huasteca hidalguense, zapoteco de la planicie costera y mixteco de Guerrero del noreste central.
- Ninguna traducción indígena inventada ni publicada. Falta confirmar municipios y obtener revisión de hablantes, además de revisión de salud, privacidad y consentimiento.
- Acceso público corregido: Crear cuenta y Privacidad están dentro del flujo; se retiró la etiqueta decorativa Prototipo de demostración de esa zona.
- Se preservan las advertencias clínicas, consentimiento, privacidad y separación entre sugerencia automática y valoración profesional.

## Verificaciones ejecutadas

- 34 pruebas pytest de backend correctas.
- 8 pruebas Playwright correctas (escritorio y emulación móvil); el acceso se comprueba a 360, 768 y 1440 px, también con enlaces de texto largo.
- 4 pruebas unitarias del catálogo/resolver correctas.
- Comprobación de claves, huecos declarados e interpolación; TypeScript y Vite correctos.
- Inspección visual en móvil y escritorio; sin superposición de enlaces y título en el acceso.
- No hubo migraciones nuevas. PostgreSQL, dispositivos físicos y auditoría de accesibilidad externa siguen pendientes en este entorno.

## Skills

Emil y la guía de auditoría/craft-floor de Impeccable se aplicaron manualmente. El launcher de Impeccable no pudo crear la caché en esta sesión; no se afirma haber usado su detector. De Taste se aplicaron los criterios compatibles con un producto de salud; su alcance excluye dashboards y formularios de varios pasos.

## Archivos modificados

- `.github/workflows/ci.yml`
- `README.md`
- `docs/VALIDATION.md`
- `frontend/package.json`
- `frontend/src/app/App.tsx`
- `frontend/src/app/Layout.tsx`
- `frontend/src/components/UI.tsx`
- `frontend/src/features/auth/AuthContext.tsx`
- `frontend/src/features/auth/LoginPage.tsx`
- `frontend/src/features/auth/RegisterPage.tsx`
- `frontend/src/features/clinical-dashboard/DashboardPage.tsx`
- `frontend/src/features/patient/AccountForms.tsx`
- `frontend/src/features/patient/AccountPage.tsx`
- `frontend/src/features/patient/PatientHome.tsx`
- `frontend/src/features/patient/PrivacyNotice.tsx`
- `frontend/src/features/patient/PrivacyRequests.tsx`
- `frontend/src/features/records/HistoryPage.tsx`
- `frontend/src/features/records/NewRecordPage.tsx`
- `frontend/src/features/records/QuestionnaireFields.tsx`
- `frontend/src/features/records/RecordDetailPage.tsx`
- `frontend/src/features/records/RecordTable.tsx`
- `frontend/src/features/records/ReviewForm.tsx`
- `frontend/src/main.tsx`
- `frontend/src/services/api.ts`
- `frontend/src/styles/privacy.css`
- `frontend/tests/flow.spec.ts`

## Archivos añadidos

- `docs/AUDITORIA-IDIOMAS.md`
- `docs/IDIOMAS.md`
- `docs/paleta-de-colores.md`
- `frontend/scripts/check-i18n.mjs`
- `frontend/scripts/i18n.test.mjs`
- `frontend/src/i18n/LanguageBar.tsx`
- `frontend/src/i18n/catalog.ts`
- `frontend/src/i18n/locales/es-MX.json`
- `frontend/src/i18n/locales/mix-051601.json`
- `frontend/src/i18n/locales/nah-021130.json`
- `frontend/src/i18n/locales/zap-051362.json`
- `frontend/src/i18n/runtime.ts`
- `frontend/src/i18n/server-sources.json`
- `frontend/src/i18n/validation.ts`
- `frontend/src/styles/language.css`
- `frontend/tests/language.spec.ts`
- `docs/ENTREGA-IDIOMAS.md`

Las instrucciones y fuentes están en IDIOMAS.md y paleta-de-colores.md. El código se entrega en el ZIP del repositorio; no contiene .env, bases de datos, fotos de pacientes ni dependencias instaladas. La publicación en GitHub sigue pendiente de autenticación.
