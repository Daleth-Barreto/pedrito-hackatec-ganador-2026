# Auditoría de segunda pasada

Revisión del código existente, antes de modificarlo. Se conserva React/FastAPI/SQLAlchemy y la priorización por reglas.

| Before | After (objetivo) | Why |
|---|---|---|
| Consentimiento v1, solo aceptación | Decisiones versionadas, rechazo y revocación | Control explícito de la persona |
| Sin aviso ni ARCO | Aviso público y solicitudes privadas con reautenticación | Transparencia y trazabilidad |
| Solo login | Registro, perfil, contraseña y solicitud de baja | Gestión autónoma de la cuenta |
| Contraseñas con configuración implícita | Argon2id explícito y preservación de espacios | Evitar transformación silenciosa del secreto |
| Contenido sin landmark y enlaces pequeños | Main, salto de navegación y objetivos táctiles | Teclado, lectura y móvil |

Prioridades: P1 ausencia de flujos de privacidad y revocación; P1 sin gestión de contraseña; P2 contraste de texto secundario, foco y objetivos táctiles; P2 deuda de estilos duplicados. Fortalezas: autorización por propietario/asignación, imágenes autenticadas y saneadas, sesiones revocables, ausencia de métricas clínicas inventadas.

Evaluación manual inicial (0–4): accesibilidad 2, rendimiento 3, responsive 3, coherencia visual 2, integridad funcional 2. Estas son valoraciones de auditoría, no mediciones automáticas.

Skills: se consultaron Emil design engineering, Impeccable (audit y craft-floor) y Design Taste Frontend. El launcher de Impeccable falló al crear su caché: no se ejecutó el detector automático. Taste excluye dashboards y formularios de múltiples pasos; se aplican solamente sus criterios compatibles de consistencia, legibilidad y ausencia de decoración gratuita.

## Cambios verificados

Se implementaron los objetivos de la tabla mediante consentimiento v2, nuevos endpoints y pantallas de cuenta/privacidad, migración 0002, Argon2id explícito, protección de mutaciones por cabecera y control de origen. Las solicitudes se guardan, se aíslan por titular y admiten respuesta del operador. Se mejoraron tamaños tipográficos compartidos, contraste de texto secundario, foco, navegación móvil, campos, objetivos táctiles y estados de los nuevos formularios.

Quedan como bloqueos de publicación: revisión jurídica, responsable/contacto/domicilio, acreditación legal de identidad, correo verificado, cifrado administrado y respaldos. No se ejecutó una auditoría externa de seguridad ni accesibilidad. Véase VALIDATION.md para las pruebas efectivamente ejecutadas.
