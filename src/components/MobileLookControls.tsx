import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function MobileLookControls() {
  const { camera, gl } = useThree();
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const PI_2 = Math.PI / 2;

  useEffect(() => {
    // initialize euler from camera
    euler.current.copy(camera.rotation);
    euler.current.order = 'YXZ';

    let lastTouchX = 0;
    let lastTouchY = 0;
    let isDragging = false;
    let activeTouchId: number | null = null;

    // Use passive: false so we can preventDefault
    const onTouchStart = (event: TouchEvent) => {
      // Don't start dragging if touching UI buttons or bottom hotbars
      const target = event.target as HTMLElement;
      if (
          target.tagName === 'BUTTON' || 
          target.closest('button') ||
          target.closest('.pointer-events-auto')
      ) {
          return;
      }

      // Find the first touch that is not already tracked
      for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        if (!isDragging) {
            isDragging = true;
            activeTouchId = touch.identifier;
            lastTouchX = touch.pageX;
            lastTouchY = touch.pageY;
            break;
        }
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!isDragging || activeTouchId === null) return;
      
      let trackedTouch: Touch | undefined;
      for (let i = 0; i < event.changedTouches.length; i++) {
        if (event.changedTouches[i].identifier === activeTouchId) {
            trackedTouch = event.changedTouches[i];
            break;
        }
      }

      if (!trackedTouch) return;

      // Prevent pull-to-refresh and other default touch actions
      if (event.cancelable) {
        event.preventDefault();
      }
      
      const touchX = trackedTouch.pageX;
      const touchY = trackedTouch.pageY;

      const movementX = touchX - lastTouchX;
      const movementY = touchY - lastTouchY;

      lastTouchX = touchX;
      lastTouchY = touchY;

      const movementSpeed = 0.005;

      euler.current.y -= movementX * movementSpeed;
      euler.current.x -= movementY * movementSpeed;

      euler.current.x = Math.max(-PI_2, Math.min(PI_2, euler.current.x));

      camera.quaternion.setFromEuler(euler.current);
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!isDragging || activeTouchId === null) return;

      for (let i = 0; i < event.changedTouches.length; i++) {
        if (event.changedTouches[i].identifier === activeTouchId) {
            isDragging = false;
            activeTouchId = null;
            break;
        }
      }
    };

    const domElement = gl.domElement;
    domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    domElement.addEventListener('touchend', onTouchEnd);
    domElement.addEventListener('touchcancel', onTouchEnd);

    return () => {
      domElement.removeEventListener('touchstart', onTouchStart);
      domElement.removeEventListener('touchmove', onTouchMove);
      domElement.removeEventListener('touchend', onTouchEnd);
      domElement.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [camera, gl.domElement]);

  return null;
}
