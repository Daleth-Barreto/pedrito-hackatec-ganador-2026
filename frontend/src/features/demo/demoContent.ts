// Contenido de la demo interactiva (/demo).
// Los textos viven aqui (y no en JSX) porque `npm run i18n:check` exige que todo
// texto visible en JSX pase por el catalogo de idiomas; esta demo es una
// simulacion aislada y no toca esos catalogos.
//
// Todas las rutas son relativas al `base` de Vite (public/demo/...), sin rutas
// absolutas del disco.

const BASE = import.meta.env.BASE_URL;
export const asset = (path: string) => `${BASE}demo/${path}`;
const pad = (n: number) => String(n).padStart(2, "0");

export const VIDEO_NAME = "VIDEO.mp4";
export const VIDEO_URL = asset(`video/${VIDEO_NAME}`);

export const FRAMES = Array.from({ length: 50 }, (_, i) =>
  asset(`fotogramas/frame_${pad(i + 1)}.png`),
);
export const SPECKLE = Array.from({ length: 24 }, (_, i) =>
  asset(`fotos_speckle/foto_${pad(i)}.png`),
);
export const SKIN = Array.from({ length: 24 }, (_, i) =>
  asset(`fotos_piel/foto_${pad(i)}.png`),
);

// Los renders usan 12 azimuts x 2 elevaciones (18 y 45 grados), en ese orden.
export function viewLabel(i: number): string {
  const azimuth = (i % 12) * 30;
  const elevation = i < 12 ? 18 : 45;
  return `Vista ${i + 1} de 24 · azimut ${azimuth}° · elevación ${elevation}°`;
}
export function frameLabel(i: number): string {
  return `Fotograma ${i + 1} de ${FRAMES.length} extraído del video`;
}

export type StageId =
  | "video"
  | "frames"
  | "speckle"
  | "cloud"
  | "skin"
  | "assembly";

export interface StageInfo {
  id: StageId;
  nav: string;
  title: string;
  summary: string;
  points: string[];
}

export const STAGES: StageInfo[] = [
  {
    id: "video",
    nav: "Captura de video",
    title: "Captura del video",
    summary:
      "Todo empieza con un video corto alrededor de la mano. Es la única entrada que necesita la persona usuaria.",
    points: [
      "Se sube el video (.mp4) desde el teléfono o la computadora.",
      "La app lo recibe y lo deja listo para extraer fotogramas.",
    ],
  },
  {
    id: "frames",
    nav: "Fotogramas",
    title: "Extracción de fotogramas",
    summary:
      "Del video se toman cuadros a intervalos regulares para obtener muchas vistas distintas del mismo objeto.",
    points: [
      "Cada fotograma es una imagen fija; aquí se muestran uno por uno.",
      "Más vistas y más solapamiento entre ellas ayudan a reconstruir la forma en 3D.",
    ],
  },
  {
    id: "speckle",
    nav: "Fotos con patrón",
    title: "Preparación para fotogrametría",
    summary:
      "La piel lisa casi no tiene detalles que reconocer. Se aplica un patrón aleatorio (speckle) para dar puntos reconocibles.",
    points: [
      "En la prueba, COLMAP detectó entre 6,700 y 10,200 puntos por imagen.",
      "Las 24 imágenes quedaron registradas (24 de 24), así que se conoce la posición de cada cámara.",
    ],
  },
  {
    id: "cloud",
    nav: "Reconstrucción 3D",
    title: "Reconstrucción en 3D",
    summary:
      "Con las cámaras ubicadas se calcula la profundidad de cada imagen y se fusiona en un modelo 3D. Explora cada resultado con el mouse.",
    points: [
      "Arrastra para rotar, rueda para acercar y botón derecho para desplazar.",
      "Son tres resultados seguidos: malla Poisson, nube de puntos densa y malla cerrada.",
    ],
  },
  {
    id: "skin",
    nav: "Fotos de la mano",
    title: "Vistas de la mano escaneada",
    summary:
      "Renders de la mano con textura de piel, generados desde el modelo 3D, para revisar el resultado desde distintos ángulos.",
    points: [
      "Son 12 azimuts por 2 elevaciones, mostradas una a una.",
      "Sirven para documentar el escaneo; no se usan para reconstruir porque la piel lisa da muy pocos puntos reconocibles.",
    ],
  },
  {
    id: "assembly",
    nav: "Ensamble de la prótesis",
    title: "Ensamble de la prótesis",
    summary:
      "Las piezas diseñadas para esta mano se acomodan una a una sobre la extremidad residual. Avanza pieza por pieza o reproduce todo el ensamble.",
    points: [
      "Las piezas salen del motor de diseño paramétrico: encajan porque se generan a partir del mismo escaneo.",
      "Cada pieza aparece desde afuera hacia su posición final.",
    ],
  },
];

export interface PlyItem {
  id: string;
  file: string;
  kind: "points" | "mesh";
  title: string;
  detail: string;
  color: string;
}

