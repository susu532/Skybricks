import { useEffect, useRef, useState, useCallback } from "react";
import { useStore } from "../store";

export function Joystick() {
  const containerRef = useRef<HTMLDivElement>(null);
  const setMobileMovement = useStore((state) => state.setMobileMovement);
  const touchIdRef = useRef<number | null>(null);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  const resetTarget = useCallback(() => {
    setPosition({ x: 0, y: 0 });
    setIsActive(false);
    touchIdRef.current = null;
    setMobileMovement({
      forward: 0,
      backward: 0,
      left: 0,
      right: 0,
    });
  }, [setMobileMovement]);

  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const maxRadius = rect.width / 2;

      let deltaX = clientX - centerX;
      let deltaY = clientY - centerY;

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > maxRadius) {
        const ratio = maxRadius / distance;
        deltaX *= ratio;
        deltaY *= ratio;
      }

      setPosition({ x: deltaX, y: deltaY });

      // Calculate forces
      const rawForce = Math.min(distance / maxRadius, 1);
      const angle = Math.atan2(deltaY, deltaX); // angle in radians

      // In nipple angle: 0 is right, Math.PI/2 is down
      // We want: forward (up), backward (down)
      const forward = Math.max(0, -Math.sin(angle) * rawForce);
      const backward = Math.max(0, Math.sin(angle) * rawForce);
      const right = Math.max(0, Math.cos(angle) * rawForce);
      const left = Math.max(0, -Math.cos(angle) * rawForce);

      setMobileMovement({
        forward: forward > 0.1 ? forward : 0,
        backward: backward > 0.1 ? backward : 0,
        right: right > 0.1 ? right : 0,
        left: left > 0.1 ? left : 0,
      });
    },
    [setMobileMovement],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (touchIdRef.current !== null) return; // Already active
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    touchIdRef.current = e.pointerId;
    setIsActive(true);
    updatePosition(e.clientX, e.clientY);
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (touchIdRef.current !== e.pointerId) return;
    e.preventDefault();
    updatePosition(e.clientX, e.clientY);
  }, [updatePosition]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (touchIdRef.current !== e.pointerId) return;
    e.preventDefault();
    if (containerRef.current) {
        try { containerRef.current.releasePointerCapture(e.pointerId); } catch(err) {}
    }
    resetTarget();
  }, [resetTarget]);

  useEffect(() => {
    if (isActive) {
      window.addEventListener("pointermove", handlePointerMove, { passive: false });
      window.addEventListener("pointerup", handlePointerUp, { passive: false });
      window.addEventListener("pointercancel", handlePointerUp, { passive: false });
    }
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isActive, handlePointerMove, handlePointerUp]);

  useEffect(() => {
    return () => resetTarget();
  }, [resetTarget]);

  return (
    <div className="relative pointer-events-auto">
      {/* Large invisible hit area to prevent missing the joystick */}
      <div 
        className="absolute bottom-[-20px] left-[-20px] w-48 h-48 sm:w-56 sm:h-56 z-0"
        onPointerDown={handlePointerDown}
        onContextMenu={(e) => e.preventDefault()}
        style={{ touchAction: "none" }}
      />
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onContextMenu={(e) => e.preventDefault()}
        className="w-32 h-32 sm:w-40 sm:h-40 relative bg-white/20 backdrop-blur-sm rounded-full border border-white/40 shadow-lg flex items-center justify-center z-10"
        style={{ touchAction: "none" }}
      >
        {/* Decorative center point when not active */}
        {!isActive && (
          <div className="absolute w-4 h-4 bg-white/30 rounded-full border border-white/20" />
        )}

        {/* The Joystick Knob */}
        <div
          className="absolute w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#FA31A7] shadow-xl border-2 border-white/50 transition-transform duration-75"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) ${isActive ? "scale(1.1)" : "scale(1)"}`,
            boxShadow: isActive
              ? "0 10px 25px rgba(250, 49, 167, 0.5)"
              : "0 4px 15px rgba(0,0,0,0.2)",
          }}
        />
      </div>
    </div>
  );
}
