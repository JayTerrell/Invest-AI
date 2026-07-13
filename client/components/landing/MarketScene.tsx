import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MotionValue } from "framer-motion";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Scroll-reactive 3D "market terrain": an instanced field of candlesticks
 * undulating like a living order book, plus a drifting particle veil.
 * The camera sweeps from a low grazing angle to a top-down institutional
 * view as the page scrolls.
 */

const UP = new THREE.Color("#10b981");
const DOWN = new THREE.Color("#f43f5e");
const ACCENT = new THREE.Color("#22d3ee");

function CandleField({ scroll }: { scroll: MotionValue<number> }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const COLS = isMobile ? 26 : 44;
  const ROWS = isMobile ? 8 : 12;
  const COUNT = COLS * ROWS;

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.45;
    const s = scroll.get();
    const m = mesh.current;
    let i = 0;
    for (let z = 0; z < ROWS; z++) {
      for (let x = 0; x < COLS; x++) {
        const px = (x - COLS / 2) * 0.62;
        const pz = (z - ROWS / 2) * 1.5 - 2;
        const wave =
          Math.sin(px * 0.55 + t + z * 0.7) * 0.9 +
          Math.sin(px * 0.21 - t * 0.6) * 1.4 +
          Math.cos(pz * 0.4 + t * 0.35) * 0.5;
        const h = 0.35 + Math.abs(wave) * (1.1 + s * 0.4);
        dummy.position.set(px, h / 2 - 1.2, pz);
        dummy.scale.set(0.16, h, 0.16);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);

        // direction of the local slope decides up/down coloring
        const slope =
          Math.cos(px * 0.55 + t + z * 0.7) * 0.55 +
          Math.cos(px * 0.21 - t * 0.6) * 0.21;
        color.copy(slope >= 0 ? UP : DOWN);
        // fade far rows toward the accent for depth
        color.lerp(ACCENT, Math.min(0.55, (z / ROWS) * 0.7));
        m.setColorAt(i, color);
        i++;
      }
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial transparent opacity={0.8} toneMapped={false} />
    </instancedMesh>
  );
}

function ParticleVeil() {
  const pts = useRef<THREE.Points>(null!);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const N = isMobile ? 350 : 900;
  const positions = useMemo(() => {
    const a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      a[i * 3] = (Math.random() - 0.5) * 34;
      a[i * 3 + 1] = Math.random() * 14 - 2;
      a[i * 3 + 2] = (Math.random() - 0.5) * 26;
    }
    return a;
  }, [N]);

  useFrame(({ clock }) => {
    pts.current.rotation.y = clock.getElapsedTime() * 0.012;
  });

  return (
    <points ref={pts}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#22d3ee"
        transparent
        opacity={0.55}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function Rig({ scroll }: { scroll: MotionValue<number> }) {
  const { camera, pointer } = useThree();
  const look = useMemo(() => new THREE.Vector3(0, 0.4, 0), []);
  useFrame(() => {
    const s = scroll.get();
    // sweep: grazing shot -> elevated command view
    const ty = 2.2 + s * 7.5;
    const tz = 13.5 - s * 6.5;
    const tx = pointer.x * 0.9;
    camera.position.x += (tx - camera.position.x) * 0.04;
    camera.position.y += (ty + pointer.y * 0.4 - camera.position.y) * 0.05;
    camera.position.z += (tz - camera.position.z) * 0.05;
    camera.lookAt(look);
  });
  return null;
}

export function MarketScene({ scroll }: { scroll: MotionValue<number> }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 2.2, 13.5], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ pointerEvents: "none" }}
    >
      <fogExp2 attach="fog" args={["#080b12", 0.052]} />
      <CandleField scroll={scroll} />
      <ParticleVeil />
      <Rig scroll={scroll} />
    </Canvas>
  );
}
