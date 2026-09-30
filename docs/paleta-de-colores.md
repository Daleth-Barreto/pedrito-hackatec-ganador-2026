# KINEVA · Paleta e identidad para presentaciones

Referencia para diapositivas, carteles y materiales del proyecto. La identidad principal usa los cuatro colores proporcionados por el equipo y blanco. La aplicación utiliza los mismos colores y tonos claros de apoyo; este documento no añade una pantalla de paleta.

| Nombre | HEX | Uso recomendado |
| --- | --- | --- |
| Acento turquesa | `#16C1C8` | Detalles de marca, diagramas, indicadores de paso y rellenos con texto oscuro. |
| Secundario | `#0B8F96` | Iconos, trazos y gráficos; evitarlo para texto pequeño sobre blanco. |
| Principal | `#126E78` | Botones con texto blanco, enlaces y títulos sobre superficies claras. |
| Texto / fondo oscuro | `#263238` | Cuerpo de texto, nombre KINEVA y portadas oscuras con texto blanco. |
| Superficie | `#FFFFFF` | Tarjetas, formularios, tablas y áreas de lectura. |
| Fondo claro de apoyo | `#F3FAFA` | Lienzo principal de la aplicación y diapositivas. |
| Superficie suave | `#E8F8F9` | Secciones destacadas, introducciones y navegación seleccionada. |
| Superficie tenue | `#F5FBFB` | Encabezados de tabla y bloques de información secundaria. |
| Texto secundario | `#52666C` | Fechas, instrucciones, pies y metadatos. |
| Borde decorativo | `#CCE4E6` | Separadores y tarjetas; no como único límite de un campo. |
| Borde de controles | `#6B8B90` | Límites visibles de campos y formularios. |
| Normal | `#126E78` | Prioridad Normal y estados completados, acompañados de texto. |
| Vigilancia | `#8A5A12` | Estado Vigilancia sobre `#FFF3DA`. Color funcional reservado. |
| Alerta | `#B83F45` | Estado Alerta, errores y acciones destructivas sobre `#FFF0F0`. Color funcional reservado. |

Ámbar y rojo se conservan únicamente para distinguir estados operativos. El resto de la interfaz usa la identidad KINEVA. Ningún color implica un diagnóstico ni garantiza ausencia de complicaciones.

## Combinaciones de fondo y texto

Ratios calculados por luminancia relativa sRGB. Texto corriente: al menos 4.5:1; texto grande: al menos 3:1, según [WCAG 2.2, contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). La tabla no equivale a una certificación de accesibilidad de toda la aplicación.

| Fondo | Texto | Contraste | Uso |
| --- | --- | --- | --- |
| `#FFFFFF` | `#263238` | 13.16:1 | Párrafos y formularios |
| `#FFFFFF` | `#126E78` | 5.95:1 | Enlaces y títulos |
| `#FFFFFF` | `#52666C` | 6.04:1 | Texto secundario |
| `#126E78` | `#FFFFFF` | 5.95:1 | Botones principales |
| `#263238` | `#FFFFFF` | 13.16:1 | Portadas y separadores |
| `#16C1C8` | `#263238` | 5.95:1 | Acentos con etiquetas |
| `#E8F8F9` | `#263238` | 12.05:1 | Bloques de contenido |
| `#E8F8F9` | `#126E78` | 5.45:1 | Títulos sobre fondo suave |

Blanco sobre `#16C1C8` da 2.21:1; blanco sobre `#0B8F96`, 3.90:1. Esas combinaciones no se usan para texto corriente. El borde de controles `#6B8B90` contrasta 3.67:1 sobre blanco.

## Marca y composición

- Nombre comercial visible: **KINEVA**, conservado igual en todos los idiomas.
- Se utiliza la K turquesa de la izquierda de la referencia proporcionada. La imagen fuente se conserva sin cambios; el símbolo se muestra con un encuadre SVG, sin estirarlo ni redibujarlo.
- El nombre se renderiza como texto para mantener nitidez y accesibilidad. Su tamaño se adapta al acceso, navegación y páginas públicas.
- Portadas: blanco o fondo `#263238`; título de alto contraste y acento `#16C1C8`.
- Contenido: fondo blanco o claro, títulos `#126E78`, cuerpo `#263238` y espacios generosos entre grupos.
- Tablas: superficies claras, separadores discretos y estados con texto e icono.
- Presentaciones: títulos de 32–44 pt y cuerpo de 24–28 pt como punto de partida, ajustados a la distancia de lectura.
- No sustituir los datos legales del responsable por la marca comercial: nombre legal, domicilio y contacto siguen sujetos a configuración y revisión.

## Archivos de implementación

`frontend/src/styles/tokens.css` centraliza los colores. `frontend/src/components/Brand.tsx` comparte el logo y nombre. `frontend/src/styles/brand.css` controla tamaños y proporciones. `frontend/public/brand/kineva-reference.png` conserva el archivo recibido, y `favicon.svg` encuadra el mismo símbolo para la pestaña.
