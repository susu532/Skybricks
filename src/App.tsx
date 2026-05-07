/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { UI } from './components/UI';
import { setMuted } from './audio';
import { Play } from 'lucide-react';
import { useStore } from './store';

export default function App() {
  const [started, setStarted] = useState(false);
  const { performanceMode } = useStore();

  useEffect(() => {
    // Wait for the SDK to load and register the audio listener
    let interval = setInterval(async () => {
      const cg = (window as any).CrazyGames;
      if (cg && cg.SDK) {
        clearInterval(interval);
        
        try {
          // Init for SDK v3
          if (typeof cg.SDK.init === 'function') {
             await cg.SDK.init().catch(() => {});
          }

          if (cg.SDK.game && typeof cg.SDK.game.addAudioListener === 'function') {
            cg.SDK.game.addAudioListener((mute: boolean) => setMuted(mute));
          } else if (typeof cg.SDK.addEventListener === 'function') {
            cg.SDK.addEventListener('audio', (event: any) => setMuted(event.mute));
          }
        } catch (e) {
          console.warn('CrazyGames SDK setup failed', e);
        }
      }
    }, 500);

    const handleResize = () => {
      const isWindowMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
        (window.innerWidth < 768 && (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)) ||
        (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0 && /Macintosh/.test(navigator.userAgent));
      useStore.getState().setIsMobile(isWindowMobile);
    };

    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleStart = async () => {
    setStarted(true);

    const isMobile = useStore.getState().isMobile;
    try {
      const el = document.documentElement as any;
      if (isMobile) {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        } else if (el.msRequestFullscreen) {
          await el.msRequestFullscreen();
        }

        const navScreen = screen as any;
        if (navScreen.orientation && navScreen.orientation.lock) {
          await navScreen.orientation.lock('landscape');
        }
      }
    } catch (err) {
      console.warn('Could not request fullscreen or lock orientation:', err);
    }
  };

  if (!started) {
    return (
      <div className="relative w-screen h-screen bg-white flex flex-col items-center justify-center font-sans select-none overflow-hidden">
        <h1 className="text-[min(15vw,8rem)] sm:text-8xl md:text-9xl font-black mb-8 sm:mb-12 tracking-tighter flex items-center justify-center" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          <span className="text-[#5FA6FF]">Sky</span>
          <span className="text-[#FA31A7]">Bricks</span>
        </h1>
        <button 
          onClick={handleStart}
          className="group relative flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/10"
        >
          <Play className="w-6 h-6 fill-white group-hover:scale-110 transition-transform" />
          Play Now
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-slate-50 overflow-hidden font-sans select-none">
      <div className="absolute inset-0 touch-none">
        <Canvas 
          camera={{ position: [0, 8, 15], fov: 60 }}
          dpr={performanceMode ? 1 : Math.min(2, window.devicePixelRatio)}
          gl={{ antialias: !performanceMode }}
        >
          <Scene />
        </Canvas>
      </div>
      <UI />
    </div>
  );
}
