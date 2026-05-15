import { useEffect, useRef } from 'react';
import nipplejs from 'nipplejs';
import { useStore } from '../store';

export function Joystick() {
  const containerRef = useRef<HTMLDivElement>(null);
  const setMobileMovement = useStore((state) => state.setMobileMovement);

  useEffect(() => {
    if (!containerRef.current) return;

    const manager = nipplejs.create({
      zone: containerRef.current,
      mode: 'static',
      position: { left: '50%', top: '50%' },
      color: '#FA31A7', // Barbie Pink
      size: 120,
      threshold: 0.1,
    });

    manager.on('move', (_, data) => {
      const force = data.force;
      const angle = data.angle.radian;
      
      const forward = Math.max(0, Math.sin(angle) * force);
      const backward = Math.max(0, -Math.sin(angle) * force);
      const right = Math.max(0, Math.cos(angle) * force);
      const left = Math.max(0, -Math.cos(angle) * force);

      // We normalize the force to a max of 1 for the boolean-like checks in Player
      // but we could also pass the raw values for continuous movement
      setMobileMovement({
        forward: forward > 0.1 ? forward : 0,
        backward: backward > 0.1 ? backward : 0,
        right: right > 0.1 ? right : 0,
        left: left > 0.1 ? left : 0,
      });
    });

    manager.on('end', () => {
      setMobileMovement({
        forward: 0,
        backward: 0,
        left: 0,
        right: 0,
      });
    });

    return () => {
      manager.destroy();
    };
  }, [setMobileMovement]);

  return (
    <div className="relative">
      <div 
        ref={containerRef} 
        className="w-40 h-40 relative pointer-events-auto bg-white/20 backdrop-blur-sm rounded-full border border-white/40 shadow-lg flex items-center justify-center overflow-hidden"
        style={{ touchAction: 'none' }}
      />
      {/* Decorative center point */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white/30 rounded-full pointer-events-none border border-white/20" />
    </div>
  );
}
