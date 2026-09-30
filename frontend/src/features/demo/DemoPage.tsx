import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Film,
  Pause,
  Play,
  RotateCcw,
  ShoppingBag,
  SkipForward,
  StepBack,
  StepForward,
  Upload,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useProgress } from "@react-three/drei";
import { Notice } from "../../components/UI";
import "./demo.css";
import { BRAND_NAME } from "../../components/Brand";
import { PublicFooter, PublicHeader } from "../../components/PublicSite";
import { t, useLocale } from "../../i18n/runtime";
import { formatMXN, packageById, type PackageId } from "../commerce/pricing";
import { ConfirmationView, OrderView, type Order } from "./OrderFlow";
import {
  ASSEMBLY_STEPS,
  FRAMES,
  PLY_ITEMS,
  SPECKLE,
  STAGES,
  UI,
  VIDEO_NAME,
  VIDEO_URL,
  frameLabel,
  plyUrl,
  viewLabel,
  type StageId,
} from "./demoContent";
import { AssemblyScene, PlyModel, Stage3D, preloadAssembly } from "./Viewer3D";

type Done = (id: StageId) => void;

// ------------------------------------------------------------------ video

function VideoStage({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"idle" | "uploading" | "ready">("idle");
  const [progress, setProgress] = useState(0);
  const [source, setSource] = useState("");
  const [name, setName] = useState("");
  const objectUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  useEffect(() => {
    if (phase !== "uploading") return;
    const timer = window.setInterval(() => {
      setProgress((p) => Math.min(100, p + 4));
    }, 50);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === "uploading" && progress >= 100) {
      setPhase("ready");
      onDone();
    }
  }, [phase, progress, onDone]);

  function begin(url: string, label: string) {
    setSource(url);
    setName(label);
    setProgress(0);
    setPhase("uploading");
  }

  function pick(file: File | undefined) {
    if (!file) return;
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(file);
    begin(objectUrl.current, file.name);
  }

  if (phase === "idle")
    return (
      <div className="demo-drop">
        <Film size={42} />
        <h3>{UI.dropTitle}</h3>
        <p>{UI.dropHint}</p>
        <div className="demo-actions">
          <label className="button primary demo-file">
            <Upload size={17} />
            {UI.chooseFile}
            <input
              type="file"
              accept="video/*"
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </label>
          <button
            type="button"
            className="button secondary"
            onClick={() => begin(VIDEO_URL, VIDEO_NAME)}
          >
            <Play size={17} />
            {UI.useSample}
          </button>
        </div>
      </div>
    );

  if (phase === "uploading")
    return (
      <div className="demo-drop">
        <Upload size={42} />
        <h3>{UI.uploading}</h3>
        <p>{name}</p>
        <div
          className="demo-bar wide"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
    );

  return (
    <div className="demo-video">
      <video
        src={source}
        controls
        autoPlay
        muted
        loop
        playsInline
        aria-label={name}
      />
      <p className="demo-caption">
        <Check size={15} />
        {UI.processing}: {name}. {UI.videoReady}.
      </p>
    </div>
  );
}

// ------------------------------------------------- secuencia de imagenes

