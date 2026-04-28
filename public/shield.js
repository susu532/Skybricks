/**
 * @copyright 2026 hentertrabelsi - All Rights Reserved
 * SkyBricks - Runtime Protection Shield
 */
(function () {
  'use strict';

  // ===== 1. ANTI-IFRAME: Bust out of frames =====
  if (window.top !== window.self) {
    try {
      // CrazyGames legitimately iframes games, so only block cross-origin frames
      // that aren't from crazygames.com
      var parentHost = '';
      try { parentHost = window.top.location.hostname; } catch (e) { parentHost = ''; }
      
      if (parentHost && !parentHost.includes('crazygames.com') && !parentHost.includes('1001juegos.com') && !parentHost.includes('gamescraft.com')) {
        document.documentElement.innerHTML = '';
        document.title = '';
      }
    } catch (e) {
      // Cross-origin frame that we can't read — could be CrazyGames, allow it
    }
  }

  // ===== 2. ANTI-RIGHT-CLICK =====
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
  });

  // ===== 3. ANTI-KEYBOARD SHORTCUTS =====
  document.addEventListener('keydown', function (e) {
    if (e.key === 'F12') { e.preventDefault(); return false; }
    if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) { e.preventDefault(); return false; }
    if (e.ctrlKey && e.key.toUpperCase() === 'U') { e.preventDefault(); return false; }
    if (e.ctrlKey && e.key.toUpperCase() === 'S') { e.preventDefault(); return false; }
    if (e.ctrlKey && e.key.toUpperCase() === 'P') { e.preventDefault(); return false; }
  });

  // ===== 4. ANTI-DRAG =====
  document.addEventListener('dragstart', function (e) {
    e.preventDefault();
    return false;
  });

  // ===== 5. ANTI-SELECTION =====
  document.addEventListener('selectstart', function (e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return true;
    e.preventDefault();
    return false;
  });

  // ===== 6. ANTI-COPY =====
  document.addEventListener('copy', function (e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return true;
    e.preventDefault();
    return false;
  });

  // ===== 7. DEVTOOLS DETECTION =====
  var _dc = 0;
  var _el = new Image();
  Object.defineProperty(_el, 'id', {
    get: function () {
      _dc++;
      if (_dc > 1) {
        document.title = '⚠️ SkyBricks - Protected Content';
        console.clear();
        console.log('%c⚠️ WARNING', 'color: red; font-size: 40px; font-weight: bold;');
        console.log(
          '%cThis game is proprietary software. Copying, reverse-engineering, or redistributing is strictly prohibited.\n© 2026 hentertrabelsi - All Rights Reserved',
          'color: white; font-size: 14px;'
        );
      }
    },
  });
  setInterval(function () { _dc = 0; console.log(_el); console.clear(); }, 2000);

  // ===== 8. CONSOLE WARNING =====
  console.log('%c🛑 STOP!', 'color: red; font-size: 50px; font-weight: bold; text-shadow: 2px 2px 0 black;');
  console.log('%cThis is a browser feature intended for developers.', 'font-size: 16px; color: white;');
  console.log('%cIf someone told you to copy-paste something here, it\'s a scam.', 'font-size: 16px; color: #ff6b6b;');
  console.log('%c© 2026 hentertrabelsi - All Rights Reserved\nUnauthorized copying or cloning of this game is illegal.', 'font-size: 14px; color: #888;');

  // ===== 9. ANTI-PRINT =====
  window.addEventListener('beforeprint', function () { document.body.style.display = 'none'; });
  window.addEventListener('afterprint', function () { document.body.style.display = ''; });

  // ===== 10. DOMAIN LOCK =====
  var _allowedHosts = [
    'localhost',
    '127.0.0.1',
    'crazygames.com',
    'games.crazygames.com',
    '1001juegos.com',
    'gamescraft.com',
    'https://skybricks-one.vercel.app/'
  ];

  function _checkDomain() {
    var host = window.location.hostname;
    var allowed = _allowedHosts.some(function (h) {
      return host === h || host.endsWith('.' + h);
    });
    if (!allowed) {
      document.documentElement.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0a0a;color:#ff4444;font-family:monospace;font-size:24px;text-align:center;padding:20px;">' +
        '<div>⛔ UNAUTHORIZED MIRROR DETECTED<br><br>' +
        '<span style="font-size:16px;color:#888;">This is a stolen copy of SkyBricks.<br>' +
        'Play the real game on CrazyGames.</span><br><br>' +
        '<span style="font-size:12px;color:#555;">© 2026 hentertrabelsi</span></div></div>';
      document.title = '⛔ Unauthorized Copy - SkyBricks';
      var scripts = document.querySelectorAll('script');
      scripts.forEach(function (s) { s.remove(); });
    }
  }
  _checkDomain();

  // ===== 11. MUTATION OBSERVER - Prevent tampering =====
  if (window.MutationObserver) {
    var _headObs = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.tagName === 'SCRIPT' && node.src && !node.src.includes(window.location.hostname) && !node.src.includes('crazygames.com')) {
            node.remove();
          }
          if (node.tagName === 'IFRAME' && node.src && !node.src.includes('crazygames.com')) {
            node.remove();
          }
        });
      });
    });
    _headObs.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
