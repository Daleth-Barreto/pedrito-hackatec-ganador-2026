# Revisión de datasets · 29 de septiembre de 2026

Se revisaron páginas oficiales y publicaciones de los autores; no se descargaron fotografías ni se aceptaron licencias en nombre del usuario. No se verificó la estructura de archivos de ningún paquete descargado. La estructura descrita aquí es la publicada, no una inspección de archivos.

| Fuente | Disponibilidad y condiciones | Estructura publicada y pertinencia |
|---|---|---|
| [DFUC 2021](https://dfu-2021.grand-challenge.org/Dataset/) | Acceso mediante solicitud a los organizadores. No se ha obtenido autorización. | 15,683 recortes de úlceras de pie diabético; entrenamiento, prueba y parte sin etiquetas. Clases control, infección, isquemia y ambas. No es seguimiento de muñones. |
| [DFUC 2022](https://dfu-challenge.github.io/dfuc2022.html) | La página permite solicitar acceso. El [artículo de los autores](https://openresearch.surrey.ac.uk/esploro/outputs/journalArticle/Diabetic-foot-ulcers-segmentation-challenge-report/99924764702346) exige acuerdo de licencia con el propietario. La licencia del artículo no equivale a licencia de datos. | Imágenes de úlceras y anotaciones de segmentación; particiones de entrenamiento/validación/prueba. Segmentar una úlcera no equivale a clasificar prioridad ni complicaciones postamputación. |
| [Medetec](https://medetec.co.uk/files/medetec-image-databases.html) | Colección web accesible. Las [condiciones](https://medetec.co.uk/files/medetec-images.html) permiten usos educativos y similares conservando copyright; alta resolución comercial requiere contacto. No se acredita permiso específico para entrenamiento o redistribución. | Galerías por tipos de herida, sin contrato uniforme de etiquetas de triage, particiones por paciente ni seguimiento longitudinal verificado. La página reconoce deterioro en parte de las imágenes. |

## Decisión

No usar estos recursos como si representaran muñones recientes. No publicar imágenes reales ni entrenar un modelo con licencias o relevancia sin resolver. El módulo de demostración comprueba aspectos técnicos de la imagen y declara que el análisis clínico visual no está disponible. No proporciona clases aleatorias, probabilidades ni métricas.

## Condiciones para un clasificador real

Licencia explícita para entrenamiento y uso previsto; consentimiento y gobernanza; población objetivo representativa; anotaciones profesionales con acuerdos medidos; separación por persona y episodio; revisión de duplicados y fugas; evaluación externa, por subgrupos y dispositivos; análisis de fallos, calibración y umbrales definidos previamente por responsables clínicos. Reportar sensibilidad, especificidad y errores con intervalos de incertidumbre solo tras ejecutar esa evaluación. Evaluar MobileNetV3/EfficientNet-B0 únicamente después. La aprobación de un conjunto de datos no demuestra aptitud clínica.

Las cifras contextuales de amputaciones y acceso a rehabilitación no se incluyen en la interfaz: no se verificaron sus fuentes primarias.
