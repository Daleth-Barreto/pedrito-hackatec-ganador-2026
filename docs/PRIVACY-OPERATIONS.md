# Privacidad y cuentas — segunda pasada

La implementación es para demostración. No afirma cumplimiento de la LFPDPPP ni aptitud clínica. Las referencias son la [LFPDPPP vigente](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf) y los principios de transparencia, privacidad y supervisión humana de la [Recomendación de la UNESCO](https://www.unesco.org/es/legal-affairs/recommendation-ethics-artificial-intelligence). No existe aval de esas instituciones.

## Configuración y migración

Ejecutar `alembic upgrade head` desde backend antes de iniciar la nueva versión. La migración 0002 conserva consentimientos anteriores, añade la decisión y crea solicitudes de privacidad. Las aceptaciones v1 quedan como antecedentes y no habilitan nuevos envíos. La aplicación solicita v2. El rollback elimina las decisiones y solicitudes nuevas: no usar downgrade en datos que deban conservarse.

Configurar `PRIVACY_CONTROLLER`, `PRIVACY_ADDRESS`, `PRIVACY_CONTACT`. Los valores por defecto indican expresamente que están pendientes; no se inventa una organización. `RETENTION_DAYS` controla el vencimiento de registros. `python -m app.purge` debe programarse diariamente para su eliminación física. Un registro vencido queda fuera de consultas aunque no se haya ejecutado aún la tarea.

## Contratos añadidos

Todas las mutaciones exigen `X-Requested-With: Seguimiento`, además de las comprobaciones de origen. El cliente ya lo incorpora. Cookies HttpOnly, SameSite Strict y Secure en producción. Las herramientas API que muten datos deben enviar ese encabezado.

| Endpoint | Acceso y efecto |
|---|---|
| GET /api/privacy/notice | Público, configuración no sensible del aviso |
| POST /api/auth/register | Crea únicamente paciente demo; bloqueado en production hasta habilitar verificación de correo y revisión legal |
| POST /api/account/profile | Paciente y contraseña actual; actualiza nombre |
| POST /api/account/password | Paciente y contraseña actual; cambia hash y revoca todas las sesiones |
| POST /api/consents | Paciente, `{accepted: boolean, version: "2"}`; registra aceptación, rechazo o revocación con fecha |
| GET /api/consents/current | Última decisión v2 del paciente |
| POST /api/privacy/requests | Paciente y contraseña actual; access, rectification, cancellation u opposition |
| GET /api/privacy/requests | Solo solicitudes propias, folios, fechas y respuesta |
| POST /api/account/deletion | Contraseña actual y texto exacto ELIMINAR MI CUENTA; crea petición pendiente |
| POST /api/account/deletion/cancel | Paciente autenticado; cancela su baja pendiente |

Nombre, correo y contraseña nunca pueden modificar el rol ni asignar profesionales. El correo de acceso no se cambia sin verificación: su rectificación se solicita por ARCO. Una cuenta nueva no tiene equipo asignado; el despliegue debe establecer el proceso de asignación autorizado.

## Atención de solicitudes

El flujo comprueba control de cuenta mediante reautenticación y deriva la titularidad de la sesión, nunca de un `patient_id` enviado por el cliente. No acredita identidad legal ni representación. No solicita documentos ni los envía a terceros. Folio, decisión y contraseña de acceso no se confunden con una acreditación documental.

La atención se realiza mediante una CLI local, reservada al operador con acceso al servidor y credenciales de base de datos. El personal de salud no adquiere permiso sobre estas solicitudes. No hay panel administrativo público ni envío simulado de correo.

```sh
python -m app.privacy_admin list
python -m app.privacy_admin show --id UUID
python -m app.privacy_admin respond --id UUID --status in_review --response-file respuesta.txt
python -m app.privacy_admin respond --id UUID --status needs_information --response-file respuesta.txt
python -m app.privacy_admin respond --id UUID --status resolved --response-file respuesta.txt
```

La lista muestra folio, tipo, estado y fecha, sin contenido sensible. `show` permite al operador consultar expresamente una solicitud; no redirigir esa salida a logs compartidos. La respuesta debe describir actuaciones realmente realizadas: cambiar estado no ejecuta automáticamente acceso, rectificación, cancelación u oposición. Antes de marcar resuelta, el operador debe efectuar y revisar las actuaciones pertinentes por un canal configurado. El titular consulta estado y respuesta en su cuenta. Se requiere establecer un responsable operativo, procedimiento de acreditación y calendario/plazos legales antes de publicar. No hay SLA ni entrega automática de expedientes implementados.

## Eliminación de cuenta

Mientras esté pendiente se bloquean nuevos registros. La cuenta conserva acceso para ver solicitudes y cancelar la baja. La ejecución está separada del ejercicio ARCO:

```sh
python -m app.privacy_admin erase --id UUID_DE_SOLICITUD
```

La CLI exige una petición de baja pendiente, un mínimo de 24 horas desde su creación y ausencia de solicitudes ARCO abiertas. El operador borra fotografías y luego registros, notas, asignaciones, consentimientos, sesiones, solicitudes y usuario. Un fallo de almacenamiento conserva metadatos para reintentar. No se etiqueta una solicitud como eliminada sin ejecutar la operación. Al desaparecer la cuenta también desaparece su historial de solicitudes; antes debe haberse comunicado cualquier respuesta pendiente. Cancelar la petición evita su ejecución.

No existe eliminación programada de copias de respaldo ni tratamiento legal de bloqueo implementado. La base y los archivos siguen en texto/bytes recuperables en el servidor; no se incorporó AES porque no se ha definido infraestructura de claves. **El cifrado en reposo, copias de respaldo, rotación de claves y sus políticas son pendientes antes de manejar datos reales.** No se usa AES para contraseñas: se usa Argon2id con sal aleatoria generada por la biblioteca en cada hash. No hay semilla fija ni criptografía propia.

## Revisión jurídica y operación pendientes

- Nombre o razón social, domicilio y contacto del responsable; área encargada de privacidad.
- Finalidades, encargados, transferencias y ubicación de infraestructura del despliegue concreto.
- Procedimiento de acreditación de titular/representante, canal documental, medios de respuesta y plazos de atención.
- Base jurídica, requisitos de consentimiento para datos sensibles, menores o representantes y revisión de la evidencia electrónica.
- Plazos legales de conservación/bloqueo, excepciones, copias de respaldo y respuesta a incidentes.
- Verificación/recuperación de correo, MFA de operadores, control de acceso al servidor, auditoría administrativa y limitador distribuido si se usan varios procesos.
- HTTPS, cifrado en reposo administrado, despliegue PostgreSQL y validación clínica independiente.

El prototipo usa reglas y plantillas. No hay clasificador clínico activo ni LLM externo. No se recolectan datos para entrenamiento. Incorporar alguno exige revisar aviso, proveedores y versión de consentimiento.
