let ctx: AudioContext | null = null;
let isMuted = false;

export function setMuted(mute: boolean) {
  isMuted = mute;
  if (ctx) {
    if (mute && ctx.state === 'running') {
      ctx.suspend().catch(() => {});
    } else if (!mute && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }
}

function getContext() {
  if (isMuted) return null;
  if (!ctx) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (Ctx) {
      ctx = new Ctx();
    }
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function playJumpSound() {
  const context = getContext();
  if (!context) return;
  const osc = context.createOscillator();
  const gain = context.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, context.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, context.currentTime + 0.1);
  
  gain.gain.setValueAtTime(0, context.currentTime);
  gain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
  
  osc.connect(gain);
  gain.connect(context.destination);
  osc.start();
  osc.stop(context.currentTime + 0.1);
}

export function playPlopSound() {
  const context = getContext();
  if (!context) return;
  const osc = context.createOscillator();
  const gain = context.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(450, context.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, context.currentTime + 0.1);
  
  gain.gain.setValueAtTime(0, context.currentTime);
  gain.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
  
  osc.connect(gain);
  gain.connect(context.destination);
  osc.start();
  osc.stop(context.currentTime + 0.1);
}

export function playSelectSound() {
  const context = getContext();
  if (!context) return;
  const osc = context.createOscillator();
  const gain = context.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, context.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1000, context.currentTime + 0.05);
  
  gain.gain.setValueAtTime(0, context.currentTime);
  gain.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.05);
  
  osc.connect(gain);
  gain.connect(context.destination);
  osc.start();
  osc.stop(context.currentTime + 0.05);
}

export function playSnapSound() {
  const context = getContext();
  if (!context) return;
  const osc = context.createOscillator();
  const gain = context.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(400, context.currentTime);
  osc.frequency.linearRampToValueAtTime(800, context.currentTime + 0.02);
  
  gain.gain.setValueAtTime(0, context.currentTime);
  gain.gain.linearRampToValueAtTime(0.05, context.currentTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.02);
  
  osc.connect(gain);
  gain.connect(context.destination);
  osc.start();
  osc.stop(context.currentTime + 0.02);
}

export function playClackSound(velocity: number) {
  if (velocity < 0.1) return;
  const context = getContext();
  if (!context) return;
  
  const osc = context.createOscillator();
  const gain = context.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(800 + Math.random() * 400, context.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, context.currentTime + 0.05);
  
  const v = Math.min(1, velocity * 0.1);
  gain.gain.setValueAtTime(0, context.currentTime);
  gain.gain.linearRampToValueAtTime(v, context.currentTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.05);
  
  osc.connect(gain);
  gain.connect(context.destination);
  osc.start();
  osc.stop(context.currentTime + 0.05);
}
