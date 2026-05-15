import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useStore } from "../store";

export function MobileLookControls() {
  const { camera, gl } = useThree();
  const isMobile = useStore((state) => state.isMobile);
  const PI_2 = Math.PI / 2;

  const targetRotationRef = useRef({ x: 0, y: 0 }); // Smooth rotation target
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));

  // Track pointer state
  const activePointerId = useRef<number | null>(null);
  const previousTouch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    euler.current.copy(camera.rotation);
    euler.current.order = "YXZ";
    targetRotationRef.current.x = euler.current.x;
    targetRotationRef.current.y = euler.current.y;
  }, [camera]);

  useEffect(() => {
    if (!isMobile) return;

    const domElement = gl.domElement;
    domElement.style.touchAction = "none"; // Essential for mobile pointer events

    const onPointerDown = (event: PointerEvent) => {
      // Ignore if we're already tracking a pointer
      if (activePointerId.current !== null) return;
      // Do not capture if hitting an interactive UI element
      if ((event.target as HTMLElement)?.closest('button, .joystick, [role="button"]')) return;

      activePointerId.current = event.pointerId;
      previousTouch.current = { x: event.clientX, y: event.clientY };
      
      try {
        domElement.setPointerCapture(event.pointerId);
      } catch (e) {}
    };

    const onPointerMove = (event: PointerEvent) => {
      if (activePointerId.current !== event.pointerId || !previousTouch.current)
        return;

      const deltaX = event.clientX - previousTouch.current.x;
      const deltaY = event.clientY - previousTouch.current.y;

      const movementSpeed = 0.005;

      targetRotationRef.current.y -= deltaX * movementSpeed;
      targetRotationRef.current.x -= deltaY * movementSpeed;

      // Clamp up/down looking
      targetRotationRef.current.x = Math.max(
        -PI_2 + 0.1,
        Math.min(PI_2 - 0.1, targetRotationRef.current.x),
      );

      previousTouch.current = { x: event.clientX, y: event.clientY };
    };

    const onPointerUp = (event: PointerEvent) => {
      if (activePointerId.current === event.pointerId) {
        activePointerId.current = null;
        previousTouch.current = null;
        try {
          domElement.releasePointerCapture(event.pointerId);
        } catch (e) {}
      }
    };

    domElement.addEventListener("pointerdown", onPointerDown);
    // Bind move/up to window so we don't lose the touch if it slides off or gets blocked
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    domElement.addEventListener("contextmenu", (e) => e.preventDefault());

    return () => {
      domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      domElement.style.touchAction = "";
    };
  }, [camera, gl.domElement, isMobile]);

  useFrame((_, delta) => {
    if (!isMobile) return;

    const smoothSpeed = 15;
    euler.current.y +=
      (targetRotationRef.current.y - euler.current.y) * smoothSpeed * delta;
    euler.current.x +=
      (targetRotationRef.current.x - euler.current.x) * smoothSpeed * delta;

    camera.quaternion.setFromEuler(euler.current);
  });

  return null;
}
