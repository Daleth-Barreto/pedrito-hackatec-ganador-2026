# KINEVA · Seguimiento de heridas postamputación

## Inicio rápido para el equipo en Windows

El repositorio incluye el modelo mediante Git LFS. Cada integrante necesita Git LFS, Python 3.12 y Node.js 22 o posterior. Después de clonar, abre PowerShell en la raíz y ejecuta:

```powershell
git lfs pull
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\setup-windows.ps1
```

El script crea un entorno virtual, instala las dependencias, genera una configuración local privada, aplica las migraciones, crea las cuentas de demostración e instala el frontend. No sobrescribe un `backend/.env` existente. Para ejecutar la aplicación, abre dos terminales desde la raíz:

```powershell
cd backend
& ..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-access-log
```

```powershell
cd frontend
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Abre `http://127.0.0.1:5173`. Las cuentas `paciente@demo.local` y `salud@demo.local` usan la clave `Kineva-Demo-2026!` cuando se conserva el valor predeterminado del script. La base SQLite, las imágenes y `.env` permanecen fuera de Git.

MVP de hackatón: un paciente registra una fotografía y un cuestionario; el profesional asignado consulta el historial y documenta su revisión. React + TypeScript, FastAPI, PostgreSQL y almacenamiento privado de imágenes. Interfaz en español, adaptable a móvil y escritorio.

**Demostración, sin validación clínica.** No diagnostica, prescribe ni sustituye consulta. No hay un clasificador validado: la imagen devuelve «evaluación automática no disponible». Las reglas del cuestionario son hipótesis explícitas de prototipo. No se usan fotografías de pacientes reales, estadísticas de contexto sin verificar, métricas inventadas ni llamadas simuladas a servicios externos.

## Ejecución recomendada desde cero

Requisitos: Git y Docker con Compose. Puertos 5173 y 8000 disponibles.

```sh
git clone https://github.com/Daleth-Barreto/pedrito-hackatec-ganador-2026.git
cd pedrito-hackatec-ganador-2026
cp .env.example .env
```

En PowerShell, usa `Copy-Item .env.example .env`. Edita `.env` antes de continuar:

1. Cambia `POSTGRES_PASSWORD` y el mismo valor dentro de `DATABASE_URL`. Si contiene caracteres reservados, codifícalos en la URL.
2. Sustituye `SECRET_KEY` por un secreto aleatorio de al menos 32 caracteres. Por ejemplo, `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
3. Define `DEMO_PASSWORD` con al menos 12 caracteres. No la publiques ni uses credenciales reales.

```sh
docker compose up --build -d
docker compose exec backend python -m app.seed
```

- Aplicación: [localhost:5173](http://localhost:5173).
- API y documentación: [localhost:8000/docs](http://localhost:8000/docs).
- Salud técnica: [localhost:8000/api/health](http://localhost:8000/api/health).

El arranque aplica migraciones antes de servir. PostgreSQL e imágenes persisten en volúmenes. `docker compose down` detiene el entorno sin eliminar esos datos. No uses `down -v` si quieres conservarlos.

### Cuentas de demostración

| Correo | Rol | Acceso |
|---|---|---|
| paciente@demo.local | Paciente | Registros propios |
| salud@demo.local | Personal de salud | Primer paciente asignado |
| otro@demo.local | Paciente | Sus registros; no asignado al profesional demo |

Las tres usan la contraseña `DEMO_PASSWORD` que tú configuraste. El seed solo funciona en `APP_ENV=demo`, es idempotente y no modifica contraseñas existentes. No crea registros clínicos. `frontend/tests/fixtures/synthetic.png` es una figura geométrica claramente sintética para probar el flujo. Mantén las bases de demostración separadas de cualquier otro entorno; la base del ejemplo se llama `seguimiento_demo`.

## Desarrollo sin Docker

Requiere Python 3.12+, Node 22+ y PostgreSQL 17+. Crea una base y un usuario exclusivos para el prototipo. Copia la configuración a `backend/.env`; cambia `DATABASE_URL` al servidor PostgreSQL accesible (habitualmente `localhost`), y `STORAGE_PATH=storage`.

```sh
python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# PowerShell: .\.venv\Scripts\Activate.ps1
pip install -r backend/requirements-lock.txt
cd backend
alembic upgrade head
python -m app.seed
uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-access-log
```

Para el seed local, exporta `DEMO_PASSWORD` al entorno o ejecútalo con el archivo `.env` configurado. En una segunda terminal:

```sh
cd frontend
npm ci
npm run dev
```

Vite redirige `/api` al backend; no es necesario exponer credenciales ni URLs de almacenamiento al navegador. Si el entorno restringido de Windows impide que esbuild explore directorios al iniciar Vite, la vista previa compilada puede ejecutarse con `npm run build` y `npm run preview -- --port 5173 --configLoader runner`.

SQLite se admite **solo para pruebas aisladas o una vista previa técnica** (`DATABASE_URL=sqlite:///preview.db`). Esto no sustituye la ejecución con PostgreSQL y debe declararse al presentar resultados de pruebas.

