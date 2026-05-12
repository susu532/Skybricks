import { Environment, PointerLockControls, Html } from '@react-three/drei';
import { Physics, CuboidCollider, RigidBody } from '@react-three/rapier';
import { EffectComposer, N8AO, Bloom, Vignette } from '@react-three/postprocessing';
import { useMemo } from 'react';
import { Brick, getBlockHeight, BRICK_WIDTH, InstancedBricks } from './components/Brick';
import { BLOCK_DIMENSIONS, useStore } from './store';
import { Player } from './components/Player';
import { MobileLookControls } from './components/MobileLookControls';

export function Scene() {
  const blocks = useStore((state) => state.blocks);
  const performanceMode = useStore((state) => state.performanceMode);
  const isMobile = useStore((state) => state.isMobile);

  const colliders = useMemo(() => {
    return blocks.map((b) => {
      const d = BLOCK_DIMENSIONS[b.type] || { w: 1, d: 1 };
      const h = getBlockHeight(d.shape, d.isPlate);
      return (
        <CuboidCollider 
          key={b.id + "_col"} 
          args={[d.w * BRICK_WIDTH / 2, h / 2, d.d * BRICK_WIDTH / 2]} 
          position={b.position} 
          rotation={[b.rotation[0], b.rotation[1], b.rotation[2]]}
        />
      );
    });
  }, [blocks]);

  const furnitureBricks = useMemo(() => {
    return blocks.filter((b) => {
      const d = BLOCK_DIMENSIONS[b.type];
      const shape = d?.shape || 'brick';
      return shape !== 'brick' && shape !== 'cylinder';
    }).map((b) => {
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
    });
  }, [blocks, performanceMode]);

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
        <orthographicCamera attach="shadow-camera" args={[-100, 100, 100, -100]} />
      </directionalLight>
      <ambientLight intensity={0.4} color="#ffffff" />
      
      {/* Preppy Sky Background */}
      <color attach="background" args={['#bae6fd']} />
      <fog attach="fog" args={['#bae6fd', 10, 100]} />

      <Physics>
        <Player />

        <group>
          {/* Ground & ALL Static Colliders */}
          <RigidBody type="fixed" colliders={false} position={[0, 0, 0]}>
            <CuboidCollider args={[100, 0.05, 100]} position={[0, -0.05, 0]} />
            {colliders}

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
              <planeGeometry args={[200, 200]} />
              <meshStandardMaterial 
                color="#e9a3bc" 
                roughness={1} 
                metalness={0} 
              />
            </mesh>
          </RigidBody>

          <InstancedBricks blocks={blocks} performanceMode={performanceMode} />
          {furnitureBricks}
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
