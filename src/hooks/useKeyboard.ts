import { useState, useEffect } from 'react';

export function useKeyboard() {
  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    shift: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': setMovement((m) => ({ ...m, forward: true })); break;
        case 'KeyS': setMovement((m) => ({ ...m, backward: true })); break;
        case 'KeyA': setMovement((m) => ({ ...m, left: true })); break;
        case 'KeyD': setMovement((m) => ({ ...m, right: true })); break;
        case 'Space': setMovement((m) => ({ ...m, jump: true })); break;
        case 'ShiftLeft':
        case 'ShiftRight': setMovement((m) => ({ ...m, shift: true })); break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': setMovement((m) => ({ ...m, forward: false })); break;
        case 'KeyS': setMovement((m) => ({ ...m, backward: false })); break;
        case 'KeyA': setMovement((m) => ({ ...m, left: false })); break;
        case 'KeyD': setMovement((m) => ({ ...m, right: false })); break;
        case 'Space': setMovement((m) => ({ ...m, jump: false })); break;
        case 'ShiftLeft':
        case 'ShiftRight': setMovement((m) => ({ ...m, shift: false })); break;
      }
    };

    const handleClear = () => {
       setMovement({
          forward: false,
          backward: false,
          left: false,
          right: false,
          jump: false,
          shift: false,
       });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleClear);
    document.addEventListener('pointerlockchange', () => {
        if (!document.pointerLockElement) {
           handleClear();
        }
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleClear);
    };
  }, []);

  return movement;
}
