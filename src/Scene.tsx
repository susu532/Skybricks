import { Environment, PointerLockControls, ContactShadows, Html } from '@react-three/drei';
import { Physics, CuboidCollider, RigidBody } from '@react-three/rapier';
import { EffectComposer, N8AO, Bloom, Vignette, TiltShift2 } from '@react-three/postprocessing';
import { useEffect, useState } from 'react';
import { Brick } from './components/Brick';
import { BLOCK_DIMENSIONS, useStore } from './store';
import { Player } from './components/Player';
import { MobileLookControls } from './components/MobileLookControls';

export function Scene() {
  const blocks = useStore((state) => state.blocks);
  const performanceMode = useStore((state) => state.performanceMode);
  const isMobile = useStore((state) => state.isMobile);
  const [rotation, setRotation] = useState(0);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        setRotation((r) => r === 0 ? Math.PI / 2 : 0);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        useStore.getState().undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {!isMobile ? (
        <PointerLockControls />
      ) : (
        <MobileLookControls />
      )}
      <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/brown_photostudio_05_1k.hdr" environmentIntensity={1.2} />
      <directionalLight 
        position={[20, 30, 20]} 
        intensity={0.8} 
        color="#ffffff"
      >
        <orthographicCamera attach="shadow-camera" args={[-30, 30, 30, -30]} />
      </directionalLight>
      <ambientLight intensity={0.4} color="#ffffff" />
      
      {/* Preppy Sky Background */}
      <color attach="background" args={['#bae6fd']} />
      <fog attach="fog" args={['#bae6fd', 10, 50]} />

      <Physics>
        <Player rotation={rotation} />

        <group>
          {/* Ground */}
          <RigidBody type="fixed" colliders={false} position={[0, 0, 0]}>
            <CuboidCollider args={[50, 0.05, 50]} position={[0, -0.05, 0]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
              <planeGeometry args={[100, 100]} />
              <meshStandardMaterial 
                color="#e9a3bc" 
                roughness={1} 
                metalness={0} 
              />
            </mesh>
          </RigidBody>

          {blocks.map((b) => {
            const d = BLOCK_DIMENSIONS[b.type] || { w: 1, d: 1 };
            return (
              <Brick
                key={b.id}
                id={b.id}
                width={d.w}
                depth={d.d}
                isPlate={d.isPlate}
                shape={d.shape}
                position={b.position}
                rotation={b.rotation}
                color={b.color}
                isDynamic={false}
                isGhost={false}
                performanceMode={performanceMode}
              />
            );
          })}
        </group>
      </Physics>

      {!performanceMode && (
        <EffectComposer>
          <N8AO aoRadius={1.0} intensity={1.5} />
          <Bloom luminanceThreshold={1.2} mipmapBlur intensity={0.08} />
          <Vignette eskil={false} offset={0.1} darkness={0.4} />
        </EffectComposer>
      )}
    </>
  );
}