## Recorrido de aceptación

1. Entra como paciente y abre «Nuevo registro».
2. Acepta el consentimiento antes de acceder al selector de archivos.
3. Usa la imagen sintética, completa el cuestionario y confirma el envío.
4. Consulta el registro, su prioridad sugerida, los motivos y el estado pendiente.
5. Cierra sesión e ingresa como profesional; filtra y abre el registro.
6. Escribe una nota, selecciona una valoración y marca como revisado.
7. Vuelve como paciente para consultar la nota y, si corresponde a la prueba, eliminar el registro.

La vista de detalle distingue la sugerencia del sistema de la valoración humana. El dashboard muestra solo pacientes asignados. Los reportes se crean con plantillas estructuradas a partir de los datos guardados; no se utiliza un LLM. La API también expone el reporte estructurado en el detalle.

## Reglas de priorización

| Entrada reportada | Prioridad sugerida por las reglas v1 |
|---|---|
| Fiebre o apertura de la herida | Alerta |
| Aumento del dolor, secreción, olor, dolor ≥ 4/10 o cambios | Vigilancia, salvo una señal de alerta |
| Sin señales, pero sin modelo validado o con datos desconocidos | Sin evaluación; revisión humana |

No son reglas médicas validadas. Una predicción visual nunca puede bajar una prioridad del cuestionario. `normal` está reservado para una futura integración validada, con entradas completas; el adaptador actual nunca lo produce. `null` significa «sin evaluación», no «normal». Las respuestas desconocidas se conservan como tales. Todas las fotografías quedan sujetas a revisión profesional.

Archivos ilegibles, no admitidos, animados, pequeños o demasiado grandes se rechazan con errores claros. Las imágenes oscuras, sobreexpuestas o con poco contraste se guardan con limitaciones técnicas explícitas. No se afirma verificar enfoque, anatomía ni aptitud clínica. La resolución mínima es 320 × 320 px, máximo 20 megapíxeles y 8 MB; se recodifica a JPEG hasta 2400 px y se eliminan metadatos EXIF.

## Pruebas y calidad

```sh
cd backend
pytest -q
ruff check app migrations
alembic check
cd ../frontend
npm ci
npm run build
npx playwright install chromium
# Con ambos servicios activos y las cuentas demo creadas:
# export DEMO_PASSWORD='tu contraseña de demostración'
# PowerShell: $env:DEMO_PASSWORD='tu contraseña de demostración'
npm run test:e2e
```

`pytest` usa una SQLite efímera por prueba. Para ejecutar las pruebas contra PostgreSQL define `TEST_DATABASE_URL` apuntando a una **base exclusiva de pruebas vacía**: el fixture crea y elimina tablas. Nunca apuntes esa variable a datos que quieras conservar. GitHub Actions configura su propio PostgreSQL 17, aplica migraciones, verifica diferencias y ejecuta las pruebas. La ejecución de Actions depende de que el código esté publicado y el servicio habilitado.

Las pruebas de navegador realizan el recorrido completo en escritorio y móvil, con solicitudes reales a la API. Generan y eliminan registros sintéticos; no simulan respuestas de red. Guardan capturas en `frontend/test-results/`. Solo se ejecutan con una contraseña demo configurada. Ver [VALIDATION.md](docs/VALIDATION.md) para los resultados efectivamente comprobados en la entrega.

## Estructura y decisiones

```text
frontend/src/
  app/                      rutas y navegación
  features/auth/            sesión y acceso
  features/patient/         inicio del paciente
  features/records/         envío, historial, detalle y revisión
  features/clinical-dashboard/
  components/ services/ types/ styles/
backend/app/
  api/ core/ models/ schemas/ repositories/
  services/ ml/ storage/ tests/
backend/migrations/         migración Alembic explícita
docs/                       plan, fuentes, seguridad y verificación
```

Funciones de priorización independientes; repositorio concentra el alcance de acceso; servicio de archivos usa un protocolo sustituible por S3. Las claves de almacenamiento no salen por la API. JWT en cookie HttpOnly, sesiones persistidas revocables, contraseñas Argon2, control de origen y límite de solicitudes de acceso. El frontend no guarda datos de salud ni tokens en localStorage. Paginación y filtros se resuelven en backend. Dependencias exactas en `requirements-lock.txt` y `package-lock.json`; los rangos de desarrollo están en `requirements.txt`.

Los contratos y el modelo se documentaron antes de implementar: [PLAN.md](docs/PLAN.md). La evaluación de pertinencia y licencias de datasets está en [DATASETS.md](docs/DATASETS.md).

## Retención y eliminación

`RETENTION_DAYS` define el vencimiento al crear cada registro; no cambia retroactivamente fechas existentes. Registros vencidos e imágenes dejan de ser accesibles por la API. Ejecuta diariamente `docker compose exec -T backend python -m app.purge` desde el programador del servidor para borrar físicamente registros, revisiones e imágenes vencidas. El paciente también puede eliminarlos manualmente desde el detalle. Si falla el borrado de archivos, el registro permanece para reintento. Los consentimientos y las cuentas no se eliminan mediante esta operación. Los respaldos requieren su propia política de eliminación.

