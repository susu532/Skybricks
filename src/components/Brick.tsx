import { CuboidCollider, RigidBody } from '@react-three/rapier';
import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { playClackSound } from '../audio';
import { BLOCK_DIMENSIONS, useStore } from '../store';

export const BRICK_HEIGHT = 1.2;
export const BRICK_WIDTH = 1.0;
export const PLATE_HEIGHT = BRICK_HEIGHT / 3;
export const STUD_HEIGHT = 0.2;
export const STUD_RADIUS = 0.3;

const tempMatrix = new THREE.Matrix4();

export function InstancedBricks({ blocks, performanceMode }: { blocks: any[], performanceMode: boolean }) {
  const groups = useMemo(() => {
    const map = new Map<string, any>();
    for (const b of blocks) {
      if (!b || !b.type) continue;
      const d = BLOCK_DIMENSIONS[b.type as keyof typeof BLOCK_DIMENSIONS] || { w: 1, d: 1 };
      const shape = d.shape || 'brick';
      const isFurniture = shape !== 'brick' && shape !== 'cylinder';
      if (isFurniture) continue;
      
      const height = getBlockHeight(shape, d.isPlate);
      // Key includes size, shape, color, and performanceMode to ensure same material/geometry
      const geomKey = `${d.w}_${d.d}_${height}_${shape}`;
      const matKey = `${b.color}_${performanceMode}`;
      const key = `${geomKey}:::${matKey}`;
      
      if (!map.has(key)) {
        map.set(key, { w: d.w, d: d.d, h: height, shape, color: b.color, blocks: [] });
      }
      map.get(key)!.blocks.push(b);
    }
    return Array.from(map.values());
  }, [blocks, performanceMode]);

  return (
    <>
      {groups.map((g, i) => (
        <InstancedGroup key={i} group={g} performanceMode={performanceMode} />
      ))}
    </>
  );
}

function InstancedGroup({ group, performanceMode }: any) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const geom = getGeometry(group.w, group.d, group.h, group.shape, performanceMode);
    const mat = getBrickMaterial(group.color, false, false, performanceMode);
    
    useLayoutEffect(() => {
        if (!meshRef.current) return;
        group.blocks.forEach((b: any, i: number) => {
            tempMatrix.makeRotationFromEuler(new THREE.Euler(b.rotation[0], b.rotation[1], b.rotation[2]));
            tempMatrix.setPosition(b.position[0], b.position[1], b.position[2]);
            meshRef.current!.setMatrixAt(i, tempMatrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [group.blocks]);

    return (
        <instancedMesh
            ref={meshRef}
            args={[geom, mat, group.blocks.length]}
            castShadow={!performanceMode}
            receiveShadow={!performanceMode}
            userData={{ blocks: group.blocks }}
        />
    );
}

export function getBlockHeight(shape?: string, isPlate?: boolean) {
    let height = isPlate ? PLATE_HEIGHT : BRICK_HEIGHT;
    
    // Furniture specific proportions
    if (shape === 'desk') height = 2.4;
    else if (shape === 'sofa') height = 2.0;
    else if (shape === 'monitor') height = 1.6;
    else if (shape === 'lamp') height = 4.8;
    else if (shape === 'cabinet') height = 3.6;
    else if (shape === 'bookshelf') height = 6.0;
    else if (shape === 'tv') height = 3.0;
    else if (shape === 'toilet') height = 1.6;
    else if (shape === 'bathtub') height = 1.6;
    else if (shape === 'fridge') height = 6.0;
    else if (shape === 'stove') height = 2.4;
    else if (shape === 'sink') height = 2.4;
    else if (shape === 'washer') height = 2.8;
    else if (shape === 'dining_table') height = 2.4;
    else if (shape === 'coffee_table') height = 1.4;
    else if (shape === 'armchair') height = 2.0;
    else if (shape === 'shower') height = 6.0;
    else if (shape === 'vanity') height = 2.4;
    else if (shape === 'mirror') height = 3.0;
    else if (shape === 'stool') height = 1.6;
    else if (shape === 'pouf') height = 1.2;
    else if (shape === 'plant') height = 2.0;
    else if (shape === 'heart_rug') height = 0.2;
    else if (shape === 'canopy_bed') height = 5.0;
    else if (shape === 'clothing_rack') height = 4.0;
    else if (shape === 'bow_chair') height = 2.0;
    else if (shape === 'record_player') height = 1.0;
    else if (shape === 'disco_ball') height = 1.5;

    return height;
}

import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const materialCache: Record<string, THREE.Material> = {};
const ghostMaterialCache: Record<string, THREE.Material> = {};
const boxGeomCache: Record<string, THREE.BufferGeometry> = {};

export function getGeometry(width: number, depth: number, height: number, shape?: string, performanceMode: boolean = false, isGhost: boolean = false) {
  const key = `${width}_${depth}_${height}_${shape || 'brick'}_${performanceMode}_${isGhost}`;
  if (!boxGeomCache[key]) {
      let geom: THREE.BufferGeometry;
      
      if (shape === 'cylinder') {
          geom = new THREE.CylinderGeometry(width * BRICK_WIDTH / 2 - 0.01, depth * BRICK_WIDTH / 2 - 0.01, height - 0.01, performanceMode ? 12 : 32);
      } else {
          if (performanceMode) {
              geom = new THREE.BoxGeometry(width * BRICK_WIDTH - 0.01, height - 0.01, depth * BRICK_WIDTH - 0.01);
          } else {
              geom = new RoundedBoxGeometry(width * BRICK_WIDTH - 0.01, height - 0.01, depth * BRICK_WIDTH - 0.01, 2, 0.02);
          }
      }
      
      const isFurniture = shape && shape !== 'brick' && shape !== 'cylinder';
      if (!isFurniture) {
          let baseGeom = geom.toNonIndexed();
          baseGeom.deleteAttribute('uv');
          baseGeom.deleteAttribute('normal');
          baseGeom.computeVertexNormals();
          
          const geometries = [baseGeom];
          let radialSegments = performanceMode ? 8 : 32;
          let studGeom = new THREE.CylinderGeometry(STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, radialSegments).toNonIndexed();
          studGeom.deleteAttribute('uv');
          studGeom.deleteAttribute('normal');
          studGeom.computeVertexNormals();
          
          for (let x = 0; x < width; x++) {
              for (let z = 0; z < depth; z++) {
                  // Optimization: skip studs for performance mode on mobile and ghost previews
                  const isMobile = useStore.getState().isMobile;
                  if (performanceMode && (isMobile || isGhost)) continue;
                  
                  const clonedStud = studGeom.clone();
                  clonedStud.translate(
                      (x - width / 2 + 0.5) * BRICK_WIDTH,
                      height / 2 + STUD_HEIGHT / 2,
                      (z - depth / 2 + 0.5) * BRICK_WIDTH
                  );
                  geometries.push(clonedStud);
              }
          }
          const mergedGeom = mergeGeometries(geometries);
          if (mergedGeom) {
              geom = mergedGeom;
              geom.computeBoundingSphere();
              geom.computeBoundingBox();
          }
      }

      boxGeomCache[key] = geom;
  }
  return boxGeomCache[key];
}

export function getBrickMaterial(color: string, isGhost: boolean = false, isInvalid: boolean = false, performanceMode: boolean = false) {
  const cacheKey = `${color}${isGhost ? '_ghost' : ''}${isInvalid ? '_invalid' : ''}${performanceMode ? '_perf' : ''}`;
  const cache = isGhost ? ghostMaterialCache : materialCache;
  if (!cache[cacheKey]) {
    if (isGhost) {
      if (performanceMode) {
        cache[cacheKey] = new THREE.MeshStandardMaterial({
          color: isInvalid ? '#ff0000' : color,
          roughness: 0.1,
          metalness: 0,
          transparent: true,
          opacity: isInvalid ? 0.4 : 0.6,
          depthWrite: false,
          emissive: isInvalid ? '#ff0000' : color,
          emissiveIntensity: 0.5,
        });
      } else {
        cache[cacheKey] = new THREE.MeshPhysicalMaterial({
          color: isInvalid ? '#ff0000' : color,
          roughness: 0.15,
          metalness: 0.05,
          clearcoat: 0.5,
          clearcoatRoughness: 0.1,
          ior: 1.48,
          transparent: true,
          opacity: isInvalid ? 0.4 : 0.7,
          depthWrite: false,
          emissive: isInvalid ? '#ff0000' : color,
          emissiveIntensity: 0.3,
        });
      }
    } else {
      if (performanceMode) {
        cache[cacheKey] = new THREE.MeshLambertMaterial({
          color: color,
        });
      } else {
        cache[cacheKey] = new THREE.MeshPhysicalMaterial({
          color: color,
          roughness: 0.15, // Polished plastic
          metalness: 0.05, // Slight depth
          clearcoat: 0.5, // Better sheen
          clearcoatRoughness: 0.1,
          ior: 1.48, // Standard acrylic/plastic
          transparent: false,
          opacity: 1.0,
          depthWrite: true,
          reflectivity: 0.5,
          envMapIntensity: 1.4,
        });
      }
    }
  }
  return cache[cacheKey];
}

function GhostAnimator({ groupRef, material, isInvalid }: { groupRef: any, material: any, isInvalid: boolean }) {
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.02;
      if (material) {
        material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 6) * 0.3;
        if (isInvalid) {
          material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 8) * 0.2;
        }
      }
    }
  });
  return null;
}

