import { Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { ASSEMBLY_STEPS, HAND_URL, UI, stlUrl } from "./demoContent";

interface Framing {
  center: THREE.Vector3;
  dim: number;
}

function frameOf(box: THREE.Box3): Framing {
  const size = box.getSize(new THREE.Vector3());
  return {
    center: box.getCenter(new THREE.Vector3()),
    dim: Math.max(size.x, size.y, size.z) || 1,
  };
}

function boxOf(geometry: THREE.BufferGeometry): THREE.Box3 {
  geometry.computeBoundingBox();
  return geometry.boundingBox!.clone();
}

// Acerca la camara segun el tamano del modelo (las unidades varian: COLMAP ~3,
// motor de diseno ~100).
function Fit({ dim }: { dim: number }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as {
    target: THREE.Vector3;
    update: () => void;
  } | null;
  useEffect(() => {
    camera.position.set(dim * 0.35, dim * 0.45, dim * 1.7);
    camera.near = dim / 100;
    camera.far = dim * 40;
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [camera, controls, dim]);
  return null;
}

// Indicador de carga en el DOM (no dentro del canvas): un fallback <Html> de drei
// dentro de Suspense rompe el render con React 19 (removeChild).
function LoadingOverlay() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div className="demo-loading" role="status">
      {UI.loading} {Math.round(progress)}%
    </div>
  );
}

export function Stage3D({
  children,
  autoRotate = false,
}: {
  children: ReactNode;
  autoRotate?: boolean;
}) {
  return (
    <>
      <Canvas camera={{ fov: 45, near: 0.1, far: 5000 }} dpr={[1, 2]}>
        <color attach="background" args={["#0f1f22"]} />
        <ambientLight intensity={0.75} />
        <directionalLight position={[1, 1.6, 1.2]} intensity={1.5} />
        <directionalLight position={[-1, -0.6, -1]} intensity={0.55} />
        <Suspense fallback={null}>{children}</Suspense>
        <OrbitControls
          makeDefault
          enableDamping
          autoRotate={autoRotate}
          autoRotateSpeed={1.4}
        />
      </Canvas>
      <LoadingOverlay />
    </>
  );
}

export function PlyModel({
  url,
  kind,
  color = "#ffffff",
}: {
  url: string;
  kind: "points" | "mesh";
  color?: string;
}) {
  const geometry = useLoader(PLYLoader, url);
  const framing = useMemo(() => frameOf(boxOf(geometry)), [geometry]);
  const hasColor = !!geometry.getAttribute("color");
  useMemo(() => {
    if (kind === "mesh" && !geometry.getAttribute("normal"))
      geometry.computeVertexNormals();
  }, [geometry, kind]);
  return (
    <>
      <Fit dim={framing.dim} />
      <group position={framing.center.clone().negate()}>
        {kind === "points" ? (
          <points geometry={geometry}>
            <pointsMaterial
              size={framing.dim / 380}
              vertexColors={hasColor}
              sizeAttenuation
            />
          </points>
        ) : (
          <mesh geometry={geometry}>
            <meshStandardMaterial
              vertexColors={hasColor}
              color={hasColor ? "#ffffff" : color}
              side={THREE.DoubleSide}
              roughness={0.6}
              metalness={0.05}
            />
          </mesh>
        )}
      </group>
    </>
  );
}

// ---------------------------------------------------------------- ensamble

const EXPLODE = 60;
const STAGGER_MS = 220;
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

interface PartDef {
  url: string;
  color: string;
  step: number;
  order: number;
}

const PARTS: PartDef[] = ASSEMBLY_STEPS.flatMap((step, stepIndex) =>
  step.files.map((file, order) => ({
    url: stlUrl(file),
    color: step.color,
    step: stepIndex,
    order,
  })),
);
const ALL_URLS = [HAND_URL, ...PARTS.map((p) => p.url)];

// Pieza que entra desde afuera (direccion: del centro del munon hacia la pieza).
function Piece({
  geometry,
  color,
  visible,
  delay,
  origin,
}: {
  geometry: THREE.BufferGeometry;
  color: string;
  visible: boolean;
  delay: number;
  origin: THREE.Vector3;
}) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const progress = useRef(0);
  const showAt = useRef(0);

  const offset = useMemo(() => {
    geometry.computeBoundingSphere();
    const direction = geometry.boundingSphere!.center.clone().sub(origin);
    if (direction.lengthSq() < 1e-6) direction.set(0, 1, 0);
    return direction.normalize().multiplyScalar(EXPLODE);
  }, [geometry, origin]);

  useMemo(() => {
    if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
  }, [geometry]);

  useEffect(() => {
    if (visible) showAt.current = performance.now() + delay;
  }, [visible, delay]);

  useFrame((_, dt) => {
    const active = visible && performance.now() >= showAt.current;
    const target = active ? 1 : 0;
    const step = Math.min(Math.abs(target - progress.current), dt / 0.9);
    progress.current += Math.sign(target - progress.current) * step;
    const eased = easeOutCubic(progress.current);
    if (group.current) {
      group.current.position.copy(offset).multiplyScalar(1 - eased);
      group.current.visible = progress.current > 0.001;
    }
    if (material.current) {
      material.current.opacity = Math.min(1, eased * 1.6);
      material.current.emissiveIntensity = (1 - eased) * 0.9;
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          ref={material}
          color={color}
          emissive={color}
          emissiveIntensity={0}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          roughness={0.4}
          metalness={0.15}
        />
      </mesh>
    </group>
  );
}

export function AssemblyScene({ shown }: { shown: number }) {
  const geometries = useLoader(STLLoader, ALL_URLS);
  const handGeometry = geometries[0];

  const framing = useMemo(() => {
    const box = new THREE.Box3();
    geometries.forEach((g) => box.union(boxOf(g)));
    return frameOf(box);
  }, [geometries]);

  const handCenter = useMemo(() => {
    handGeometry.computeBoundingSphere();
    return handGeometry.boundingSphere!.center.clone();
  }, [handGeometry]);

  useMemo(() => {
    if (!handGeometry.getAttribute("normal")) handGeometry.computeVertexNormals();
  }, [handGeometry]);

  return (
    <>
      <Fit dim={framing.dim} />
      <group position={framing.center.clone().negate()}>
        <mesh geometry={handGeometry}>
          <meshStandardMaterial
            color={ASSEMBLY_STEPS[0].color}
            side={THREE.DoubleSide}
            roughness={0.6}
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        </mesh>
        {PARTS.map((part, i) => (
          <Piece
            key={part.url}
            geometry={geometries[i + 1]}
            color={part.color}
            visible={shown >= part.step}
            delay={part.order * STAGGER_MS}
            origin={handCenter}
          />
        ))}
      </group>
    </>
  );
}

// Descarga anticipada de los STL para que el ensamble arranque sin espera.
export function preloadAssembly() {
  ALL_URLS.forEach((url) => useLoader.preload(STLLoader, url));
}
