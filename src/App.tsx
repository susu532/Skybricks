/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { UI } from './components/UI';

export default function App() {
  return (
    <div className="relative w-screen h-screen bg-slate-50 overflow-hidden font-sans select-none">
      <div className="absolute inset-0 touch-none">
        <Canvas camera={{ position: [0, 8, 15], fov: 60 }}>
          <Scene />
        </Canvas>
      </div>
      <UI />
    </div>
  );
}
