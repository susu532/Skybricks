import { Environment, PointerLockControls, Html } from '@react-three/drei';
import { Physics, CuboidCollider, RigidBody, InstancedRigidBodies } from '@react-three/rapier';
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

  const activeBlocks = useMemo(() => {
    if (isMobile) {
      return blocks.filter(b => !b.id.startsWith('mansion_'));
    }
    return blocks.filter(b => !b.id.startsWith('mobile_barbie_'));
  }, [blocks, isMobile]);

  const instancedColliders = useMemo(() => {
    const groups = new Map<string, { w: number, d: number, h: number, instances: any[] }>();
    activeBlocks.forEach((b) => {
      const d = BLOCK_DIMENSIONS[b.type] || { w: 1, d: 1 };
      const h = getBlockHeight(d.shape, d.isPlate);
      // Small optimization: we don't need colliders for rugs and tiny decorative things
      if (h < 0.3) return; 
      
      const key = `${d.w}_${d.d}_${h}`;
      if (!groups.has(key)) {
        groups.set(key, { w: d.w, d: d.d, h: h, instances: [] });
      }
      const g = groups.get(key)!;
      g.instances.push({
        key: g.instances.length,
        position: [b.position[0], b.position[1], b.position[2]],
        rotation: [b.rotation[0], b.rotation[1], b.rotation[2]]
      });
    });
    return Array.from(groups.values());
  }, [activeBlocks]);

  const furnitureBricks = useMemo(() => {
    return activeBlocks.filter((b) => {
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
  }, [activeBlocks, performanceMode]);

  return (
    <>
      {!isMobile ? (
        <PointerLockControls />
      ) : (
        <MobileLookControls />
      )}
      {!performanceMode && (
        <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/brown_photostudio_05_1k.hdr" environmentIntensity={1.2} />
      )}
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
        <Player activeBlocks={activeBlocks} />

        <group>
          {/* Ground & ALL Static Colliders */}
          <RigidBody type="fixed" colliders={false} position={[0, 0, 0]}>
            <CuboidCollider args={[100, 0.05, 100]} position={[0, -0.05, 0]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
              <planeGeometry args={[200, 200]} />
              <meshStandardMaterial 
                color="#e9a3bc" 
                roughness={1} 
                metalness={0} 
              />
            </mesh>
          </RigidBody>

          {instancedColliders.map((g, i) => (
            <InstancedRigidBodies 
              key={i} 
              instances={g.instances}
              type="fixed" 
              colliders="cuboid"
            >
               <instancedMesh args={[undefined, undefined, g.instances.length]}>
                 <boxGeometry args={[g.w * BRICK_WIDTH, g.h, g.d * BRICK_WIDTH]} />
                 <meshBasicMaterial visible={false} />
               </instancedMesh>
            </InstancedRigidBodies>
          ))}

          <InstancedBricks blocks={activeBlocks} performanceMode={performanceMode} />
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