function PhotoStage({
  urls,
  caption,
  intervalMs,
  onDone,
}: {
  urls: string[];
  caption: (index: number) => string;
  intervalMs: number;
  onDone: () => void;
}) {
  const last = urls.length - 1;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setIndex((i) => Math.min(last, i + 1));
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [playing, intervalMs, last]);

  useEffect(() => {
    if (index >= last) {
      setPlaying(false);
      onDone();
    }
  }, [index, last, onDone]);

  useEffect(() => {
    const next = urls[index + 1];
    if (next) new Image().src = next;
  }, [index, urls]);

  const finished = index >= last;
  function togglePlay() {
    if (finished) {
      setIndex(0);
      setPlaying(true);
    } else setPlaying((p) => !p);
  }

  return (
    <div className="demo-photos">
      <div className="demo-frame">
        <img src={urls[index]} alt={caption(index)} />
        <span className="demo-counter">
          {index + 1} / {urls.length}
        </span>
      </div>
      <p className="demo-caption">{caption(index)}</p>
      <div className="demo-bar" aria-hidden="true">
        <span style={{ width: `${((index + 1) / urls.length) * 100}%` }} />
      </div>
      <div className="demo-controls">
        <button
          type="button"
          className="demo-icon"
          aria-label={UI.prevPhoto}
          onClick={() => {
            setPlaying(false);
            setIndex((i) => Math.max(0, i - 1));
          }}
        >
          <StepBack size={18} />
        </button>
        <button
          type="button"
          className="demo-icon primary"
          aria-label={finished ? UI.replay : playing ? UI.pause : UI.play}
          onClick={togglePlay}
        >
          {finished ? (
            <RotateCcw size={18} />
          ) : playing ? (
            <Pause size={18} />
          ) : (
            <Play size={18} />
          )}
        </button>
        <button
          type="button"
          className="demo-icon"
          aria-label={UI.nextPhoto}
          onClick={() => {
            setPlaying(false);
            setIndex((i) => Math.min(last, i + 1));
          }}
        >
          <StepForward size={18} />
        </button>
        <input
          type="range"
          min={0}
          max={last}
          value={index}
          aria-label={UI.scrub}
          onChange={(e) => {
            setPlaying(false);
            setIndex(Number(e.target.value));
          }}
        />
        {!finished && (
          <button
            type="button"
            className="demo-icon"
            aria-label={UI.skip}
            onClick={() => {
              setPlaying(false);
              setIndex(last);
            }}
          >
            <SkipForward size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------ reconstruccion 3D

function CloudStage({ onDone }: { onDone: () => void }) {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const [seen, setSeen] = useState<number[]>([0]);
  const { active: loading } = useProgress();

  // el avance automatico espera a que el modelo termine de cargar
  useEffect(() => {
    if (!auto || loading || active >= PLY_ITEMS.length - 1) return;
    const timer = window.setTimeout(() => select(active + 1, true), 7000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, loading, active]);

  useEffect(() => {
    if (seen.length === PLY_ITEMS.length) onDone();
  }, [seen, onDone]);

  function select(i: number, fromAuto = false) {
    if (!fromAuto) setAuto(false);
    setActive(i);
    setSeen((s) => (s.includes(i) ? s : [...s, i]));
  }

  const item = PLY_ITEMS[active];
  return (
    <div className="demo-cloud">
      <div className="demo-pills" role="tablist">
        {PLY_ITEMS.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={`demo-pill${i === active ? " on" : ""}`}
            onClick={() => select(i)}
          >
            {seen.includes(i) && i !== active && <Check size={13} />}
            {i + 1}. {p.title}
          </button>
        ))}
      </div>
      <div className="demo-viewer">
        <Stage3D autoRotate>
          <PlyModel
            key={item.id}
            url={plyUrl(item.file)}
            kind={item.kind}
            color={item.color}
          />
        </Stage3D>
        <span className="demo-hint">{UI.viewerHint}</span>
      </div>
      <p className="demo-caption">{item.detail}</p>
    </div>
  );
}

// --------------------------------------------------------------- ensamble

function AssemblyStage({ onDone }: { onDone: () => void }) {
  const total = ASSEMBLY_STEPS.length;
  const [shown, setShown] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (shown >= total - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setShown((s) => s + 1), 1900);
    return () => window.clearTimeout(timer);
  }, [playing, shown, total]);

  useEffect(() => {
    if (shown >= total - 1) onDone();
  }, [shown, total, onDone]);

  const current = ASSEMBLY_STEPS[shown];
  const complete = shown >= total - 1;
  return (
    <div className="demo-assembly">
      <div className="demo-viewer">
        <Stage3D>
          <AssemblyScene shown={shown} />
        </Stage3D>
        <span className="demo-hint">{UI.viewerHint}</span>
      </div>
      <div className="demo-side">
        <ol className="demo-parts">
          {ASSEMBLY_STEPS.map((step, i) => (
            <li
              key={step.title}
              className={
                i < shown ? "done" : i === shown ? "current" : "pending"
              }
            >
              <span
                className="demo-swatch"
                style={{ background: step.color }}
              />
              <span className="demo-part-name">{step.title}</span>
              {step.files.length > 0 && (
                <small>{UI.pieceCount(step.files.length)}</small>
              )}
              {i < shown && <Check size={14} />}
            </li>
          ))}
        </ol>
        <div className="demo-step-text" aria-live="polite">
          <strong>{current.title}</strong>
          <p>{current.detail}</p>
        </div>
        <div className="demo-actions">
          <button
            type="button"
            className="button primary"
            disabled={complete}
            onClick={() => {
              setPlaying(false);
              setShown((s) => Math.min(total - 1, s + 1));
            }}
          >
            <StepForward size={17} />
            {UI.nextPiece}
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={complete}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? <Pause size={17} /> : <Play size={17} />}
            {playing ? UI.pauseAssembly : UI.playAssembly}
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setPlaying(false);
              setShown(0);
            }}
          >
            <RotateCcw size={17} />
            {UI.resetAssembly}
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------ proceso tecnico

