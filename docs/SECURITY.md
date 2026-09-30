# Seguridad y límites operativos

## Controles implementados

- Contraseñas Argon2; respuesta de acceso genérica, límite de 10 intentos por IP/5 minutos en un proceso.
- Cookie HttpOnly y SameSite=Strict; Secure cuando APP_ENV=production. JWT firmado con vencimiento más sesión revocable en DB. El secreto de ejemplo se rechaza.
- Origin permitido explícitamente; rechazo de Sec-Fetch-Site cross-site; sin tokens en almacenamiento del navegador.
- Consultas acotadas por propietario/asignación para listas, detalles, imágenes y notas; 404 uniforme para identificadores ajenos.
- Consentimiento persistido anterior al registro; restricción de UI antes de captura, validación de propietario en backend.
- Tamaño limitado incluso sin Content-Length; inspección de contenido real con Pillow; formatos restringidos, límites de píxeles y metadatos removidos.
- UUID privados para almacenamiento. No hay servidor estático de fotografías. Respuestas sensibles sin caché.
- Validación del cuestionario, separación entre prioridad sugerida y revisión, versiones de reglas, fechas y autor profesional.
- Borrado manual y purga por vencimiento. Fallos de persistencia intentan retirar el archivo recién creado.
- Logs de errores inesperados contienen el tipo de excepción, sin payload, contraseña, fotografía ni descripción del paciente.

## Lo que falta

El prototipo no afirma cumplimiento legal. APP_ENV=production activa Secure, pero no transforma la aplicación en un producto apto para pacientes. Requiere HTTPS, red privada para DB, gestión de secretos, monitoreo, validación clínica, revisión de accesibilidad y seguridad, controles institucionales de consentimiento y conservación, evaluación regulatoria y gobernanza de datos.

El limitador de login no es distribuido y debe reemplazarse antes de varios workers. El almacenamiento local no cifra por sí mismo ni tiene respaldo. Un corte entre DB y disco puede dejar archivos huérfanos: se necesita reconciliación operativa y transacciones/outbox según el proveedor definitivo. Los consentimientos y las sesiones requieren una política adicional de conservación. Las revisiones del MVP son de una sola escritura; no hay flujo de enmiendas ni auditoría completa de lecturas. El servicio no envía alertas al profesional ni garantiza tiempos de respuesta. Los datos son aportados por el paciente y no se verifican clínicamente.

La eliminación lógica por fecha es inmediata al consultar; la eliminación física exige programar `python -m app.purge`. No se incluye un programador oculto dentro del servidor web. Los respaldos, si se habilitan, deben respetar la política de conservación.

Para un LLM futuro: enviar solo los campos mínimos, contrato de tratamiento de datos, salida con esquema validado, prohibir diagnósticos y recomendaciones no aprobadas, comprobación de fidelidad y fallback a las plantillas actuales. No configurar un LLM solo para aparentar inteligencia en el hackatón.
