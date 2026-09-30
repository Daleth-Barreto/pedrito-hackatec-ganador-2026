# Idiomas y traducción automática

Actualizado el 29 de septiembre de 2026. Esta entrega sustituye el estado de catálogos vacíos documentado en la auditoría anterior.

## Qué cambia al elegir idioma

| Opción | Catálogo | Contenido |
|---|---|---|
| Español | `es-MX.json` | Fuente de 492 claves |
| Náhuatl | `nhe-machine.json` | 419 claves con salida automática de Google Translate, Huasteca oriental (`nhe`) |
| Zapoteco | `zap-machine.json` | 413 claves con salida automática de Google Translate; el proveedor no precisa variante (`zap` es agrupación) |


No se afirma que sean las variantes más habladas. La selección actual de los dos catálogos automáticos corresponde a la disponibilidad comprobada del proveedor, no a una comparación demográfica. No se equipara Huasteca oriental con la anterior propuesta hidalguense, ni el zapoteco del proveedor con la planicie costera.

Las dos opciones automáticas cambian navegación, formularios, preguntas, avisos, errores y textos conocidos de los reportes. Cada traducción se acompaña del original español, separado por `/`. Los fragmentos sin traducción aparecen con `[español]`. La barra de idioma informa que la traducción es automática y no tiene revisión lingüística; sus controles y advertencias permanecen en español. La cobertura parcial no equivale a una aplicación plenamente traducida.

Las traducciones pueden contener errores y no están validadas para consentimiento ni decisiones de salud. No usar este modo con pacientes reales antes de revisión lingüística, clínica y jurídica. Las pruebas de software verifican funcionamiento y estructura; no validan significado, variante ni comprensión. El español visible permite revisar el original, pero no sustituye a una persona intérprete competente.

## Procedencia y privacidad

Se obtuvieron seis lotes por lengua desde la interfaz pública de Google Translate, sin cuenta ni API, el 29 de septiembre de 2026. Se enviaron solamente las cadenas estáticas del programa, incluidos avisos y plantillas genéricas. No se enviaron fotografías, cuestionarios respondidos, nombres de pacientes, notas profesionales, contraseñas ni registros de la base de datos. Las direcciones presentes eran ejemplos ficticios del código.

El resultado se guarda en archivos JSON del frontend. Durante el uso de la app **no se hacen solicitudes a Google ni a otros servicios de traducción**, no hay widget que lea la página y no se necesitan claves. Los enlaces de fuente solo abren al proveedor si la persona los pulsa; no incorporan texto ni datos del paciente a la URL. Las notas profesionales, respuestas libres y datos configurados del responsable se mantienen en origen.

- [Anuncio de Google: náhuatl de la Huasteca oriental y zapoteco](https://blog.google/intl/es-419/actualizaciones-de-producto/informacion/trayendo-el-nahuatl-zapoteco-y-otras-lenguas-originarias-de-mexico-a-google-translate/)
- [Idiomas incorporados a Google Translate](https://support.google.com/translate/answer/15139004?hl=en)
- [INALI: propuesta mixteca](https://atlas.inali.gob.mx/variantes/ficha/051601)

No se encontró mixteco en el selector del servicio consultado. El corpus [KOLO de Elotl](https://kolo.elotl.mx/about/) es un recurso paralelo, no un servicio que traduzca estos formularios completos. No se han fabricado traducciones para rellenar ese catálogo.

## Validaciones y mantenimiento

Se descartaron resultados ausentes, duplicados contradictorios, cambios de parámetros entre llaves, cambios en números, textos idénticos y cadenas con correos, identificadores técnicos o la confirmación literal `ELIMINAR MI CUENTA`. Es una comprobación estructural, no una revisión de traducción.

Los catálogos automáticos tienen `status: machine`, proveedor, fecha, etiqueta de lengua y huella del texto fuente. `reviewers` permanece vacío y `reviewedAt` es nulo. `isMachinePreview` permite la presentación bilingüe; `isReleased` sigue reservado para catálogos completos revisados. No se falsificó evidencia de revisión. Una huella desactualizada desactiva las traducciones automáticas hasta actualizar/revisar los textos.

Las preferencias anteriores `nah-021130` y `zap-051362` se migran al leerlas a `nhe` y `zap-machine`. La variante real se informa en la barra. `html.lang` y fechas mantienen español mientras el contenido sea bilingüe o pendiente; no se etiqueta la página completa como una traducción validada. Se conserva la selección entre recargas y pestañas.

Para actualizar una traducción, editar la clave correspondiente, conservar parámetros e identificadores y comprobar las fuentes. Mantener `machine` hasta contar con revisión competente; no basta con cambiar metadatos para validar una lengua. La publicación revisada exige catálogo completo, variante y comunidad confirmadas, etiqueta lingüística, dos revisiones independientes y fecha. Los textos críticos necesitan revisión clínica/jurídica además de lingüística.

```sh
cd frontend
npm run i18n:check
npm run test:i18n
npm run build
npm run test:e2e
```

## Retiro de la opción mixteco

Por solicitud del usuario, el selector ofrece únicamente español, náhuatl y zapoteco. Una preferencia guardada de mixteco vuelve a español. El archivo pendiente se conserva como referencia interna, sin exponerse como opción de la aplicación.

Los cambios de redacción de la versión limpia invalidaron solo sus traducciones asociadas. La compatibilidad de mensajes antiguos del backend se mantiene en `legacy-sources.json`, sin reescribir datos almacenados.
