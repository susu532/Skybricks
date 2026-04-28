/**
 * @copyright 2026 hentertrabelsi - All Rights Reserved
 * SkyBricks - Runtime Protection Module
 * 
 * This module is tightly coupled with the app boot sequence.
 * Removing it will prevent the application from rendering.
 */

// ===== HEADLESS / BOT DETECTION =====
export const isHeadless = (): boolean => {
  const w = window as any;
  // Playwright, Puppeteer, Selenium all set this
  if (navigator.webdriver) return true;
  // PhantomJS / Nightmare
  if (w._phantom || w.__nightmare || w.callPhantom) return true;
  // Headless Chrome has no plugins
  if (navigator.plugins && navigator.plugins.length === 0 && navigator.userAgent.includes('Chrome')) return true;
  // Headless Chrome missing window.chrome
  if (navigator.userAgent.includes('Chrome') && !w.chrome) return true;
  // Empty languages string (headless)
  if ((navigator as any).languages === '') return true;

  return false;
};

// ===== DOMAIN LOCK =====
const _h = [
  // localhost variants for dev
  'localhost',
  '127.0.0.1',
  // CrazyGames domains (where game will be hosted)
  'crazygames.com',
  'games.crazygames.com',
  '1001juegos.com',
  'gamescraft.com',
];

export const isDomainValid = (): boolean => {
  const host = window.location.hostname;
  // Allow localhost for development
  if (host === 'localhost' || host === '127.0.0.1') return true;
  // Allow CrazyGames subdomains
  return _h.some(d => host === d || host.endsWith('.' + d));
};

// ===== INTEGRITY TOKEN =====
// This function generates a runtime integrity token that other modules
// must call to prove the security module was not stripped out.
// The token is derived from the domain — wrong domain = wrong token = broken app.
let _cachedToken: string | null = null;

export const getIntegrityToken = (): string => {
  if (_cachedToken) return _cachedToken;

  const host = window.location.hostname;
  // Simple hash of the hostname
  let hash = 0;
  for (let i = 0; i < host.length; i++) {
    hash = ((hash << 5) - hash + host.charCodeAt(i)) | 0;
  }

  // On valid domains, this produces a known set of values
  // On invalid domains, it produces garbage
  _cachedToken = `sb_${Math.abs(hash).toString(36)}`;
  return _cachedToken;
};

// ===== COMBINED GATE =====
export const checkEnvironment = (): { allowed: boolean; reason?: string } => {
  if (isHeadless()) return { allowed: false, reason: 'bot' };
  if (!isDomainValid()) return { allowed: false, reason: 'domain' };
  return { allowed: true };
};