// Con `onFinish`, la ultima etapa lleva a la vista previa en lugar de reiniciar.
function ProcessWalkthrough({ onFinish }: { onFinish?: () => void }) {
  useLocale();
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState<Partial<Record<StageId, boolean>>>({});
  const info = STAGES[stage];

  const markDone = useCallback<Done>(
    (id) => setDone((d) => (d[id] ? d : { ...d, [id]: true })),
    [],
  );
  const doneVideo = useCallback(() => markDone("video"), [markDone]);
  const doneFrames = useCallback(() => markDone("frames"), [markDone]);
  const doneSpeckle = useCallback(() => markDone("speckle"), [markDone]);
  const doneCloud = useCallback(() => markDone("cloud"), [markDone]);
  const doneAssembly = useCallback(() => markDone("assembly"), [markDone]);

  useEffect(() => {
    // las piezas del ensamble se descargan mientras se explora la reconstruccion 3D
    if (info.id === "cloud") preloadAssembly();
  }, [info.id]);

  const unlocked = STAGES.findIndex((s) => !done[s.id]);
  const furthest = unlocked === -1 ? STAGES.length - 1 : unlocked;
  const isLast = stage === STAGES.length - 1;
  const canContinue = !!done[info.id];

  function renderStage() {
    switch (info.id) {
      case "video":
        return <VideoStage onDone={doneVideo} />;
      case "frames":
        return (
          <PhotoStage
            urls={FRAMES}
            caption={frameLabel}
            intervalMs={420}
            onDone={doneFrames}
          />
        );
      case "speckle":
        return (
          <PhotoStage
            urls={SPECKLE}
            caption={viewLabel}
            intervalMs={700}
            onDone={doneSpeckle}
          />
        );
      case "cloud":
        return <CloudStage onDone={doneCloud} />;
      case "assembly":
        return <AssemblyStage onDone={doneAssembly} />;
    }
  }

  return (
    <div className="demo-layout">
      <nav className="demo-nav" aria-label={UI.navLabel}>
        <ol>
          {STAGES.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                disabled={i > furthest}
                aria-current={i === stage ? "step" : undefined}
                className={
                  i === stage ? "current" : done[s.id] ? "done" : "pending"
                }
                onClick={() => setStage(i)}
              >
                <span className="demo-num">
                  {done[s.id] && i !== stage ? <Check size={14} /> : i + 1}
                </span>
                {s.nav}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <section className="panel demo-stage" key={info.id}>
        <div className="demo-stage-head">
          <p className="eyebrow">{UI.stageOf(stage + 1, STAGES.length)}</p>
          <h2>{info.title}</h2>
          <p>{info.summary}</p>
          <div className="demo-points">
            <strong>{UI.happening}</strong>
            <ul>
              {info.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="demo-content">{renderStage()}</div>

        <div className="demo-foot">
          <button
            type="button"
            className="button secondary"
            disabled={stage === 0}
            onClick={() => setStage((s) => Math.max(0, s - 1))}
          >
            <ArrowLeft size={16} />
            {UI.previous}
          </button>
          {isLast && onFinish ? (
            <button
              type="button"
              className="button primary"
              disabled={!canContinue}
              onClick={onFinish}
            >
              {t("Journey.ver_mi_protesis")}
              <ArrowRight size={16} />
            </button>
          ) : isLast ? (
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setStage(0);
                setDone({});
              }}
            >
              <RotateCcw size={16} />
              {UI.restartDemo}
            </button>
          ) : (
            <button
              type="button"
              className="button primary"
              disabled={!canContinue}
              onClick={() => setStage((s) => s + 1)}
            >
              {UI.next}
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

// ------------------------------------------------ vista previa del paciente

const LAST_STEP = ASSEMBLY_STEPS.length - 1;
const INCLUDED_PARTS = ASSEMBLY_STEPS.slice(1, LAST_STEP);
// Por ahora solo el paquete mediano esta disponible para pacientes.
const RECOMMENDED: PackageId = "medium";

function FuturePreview({
  onOrder,
  showProcess = true,
}: {
  onOrder: () => void;
  showProcess?: boolean;
}) {
  useLocale();
  const [shown, setShown] = useState(LAST_STEP);
  const [building, setBuilding] = useState(false);
  const [process, setProcess] = useState(false);
  const recommended = packageById(RECOMMENDED);

  useEffect(() => {
    if (!building) return;
    if (shown >= LAST_STEP) {
      setBuilding(false);
      return;
    }
    const timer = window.setTimeout(() => setShown((s) => s + 1), 850);
    return () => window.clearTimeout(timer);
  }, [building, shown]);

  function show(withProsthesis: boolean) {
    setBuilding(false);
    setShown(withProsthesis ? LAST_STEP : 0);
  }

  return (
    <>
      <section className="preview-hero">
        <p className="eyebrow">{t("Preview.eyebrow")}</p>
        <h1>{t("Preview.titulo")}</h1>
        <p className="landing-lead">{t("Preview.subtitulo")}</p>
      </section>

      <div className="preview-grid">
        <section className="panel preview-stage">
          <div className="preview-toolbar">
            <div
              className="segmented"
              role="group"
              aria-label={t("Preview.vista")}
            >
              <button
                type="button"
                aria-pressed={shown === LAST_STEP && !building}
                onClick={() => show(true)}
              >
                {t("Preview.con_protesis")}
              </button>
              <button
                type="button"
                aria-pressed={shown === 0 && !building}
                onClick={() => show(false)}
              >
                {t("Preview.solo_extremidad")}
              </button>
            </div>
            <button
              type="button"
              className="button secondary"
              disabled={building}
              onClick={() => {
                setShown(0);
                setBuilding(true);
              }}
            >
              <Play size={16} />
              {building ? t("Preview.armando") : t("Preview.ver_como_se_arma")}
            </button>
          </div>
          <div className="demo-viewer preview-viewer">
            <Stage3D autoRotate={!building}>
              <AssemblyScene shown={shown} />
            </Stage3D>
            <span className="demo-hint">{t("Preview.arrastra")}</span>
          </div>
          <p className="preview-step" aria-live="polite">
            <strong>
              {shown === LAST_STEP
                ? t("Preview.resultado_titulo")
                : ASSEMBLY_STEPS[shown].title}
            </strong>
            {shown === LAST_STEP
              ? t("Preview.resultado_texto")
              : ASSEMBLY_STEPS[shown].detail}
          </p>
        </section>

        <aside className="panel preview-case">
          <h2>{t("Preview.tu_caso")}</h2>
          <dl className="case-facts">
            <div>
              <dt>{t("Preview.tipo")}</dt>
              <dd>{t("Preview.tipo_valor")}</dd>
            </div>
            <div>
              <dt>{t("Preview.extremidad")}</dt>
              <dd>{t("Preview.extremidad_valor")}</dd>
            </div>
            <div>
              <dt>{t("Preview.escaneo")}</dt>
              <dd className="case-ok">
                <Check size={15} aria-hidden="true" />
                {t("Preview.escaneo_valor")}
              </dd>
            </div>
            <div>
              <dt>{t("Preview.tamano")}</dt>
              <dd>
                {t(recommended.name)} · {t(recommended.examples)}
              </dd>
            </div>
          </dl>
          <div className="case-price">
            <span>{t("Preview.paquete_recomendado")}</span>
            <strong>{formatMXN(recommended.price)}</strong>
            <small>{t("Preview.incluye_mes_gratis")}</small>
          </div>
          <button
            type="button"
            className="button primary full large"
            onClick={onOrder}
          >
            <ShoppingBag size={18} />
            {t("Preview.ordenar")}
          </button>
          <small className="preview-disclaimer">
            {t("Preview.simulacion")}
          </small>
        </aside>
      </div>

      <section className="panel preview-parts">
        <h2>{t("Preview.piezas_titulo")}</h2>
        <ul>
          {INCLUDED_PARTS.map((part) => (
            <li key={part.title}>
              <span
                className="demo-swatch"
                style={{ background: part.color }}
              />
              <span>
                <strong>{part.title}</strong>
                <small>{part.detail}</small>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {showProcess && (
        <section className="preview-process">
          <div className="preview-process-head">
            <div>
              <h2>{t("Preview.proceso_titulo")}</h2>
              <p className="subtitle">{t("Preview.proceso_texto")}</p>
            </div>
            <button
              type="button"
              className="button secondary"
              aria-expanded={process}
              onClick={() => setProcess((open) => !open)}
            >
              {process ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {process
                ? t("Preview.ocultar_proceso")
                : t("Preview.ver_proceso")}
            </button>
          </div>
          {process && <ProcessWalkthrough />}
        </section>
      )}
    </>
  );
}

// ------------------------------------- recorrido del paciente dentro de la app

type JourneyView = "process" | "preview" | "order" | "done";
const JOURNEY_VIEWS: JourneyView[] = ["process", "preview", "order", "done"];

// Paciente con sesion: sube su video, sigue la generacion hasta el STL, ve su
// protesis, la ordena y decide si activa el seguimiento.
export function ProsthesisJourney() {
  useLocale();
  const location = useLocation();
  const welcome = Boolean(
    (location.state as { welcome?: boolean } | null)?.welcome,
  );
  const [view, setView] = useState<JourneyView>("process");
  const [order, setOrder] = useState<Order | null>(null);
  const current = JOURNEY_VIEWS.indexOf(view);
  const labels = [
    t("Journey.paso_escaneo"),
    t("Journey.paso_vista"),
    t("Journey.paso_pedido"),
    t("Journey.paso_seguimiento"),
  ];

  function go(next: JourneyView) {
    setView(next);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="journey-page">
      {welcome && view === "process" && (
        <Notice kind="success">{t("Journey.bienvenida")}</Notice>
      )}
      <ol className="stepper journey-stepper" aria-label={t("Journey.pasos")}>
        {labels.map((label, i) => (
          <li
            key={label}
            className={
              i === current ? "current" : i < current ? "complete" : ""
            }
            aria-current={i === current ? "step" : undefined}
          >
            <span>{i < current ? <Check size={17} /> : i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {view === "process" && (
        <>
          <div className="page-title journey-title">
            <p className="eyebrow">{t("Journey.eyebrow")}</p>
            <h1>{t("Journey.titulo")}</h1>
            <p className="subtitle">{t("Journey.subtitulo")}</p>
            <small>{t("Journey.simulacion")}</small>
          </div>
          <ProcessWalkthrough onFinish={() => go("preview")} />
        </>
      )}
      {view === "preview" && (
        <>
          <button
            type="button"
            className="back-link"
            onClick={() => go("process")}
          >
            <ArrowLeft size={16} />
            {t("Journey.volver_al_proceso")}
          </button>
          <FuturePreview onOrder={() => go("order")} showProcess={false} />
        </>
      )}
      {view === "order" && (
        <OrderView
          initial={RECOMMENDED}
          showSteps={false}
          onBack={() => go("preview")}
          onConfirm={(placed) => {
            setOrder(placed);
            go("done");
          }}
        />
      )}
      {view === "done" && order && (
        <ConfirmationView order={order} showSteps={false} inApp />
      )}
    </div>
  );
}

// ------------------------------------------------------------------ pagina

export default function DemoPage() {
  useLocale();
  const [view, setView] = useState<"preview" | "order" | "done">("preview");
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const previous = document.title;
    document.title = `${BRAND_NAME} · ${t("Preview.titulo")}`;
    return () => {
      document.title = previous;
    };
  }, []);

  function go(next: typeof view) {
    setView(next);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="site">
      <PublicHeader />
      <main className="demo-page" id="main-content">
        {view === "preview" && <FuturePreview onOrder={() => go("order")} />}
        {view === "order" && (
          <OrderView
            initial={RECOMMENDED}
            onBack={() => go("preview")}
            onConfirm={(placed) => {
              setOrder(placed);
              go("done");
            }}
          />
        )}
        {view === "done" && order && <ConfirmationView order={order} />}
      </main>
      <PublicFooter />
    </div>
  );
}
