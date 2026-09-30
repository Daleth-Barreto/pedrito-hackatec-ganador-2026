# Segmentación local de heridas: integración experimental

## Decisión y aportación

Se incorpora una capacidad útil de visión por computadora: proponer contornos y describir su geometría dentro de una fotografía. Se reutilizan los pesos entregados por el usuario, no un clasificador ficticio. Esta salida puede servir para desarrollar y evaluar una futura herramienta de anotación para profesionales.

No hay evidencia suficiente para incorporar este modelo a la priorización postamputación. La integración se ofrece en el detalle del registro, mediante autorización específica del paciente y ejecución explícita del profesional asignado. Procesa la fotografía almacenada y guarda los resultados por separado. No se ejecuta al subir fotografías y no modifica prioridades, informes clínicos o revisiones profesionales. Sigue bloqueada en producción: permitir su evaluación experimental local no acredita aptitud clínica.

## Artefactos inspeccionados

| Dato | Resultado comprobado |
| --- | --- |
| Archivo | `best (1).pt`, proporcionado por el usuario e instalado como `backend/model_artifacts/best.pt` |
| Tamaño | 20 510 116 bytes |
| SHA-256 | `719df7a51f141b8acc00a0a519f117014f36c37dc87e89693a460fdfe212a051` |
| Tipo cargado | `ultralytics.nn.tasks.SegmentationModel` |
| Clases | `{0: "herida"}` |
| Parámetros | 10 082 675 |
| Versión grabada en checkpoint | Ultralytics 8.4.162 |
| Tamaño de inferencia | 640 px, con preprocesamiento de Ultralytics |
| Umbral del notebook conservado | 0.35; umbral técnico, no sensibilidad clínica |
| Entorno comprobado | Windows, Python 3.12.14; torch 2.14.0+cpu; torchvision 0.29.0+cpu; Ultralytics 8.4.166 |

El notebook contiene preparación de máscaras e inferencia. No proporciona una evaluación reproducible que permita acreditar uso en muñones postamputación. La fotografía usada en su ejemplo tiene un nombre que indica generación con Gemini; su salida no constituye validación clínica. Los campos de métricas incluidos en un checkpoint tampoco sustituyen una evaluación independiente, con separación por paciente y conjunto de prueba pertinente.

## Metodología aprovechada y partes excluidas

Los pesos se actualizaron el 29 de septiembre de 2026. Los nuevos análisis se identifican como `wound-seg-719df7a51f14`; los resultados anteriores guardados conservan su identificador original y no se recalculan automáticamente. El ZIP de entrega incluye el nuevo modelo; no es necesario copiarlo de nuevo. La carga e inferencia verifican compatibilidad técnica, no rendimiento clínico.

Se conserva una sola ejecución del segmentador por solicitud, `conf=0.35`, polígonos en coordenadas de imagen, cajas delimitadoras, área de contorno, porcentaje respecto a la imagen y ubicación por tercios. Las regiones se ordenan por área descendente. La posición superior/inferior describe el encuadre, nunca una zona anatómica. No se suman áreas de regiones que pudieran superponerse.

El notebook convierte máscaras binarias a polígonos YOLO mediante umbral 127, contornos externos, descarte de áreas menores de 80 píxeles y aproximación con tolerancia de 0.002 del perímetro; opcionalmente recorta bordes oscuros con umbral 8. Esa preparación pertenece al entrenamiento: no se ejecuta sobre fotografías de la API ni se entrenó otro modelo sin datos adecuados. La inferencia conserva el encuadre completo, como la función de predicción del notebook.

No se incorporan:

- Consejos elegidos aleatoriamente, inferencias de infección, gravedad o tejidos.
- Umbrales de área que calificaban una herida de pequeña, moderada o extensa.
- Recomendaciones de tratamiento producidas por un LLM sin validación de salida.
- Llamadas a OpenAI, la clave incrustada, rutas personales ni búsqueda automática de otros pesos.
- Un segundo pase de inferencia para dibujar la imagen. El consumidor puede dibujar `polygon_xy` sobre la fotografía autorizada del registro.

Una puntuación de 0.8 no equivale a 80 % de certeza médica. El área en píxeles depende del encuadre, distancia y perspectiva; no es área en cm² ni permite comparar evolución sin un protocolo de fotografía y calibración.

## Datos y licencias

La ruta del notebook menciona **Foot Ulcer Segmentation Challenge (FUSeg)**. Su documentación describe segmentación de úlceras del pie y máscaras, no un conjunto específico de heridas postamputación. Esa mención no demuestra con qué datos se entrenó este archivo ni autoriza su uso clínico o redistribución.

No se descargaron fotografías de pacientes. Quedan pendientes la trazabilidad del entrenamiento, licencia exacta de las imágenes y de los pesos, permisos aplicables y evaluación sobre la población prevista. La consulta al archivo `LICENSE` de la raíz de ese repositorio devolvió 404; eso no prueba que no existan condiciones en otras ubicaciones. La disponibilidad pública no se interpreta como permiso de uso irrestricto.

