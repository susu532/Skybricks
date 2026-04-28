import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useKeyboard } from '../hooks/useKeyboard';
import { useStore, BLOCK_DIMENSIONS, BlockType } from '../store';
import { getSnappedPosition } from '../utils';
import { Brick, PLATE_HEIGHT, BRICK_HEIGHT, getBlockHeight } from './Brick';
import { playPlopSound, playJumpSound } from '../audio';

const SPEED = 8;
const JUMP_FORCE = 6;

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function Player({ rotation }: { rotation: number }) {
  const ref = useRef<any>(null);
  const movement = useKeyboard();
  const { camera, scene } = useThree();
  const [ghostPos, setGhostPos] = useState<[number, number, number] | null>(null);
  const [isGhostInvalid, setIsGhostInvalid] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const lastJumpPress = useRef(0);
  const wasJump = useRef(false);
  
  const { selectedType, selectedColor, addBlock, removeBlock } = useStore();
  
  const dims = BLOCK_DIMENSIONS[selectedType] || { w: 1, d: 1, shape: 'brick' as const };
  const height = getBlockHeight(dims.shape, dims.isPlate);

  const getNearbyBlocks = (point: THREE.Vector3) => {
      // Fast broad-phase filter
      return useStore.getState().blocks.filter(b => {
          return Math.abs(b.position[0] - point.x) < 15 &&
                 Math.abs(b.position[1] - point.y) < 15 &&
                 Math.abs(b.position[2] - point.z) < 15;
      });
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
      // Is it on the ground? (y=0 is the floor)
      const bottomY = pos[1] - height / 2;
      if (Math.abs(bottomY) < 0.01) return true;

      // Vertical support check (Stud connection)
      const b1_w = Math.abs(rotation % Math.PI) > 0.1 ? dims.d : dims.w;
      const b1_d = Math.abs(rotation % Math.PI) > 0.1 ? dims.w : dims.d;
      const b1_minX = pos[0] - b1_w / 2;
      const b1_maxX = pos[0] + b1_w / 2;
      const b1_minY = pos[1] - height / 2;
      const b1_maxY = pos[1] + height / 2;
      const b1_minZ = pos[2] - b1_d / 2;
      const b1_maxZ = pos[2] + b1_d / 2;

      const epsilon = 0.1; // Small margin for contact detection

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

          // Stacking/Attached check: Must overlap in XZ and touch exactly in Y (Top-to-Bottom or Bottom-to-Top)
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
    const offsets: [number, number, number][] = [];
    const range = 5; // Extra expanded reach for edge placements
    const yRange = 3; // Allows checking +/- 1.2 units
    for (let x = -range; x <= range; x++) {
        for (let z = -range; z <= range; z++) {
            for (let y = -yRange; y <= yRange; y++) {
                if (x === 0 && y === 0 && z === 0) continue;
                offsets.push([x, y, z]);
            }
        }
    }
    // Sort radially outward for fast early-exit during scoring
    return offsets.sort((a, b) => {
        const dA = a[0]*a[0] + a[1]*a[1] + a[2]*a[2];
        const dB = b[0]*b[0] + b[1]*b[1] + b[2]*b[2];
        return dA - dB;
    });
  }, [height]);

  useFrame((state) => {
    if (!ref.current) return;
    
    const velocity = ref.current.linvel();
    const frontVector = new THREE.Vector3();
    const sideVector = new THREE.Vector3();
    const direction = new THREE.Vector3();
    
    camera.getWorldDirection(frontVector);
    frontVector.y = 0;
    frontVector.normalize();
    
    sideVector.crossVectors(camera.up, frontVector).normalize();

    direction.set(0, 0, 0);
    if (movement.forward) direction.add(frontVector);
    if (movement.backward) direction.sub(frontVector);
    if (movement.left) direction.add(sideVector);
    if (movement.right) direction.sub(sideVector);
    
    direction.normalize().multiplyScalar(isFlying ? SPEED * 1.5 : SPEED);
    
    let vy = velocity.y;
    
    if (movement.jump && !wasJump.current) {
      const now = performance.now();
      if (now - lastJumpPress.current < 300) {
        setIsFlying(!isFlying);
      }
      lastJumpPress.current = now;
    }
    wasJump.current = movement.jump;

    if (isFlying) {
      if (movement.jump) {
        vy = SPEED;
      } else if (movement.shift) {
        vy = -SPEED;
      } else {
        vy = 0;
      }
    } else {
      if (movement.jump && Math.abs(velocity.y) < 0.1) {
         vy = JUMP_FORCE;
         playJumpSound();
      }
    }
    
    ref.current.setLinvel({ x: direction.x, y: vy, z: direction.z });

    const pos = ref.current.translation();
    camera.position.set(pos.x, pos.y + 1.2, pos.z);

    // Ghost Placement Logic
    const start = camera.position.clone();
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
    const ray = new THREE.Ray(start, dir);
    const raycaster = new THREE.Raycaster(start, dir, 0, 8);
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    const hit = intersects.find((i: any) => {
        let obj = i.object;
        while (obj) {
            if (obj.userData?.isGhost || obj.userData?.isPlayer) return false;
            obj = obj.parent;
        }
        return true;
    });
    
    const basePointsToSearch: {point: THREE.Vector3, normal: THREE.Vector3}[] = [];

    if (hit && hit.face) {
        basePointsToSearch.push({point: hit.point, normal: hit.face.normal});
    }

    // Try projecting onto the current build plane to support dragging over empty space perfectly
    const currentGhostY = ghostPosRef.current ? ghostPosRef.current[1] : height / 2;
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -currentGhostY);
    const hitPlane = new THREE.Vector3();
    if (ray.intersectPlane(plane, hitPlane)) {
        if (hitPlane.distanceTo(start) < 8) {
            basePointsToSearch.push({point: hitPlane, normal: new THREE.Vector3(0, 1, 0)});
        }
    }

    let targetPos: [number, number, number] | null = null;
    let minScore = Infinity;

    // Use hit point, or default if missing, for getting localized blocks bounds
    const searchCenter = hit ? hit.point : hitPlane;
    const nearbyBlocks = getNearbyBlocks(searchCenter);

    const evaluated = new Set<string>();

    const evaluatePos = (testP: number[], queryPoint: THREE.Vector3) => {
        // PREVENT PLACING INSIDE OR UNDERGROUND
        if (testP[1] - height / 2 < -0.01) return; // Must be above/on ground
        
        const key = `${testP[0].toFixed(1)},${testP[1].toFixed(1)},${testP[2].toFixed(1)}`;
        if (evaluated.has(key)) return;
        evaluated.add(key);

        const center = new THREE.Vector3(testP[0], testP[1], testP[2]);
        const distToCenter = ray.distanceSqToPoint(center);
        
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

        // Highly sensitive to cursor: prioritize minimizing distance from the block volume to the spot the user is pointing at.
        // Secondary priority is keeping the center close to the cursor.
        let score = distToBBXZ * 100.0 + distToCenter * 1.0 + yPenalty;

        // Hysteresis: artificially lower the score of the currently placed ghost to make it "sticky"
        if (ghostPosRef.current) {
             const hx = testP[0] - ghostPosRef.current[0];
             const hy = testP[1] - ghostPosRef.current[1];
             const hz = testP[2] - ghostPosRef.current[2];
             if (hx*hx + hy*hy + hz*hz < 0.01) {
                 score -= 15.0; // Strong stickiness
             }
        }

        if (score >= minScore) return; // Early exit shortcut!

        if (checkCollision(testP, nearbyBlocks) && checkSupport(testP, nearbyBlocks)) {
            minScore = score;
            targetPos = [testP[0], testP[1], testP[2]];
        }
    };

    for (const base of basePointsToSearch) {
        const p = getSnappedPosition(base.point, base.normal, dims.w, dims.d, height, rotation);
        evaluatePos(p, base.point);
        
        for (const off of searchPattern) {
            const testP = [p[0] + off[0], p[1] + off[1] * 0.4, p[2] + off[2]];
            evaluatePos(testP, base.point);
        }
    }

    if (targetPos) {
      setGhostPos(targetPos);
      setIsGhostInvalid(false);
    } else {
      setGhostPos(null);
      setIsGhostInvalid(false);
    }
  });

  const visualGhostPos = useRef(new THREE.Vector3());
  const ghostRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (ghostPos && ghostRef.current) {
        const target = new THREE.Vector3(...ghostPos);
        
        // If the target is very far away (e.g. cross map jump), snap immediately
        if (visualGhostPos.current.distanceTo(target) > 5) {
            visualGhostPos.current.copy(target);
        } else {
            // Smoothly interpolate for a high-quality feel
            visualGhostPos.current.lerp(target, 0.4 * (60 * delta));
        }

        ghostRef.current.position.copy(visualGhostPos.current);
        
        // Tilt the ghost slightly in the direction of movement
        const diff = target.clone().sub(visualGhostPos.current);
        ghostRef.current.rotation.x = THREE.MathUtils.lerp(ghostRef.current.rotation.x, diff.z * 0.3, 0.1);
        ghostRef.current.rotation.z = THREE.MathUtils.lerp(ghostRef.current.rotation.z, -diff.x * 0.3, 0.1);
    }
  });

  const ghostPosRef = useRef<[number, number, number] | null>(null);
  const isGhostInvalidRef = useRef(false);
  useEffect(() => {
    ghostPosRef.current = ghostPos;
    isGhostInvalidRef.current = isGhostInvalid;
  }, [ghostPos, isGhostInvalid]);

  useEffect(() => {
    const handlePlace = () => {
         if (ghostPosRef.current && !isGhostInvalidRef.current) {
            playPlopSound();
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
         const dir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
         const raycaster = new THREE.Raycaster(start, dir, 0, 10);
         const intersects = raycaster.intersectObjects(scene.children, true);
         
         const hit = intersects.find((i: any) => {
             let obj = i.object;
             while (obj) {
                 if (obj.userData?.isGhost || obj.userData?.isPlayer) return false;
                 obj = obj.parent;
             }
             return true;
         });

         if (hit) {
            let obj = hit.object;
            let id = null;
            while (obj && !id) {
                if (obj.userData?.id) id = obj.userData.id;
                obj = obj.parent;
            }
            if (id) {
                removeBlock(id);
                playPlopSound();
            }
         }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Allow bypass for custom events
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
  }, [camera, scene, selectedType, selectedColor, rotation, addBlock, removeBlock, dims.w, dims.d, height]);

  return (
    <>
      <RigidBody 
        ref={ref} 
        colliders={false} 
        mass={1} 
        type="dynamic" 
        position={[0, 8, 10]} 
        enabledRotations={[false, false, false]}
        canSleep={false}
        gravityScale={isFlying ? 0 : 1}
      >
        <CapsuleCollider args={[0.5, 0.4]} />
        <mesh userData={{ isPlayer: true }} visible={false}>
          <capsuleGeometry args={[0.4, 1.0]} />
        </mesh>
      </RigidBody>

      {ghostPos && (
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
            />
        </group>
      )}
    </>
  );
}