## Límites antes de cualquier uso fuera de demostración

No hay validación clínica, métricas independientes de desempeño, aprobación regulatoria ni afirmación de cumplimiento normativo. El modelo de segmentación opcional descrito abajo no interviene en la priorización. No hay integración con sistemas hospitalarios, notificaciones, agenda, emergencias ni recuperación de contraseñas. El envío no garantiza que el equipo lo lea de inmediato.

Faltan revisión clínica de reglas y mensajes, gobernanza y licencia de datos pertinentes, análisis formal de riesgos, evaluación de seguridad, HTTPS gestionado, cifrado y respaldo del almacenamiento, auditoría clínica completa, MFA, límites distribuidos, monitoreo, recuperación ante desastres y políticas institucionales. Consulta [SECURITY.md](docs/SECURITY.md). No utilices fotografías o datos reales hasta resolver estos puntos.

## Segunda pasada: cuenta y privacidad

Se conserva el flujo de seguimiento. Se añaden consentimiento v2 (aceptar, rechazar y revocar), aviso público, registro de pacientes demo, actualización de nombre, cambio seguro de contraseña, solicitudes ARCO y solicitud/cancelación de baja. Antes de iniciar, ejecuta `alembic upgrade head`. Todas las peticiones que modifican datos requieren `X-Requested-With: Seguimiento`.

Consulta [la auditoría](docs/AUDIT-SECOND-PASS.md) y [operación de privacidad y limitaciones](docs/PRIVACY-OPERATIONS.md). Las solicitudes ARCO tienen estado persistente y atención por operador local; no se simula envío de correo ni eliminación automática. El registro público está bloqueado en producción hasta completar verificación y revisión legal.

Las contraseñas usan Argon2id con sal aleatoria. Fotografías y cuestionarios todavía requieren cifrado administrado en reposo antes de usar datos reales; no se implementó AES ni se almacena una clave en el repositorio.

## Idiomas y referencia visual

El selector global guarda la preferencia local. Náhuatl de la Huasteca oriental y zapoteco disponen de catálogos automáticos parciales obtenidos con Google Translate: muestran la traducción junto al original español y advierten que no tienen revisión lingüística. Mixteco continúa pendiente. Los catálogos se sirven localmente; no se envían datos del paciente a servicios de traducción ni se necesita una API. Consulta la cobertura y las limitaciones en docs/IDIOMAS.md.

Consulta [variantes, archivos y revisión](docs/IDIOMAS.md), [auditoría de acceso e idiomas](docs/AUDITORIA-IDIOMAS.md) y [paleta para presentaciones](docs/paleta-de-colores.md). La paleta es documentación; no hay pantalla de paleta en la aplicación.

Desde frontend, ejecuta `npm run i18n:check` y `npm run test:i18n`. La compilación incluye el control de claves e interpolaciones. Las pruebas Playwright cubren persistencia, aviso de español, validaciones y ausencia de superposición a 360, 768 y 1440 px, además de los recorridos originales.

## Segmentación de imágenes con PyTorch (opcional)

Se integraron los pesos `best.pt` proporcionados por el usuario como un servicio experimental local. El detalle del registro permite al paciente autorizar el análisis visual y al profesional asignado ejecutarlo. `POST /api/records/{id}/segmentation` devuelve contornos y áreas relativas; la interfaz superpone las regiones a la fotografía y permite compararlas con el original. Se guarda el resultado sin alterar el semáforo ni la valoración profesional. No usa LLM ni servicios externos. Está bloqueado en producción por falta de validación clínica. Ejecuta `alembic upgrade head` para instalar la migración 0003.

Consulta [instalación, contrato, auditoría del notebook y límites](docs/SEGMENTACION.md). Dependencias opcionales en `backend/requirements-ml.txt` y entorno comprobado en `backend/requirements-ml-lock.txt`. Los pesos no se redistribuyen en Git. La aplicación principal sigue funcionando sin instalar PyTorch.

### Asignación de cuentas nuevas

En una instalación con un equipo de atención definido, configura `REGISTRATION_CLINICIAN_EMAIL` con el correo de un profesional existente (por ejemplo, `salud@demo.local` después de ejecutar el seed). Reinicia la API al cambiarlo. Las nuevas cuentas y su asignación se guardan en una sola transacción; si el profesional configurado no existe o no tiene el rol adecuado, el registro devuelve un error y no crea la cuenta. El paciente no puede elegir ni modificar esta configuración.

Si está vacío, no se concede acceso automáticamente: se necesita una asignación institucional en la tabla `assignments`. La configuración no reasigna cuentas anteriores, no concede acceso a otros médicos y no habilita el registro público en producción. El panel muestra los registros del paciente asignado al cargar o actualizar la página.
