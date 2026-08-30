'use strict';
/* This module talks directly to window/navigator/document, so testing it
 * outside a browser means shimming just enough of those globals for its
 * logic to run against. The shim objects are mutated in place between
 * cases (not reassigned) so identity stays consistent with what the
 * module captured at load time. */
const test = require('node:test');
const assert = require('assert');

const classList = { classes: new Set(), add(c) { this.classes.add(c); } };
const navigator = { userAgent: '', platform: '', maxTouchPoints: 0, standalone: undefined };
let matchMediaResult = { matches: false };
const listeners = {};
const win = {
  navigator: navigator,
  matchMedia: function () { return matchMediaResult; },
  addEventListener: function (type, cb) { (listeners[type] = listeners[type] || []).push(cb); }
};

global.window = win;
// Node >=21 defines a read-only `navigator` global of its own; override it
// for this test process so the module's bare `navigator.*` reads hit our shim.
Object.defineProperty(global, 'navigator', { value: navigator, configurable: true });
global.document = { documentElement: { classList: classList } };

require('./pwa-install-detect.js');
const D = win.PwaInstallDetect;

function setNavigator(ua, extra) {
  navigator.userAgent = ua;
  navigator.platform = (extra && extra.platform) || '';
  navigator.maxTouchPoints = (extra && extra.maxTouchPoints) || 0;
  navigator.standalone = extra && extra.standalone;
}

const IPHONE_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0 Mobile/15E148 Safari/604.1';
const ANDROID_CHROME = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36';
const DESKTOP_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/125.0 Safari/537.36';

test('recognizes an iPhone Safari UA as iOS and iOS Safari', () => {
  setNavigator(IPHONE_SAFARI);
  assert.strictEqual(D.ios(), true);
  assert.strictEqual(D.iosSafari(), true);
  assert.strictEqual(D.android(), false);
});

test('recognizes Chrome-on-iOS as iOS but not iOS Safari', () => {
  setNavigator(IPHONE_CHROME);
  assert.strictEqual(D.ios(), true);
  assert.strictEqual(D.iosSafari(), false);
});

test('recognizes iPadOS 13+ reporting a Mac UA, via touch points', () => {
  setNavigator(DESKTOP_MAC, { platform: 'MacIntel', maxTouchPoints: 5 });
  assert.strictEqual(D.ios(), true);
});

test('does not mistake a real Mac (no touch points) for iOS', () => {
  setNavigator(DESKTOP_MAC, { platform: 'MacIntel', maxTouchPoints: 0 });
  assert.strictEqual(D.ios(), false);
});

test('detects Android', () => {
  setNavigator(ANDROID_CHROME);
  assert.strictEqual(D.android(), true);
  assert.strictEqual(D.ios(), false);
});

test('standalone() reflects navigator.standalone (iOS)', () => {
  setNavigator(IPHONE_SAFARI, { standalone: true });
  matchMediaResult = { matches: false };
  assert.strictEqual(D.standalone(), true);
});

test('standalone() reflects the display-mode media query (non-iOS)', () => {
  setNavigator(ANDROID_CHROME);
  matchMediaResult = { matches: true };
  assert.strictEqual(D.standalone(), true);
  matchMediaResult = { matches: false };
  assert.strictEqual(D.standalone(), false);
});

test('canPrompt()/prompt() are false/no-op before any captured event', async () => {
  assert.strictEqual(D.canPrompt(), false);
  assert.strictEqual(await D.prompt(), false);
});

test('captures beforeinstallprompt and replays it via prompt()', async () => {
  let prevented = false, prompted = false;
  const fakeEvent = {
    preventDefault() { prevented = true; },
    prompt() { prompted = true; },
    userChoice: Promise.resolve({ outcome: 'accepted' })
  };
  listeners.beforeinstallprompt.forEach((cb) => cb(fakeEvent));

  assert.strictEqual(prevented, true);
  assert.strictEqual(D.canPrompt(), true);
  assert.ok(classList.classes.has('can-install'));

  const accepted = await D.prompt();
  assert.strictEqual(accepted, true);
  assert.strictEqual(prompted, true);
  assert.strictEqual(D.canPrompt(), false, 'the captured prompt is consumed after use');
});

test('a dismissed prompt resolves to false', async () => {
  const fakeEvent = {
    preventDefault() {},
    prompt() {},
    userChoice: Promise.resolve({ outcome: 'dismissed' })
  };
  listeners.beforeinstallprompt.forEach((cb) => cb(fakeEvent));
  assert.strictEqual(await D.prompt(), false);
});

test('onInstalled callbacks fire on appinstalled and clear the captured prompt', () => {
  let fired = 0;
  D.onInstalled(() => { fired++; });
  listeners.appinstalled.forEach((cb) => cb());
  assert.strictEqual(fired, 1);
  assert.strictEqual(D.canPrompt(), false);
});
