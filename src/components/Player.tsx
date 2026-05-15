import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier';
import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useInput } from '../hooks/useInput';
import { useStore, BLOCK_DIMENSIONS, BlockType } from '../store';
import { getSnappedPosition } from '../utils';
import { Brick, PLATE_HEIGHT, BRICK_HEIGHT, getBlockHeight } from './Brick';
import { playPlopSound, playJumpSound } from '../audio';

const SPEED = 8;
const JUMP_FORCE = 6;
const CHUNK_SIZE = 8;

const _frontVector = new THREE.Vector3();
const _sideVector = new THREE.Vector3();
const _direction = new THREE.Vector3();
const _start = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _rayDir = { x: 0, y: 0, z: 0 };
const _rayOrigin = { x: 0, y: 0, z: 0 };
const _threeRay = new THREE.Ray();
const _planeNormal = new THREE.Vector3(0, 1, 0);
const _plane = new THREE.Plane(_planeNormal, 0);
const _hitPlane = new THREE.Vector3();
const _hitPoint = new THREE.Vector3();
const _searchCenter = new THREE.Vector3();
const _evalCenter = new THREE.Vector3();
const _evaluated = new Set<string>();
const _basePoints = [
   { point: new THREE.Vector3(), normal: new THREE.Vector3() },
   { point: new THREE.Vector3(), normal: new THREE.Vector3() }
];

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function Player({ activeBlocks }: { activeBlocks: any[] }) {
  const ref = useRef<any>(null);
  const getInput = useInput();
  const { camera, scene } = useThree();
  const { world, rapier } = useRapier();
  const [ghostPos, setGhostPos] = useState<[number, number, number] | null>(null);
  const [isGhostInvalid, setIsGhostInvalid] = useState(false);
  const [rotation, setRotation] = useState(0);
  const lastJumpPress = useRef(0);
  const wasJump = useRef(false);

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

  const selectedType = useStore((state) => state.selectedType);
  const selectedColor = useStore((state) => state.selectedColor);
  const addBlock = useStore((state) => state.addBlock);
  const removeBlock = useStore((state) => state.removeBlock);
  const uiHidden = useStore((state) => state.uiHidden);
  const isMobile = useStore((state) => state.isMobile);
  const isFlying = useStore((state) => state.isFlying);
  const setIsFlying = useStore((state) => state.setIsFlying);
  const performanceMode = useStore((state) => state.performanceMode);
  
  const mobileActions = useStore((state) => state.mobileActions);
  const [wasRotating, setWasRotating] = useState(false);
  
  useEffect(() => {
    if (mobileActions.rotate && !wasRotating) {
      setRotation((r) => r === 0 ? Math.PI / 2 : 0);
    }
    setWasRotating(mobileActions.rotate);
  }, [mobileActions.rotate, wasRotating]);

  const spatialHashGrid = useMemo(() => {
     const grid = new Map<string, any[]>();
     const len = activeBlocks.length;
     for (let i = 0; i < len; i++) {
        const b = activeBlocks[i];
        const cx = Math.floor(b.position[0] / CHUNK_SIZE);
        const cy = Math.floor(b.position[1] / CHUNK_SIZE);
        const cz = Math.floor(b.position[2] / CHUNK_SIZE);
        const key = cx + '_' + cy + '_' + cz;
        let chunk = grid.get(key);
        if (!chunk) {
           chunk = [];
           grid.set(key, chunk);
        }
        chunk.push(b);
     }
     return grid;
  }, [activeBlocks]);
  
  const dims = BLOCK_DIMENSIONS[selectedType] || { w: 1, d: 1, shape: 'brick' as const };
  const height = getBlockHeight(dims.shape, dims.isPlate);

  const getNearbyBlocks = (point: THREE.Vector3) => {
      const pointX = point.x, pointY = point.y, pointZ = point.z;
      const px = Math.floor(pointX / CHUNK_SIZE);
      const py = Math.floor(pointY / CHUNK_SIZE);
      const pz = Math.floor(pointZ / CHUNK_SIZE);
      
      const nearby = [];
      for (let cx = px - 1; cx <= px + 1; cx++) {
          for (let cy = py - 1; cy <= py + 1; cy++) {
              for (let cz = pz - 1; cz <= pz + 1; cz++) {
                  const chunk = spatialHashGrid.get(cx + '_' + cy + '_' + cz);
                  if (chunk) {
                      const len = chunk.length;
                      for (let i = 0; i < len; i++) {
                          const b = chunk[i];
                          if (Math.abs(b.position[0] - pointX) < 8 &&
                              Math.abs(b.position[1] - pointY) < 8 &&
                              Math.abs(b.position[2] - pointZ) < 8) {
                              nearby.push(b);
                          }
                      }
                  }
              }
          }
      }
      return nearby;
  };

  const checkCollision = (pos: number[], nearbyBlocks: any[]) => {
      const b1_w = Math.abs(rotation % Math.PI) > 0.1 ? dims.d : dims.w;
      const b1_d = Math.abs(rotation % Math.PI) > 0.1 ? dims.w : dims.d;
      const b1_minX = pos[0] - b1_w / 2;
      const b1_maxX = pos[0] + b1_w / 2;
      const b1_minY = pos[1] - height / 2;
      const b1_maxY = pos[1] + height / 2;
      const b1_minZ = pos[2] - b1_d / 2;
      const b1_maxZ = pos[2] + b1_d / 2;
      
      const epsilon = 0.05;

      return !nearbyBlocks.some((b) => {
          const d2 = BLOCK_DIMENSIONS[b.type as BlockType] || { w: 1, d: 1, shape: 'brick' as const };
          const h2 = getBlockHeight(d2.shape, d2.isPlate);
          const isRot = Math.abs(b.rotation[1] % Math.PI) > 0.1;
          const b2_w = isRot ? d2.d : d2.w;
          const b2_d = isRot ? d2.w : d2.d;
          
          const b2_minX = b.position[0] - b2_w / 2;
          const b2_maxX = b.position[0] + b2_w / 2;
          const b2_minY = b.position[1] - h2 / 2;
          const b2_maxY = b.position[1] + h2 / 2;
          const b2_minZ = b.position[2] - b2_d / 2;
          const b2_maxZ = b.position[2] + b2_d / 2;

          return (
             b1_minX < b2_maxX - epsilon &&
             b1_maxX > b2_minX + epsilon &&
             b1_minY < b2_maxY - epsilon &&
             b1_maxY > b2_minY + epsilon &&
             b1_minZ < b2_maxZ - epsilon &&
             b1_maxZ > b2_minZ + epsilon
          );
      });
  };

  const checkSupport = (pos: number[], nearbyBlocks: any[]) => {
      const bottomY = pos[1] - height / 2;
      if (Math.abs(bottomY) < 0.01) return true;

      const b1_w = Math.abs(rotation % Math.PI) > 0.1 ? dims.d : dims.w;
      const b1_d = Math.abs(rotation % Math.PI) > 0.1 ? dims.w : dims.d;
      const b1_minX = pos[0] - b1_w / 2;
      const b1_maxX = pos[0] + b1_w / 2;
      const b1_minY = pos[1] - height / 2;
      const b1_maxY = pos[1] + height / 2;
      const b1_minZ = pos[2] - b1_d / 2;
      const b1_maxZ = pos[2] + b1_d / 2;

      const epsilon = 0.1;

      return nearbyBlocks.some((b) => {
          const d2 = BLOCK_DIMENSIONS[b.type as BlockType] || { w: 1, d: 1, shape: 'brick' as const };
          const h2 = getBlockHeight(d2.shape, d2.isPlate);
          const isRot = Math.abs(b.rotation[1] % Math.PI) > 0.1;
          const b2_w = isRot ? d2.d : d2.w;
          const b2_d = isRot ? d2.w : d2.d;
          
          const b2_minX = b.position[0] - b2_w / 2;
          const b2_maxX = b.position[0] + b2_w / 2;
          const b2_minY = b.position[1] - h2 / 2;
          const b2_maxY = b.position[1] + h2 / 2;
          const b2_minZ = b.position[2] - b2_d / 2;
          const b2_maxZ = b.position[2] + b2_d / 2;

          const overlapX = b1_minX < b2_maxX - epsilon && b1_maxX > b2_minX + epsilon;
          const overlapZ = b1_minZ < b2_maxZ - epsilon && b1_maxZ > b2_minZ + epsilon;
          
          if (overlapX && overlapZ) {
              const touchingTop = Math.abs(b1_minY - b2_maxY) < 0.05;
              const touchingBottom = Math.abs(b1_maxY - b2_minY) < 0.05;
              if (touchingTop || touchingBottom) return true;
          }

          return false;
      });
  };

  const searchPattern = useMemo(() => {
    const isPerf = performanceMode || isMobile;
    if (isPerf) {
        const offsets: [number, number, number][] = [];
        const range = 1;
        const yRange = 1; 
        for (let x = -range; x <= range; x++) {
            for (let z = -range; z <= range; z++) {
                for (let y = -yRange; y <= yRange; y++) {
                    if (x === 0 && y === 0 && z === 0) continue;
                    offsets.push([x, y, z]);
                }
            }
        }
        return offsets.sort((a, b) => {
            const dA = a[0]*a[0] + a[1]*a[1] + a[2]*a[2];
            const dB = b[0]*b[0] + b[1]*b[1] + b[2]*b[2];
            return dA - dB;
        });
    }

    const offsets: [number, number, number][] = [];
    const range = 5;
    const yRange = 3;
    for (let x = -range; x <= range; x++) {
        for (let z = -range; z <= range; z++) {
            for (let y = -yRange; y <= yRange; y++) {
                if (x === 0 && y === 0 && z === 0) continue;
                offsets.push([x, y, z]);
            }
        }
    }
    return offsets.sort((a, b) => {
        const dA = a[0]*a[0] + a[1]*a[1] + a[2]*a[2];
        const dB = b[0]*b[0] + b[1]*b[1] + b[2]*b[2];
        return dA - dB;
    });
  }, [height, performanceMode, isMobile]);

  const lastGhostUpdate = useRef(0);

  useFrame((state) => {
    if (!ref.current) return;
    
    const input = getInput();
    
    const velocity = ref.current.linvel();
    
    camera.getWorldDirection(_frontVector);
    _frontVector.y = 0;
    _frontVector.normalize();
    
    _sideVector.crossVectors(camera.up, _frontVector).normalize();

    _direction.set(0, 0, 0);

    const f = input.forward;
    const b = input.backward;
    const l = input.left;
    const r = input.right;

    if (f > 0) _direction.add(_frontVector.clone().multiplyScalar(f));
    if (b > 0) _direction.add(_frontVector.clone().multiplyScalar(-b));
    if (l > 0) _direction.add(_sideVector.clone().multiplyScalar(l));
    if (r > 0) _direction.add(_sideVector.clone().multiplyScalar(-r));
    
    // Clamp magnitude to 1 for direction vector, then multiply by SPEED
    const mag = _direction.length();
    if (mag > 0) {
      if (mag > 1) _direction.normalize();
      _direction.multiplyScalar(isFlying ? SPEED * 1.5 : SPEED);
    }
    
    let vy = velocity.y;
    
    const isJumping = input.jump;
    const isShifting = input.shift;
    
    if (isJumping && !wasJump.current) {
      const now = performance.now();
      if (now - lastJumpPress.current < 500) {
        setIsFlying(!isFlying);
      }
      lastJumpPress.current = now;
    }
    wasJump.current = isJumping;

    if (isFlying) {
      if (isJumping) {
        vy = SPEED;
      } else if (isShifting) {
        vy = -SPEED;
      } else {
        vy = 0;
      }
    } else {
      if (isJumping && Math.abs(velocity.y) < 0.1) {
         vy = JUMP_FORCE;
         playJumpSound();
      }
    }
    
    ref.current.setLinvel({ x: _direction.x, y: vy, z: _direction.z });

    const pos = ref.current.translation();
    
    if (pos.y < -20) {
      ref.current.setTranslation({ x: 0, y: 8, z: -30 });
      ref.current.setLinvel({ x: 0, y: 0, z: 0 });
      pos.y = 8;
      pos.x = 0;
      pos.z = -30;
    }

    camera.position.set(pos.x, pos.y + 1.2, pos.z);

    const nowTime = performance.now();
    const fpsLimit = (performanceMode || isMobile) ? 66 : 33;
    if (nowTime - lastGhostUpdate.current < fpsLimit) return;
    lastGhostUpdate.current = nowTime;

    _start.copy(camera.position);
    _dir.set(0, 0, -1).applyEuler(camera.rotation);
    
    // Rapier Raycast
    _rayOrigin.x = _start.x; _rayOrigin.y = _start.y; _rayOrigin.z = _start.z;
    _rayDir.x = _dir.x; _rayDir.y = _dir.y; _rayDir.z = _dir.z;
    
    const ray = new rapier.Ray(_rayOrigin, _rayDir);
    _threeRay.set(_start, _dir);
    const playerCollider = ref.current?.collider(0); 
    
    // castRayAndGetNormal(ray, maxToi, solid, collisionGroups, filterFlags, filterCollider)
    const hit = world.castRayAndGetNormal(
        ray, 
        8, 
        true, 
        undefined, 
        undefined, 
        playerCollider
    );
    
    let numBasePoints = 0;

    if (hit) {
        _threeRay.at(hit.timeOfImpact, _hitPoint);
        _basePoints[numBasePoints].point.copy(_hitPoint);
        _basePoints[numBasePoints].normal.copy(hit.normal as any);
        numBasePoints++;
    }

    const currentGhostY = ghostPosRef.current ? ghostPosRef.current[1] : height / 2;
    _planeNormal.set(0, 1, 0);
    _plane.set(_planeNormal, -currentGhostY);
    if (_threeRay.intersectPlane(_plane, _hitPlane)) {
        if (_hitPlane.distanceTo(_start) < 8) {
            _basePoints[numBasePoints].point.copy(_hitPlane);
            _basePoints[numBasePoints].normal.set(0, 1, 0);
            numBasePoints++;
        }
    }

    let targetPos: [number, number, number] | null = null;
    let minScore = Infinity;

    if (hit) {
       _threeRay.at(hit.timeOfImpact, _searchCenter);
    } else {
       _searchCenter.copy(_hitPlane);
    }
    const nearbyBlocks = getNearbyBlocks(_searchCenter);

    _evaluated.clear();

    const evaluatePos = (testP: number[], queryPoint: THREE.Vector3) => {
        if (testP[1] - height / 2 < -0.01) return;
        
        const key = Math.round(testP[0]*10) + '_' + Math.round(testP[1]*10) + '_' + Math.round(testP[2]*10);
        if (_evaluated.has(key)) return;
        _evaluated.add(key);

        _evalCenter.set(testP[0], testP[1], testP[2]);
        const distToCenter = _threeRay.distanceSqToPoint(_evalCenter);
        
        const isRot = Math.abs(rotation % Math.PI) > 0.1;
        const actualW = isRot ? dims.d : dims.w;
        const actualD = isRot ? dims.w : dims.d;
        
        const dX = Math.max(0, Math.abs(queryPoint.x - testP[0]) - actualW / 2.0);
        const dZ = Math.max(0, Math.abs(queryPoint.z - testP[2]) - actualD / 2.0);
        const distToBBXZ = dX * dX + dZ * dZ;

        let yPenalty = 0;
        if (ghostPosRef.current && Math.abs(testP[1] - currentGhostY) > 0.1) {
             yPenalty = Math.abs(testP[1] - currentGhostY) * 20.0;
        }

        let score = distToBBXZ * 100.0 + distToCenter * 1.0 + yPenalty;

        if (ghostPosRef.current) {
             const hx = testP[0] - ghostPosRef.current[0];
             const hy = testP[1] - ghostPosRef.current[1];
             const hz = testP[2] - ghostPosRef.current[2];
             if (hx*hx + hy*hy + hz*hz < 0.01) {
                 score -= 15.0;
             }
        }

        if (score >= minScore) return;

        if (checkCollision(testP, nearbyBlocks) && checkSupport(testP, nearbyBlocks)) {
            minScore = score;
            targetPos = [testP[0], testP[1], testP[2]];
        }
    };

    for (let i = 0; i < numBasePoints; i++) {
        const base = _basePoints[i];
        const p = getSnappedPosition(base.point, base.normal, dims.w, dims.d, height, rotation);
        evaluatePos(p, base.point);
        
        for (const off of searchPattern) {
            const testP = [p[0] + off[0], p[1] + off[1] * 0.4, p[2] + off[2]];
            evaluatePos(testP, base.point);
        }
    }

    if (targetPos) {
      setGhostPos(prev => {
        if (prev && prev[0] === targetPos![0] && prev[1] === targetPos![1] && prev[2] === targetPos![2]) return prev;
        return targetPos;
      });
      setIsGhostInvalid(prev => prev === false ? prev : false);
    } else {
      setGhostPos(prev => prev === null ? prev : null);
      setIsGhostInvalid(prev => prev === false ? prev : false);
    }
  });

  const visualGhostPos = useRef(new THREE.Vector3());
  const ghostRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (ghostPos && ghostRef.current) {
        const target = new THREE.Vector3(...ghostPos);
        
        if (visualGhostPos.current.distanceTo(target) > 5) {
            visualGhostPos.current.copy(target);
        } else {
            visualGhostPos.current.lerp(target, 0.4 * (60 * delta));
        }

        ghostRef.current.position.copy(visualGhostPos.current);
        
        const diff = target.clone().sub(visualGhostPos.current);
        ghostRef.current.rotation.x = THREE.MathUtils.lerp(ghostRef.current.rotation.x, diff.z * 0.3, 0.1);
        ghostRef.current.rotation.z = THREE.MathUtils.lerp(ghostRef.current.rotation.z, -diff.x * 0.3, 0.1);
    }
  });

  const ghostPosRef = useRef<[number, number, number] | null>(null);
  const isGhostInvalidRef = useRef(false);
  useEffect(() => {
    if (ghostPos && !isGhostInvalid) {
       if (!ghostPosRef.current || ghostPosRef.current[0] !== ghostPos[0] || ghostPosRef.current[1] !== ghostPos[1] || ghostPosRef.current[2] !== ghostPos[2]) {
           if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
       }
    }
    ghostPosRef.current = ghostPos;
    isGhostInvalidRef.current = isGhostInvalid;
  }, [ghostPos, isGhostInvalid]);

  useEffect(() => {
    const handlePlace = () => {
         if (ghostPosRef.current && !isGhostInvalidRef.current) {
            playPlopSound();
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30]);
            const newBlock = {
                id: generateId(),
                type: selectedType,
                position: [...ghostPosRef.current] as [number, number, number],
                rotation: [0, rotation, 0] as [number, number, number],
                color: selectedColor,
            };
            addBlock(newBlock);
         }
    };

    const handleDelete = () => {
         const start = camera.position.clone();
         const dir = new THREE.Vector3();
         camera.getWorldDirection(dir);
         
         const raycaster = new THREE.Raycaster(start, dir, 0, 10);
         const intersects = raycaster.intersectObjects(scene.children, true);
         
         let targetId: string | null = null;
         
         const hit = intersects.find((i: any) => {
             let obj = i.object;
             let isGhostOrPlayer = false;
             let tempId = null;

             if (obj instanceof THREE.InstancedMesh && i.instanceId !== undefined) {
                tempId = obj.userData?.blocks?.[i.instanceId]?.id;
             }
             
             let tempObj = obj;
             while (tempObj) {
                 if (tempObj.userData?.isGhost || tempObj.userData?.isPlayer) {
                     isGhostOrPlayer = true;
                     break;
                 }
                 if (!tempId && tempObj.userData?.id) {
                     tempId = tempObj.userData.id;
                 }
                 tempObj = tempObj.parent;
             }
             
             if (!isGhostOrPlayer && tempId) {
                 targetId = tempId;
                 return true;
             }
             return false;
         });

         if (targetId) {
             removeBlock(targetId);
             playPlopSound();
             if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30]);
         }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.type === 'mousedown' && e.isTrusted && !document.pointerLockElement) return;

      if (e.button === 0) {
          handlePlace();
      } else if (e.button === 2) {
          handleDelete();
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mobile-place', handlePlace);
    window.addEventListener('mobile-delete', handleDelete);
    return () => {
       window.removeEventListener('mousedown', handleMouseDown);
       window.removeEventListener('mobile-place', handlePlace);
       window.removeEventListener('mobile-delete', handleDelete);
    };
  }, [camera, scene, selectedType, selectedColor, rotation, addBlock, removeBlock, dims.w, dims.d, height, rapier, world]);

  return (
    <>
      <RigidBody 
        ref={ref} 
        colliders={false} 
        mass={1} 
        type="dynamic" 
        position={[0, 8, -30]} 
        enabledRotations={[false, false, false]}
        canSleep={false}
        gravityScale={isFlying ? 0 : 1}
      >
        <CapsuleCollider args={[0.5, 0.4]} sensor={isFlying} />
        <mesh userData={{ isPlayer: true }} visible={false}>
          <capsuleGeometry args={[0.4, 1.0]} />
        </mesh>
      </RigidBody>

      {ghostPos && !uiHidden && (
        <group ref={ghostRef} rotation={[0, rotation, 0]}>
            <Brick
              width={dims.w}
              depth={dims.d}
              isPlate={dims.isPlate}
              shape={dims.shape}
              position={[0, 0.02, 0]} 
              rotation={[0, 0, 0]}
              color={selectedColor}
              isDynamic={false}
              isGhost={true}
              isInvalid={isGhostInvalid}
              performanceMode={performanceMode}
            />
        </group>
      )}
    </>
  );
}

