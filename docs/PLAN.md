# Etapa 1 · Arquitectura y contratos

MVP de demostración para seguimiento postamputación. No diagnostica, prescribe ni acredita uso clínico.

## Riesgos y decisión de datos

No hay datos adecuados autorizados y evaluados de muñones postamputación en este proyecto. No se entrenará un modelo. El adaptador `demo` devolverá estado no disponible, sin clase, puntuación ni observaciones de heridas. La comprobación de formato, resolución y exposición es técnica, no clínica. Ver DATASETS.md.

Reglas v1 del cuestionario (hipótesis de prototipo, necesitan aprobación profesional): fiebre reportada o apertura → alerta; aumento del dolor, secreción, olor, dolor >= 4 o cambios reportados → vigilancia. Una imagen no puede disminuir una prioridad. Sin señales y sin modelo validado → prioridad nula y revisión humana. `normal` queda reservado a un futuro análisis disponible y validado; nunca se deriva de la ausencia de modelo. Preguntas desconocidas → análisis incompleto, manteniendo cualquier señal positiva conocida.

## Arquitectura

Frontend React/TypeScript por funcionalidades; componentes de formularios, avisos y prioridades compartidos. CSS con tokens y puntos de quiebre. API FastAPI con validación Pydantic, servicios de registros, reportes por plantillas y adaptador de inferencia. SQLAlchemy y PostgreSQL; Alembic con revisiones explícitas. Storage como protocolo y proveedor local con claves UUID privadas; sin rutas públicas. JWT en cookie HttpOnly, comprobación de Origin en operaciones mutables y sesión persistida revocable. No se envían datos a un LLM externo.

## Entidades

- User: UUID, email único, nombre de demostración, hash Argon2, rol, bandera demo.
- Assignment: relación profesional/paciente, clave compuesta.
- Session: UUID, usuario, expiración; revocable al salir.
- Consent: paciente, versión, fecha y alcance fijo; requisito previo a captura/envío.
- Record: paciente, consentimiento, fecha, cuestionario JSON, clave de imagen, metadatos técnicos, inferencia JSON, prioridad nullable, razones, versión de reglas, fecha de expiración.
- Review: registro único, autor, fecha, valoración profesional y nota; independiente de prioridad automática.

## API v1 (`/api`)

Fechas ISO 8601, UUID para identificadores. Errores `{error:{code,message,details?}}`; 401 sesión ausente/vencida, 403 rol incorrecto, 404 recurso inexistente o no autorizado, 422 datos inválidos, 413 imagen demasiado grande. Respuestas sensibles `Cache-Control: no-store`.

| Método y ruta | Entrada | Salida / autorización |
|---|---|---|
| POST /auth/login | JSON email, password | Usuario y cookie / público |
| GET /auth/me | — | Usuario / sesión |
| POST /auth/logout | — | 204, revoca sesión |
| GET /consents/current | — | Consentimiento vigente o null / paciente |
| POST /consents | accepted: true, version: 1 | Consentimiento / paciente |
| GET /patients | — | Pacientes asignados / profesional |
| POST /records | multipart image y payload JSON: consent_id, questionnaire | Registro y reporte / paciente |
| GET /records | priority, status, from_date, to_date, patient_id, offset, limit | items, total / propietario o asignación |
| GET /records/{id} | — | Detalle y reporte / propietario o asignación |
| GET /records/{id}/image | — | JPEG saneado / propietario o asignación |
| POST /records/{id}/reviews | assessment, note | Detalle actualizado / profesional asignado; 409 si revisado |
| DELETE /records/{id} | — | 204 / paciente propietario, elimina registro e imagen |
| GET /health | — | Estado DB / sin datos sensibles |

Cuestionario: photo_date (no futura), pain (0–10 o null), increased_pain, fever, discharge, odor, wound_opening (boolean o null), changes (none/changed/unknown), changes_description (hasta 1000 caracteres). Todos los campos están presentes; null significa que el paciente no sabe. El backend no transforma desconocido en falso.

## Pantallas y diseño

Acceso; inicio del paciente; captura en tres pasos (consentimiento, fotografía/cuestionario, confirmación); historial; detalle; dashboard con filtros; historial por paciente; revisión con nota. Verde petróleo, fondo marfil, texto grafito; estados normal/vigilancia/alerta con texto, icono y color. Tipografía de sistema, foco visible, etiquetas explícitas, tarjetas a 16 px, espaciado en múltiplos de 4 y navegación compacta en móvil.

## Etapas y aceptación

2: configuración reproducible. 3: persistencia, permisos, consentimiento, carga privada y reglas. 4: todos los flujos conectados. 5: adaptador demo explícito, sin métricas inventadas. 6: pruebas unitarias, integración, navegación móvil/escritorio, documentación y limitaciones. Validar envío, recuperación tras reinicio, aislamiento entre pacientes, asignaciones, revisión y reporte fiel; registrar qué verificaciones pudieron ejecutarse localmente.
