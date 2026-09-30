# Auditoría previa: acceso e idiomas

| Before | After | Why |
|---|---|---|
| Enlaces de acceso con posición absoluta, junto a la etiqueta de prototipo | Navegación dentro del flujo, sin esa etiqueta decorativa | Evitar superposición y admitir textos largos |
| Texto español incrustado en componentes | Catálogo de claves por funcionalidad y archivos por variante | Preparar traducciones revisables y detectar faltantes |
| Sin preferencia lingüística | Sección global Idioma, preferencia local persistente | Mantener la elección entre pantallas |
| Sin distinción de variantes | Propuestas concretas identificadas por INALI | No representar todas las comunidades con una traducción |

Revisión manual de código: accesibilidad 3/4, rendimiento 3/4, responsive 2/4, tokens 2/4, integridad 2/4. No son resultados de un detector ni certificación WCAG. P1: superposición en el acceso; P1: ausencia de infraestructura lingüística; P2: textos de longitud variable en controles. Se conservan los controles de consentimiento, los avisos clínicos, los permisos y las plantillas basadas en datos disponibles.

Se consultaron Emil, Impeccable audit/craft-floor y los criterios compatibles de Taste. Impeccable no ejecutó su motor automático: el launcher no pudo crear la caché en esta sesión. Taste no se aplica como plantilla de dashboard; se toman sus criterios de legibilidad y adecuación al público. La auditoría precede a las correcciones solicitadas por el usuario.

## Resultado de la intervención

Enlaces públicos en flujo normal, sin la etiqueta decorativa que se superponía. Sección global Idioma con preferencia persistente, variantes propuestas y aviso explícito de español. Catálogos tipados y control de publicación de textos críticos. Se conservaron la revisión profesional, los consentimientos, roles y privacidad; no hay servicio externo de traducción. Ver VALIDATION.md para resultados ejecutados e IDIOMAS.md para las referencias y pendientes lingüísticos.