export const PLY_ITEMS: PlyItem[] = [
  {
    id: "poisson",
    file: "scan_COLMAP_poisson.ply",
    kind: "mesh",
    title: "Malla Poisson",
    detail:
      "Primer resultado de la reconstrucción: una superficie continua calculada a partir de los mapas de profundidad (aquí simplificada). Aún tiene la base abierta porque las fotos no vieron la parte de abajo, y la app exige una malla cerrada.",
    color: "#ffffff",
  },
  {
    id: "cloud",
    file: "scan_COLMAP_denso_nube_de_puntos.ply",
    kind: "points",
    title: "Nube de puntos densa",
    detail:
      "COLMAP fusionó 48 mapas de profundidad en 122,184 puntos con color y normales. Es el resultado más limpio de la reconstrucción: todavía son puntos sueltos, sin superficie.",
    color: "#ffffff",
  },
  {
    id: "closed",
    file: "hand_partialHand1.ply",
    kind: "mesh",
    title: "Malla cerrada",
    detail:
      "Escaneo cerrado de la extremidad residual (131,162 vértices) que la app acepta: sin bordes abiertos ni aristas non-manifold. Es el insumo para diseñar la prótesis.",
    color: "#e8c4a8",
  },
];export const plyUrl = (file: string) => asset(`ply/${file}`);

export const HAND_URL = asset("stl/handMesh.stl");
export const stlUrl = (file: string) => asset(`stl/${file}`);

export interface AssemblyStep {
  title: string;
  detail: string;
  color: string;
  files: string[];
}

// Orden de ensamble. El paso 0 es la extremidad residual (siempre visible).
export const ASSEMBLY_STEPS: AssemblyStep[] = [
  {
    title: "Extremidad residual escaneada",
    detail:
      "Punto de partida: la malla de la mano. Todo lo demás se ajusta a esta forma.",
    color: "#e8c4a8",
    files: [],
  },
  {
    title: "Socket blando",
    detail:
      "Manga flexible que abraza la extremidad residual, con ventilación. Se genera a partir de la zona pintada del escaneo.",
    color: "#16c1c8",
    files: ["softSocket.stl"],
  },
  {
    title: "Dedo 1",
    detail: "Tres segmentos articulados, de la base hacia la punta.",
    color: "#5b8def",
    files: ["fingerStruct0.stl", "fingerStruct1.stl", "fingerStruct2.stl"],
  },
  {
    title: "Dedo 2",
    detail: "Segundo dedo, con la misma estructura de tres segmentos.",
    color: "#8b6cf0",
    files: ["fingerStruct3.stl", "fingerStruct4.stl", "fingerStruct5.stl"],
  },
  {
    title: "Dedo 3",
    detail: "Tercer dedo, posicionado según el esqueleto de articulaciones.",
    color: "#e0689b",
    files: ["fingerStruct6.stl", "fingerStruct7.stl", "fingerStruct8.stl"],
  },
  {
    title: "Dedo 4",
    detail: "Cuarto dedo: completa la mano parcial.",
    color: "#3cc08a",
    files: ["fingerStruct9.stl", "fingerStruct10.stl", "fingerStruct11.stl"],
  },
  {
    title: "Conectores",
    detail: "Piezas que unen los dedos con la base para que se muevan juntos.",
    color: "#f2a93b",
    files: ["connectorStruct.stl"],
  },
  {
    title: "Ensamble completo",
    detail:
      "Listo: extremidad residual, socket blando, cuatro dedos y conectores. Nota: el socket rígido (hardSocket) no se generó en esta corrida porque el motor falla en ese paso; el reporte lo registra como error.",
    color: "#ffffff",
    files: [],
  },
];

export const UI = {
  eyebrow: "DEMOSTRACIÓN INTERACTIVA",
  title: "De un video a una prótesis de mano",
  subtitle:
    "Recorre el proceso completo etapa por etapa. Es una simulación con resultados reales de una corrida de ejemplo.",
  back: "Volver a la app",
  stageOf: (n: number, total: number) => `Etapa ${n} de ${total}`,
  happening: "Qué está pasando",
  previous: "Anterior",
  next: "Continuar",
  finish: "Fin de la demo",
  restartDemo: "Volver a empezar",
  navLabel: "Etapas de la demo",
  // video
  dropTitle: "Sube el video de la mano",
  dropHint: "Formato .mp4 o similar. Se usa solo en este navegador.",
  chooseFile: "Elegir video",
  useSample: "Usar el video de ejemplo",
  uploading: "Subiendo video",
  processing: "Video recibido",
  videoReady: "Listo para extraer fotogramas",
  // fotos
  play: "Reproducir",
  pause: "Pausar",
  prevPhoto: "Imagen anterior",
  nextPhoto: "Imagen siguiente",
  replay: "Repetir",
  scrub: "Posición en la secuencia",
  skip: "Saltar al final",
  photoDone: "Secuencia completa. Puedes continuar.",
  // 3d
  loading: "Cargando modelo 3D…",
  viewerHint: "Arrastra para rotar · rueda para acercar",
  seen: "Visto",
  // ensamble
  nextPiece: "Siguiente pieza",
  playAssembly: "Reproducir ensamble",
  pauseAssembly: "Pausar",
  resetAssembly: "Reiniciar ensamble",
  assemblyDone: "Ensamble completo",
  pieceCount: (n: number) => (n === 1 ? "1 pieza" : `${n} piezas`),
};