export const Brick = React.memo(function Brick({ width, depth, isPlate, position, rotation, color, isDynamic, id, isGhost, isInvalid, shape, performanceMode }: any) {
    let height = getBlockHeight(shape, isPlate);

    const material = getBrickMaterial(color, isGhost, isInvalid, performanceMode);
    const groupRef = useRef<THREE.Group>(null);

    const isFurniture = shape && shape !== 'brick' && shape !== 'cylinder';

    const boxGeom = getGeometry(width, depth, height, shape, performanceMode, isGhost);

    let content;
    if (shape === 'chair') {
        const seatHeight = PLATE_HEIGHT;
        const legHeight = height - seatHeight;
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Seat */}
                <mesh position={[0, -height/2 + legHeight + seatHeight/2, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH - 0.2, seatHeight, depth * BRICK_WIDTH - 0.2]} />
                </mesh>
                {/* Backrest */}
                <mesh position={[0, -height/2 + legHeight + seatHeight + height/2 - 0.2, -depth * BRICK_WIDTH / 2 + 0.2]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH - 0.2, height, PLATE_HEIGHT]} />
                </mesh>
                {/* Legs */}
                {[-1, 1].map(x => [-1, 1].map(z => (
                    <mesh key={`${x}-${z}`} position={[x * (width * BRICK_WIDTH / 2 - 0.25), -height/2 + legHeight/2, z * (depth * BRICK_WIDTH / 2 - 0.25)]} material={material}>
                        <cylinderGeometry args={[0.08, 0.08, legHeight]} />
                    </mesh>
                )))}
            </group>
        );
    } else if (shape === 'table') {
        const legHeight = height - PLATE_HEIGHT;
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Top */}
                <mesh position={[0, height/2 - PLATE_HEIGHT/2, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, PLATE_HEIGHT, depth * BRICK_WIDTH]} />
                </mesh>
                {/* Legs */}
                {[-1, 1].map(x => [-1, 1].map(z => (
                    <mesh key={`${x}-${z}`} position={[x * (width * BRICK_WIDTH / 2 - 0.3), -height/2 + legHeight/2, z * (depth * BRICK_WIDTH / 2 - 0.3)]} material={material}>
                        <cylinderGeometry args={[0.15, 0.15, legHeight]} />
                    </mesh>
                )))}
            </group>
        );
    } else if (shape === 'bed') {
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Frame */}
                <mesh position={[0, -height/2 + PLATE_HEIGHT/2, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, PLATE_HEIGHT, depth * BRICK_WIDTH]} />
                </mesh>
                {/* Mattress */}
                <mesh position={[0, -height/2 + PLATE_HEIGHT + PLATE_HEIGHT/2, 0]}>
                    <boxGeometry args={[width * BRICK_WIDTH - 0.2, PLATE_HEIGHT, depth * BRICK_WIDTH - 0.2]} />
                    <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
                </mesh>
                {/* Pillow */}
                <mesh position={[0, -height/2 + PLATE_HEIGHT*2, depth * BRICK_WIDTH/2 - 0.8]}>
                    <boxGeometry args={[width * BRICK_WIDTH - 1, PLATE_HEIGHT, 1]} />
                    <meshStandardMaterial color="#FFF5F5" roughness={0.8} />
                </mesh>
                {/* Headboard */}
                <mesh position={[0, 0, depth * BRICK_WIDTH / 2 - 0.15]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, height + 0.4, 0.3]} />
                </mesh>
            </group>
        );
    } else if (shape === 'plant') {
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Pot - more detailed with rim */}
                <mesh position={[0, -height/2 + 0.3, 0]} material={material}>
                    <cylinderGeometry args={[0.45, 0.35, 0.6]} />
                </mesh>
                {!performanceMode && (
                  <>
                    <mesh position={[0, -height/2 + 0.65, 0]} material={material}>
                        <cylinderGeometry args={[0.5, 0.45, 0.15]} />
                    </mesh>
                    {/* Soil */}
                    <mesh position={[0, -height/2 + 0.6, 0]}>
                        <cylinderGeometry args={[0.4, 0.4, 0.05]} />
                        <meshStandardMaterial color="#3d2b1f" roughness={1} />
                    </mesh>
                  </>
                )}
                {/* Stem */}
                <mesh position={[0, -height/2 + 1.0, 0]}>
                    <cylinderGeometry args={[0.08, 0.1, 0.8]} />
                    <meshStandardMaterial color="#2d5a27" roughness={0.9} />
                </mesh>
                {/* Foliage - multiple clusters for a bushier look */}
                <group position={[0, height/2 - 0.5, 0]}>
                    {/* Main clump */}
                    <mesh position={[0, 0, 0]} scale={[1, 0.9, 1]}>
                        <sphereGeometry args={[0.7, performanceMode ? 8 : 12, performanceMode ? 8 : 12]} />
                        <meshStandardMaterial color="#166534" roughness={0.9} />
                    </mesh>
                    {!performanceMode && (
                      <>
                        {/* Secondary clumps */}
                        <mesh position={[0.4, 0.3, 0.4]} scale={[0.8, 0.7, 0.8]}>
                            <sphereGeometry args={[0.5, 8, 8]} />
                            <meshStandardMaterial color="#15803d" roughness={0.8} />
                        </mesh>
                        <mesh position={[-0.4, 0.4, -0.4]} scale={[0.7, 0.8, 0.7]}>
                            <sphereGeometry args={[0.5, 8, 8]} />
                            <meshStandardMaterial color="#14532d" roughness={0.8} />
                        </mesh>
                        
                        {/* Side leaves/highlights using selected color if it's not green, otherwise a bright green */}
                        {[0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].map((angle, i) => (
                            <group key={i} rotation={[0, angle, 0]}>
                                <mesh position={[0.5, 0.1, 0]} rotation={[0, 0, -Math.PI/4]} scale={[0.9, 0.3, 0.7]}>
                                    <sphereGeometry args={[0.5, 8, 8]} />
                                    <meshStandardMaterial color={color.toLowerCase() === '#006400' ? "#4ade80" : color} roughness={0.8} />
                                </mesh>
                            </group>
                        ))}
                        {/* Top leaf/bud */}
                        <mesh position={[0, 1.0, 0]} scale={[0.4, 0.6, 0.4]}>
                            <sphereGeometry args={[0.5, 8, 8]} />
                            <meshStandardMaterial color="#86efac" roughness={0.8} />
                        </mesh>
                      </>
                    )}
                </group>
            </group>
        );
    } else if (shape === 'rug') {
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                <mesh position={[0, -height/2 + 0.05, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH - 0.1, 0.1, depth * BRICK_WIDTH - 0.1]} />
                </mesh>
            </group>
        );
    } else if (shape === 'sofa') {
        const seatHeight = height * 0.4;
        const armWidth = 0.5;
        const backRestThickness = 0.6;
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Base/Seat */}
                <mesh position={[0, -height/2 + seatHeight/2, backRestThickness/2]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, seatHeight, depth * BRICK_WIDTH - backRestThickness]} />
                </mesh>
                {/* Backrest */}
                <mesh position={[0, 0, -depth * BRICK_WIDTH/2 + backRestThickness/2]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, height, backRestThickness]} />
                </mesh>
                {/* Arms */}
                <mesh position={[-width * BRICK_WIDTH/2 + armWidth/2, -height/2 + seatHeight/2 + 0.1, backRestThickness/2]} material={material}>
                    <boxGeometry args={[armWidth, seatHeight + 0.2, depth * BRICK_WIDTH - backRestThickness]} />
                </mesh>
                <mesh position={[width * BRICK_WIDTH/2 - armWidth/2, -height/2 + seatHeight/2 + 0.1, backRestThickness/2]} material={material}>
                    <boxGeometry args={[armWidth, seatHeight + 0.2, depth * BRICK_WIDTH - backRestThickness]} />
                </mesh>
            </group>
        );
    } else if (shape === 'desk') {
        const legThickness = 0.2;
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Top */}
                <mesh position={[0, height/2 - PLATE_HEIGHT/2, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, PLATE_HEIGHT, depth * BRICK_WIDTH]} />
                </mesh>
                {/* Drawer Unit (One side) */}
                <mesh position={[width * BRICK_WIDTH/2 - 1.2, -PLATE_HEIGHT/2, 0]} material={material}>
                    <boxGeometry args={[2.0, height - PLATE_HEIGHT, depth * BRICK_WIDTH - 0.2]} />
                </mesh>
                {/* Single Leg (Other side) */}
                <mesh position={[-width * BRICK_WIDTH/2 + 0.3, -PLATE_HEIGHT/2, depth * BRICK_WIDTH/2 - 0.3]} material={material}>
                    <boxGeometry args={[legThickness, height - PLATE_HEIGHT, legThickness]} />
                </mesh>
                <mesh position={[-width * BRICK_WIDTH/2 + 0.3, -PLATE_HEIGHT/2, -depth * BRICK_WIDTH/2 + 0.3]} material={material}>
                    <boxGeometry args={[legThickness, height - PLATE_HEIGHT, legThickness]} />
                </mesh>
            </group>
        );
    } else if (shape === 'monitor') {
        const standHeight = height * 0.4;
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Screen */}
                <mesh position={[0, standHeight/2, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, height - standHeight, 0.1]} />
                </mesh>
                <mesh position={[0, standHeight/2, 0.06]}>
                    <boxGeometry args={[width * BRICK_WIDTH - 0.1, height - standHeight - 0.1, 0.01]} />
                    <meshStandardMaterial color="#000000" roughness={0.1} />
                </mesh>
                {/* Stand Stem */}
                <mesh position={[0, -height/2 + standHeight/2, -0.05]} material={material}>
                    <boxGeometry args={[0.2, standHeight, 0.1]} />
                </mesh>
                {/* Stand Base */}
                <mesh position={[0, -height/2 + 0.05, -0.1]} material={material}>
                    <boxGeometry args={[0.6, 0.1, 0.4]} />
                </mesh>
            </group>
        );
    } else if (shape === 'lamp') {
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Base */}
                <mesh position={[0, -height/2 + 0.05, 0]} material={material}>
                    <cylinderGeometry args={[0.3, 0.4, 0.1]} />
                </mesh>
                {/* Pole */}
                <mesh position={[0, -0.2, 0]} material={material}>
                    <cylinderGeometry args={[0.05, 0.05, height - 0.6]} />
                </mesh>
                {/* Shade */}
                <mesh position={[0, height/2 - 0.3, 0]}>
                    <cylinderGeometry args={[0.2, 0.4, 0.4, 16, 1, true]} />
                    <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} transparent={true} opacity={0.9} />
                </mesh>
                {/* Bulb */}
                <mesh position={[0, height/2 - 0.3, 0]}>
                    <sphereGeometry args={[0.15, 16, 16]} />
                    <meshStandardMaterial color="#FFFAA0" emissive="#FFFAA0" emissiveIntensity={1} />
                </mesh>
            </group>
        );
    } else if (shape === 'cabinet') {
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Main Body */}
                <mesh position={[0, 0, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, height, depth * BRICK_WIDTH]} />
                </mesh>
                {/* Doors lines */}
                <mesh position={[0, 0, depth * BRICK_WIDTH/2 + 0.01]}>
                    <boxGeometry args={[0.02, height - 0.2, 0.02]} />
                    <meshBasicMaterial color="#000000" transparent opacity={0.2} />
                </mesh>
                {/* Handles */}
                <mesh position={[-0.2, 0.2, depth * BRICK_WIDTH/2 + 0.05]} material={material}>
                    <boxGeometry args={[0.05, 0.3, 0.1]} />
                </mesh>
                <mesh position={[0.2, 0.2, depth * BRICK_WIDTH/2 + 0.05]} material={material}>
                    <boxGeometry args={[0.05, 0.3, 0.1]} />
                </mesh>
            </group>
        );
    } else if (shape === 'bookshelf') {
        const shelfThickness = 0.1;
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Back */}
                <mesh position={[0, 0, -depth * BRICK_WIDTH/2 + shelfThickness/2]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, height, shelfThickness]} />
                </mesh>
                {/* Sides */}
                <mesh position={[-width * BRICK_WIDTH/2 + shelfThickness/2, 0, shelfThickness/2]} material={material}>
                    <boxGeometry args={[shelfThickness, height, depth * BRICK_WIDTH - shelfThickness]} />
                </mesh>
                <mesh position={[width * BRICK_WIDTH/2 - shelfThickness/2, 0, shelfThickness/2]} material={material}>
                    <boxGeometry args={[shelfThickness, height, depth * BRICK_WIDTH - shelfThickness]} />
                </mesh>
                {/* Shelves */}
                {[-0.3, -0.1, 0.1, 0.3].map((yFac, i) => (
                   <mesh key={i} position={[0, height * yFac, shelfThickness/2]} material={material}>
                       <boxGeometry args={[width * BRICK_WIDTH - shelfThickness*2, shelfThickness, depth * BRICK_WIDTH - shelfThickness]} />
                   </mesh>
                ))}
            </group>
        );
    } else if (shape === 'tv') {
        const standThick = 0.2;
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* TV Screen */}
                <mesh position={[0, height/2 - 0.2, 0]}>
                    <boxGeometry args={[width * BRICK_WIDTH, height - 0.4, 0.2]} />
                    <meshStandardMaterial color="#2d2d2d" roughness={0.1} />
                </mesh>
                <mesh position={[0, height/2 - 0.2, 0.12]}>
                    <boxGeometry args={[width * BRICK_WIDTH - 0.2, height - 0.6, 0.05]} />
                    <meshStandardMaterial color="#000000" roughness={0.0} emissive="#0a0a0a" />
                </mesh>
                {/* Stand */}
                <mesh position={[0, -height/2 + standThick/2, -0.1]} material={material}>
                    <boxGeometry args={[1.5, standThick, depth * BRICK_WIDTH]} />
                </mesh>
                <mesh position={[0, -height/2 + standThick + 0.2, -0.1]} material={material}>
                    <boxGeometry args={[0.3, 0.4, 0.1]} />
                </mesh>
            </group>
        );
    } else if (shape === 'toilet') {
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Bowl Base */}
                <mesh position={[0, -height/2 + 0.6, 0.1]} material={material}>
                    <cylinderGeometry args={[0.6, 0.4, 1.2]} />
                </mesh>
                {/* Tank */}
                <mesh position={[0, 0, -depth * BRICK_WIDTH/2 + 0.4]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, height, 0.8]} />
                </mesh>
                {/* Seat Cover */}
                <mesh position={[0, -height/2 + 1.25, 0.1]}>
                    <cylinderGeometry args={[0.62, 0.62, 0.1]} />
                    <meshStandardMaterial color="#ffffff" />
                </mesh>
            </group>
        );
    } else if (shape === 'bathtub') {
        const wallThick = 0.2;
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Outer Box */}
                <mesh position={[0, 0, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, height, depth * BRICK_WIDTH]} />
                </mesh>
                {/* Inner Cutout fake (we use dark inside logic by using multiple borders instead usually, 
                    but simple approach is a plane on top that looks like water or a recessed floor) */}
                {/* Left/Right Walls */}
                <mesh position={[-width * BRICK_WIDTH/2 + wallThick/2, 0.2, 0]} material={material}>
                    <boxGeometry args={[wallThick, height - 0.4, depth * BRICK_WIDTH]} />
                </mesh>
                <mesh position={[width * BRICK_WIDTH/2 - wallThick/2, 0.2, 0]} material={material}>
                    <boxGeometry args={[wallThick, height - 0.4, depth * BRICK_WIDTH]} />
                </mesh>
                {/* Inner bottom */}
                <mesh position={[0, -height/2 + wallThick, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH - wallThick*2, wallThick, depth * BRICK_WIDTH - wallThick*2]} />
                </mesh>
            </group>
        );
    } else if (shape === 'fridge') {
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Main Body */}
                <mesh position={[0, 0, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, height, depth * BRICK_WIDTH]} />
                </mesh>
                {/* Door split */}
                <mesh position={[0, 0.4, depth * BRICK_WIDTH/2 + 0.01]}>
                    <boxGeometry args={[width * BRICK_WIDTH + 0.02, 0.05, 0.02]} />
                    <meshBasicMaterial color="#000000" transparent opacity={0.3} />
                </mesh>
                {/* Handles */}
                <mesh position={[-width * BRICK_WIDTH/2 + 0.3, 1.2, depth * BRICK_WIDTH/2 + 0.1]}>
                    <boxGeometry args={[0.05, 0.8, 0.1]} />
                    <meshStandardMaterial color="#cccccc" />
                </mesh>
                <mesh position={[-width * BRICK_WIDTH/2 + 0.3, -0.6, depth * BRICK_WIDTH/2 + 0.1]}>
                    <boxGeometry args={[0.05, 0.6, 0.1]} />
                    <meshStandardMaterial color="#cccccc" />
                </mesh>
            </group>
        );
    } else if (shape === 'stove') {
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Body */}
                <mesh position={[0, 0, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, height, depth * BRICK_WIDTH]} />
                </mesh>
                {/* Oven door */}
                <mesh position={[0, 0, depth * BRICK_WIDTH/2 + 0.01]}>
                    <boxGeometry args={[width * BRICK_WIDTH - 0.4, height - 0.8, 0.02]} />
                    <meshStandardMaterial color="#111111" transparent opacity={0.8} />
                </mesh>
                {/* Handle */}
                <mesh position={[0, height/2 - 0.4, depth * BRICK_WIDTH/2 + 0.1]}>
                    <boxGeometry args={[1.2, 0.05, 0.1]} />
                    <meshStandardMaterial color="#cccccc" />
                </mesh>
                {/* Burners */}
                {[-0.6, 0.6].map((x, i) => 
                     [-0.6, 0.6].map((z, j) => (
                        <mesh key={`${i}-${j}`} position={[x, height/2 + 0.05, z]}>
                            <cylinderGeometry args={[0.3, 0.3, 0.1]} />
                            <meshStandardMaterial color="#222222" />
                        </mesh>
                     ))
                )}
            </group>
        );
    } else if (shape === 'sink') {
        const wallThick = 0.2;
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Cabinet Base */}
                <mesh position={[0, -height/4, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, height/2, depth * BRICK_WIDTH]} />
                </mesh>
                {/* Basin Outer */}
                <mesh position={[0, height/4, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, height/2, depth * BRICK_WIDTH]} />
                </mesh>
                {/* Basin Inner space (make it look like a bowl) */}
                <mesh position={[0, height/4 + 0.1, 0.2]}>
                    <boxGeometry args={[width * BRICK_WIDTH - 0.4, height/2, depth * BRICK_WIDTH - 0.6]} />
                    <meshStandardMaterial color="#ffffff" />
                </mesh>
                {/* Faucet */}
                <mesh position={[0, height/2 + 0.3, -depth*BRICK_WIDTH/2 + 0.2]}>
                    <cylinderGeometry args={[0.05, 0.05, 0.6]} />
                    <meshStandardMaterial color="#aaaaaa" />
                </mesh>
            </group>
        );
    } else if (shape === 'washer') {
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Body */}
                <mesh position={[0, 0, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, height, depth * BRICK_WIDTH]} />
                </mesh>
                {/* Front Door */}
                <mesh position={[0, 0, depth * BRICK_WIDTH/2 + 0.02]} rotation={[Math.PI/2, 0, 0]}>
                    <cylinderGeometry args={[0.8, 0.8, 0.1]} />
                    <meshStandardMaterial color="#333333" transparent opacity={0.8} />
                </mesh>
                {/* Panel */}
                <mesh position={[0, height/2 - 0.3, depth * BRICK_WIDTH/2 + 0.02]}>
                    <boxGeometry args={[width * BRICK_WIDTH - 0.2, 0.4, 0.1]} />
                    <meshStandardMaterial color="#222222" />
                </mesh>
            </group>
        );
    } else if (shape === 'dining_table' || shape === 'coffee_table') {
        const legThickness = 0.2;
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Top */}
                <mesh position={[0, height/2 - PLATE_HEIGHT/2, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, PLATE_HEIGHT, depth * BRICK_WIDTH]} />
                </mesh>
                {/* Legs */}
                <mesh position={[-width * BRICK_WIDTH/2 + 0.3, -PLATE_HEIGHT/2, depth * BRICK_WIDTH/2 - 0.3]} material={material}>
                    <boxGeometry args={[legThickness, height - PLATE_HEIGHT, legThickness]} />
                </mesh>
                <mesh position={[-width * BRICK_WIDTH/2 + 0.3, -PLATE_HEIGHT/2, -depth * BRICK_WIDTH/2 + 0.3]} material={material}>
                    <boxGeometry args={[legThickness, height - PLATE_HEIGHT, legThickness]} />
                </mesh>
                <mesh position={[width * BRICK_WIDTH/2 - 0.3, -PLATE_HEIGHT/2, depth * BRICK_WIDTH/2 - 0.3]} material={material}>
                    <boxGeometry args={[legThickness, height - PLATE_HEIGHT, legThickness]} />
                </mesh>
                <mesh position={[width * BRICK_WIDTH/2 - 0.3, -PLATE_HEIGHT/2, -depth * BRICK_WIDTH/2 + 0.3]} material={material}>
                    <boxGeometry args={[legThickness, height - PLATE_HEIGHT, legThickness]} />
                </mesh>
            </group>
        );
    } else if (shape === 'armchair') {
        const seatHeight = height * 0.4;
        const armWidth = 0.5;
        const backRestThickness = 0.6;
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Base/Seat */}
                <mesh position={[0, -height/2 + seatHeight/2, backRestThickness/2]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, seatHeight, depth * BRICK_WIDTH - backRestThickness]} />
                </mesh>
                {/* Backrest */}
                <mesh position={[0, 0, -depth * BRICK_WIDTH/2 + backRestThickness/2]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, height, backRestThickness]} />
                </mesh>
                {/* Arms */}
                <mesh position={[-width * BRICK_WIDTH/2 + armWidth/2, -height/2 + seatHeight/2 + 0.1, backRestThickness/2]} material={material}>
                    <boxGeometry args={[armWidth, seatHeight + 0.2, depth * BRICK_WIDTH - backRestThickness]} />
                </mesh>
                <mesh position={[width * BRICK_WIDTH/2 - armWidth/2, -height/2 + seatHeight/2 + 0.1, backRestThickness/2]} material={material}>
                    <boxGeometry args={[armWidth, seatHeight + 0.2, depth * BRICK_WIDTH - backRestThickness]} />
                </mesh>
            </group>
        );
    } else if (shape === 'shower') {
        const wallThick = 0.1;
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Base */}
                <mesh position={[0, -height/2 + 0.2, 0]}>
                    <boxGeometry args={[width * BRICK_WIDTH, 0.4, depth * BRICK_WIDTH]} />
                    <meshStandardMaterial color="#ffffff" />
                </mesh>
                {/* Back walls */}
                <mesh position={[0, 0, -depth * BRICK_WIDTH/2 + wallThick/2]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, height, wallThick]} />
                </mesh>
                <mesh position={[-width * BRICK_WIDTH/2 + wallThick/2, 0, 0]} material={material}>
                    <boxGeometry args={[wallThick, height, depth * BRICK_WIDTH]} />
                </mesh>
                {/* Shower Head */}
                <mesh position={[0, height/2 - 0.4, -depth * BRICK_WIDTH/2 + 0.4]} rotation={[Math.PI/4, 0, 0]}>
                    <cylinderGeometry args={[0.2, 0.1, 0.2]} />
                    <meshStandardMaterial color="#cccccc" />
                </mesh>
                <mesh position={[0, height/2 - 0.2, -depth * BRICK_WIDTH/2 + 0.1]} rotation={[Math.PI/4, 0, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, 0.4]} />
                    <meshStandardMaterial color="#cccccc" />
                </mesh>
                {/* Glass (Optional thin wall suggestion) */}
                <mesh position={[width * BRICK_WIDTH/2 - 0.05, 0, 0.4]}>
                    <boxGeometry args={[0.1, height, depth * BRICK_WIDTH - 0.8]} />
                    <meshStandardMaterial color="#aaddff" transparent opacity={0.3} roughness={0.1} />
                </mesh>
            </group>
        );
    } else if (shape === 'vanity') {
        const legThickness = 0.15;
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Table Top */}
                <mesh position={[0, height/2 - PLATE_HEIGHT/2, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, PLATE_HEIGHT, depth * BRICK_WIDTH]} />
                </mesh>
                {/* Drawers left/right */}
                <mesh position={[-width * BRICK_WIDTH/2 + 0.6, height/2 - PLATE_HEIGHT - 0.3, 0]} material={material}>
                    <boxGeometry args={[1.0, 0.6, depth * BRICK_WIDTH - 0.1]} />
                </mesh>
                <mesh position={[width * BRICK_WIDTH/2 - 0.6, height/2 - PLATE_HEIGHT - 0.3, 0]} material={material}>
                    <boxGeometry args={[1.0, 0.6, depth * BRICK_WIDTH - 0.1]} />
                </mesh>
                {/* Drawer pulls */}
                <mesh position={[-width * BRICK_WIDTH/2 + 0.6, height/2 - PLATE_HEIGHT - 0.3, depth * BRICK_WIDTH/2]} material={material}>
                    <sphereGeometry args={[0.08]} />
                </mesh>
                <mesh position={[width * BRICK_WIDTH/2 - 0.6, height/2 - PLATE_HEIGHT - 0.3, depth * BRICK_WIDTH/2]} material={material}>
                    <sphereGeometry args={[0.08]} />
                </mesh>
                {/* Legs */}
                <mesh position={[-width * BRICK_WIDTH/2 + 0.2, -0.2, depth * BRICK_WIDTH/2 - 0.2]} material={material}>
                    <boxGeometry args={[legThickness, height - PLATE_HEIGHT, legThickness]} />
                </mesh>
                <mesh position={[-width * BRICK_WIDTH/2 + 0.2, -0.2, -depth * BRICK_WIDTH/2 + 0.2]} material={material}>
                    <boxGeometry args={[legThickness, height - PLATE_HEIGHT, legThickness]} />
                </mesh>
                <mesh position={[width * BRICK_WIDTH/2 - 0.2, -0.2, depth * BRICK_WIDTH/2 - 0.2]} material={material}>
                    <boxGeometry args={[legThickness, height - PLATE_HEIGHT, legThickness]} />
                </mesh>
                <mesh position={[width * BRICK_WIDTH/2 - 0.2, -0.2, -depth * BRICK_WIDTH/2 + 0.2]} material={material}>
                    <boxGeometry args={[legThickness, height - PLATE_HEIGHT, legThickness]} />
                </mesh>
            </group>
        );
    } else if (shape === 'mirror') {
        const frameThick = 0.1;
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Frame */}
                <mesh position={[0, 0, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, height, 0.2]} />
                </mesh>
                {/* Glass */}
                <mesh position={[0, 0, 0.11]}>
                    <boxGeometry args={[width * BRICK_WIDTH - frameThick*2, height - frameThick*2, 0.02]} />
                    <meshStandardMaterial color="#eeeeee" roughness={0.0} metalness={0.9} envMapIntensity={2.0} />
                </mesh>
                {/* Little vanity lights around mirror */}
                {[-1.5, -0.5, 0.5, 1.5].map((y, i) => (
                    <group key={i}>
                        <mesh position={[-width*BRICK_WIDTH/2 + frameThick/2, y, 0.15]}>
                            <sphereGeometry args={[0.08]} />
                            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
                        </mesh>
                        <mesh position={[width*BRICK_WIDTH/2 - frameThick/2, y, 0.15]}>
                            <sphereGeometry args={[0.08]} />
                            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
                        </mesh>
                    </group>
                ))}
            </group>
        );
    } else if (shape === 'stool') {
        const padThick = 0.3;
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Seat Cushion */}
                <mesh position={[0, height/2 - padThick/2, 0]}>
                    <cylinderGeometry args={[width*BRICK_WIDTH/2 - 0.1, width*BRICK_WIDTH/2 - 0.1, padThick]} />
                    <meshStandardMaterial color="#ffe4e1" roughness={0.9} />
                </mesh>
                {/* Base Plate */}
                <mesh position={[0, height/2 - padThick - 0.05, 0]} material={material}>
                    <cylinderGeometry args={[width*BRICK_WIDTH/2 - 0.15, width*BRICK_WIDTH/2 - 0.15, 0.1]} />
                </mesh>
                {/* Center Post */}
                <mesh position={[0, -padThick/2, 0]} material={material}>
                    <cylinderGeometry args={[0.1, 0.1, height - padThick - 0.1]} />
                </mesh>
                {/* Floor trim base */}
                <mesh position={[0, -height/2 + 0.1, 0]} material={material}>
                    <cylinderGeometry args={[0.6, 0.8, 0.2]} />
                </mesh>
            </group>
        );
    } else if (shape === 'pouf') {
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[width*BRICK_WIDTH/2 - 0.1, width*BRICK_WIDTH/2 - 0.1, height]} />
                    <meshStandardMaterial color="#ffb6c1" roughness={0.9} />
                </mesh>
                {/* Little Tufted top */}
                <mesh position={[0, height/2, 0]}>
                    <sphereGeometry args={[width*BRICK_WIDTH/2 - 0.1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color="#ffb6c1" roughness={0.9} />
                </mesh>
            </group>
        );
    } else if (shape === 'heart_rug') {
        // Approximate heart with a box and two cylinders
        content = (
            <group ref={groupRef} userData={{ id, isGhost }} rotation={[0, Math.PI/4, 0]}>
                <mesh position={[0, -height/2 + 0.05, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH * 0.7, 0.1, depth * BRICK_WIDTH * 0.7]} />
                </mesh>
                <mesh position={[-width * BRICK_WIDTH * 0.35, -height/2 + 0.05, 0]} material={material}>
                    <cylinderGeometry args={[width * BRICK_WIDTH * 0.35, width * BRICK_WIDTH * 0.35, 0.1]} />
                </mesh>
                <mesh position={[0, -height/2 + 0.05, -depth * BRICK_WIDTH * 0.35]} material={material}>
                    <cylinderGeometry args={[depth * BRICK_WIDTH * 0.35, depth * BRICK_WIDTH * 0.35, 0.1]} />
                </mesh>
            </group>
        );
    } else if (shape === 'canopy_bed') {
        const postThick = 0.15;
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Frame */}
                <mesh position={[0, -height/2 + PLATE_HEIGHT/2, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, PLATE_HEIGHT, depth * BRICK_WIDTH]} />
                </mesh>
                {/* Mattress */}
                <mesh position={[0, -height/2 + PLATE_HEIGHT + PLATE_HEIGHT/2, 0]}>
                    <boxGeometry args={[width * BRICK_WIDTH - 0.2, PLATE_HEIGHT, depth * BRICK_WIDTH - 0.2]} />
                    <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
                </mesh>
                {/* 4 Posts */}
                {[-1, 1].map(x => [-1, 1].map(z => (
                   <mesh key={`${x}-${z}`} position={[x * (width * BRICK_WIDTH / 2 - 0.2), 0, z * (depth * BRICK_WIDTH / 2 - 0.2)]} material={material}>
                       <cylinderGeometry args={[postThick, postThick, height]} />
                   </mesh>
                )))}
                {/* Top Canopy Roof */}
                <mesh position={[0, height/2 - 0.1, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH + 0.2, 0.2, depth * BRICK_WIDTH + 0.2]} />
                </mesh>
                <mesh position={[0, height/2 - 0.2, 0]}>
                    <boxGeometry args={[width * BRICK_WIDTH, 0.1, depth * BRICK_WIDTH]} />
                    <meshStandardMaterial color="#ffc0cb" transparent opacity={0.6} side={THREE.DoubleSide} />
                </mesh>
            </group>
        );
    } else if (shape === 'clothing_rack') {
        const pole = 0.1;
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Base Frame */}
                <mesh position={[0, -height/2 + 0.1, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, 0.2, depth * BRICK_WIDTH]} />
                </mesh>
                {/* Upright Poles */}
                <mesh position={[-width * BRICK_WIDTH / 2 + 0.2, 0, 0]} material={material}>
                    <cylinderGeometry args={[pole, pole, height]} />
                </mesh>
                <mesh position={[width * BRICK_WIDTH / 2 - 0.2, 0, 0]} material={material}>
                    <cylinderGeometry args={[pole, pole, height]} />
                </mesh>
                {/* Top Hanging Bar */}
                <mesh position={[0, height/2 - 0.2, 0]} material={material} rotation={[0, 0, Math.PI/2]}>
                    <cylinderGeometry args={[pole, pole, width * BRICK_WIDTH]} />
                </mesh>
                {/* Little clothes (random shapes) */}
                <mesh position={[-0.5, height/4, 0]}>
                    <boxGeometry args={[0.1, height/2, 0.8]} />
                    <meshStandardMaterial color="#ffb6c1" />
                </mesh>
                <mesh position={[0.5, height/4, 0]}>
                    <boxGeometry args={[0.1, height/2, 0.8]} />
                    <meshStandardMaterial color="#87ceeb" />
                </mesh>
            </group>
        );
    } else if (shape === 'bow_chair') {
        const seatHeight = height * 0.4;
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Base/Seat */}
                <mesh position={[0, -height/2 + seatHeight/2, 0.2]}>
                    <cylinderGeometry args={[width * BRICK_WIDTH/2 - 0.1, width * BRICK_WIDTH/2 - 0.1, seatHeight]} />
                    <meshStandardMaterial color="#ffb6c1" roughness={0.9} />
                </mesh>
                {/* Left bow loop */}
                <mesh position={[-0.4, 0.2, -0.6]} rotation={[0, 0, Math.PI/4]}>
                    <torusGeometry args={[0.4, 0.15, 16, 32]} />
                    <meshStandardMaterial color="#ff99cc" />
                </mesh>
                {/* Right bow loop */}
                <mesh position={[0.4, 0.2, -0.6]} rotation={[0, 0, -Math.PI/4]}>
                    <torusGeometry args={[0.4, 0.15, 16, 32]} />
                    <meshStandardMaterial color="#ff99cc" />
                </mesh>
                {/* Center knot */}
                <mesh position={[0, 0.2, -0.55]}>
                    <sphereGeometry args={[0.25]} />
                    <meshStandardMaterial color="#ff66b2" />
                </mesh>
            </group>
        );
    } else if (shape === 'record_player') {
        const bodyThick = 0.4;
        const legHeight = height - bodyThick;
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Main Box */}
                <mesh position={[0, height/2 - bodyThick/2, 0]} material={material}>
                    <boxGeometry args={[width * BRICK_WIDTH, bodyThick, depth * BRICK_WIDTH]} />
                </mesh>
                {/* Record Platter */}
                <mesh position={[-0.3, height/2 + 0.05, 0]}>
                    <cylinderGeometry args={[0.6, 0.6, 0.1]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
                {/* Vinyl label */}
                <mesh position={[-0.3, height/2 + 0.105, 0]}>
                    <cylinderGeometry args={[0.2, 0.2, 0.01]} />
                    <meshStandardMaterial color="#ff69b4" />
                </mesh>
                {/* Tone Arm */}
                <group position={[0.4, height/2 + 0.1, -0.4]} rotation={[0, -Math.PI/4, 0]}>
                    <mesh rotation={[Math.PI/2, 0, 0]}>
                        <cylinderGeometry args={[0.03, 0.03, 0.6]} />
                        <meshStandardMaterial color="#ccc" />
                    </mesh>
                </group>
                {/* Legs */}
                {[-1, 1].map(x => [-1, 1].map(z => (
                   <mesh key={`${x}-${z}`} position={[x * (width * BRICK_WIDTH / 2 - 0.2), -height/2 + legHeight/2, z * (depth * BRICK_WIDTH / 2 - 0.2)]} material={material}>
                       <cylinderGeometry args={[0.08, 0.05, legHeight]} />
                   </mesh>
                )))}
            </group>
        );
    } else if (shape === 'disco_ball') {
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                {/* Cord down to ball */}
                <mesh position={[0, height/2, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, height/2]} />
                    <meshStandardMaterial color="#aaa" />
                </mesh>
                {/* Ball */}
                <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[width*BRICK_WIDTH/2 - 0.1, 32, 16]} />
                    <meshStandardMaterial color="#eeeeee" roughness={0.1} metalness={0.9} envMapIntensity={3.0} />
                </mesh>
            </group>
        );
    } else {
        content = (
            <group ref={groupRef} userData={{ id, isGhost }}>
                <mesh userData={{ isGhost, id }} material={material} geometry={boxGeom} />
            </group>
        );
    }

    if (isGhost) {
        return (
            <group position={position} rotation={rotation}>
                <GhostAnimator groupRef={groupRef} material={material} isInvalid={isInvalid} />
                {content}
            </group>
        );
    }

    if (!isDynamic) {
        return (
            <group position={position} rotation={rotation}>
                {content}
            </group>
        );
    }

    return (
        <RigidBody 
            type="dynamic"
            position={position} 
            rotation={rotation} 
            colliders={false}
            mass={(width * depth * height) * 0.5}
            friction={1.0}
            restitution={0.0}
            onCollisionEnter={(payload) => {
                playClackSound(1);
            }}
        >
            <CuboidCollider args={[width * BRICK_WIDTH / 2, height / 2, depth * BRICK_WIDTH / 2]} position={[0, 0, 0]} />
            {content}
        </RigidBody>
    );
});