Ultralytics ofrece AGPL-3.0 y licencia Enterprise. Se debe revisar la compatibilidad de la distribución/despliegue con esas condiciones; esta integración no afirma cumplimiento jurídico ni relicencia el proyecto. Los pesos locales están excluidos de Git y de las imágenes Docker.

Fuentes primarias consultadas:

- [FUSeg: estructura y objetivo del conjunto](https://github.com/uwm-bigdata/wound-segmentation/blob/master/data/Foot%20Ulcer%20Segmentation%20Challenge/README.MD).
- [Segmentación en Ultralytics](https://docs.ultralytics.com/tasks/segment).
- [Licencias de Ultralytics](https://www.ultralytics.com/license).
- [Carga restringida y límites de seguridad de PyTorch](https://docs.pytorch.org/docs/2.14/notes/serialization.html).

## Instalación opcional

La aplicación base conserva sus dependencias habituales y funciona sin PyTorch. Desde la raíz, con el entorno virtual ya creado:

```powershell
.\.venv\Scripts\python.exe -m pip install torch==2.14.0 torchvision==0.29.0 --index-url https://download.pytorch.org/whl/cpu
.\.venv\Scripts\python.exe -m pip install -r backend/requirements-ml.txt
New-Item -ItemType Directory -Force backend/model_artifacts
Copy-Item C:/ruta/propia/best.pt backend/model_artifacts/best.pt
```

El archivo `backend/requirements-ml-lock.txt` registra el entorno completo verificado, incluidas las dependencias base y las opcionales. Para reproducirlo, instalar primero las dos ruedas CPU anteriores y después ese archivo. No usar el índice de PyTorch para resolver las otras dependencias.

Añadir a `backend/.env`, usado al ejecutar desde `backend/`:

```dotenv
SEGMENTATION_ENABLED=true
SEGMENTATION_MODEL_PATH=model_artifacts/best.pt
SEGMENTATION_THREADS=2
```

Reiniciar FastAPI. La instalación local de esta entrega ya tiene las dependencias y una copia de los pesos. `.env.example` conserva `false` como valor inicial. La imagen Docker base no incluye estas dependencias ni los pesos; estos pasos describen la ejecución local nativa. Ejecutar `alembic upgrade head` desde `backend/`: la migración 0003 añade `visual_consents` y `visual_analyses`. Se guarda el último resultado, con fecha y referencia a la autorización; también se conservan las decisiones de consentimiento.


## Uso desde la aplicación

1. El paciente abre el detalle de su registro y la sección **Análisis visual** debajo de la fotografía.
2. Lee la explicación, marca la casilla y pulsa **Autorizar análisis visual**. Puede rechazar o revocar; no hay casillas premarcadas. Se registra fecha y versión `visual-1` para ese registro.
3. El profesional asignado abre ese mismo registro, confirma que comprende las limitaciones y pulsa **Analizar imagen**.
4. Ve contornos numerados sobre la fotografía, con opción **Ver fotografía original** / **Mostrar contornos**, y el detalle por región: área, proporción, puntuación y ubicación en el encuadre.
5. El último resultado queda disponible al recargar para el paciente y su equipo. La nota profesional y la prioridad del cuestionario permanecen separadas.

Revocar elimina el resultado visual guardado e impide nuevos análisis hasta otra aceptación. No borra la fotografía, cuestionario o nota. Eliminar el registro, purgarlo por vencimiento o eliminar la cuenta borra también análisis y decisiones visuales. Si la autorización cambia mientras se procesa una imagen, la API descarta el resultado.

Endpoints adicionales:

- `GET /api/records/{id}/segmentation`: estado, autorización actual y último resultado; acceso por propietario/asignación.
- `POST /api/records/{id}/visual-consent`: solo titular, cuerpo `{"accepted": true, "version": "visual-1"}`. Con `false`, rechaza o revoca y elimina el resultado.

El aviso de privacidad pasa a versión 3. El consentimiento general v2 sigue referido al registro; la autorización de análisis es adicional y separada. Los nuevos textos están en las claves de internacionalización. Español está completo; náhuatl y zapoteco muestran estos textos nuevos en español, identificados como pendientes.

Verificación de interfaz: recorridos reales paciente/profesional en escritorio y móvil con ejecución del modelo; además, prueba de renderizado con polígonos de una fixture geométrica para verificar alineación, comparación original/contornos y recuperación de un fallo 503. Esa fixture no es una predicción del modelo ni una métrica de desempeño.

## Contrato de API

`POST /api/records/{record_id}/segmentation`

Requiere sesión del profesional, paciente asignado, registro no vencido, autorización visual-1 aceptada por el titular, entorno distinto de producción y módulo habilitado. Se eliminó el requisito de declarar una imagen sintética; ahora existe consentimiento específico. El profesional confirma que comprende los límites experimentales antes de ejecutar. No se autoautorizaron registros previos.

Cabeceras: `Content-Type: application/json`, `X-Requested-With: Seguimiento`, cookie de sesión vigente. Cuerpo:

```json
{"limitations_acknowledged": true}
```

Desde la consola del navegador, con una sesión profesional abierta y el identificador de un registro autorizado:

```javascript
const recordId = 'REEMPLAZAR_POR_ID_DEL_REGISTRO';
const response = await fetch(`/api/records/${recordId}/segmentation`, {
  method: 'POST',
  credentials: 'same-origin',
  headers: {'Content-Type': 'application/json', 'X-Requested-With': 'Seguimiento'},
  body: JSON.stringify({limitations_acknowledged: true}),
});
const result = await response.json();
console.log(response.status, result);
```

El contrato OpenAPI incluye `SegmentationResult` y `Region`: `status=experimental`, `validated_for_postamputation=false`, `affects_priority=false`, dimensiones, umbral, mensaje, limitaciones y regiones. Cada región contiene puntuación técnica, área en píxeles, porcentaje de la imagen, caja, polígono y ubicación por tercios. Las coordenadas corresponden a la imagen almacenada y saneada, no necesariamente al archivo original antes de su redimensionado.

Una lista vacía significa «sin regiones detectadas a este umbral», nunca «normal». No se devuelve `priority` ni se introduce este resultado en la lógica de triage.

| Estado | Significado |
| --- | --- |
| 200 | Inferencia ejecutada, incluidas cero regiones |
| 401 / 403 | Sin sesión, rol incorrecto, producción o falta de autorización visual |
| 404 | Registro no autorizado/vencido o imagen ausente |
| 413 / 422 | Tamaño, imagen, calidad o confirmación inválidos |
| 503 | Módulo deshabilitado, ocupado, pesos ausentes/incompatibles o fallo de inferencia |

## Privacidad y operación

Se reutilizan autorización por asignación, sesión y protección CSRF existentes. La fotografía se vuelve a validar y sanear. El endpoint no recibe rutas ni nuevos pesos, no descarga modelos y no llama a traducción o generación externas. La prueba de integración bloquea conexiones de red durante la inferencia.

El cargador verifica el SHA-256 inspeccionado antes de deserializar, usa `weights_only=True` y una lista explícita de clases conocidas; no usa `weights_only=False`. Esto reduce riesgos pero no convierte archivos arbitrarios en seguros. Solo se admite este artefacto y se requiere reiniciar para cambiarlo. No se deben aceptar checkpoints enviados por usuarios finales.

Una inferencia a la vez por proceso, CPU con dos hilos por defecto, tamaño de entrada 640 y máximo 20 regiones. No se guardan fotografías derivadas ni trazas sensibles. El resultado estructurado se guarda en la base de datos con el mismo alcance de acceso y vencimiento del registro; las respuestas usan `Cache-Control: no-store`. El modelo permanece en memoria para siguientes solicitudes; la imagen y el predictor son locales a cada llamada. Los archivos de configuración de Ultralytics se crean bajo `model_artifacts/runtime`, sin información de salud. Su directorio debe ser escribible por el proceso.

Antes de escalar se necesitan aislamiento de inferencia con timeout duro, límites distribuidos y evaluación de recursos. La ejecución actual es una función síncrona en el worker de FastAPI, no una cola de producción.

## Verificación y trabajo pendiente

```powershell
cd backend
$env:RUN_MODEL_TESTS='1'
..\.venv\Scripts\python.exe -m pytest -q --basetemp=../../pytest-model-local -p no:cacheprovider
..\.venv\Scripts\python.exe -m ruff check app
..\.venv\Scripts\python.exe -m pip check
```

43 pruebas pasan, incluida inferencia real del checkpoint a través de la API con imagen sintética y red bloqueada. Cubren permisos, confirmación, bloqueo de producción y ausencia/revocación de consentimiento, calidad, archivo ausente, rechazo de pesos distintos, ocupación, fallo controlado, geometría y conservación de la prioridad y el reporte. Sin `RUN_MODEL_TESTS`, la prueba con pesos se omite; la prueba geométrica se omite si no están las dependencias opcionales.

Estas pruebas verifican software, no exactitud clínica. Falta medir segmentación con máscaras de referencia pertinentes, separar pacientes entre particiones, evaluar falsos positivos y negativos y revisar el rendimiento por condiciones de fotografía y población. No se entrenó un modelo nuevo ni se inventaron métricas. Antes de habilitar datos reales se necesitan además revisión clínica, legal y de licencias, evaluación de privacidad y condiciones institucionales. El consentimiento visual-1 implementado informa del procesamiento local y permite revocarlo; no reemplaza esa evaluación formal.

Se detectó una clave de API incrustada en el notebook original. No se copió al proyecto ni se utilizó. Su titular debe revocarla; el archivo original no fue modificado.
