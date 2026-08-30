# pwa-install-detect

Platform detection and `beforeinstallprompt` capture for installable web
apps (PWAs), in plain ES5 with zero dependencies. Handles the two things a
consuming app can't do itself:

- Detecting iOS (which has no install API at all — Safari only offers
  **Share → Add to Home Screen**, undetectable and untriggerable from JS)
  vs. Android/desktop Chrome (which fires `beforeinstallprompt` and can be
  prompted programmatically).
- Capturing the `beforeinstallprompt` event once, so the app can replay it
  later from its own "Install" button instead of Chrome's default mini-infobar.

This module is detection-only: it renders no banner and persists no state.
Pair it with your own UI and a store (e.g. this repo's `local-store` module)
for "dismissed" / "installed" flags.

## Usage

```html
<script src="pwa-install-detect.js"></script>
<script>
  if (PwaInstallDetect.iosSafari() && !PwaInstallDetect.standalone()) {
    // show your own "Add to Home Screen" instructions
  }
  document.getElementById('install-btn').onclick = function () {
    PwaInstallDetect.prompt().then(function (accepted) { /* ... */ });
  };
  PwaInstallDetect.onInstalled(function () { /* hide your install UI */ });
</script>
```

## API

| Call | Returns |
|------|---------|
| `standalone()` | `true` if already running installed (standalone display mode). |
| `ios()` | `true` on iOS/iPadOS (including iPadOS 13+ reporting a Mac UA). |
| `iosSafari()` | `true` only for actual Safari on iOS (not Chrome/Firefox/Edge-on-iOS, which are all WebKit but can't install). |
| `android()` | `true` on Android. |
| `canPrompt()` | `true` if a captured `beforeinstallprompt` event is available. |
| `prompt()` | Fires the captured prompt. Resolves to `true` if the user accepted, `false` otherwise or if none was captured. |
| `onInstalled(cb)` | Registers `cb` to run once the app is actually installed (`appinstalled` fires). |

The module also adds a `can-install` class to `document.documentElement`
once a prompt has been captured, as a CSS hook for showing an install button.

## Testing

```sh
node --test test.js
```

Uses Node's built-in test runner against a minimal hand-rolled shim of
`window`/`navigator`/`document` (there's no real browser in the loop) — no
dependencies, no npm install.

## Changing this module

This file is consumed by other repositories as a git submodule. Make changes
here, not in a vendored copy — see the top-level `AGENTS.md` for the
cross-repo workflow.
