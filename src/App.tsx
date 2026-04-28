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
import { getIntegrityToken } from './utils/security';

export default function App() {
  const _it = getIntegrityToken();
  const [started, setStarted] = useState(false);
  const { performanceMode } = useStore();

  useEffect(() => {
    // Wait for the SDK to load and register the audio listener
    let interval = setInterval(() => {
      const cg = (window as any).CrazyGames;
      if (cg && cg.SDK) {
        clearInterval(interval);
        
        try {
          // Init for SDK v3
          if (typeof cg.SDK.init === 'function') {
             cg.SDK.init().catch(() => {});
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
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    setStarted(true);
    try {
      const cg = (window as any).CrazyGames;
      if (cg && cg.SDK && cg.SDK.game && typeof cg.SDK.game.gameplayStart === 'function') {
          cg.SDK.game.gameplayStart();
      }
    } catch (e) {}
  };

  if (!started) {
    return (
      <div className="relative w-screen h-screen bg-slate-900 flex flex-col items-center justify-center font-sans select-none text-white">
        <h1 className="text-6xl font-bold mb-8 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-500">
          SkyBricks
        </h1>
        <button 
          onClick={handleStart}
          className="group relative flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-pink-500/20"
        >
          <Play className="w-6 h-6 fill-slate-900 group-hover:scale-110 transition-transform" />
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
