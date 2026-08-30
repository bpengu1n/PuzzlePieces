/* PWA install-affordance detection: platform sniffing plus the
 * beforeinstallprompt capture-and-replay dance. No dependencies.
 *
 * iOS has no install API at all: Safari only offers Share -> Add to Home
 * Screen, and nothing in JS can trigger or detect it. So on iOS the best a
 * consuming app can do is show the steps, pointed at the right button.
 * Android/desktop Chrome fire `beforeinstallprompt`, which this module
 * captures so the app can replay it later from its own UI.
 *
 * This module only detects and captures; it renders no UI and persists no
 * state. Pair it with a per-app banner and a store for "dismissed" flags.
 */
(function (root) {
  'use strict';

  function standalone() {
    // iOS uses the legacy navigator.standalone; everyone else display-mode.
    return root.navigator.standalone === true ||
           !!(root.matchMedia && root.matchMedia('(display-mode: standalone)').matches);
  }

  function ios() {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
    // iPadOS 13+ reports a Mac user agent; touch points give it away.
    return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  }

  // On iOS every browser is WebKit, but only Safari can add to the home screen.
  function iosSafari() {
    return ios() && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome/.test(navigator.userAgent);
  }

  function android() { return /Android/.test(navigator.userAgent); }

  var deferredPrompt = null;
  var installedCbs = [];

  root.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();            // keep the mini-infobar off; apps place their own
    deferredPrompt = e;
    document.documentElement.classList.add('can-install');
  });
  root.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    installedCbs.forEach(function (cb) { cb(); });
  });

  root.PwaInstallDetect = {
    standalone: standalone,
    ios: ios,
    iosSafari: iosSafari,
    android: android,
    canPrompt: function () { return !!deferredPrompt; },

    /** Fire the captured Chrome install prompt. Resolves to true if accepted. */
    prompt: function () {
      if (!deferredPrompt) return Promise.resolve(false);
      var p = deferredPrompt;
      deferredPrompt = null;
      p.prompt();
      return p.userChoice.then(function (c) { return c.outcome === 'accepted'; });
    },

    /** Register a callback fired once the app is actually installed. */
    onInstalled: function (cb) { installedCbs.push(cb); }
  };
})(window);
