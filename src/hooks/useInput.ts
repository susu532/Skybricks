import { useRef, useEffect } from 'react';
import { useStore } from '../store';

export function useInput() {
  const inputRef = useRef({
    forward: 0,
    backward: 0,
    left: 0,
    right: 0,
    jump: false,
    shift: false,
    rotate: false
  });

  const keys = useRef({
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
        case 'KeyW': keys.current.forward = true; break;
        case 'KeyS': keys.current.backward = true; break;
        case 'KeyA': keys.current.left = true; break;
        case 'KeyD': keys.current.right = true; break;
        case 'Space': keys.current.jump = true; break;
        case 'ShiftLeft':
        case 'ShiftRight': keys.current.shift = true; break;
        case 'KeyR': inputRef.current.rotate = true; break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': keys.current.forward = false; break;
        case 'KeyS': keys.current.backward = false; break;
        case 'KeyA': keys.current.left = false; break;
        case 'KeyD': keys.current.right = false; break;
        case 'Space': keys.current.jump = false; break;
        case 'ShiftLeft':
        case 'ShiftRight': keys.current.shift = false; break;
        case 'KeyR': inputRef.current.rotate = false; break;
      }
    };

    const handleClear = () => {
       keys.current = {
          forward: false,
          backward: false,
          left: false,
          right: false,
          jump: false,
          shift: false,
       };
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

  return () => {
    const state = useStore.getState();
    const mobileMovement = state.mobileMovement;
    const mobileActions = state.mobileActions;
    
    inputRef.current.forward = (keys.current.forward ? 1 : 0) + mobileMovement.forward;
    inputRef.current.backward = (keys.current.backward ? 1 : 0) + mobileMovement.backward;
    inputRef.current.left = (keys.current.left ? 1 : 0) + mobileMovement.left;
    inputRef.current.right = (keys.current.right ? 1 : 0) + mobileMovement.right;
    inputRef.current.jump = keys.current.jump || mobileActions.jump;
    inputRef.current.shift = keys.current.shift || mobileActions.shift;
    inputRef.current.rotate = inputRef.current.rotate || mobileActions.rotate;

    return inputRef.current;
  };
}
