# PuzzlePieces

Repeatable modules for general development — small, dependency-light pieces
extracted from real projects so they can be reused instead of rewritten.

Consuming projects pull individual modules in as git submodules and use them
directly (no package manager, no build step required to consume a module),
rather than owning a copy of the code themselves. That way a fix or
improvement made once is available everywhere the module is used.

## Layout

Modules are organized by language, one directory per module:

```
js/
  math-renderer/        LaTeX-subset -> HTML renderer, no deps
  local-store/           guarded localStorage wrapper, no deps
  pwa-install-detect/    PWA install-prompt platform detection, no deps
python/
  static-dev-server/     zero-dependency local static file server
  png-writer/            minimal PNG writer (zlib + struct only)
  pages-qr/              GitHub Pages install QR code generator
c/                       (no modules yet)
cpp/                     (no modules yet)
```

Each module directory is self-contained: its own `README.md` documents what
it does, its public API, and how to use it. Start there for any module you
want to use.

## Testing

Every module carries its own tests next to it (`<module>/test.js` for JS,
`<module>/test_<module>.py` for Python) — see a module's README for the
exact command. `.github/workflows/test.yml` discovers and runs all of them
on every pull request.

## Using a module in your project

Add this repo as a submodule, then reference the module's files directly:

```sh
git submodule add https://github.com/bpengu1n/PuzzlePieces.git vendor/puzzlepieces
```

```html
<script src="vendor/puzzlepieces/js/math-renderer/math-renderer.js"></script>
```

```python
sys.path.insert(0, 'vendor/puzzlepieces/python/png-writer')
from png_writer import new_canvas, write_png
```

Pin the submodule to a specific commit (the normal git-submodule behavior)
and update it deliberately with `git submodule update --remote` when you
want the latest version of a module — don't float on a branch.

**If you need a module to behave differently, change it here, in this
repo, and update the submodule pointer in your project — don't patch the
vendored copy in place.** A patched vendored copy silently diverges from
every other consumer and gets overwritten by the next submodule update. See
`AGENTS.md` for the full workflow, including for agents making changes on
a consuming project's behalf.

## Current consumers

- [CryptoProofHelper](https://github.com/bpengu1n/CryptoProofHelper) — uses
  `js/math-renderer`, `js/local-store`, and `js/pwa-install-detect`
  (via `vendor/puzzlepieces`), plus `python/static-dev-server`,
  `python/png-writer`, and `python/pages-qr` as dev tools.

## Adding a module

1. Pick the language directory (`js/`, `python/`, `c/`, `cpp/`, ...);
   create a new one if the language isn't represented yet.
2. Create `<lang>/<module-name>/` and move the generalized source into it.
   Strip anything specific to the app it came from (app-specific globals,
   hardcoded branding/text, app-specific storage keys) — a module here
   should make sense with zero knowledge of where it came from.
3. Write a `README.md` for the module: what it does, its public API, a
   usage example, its dependencies (default to none), and how to run its
   tests.
4. Write a test file (`test.js` / `test_<module>.py` — see **Testing**
   above) unless the module is trivial enough that one isn't worth it. It
   will be picked up by CI automatically; no workflow changes needed.
5. Add a row for it under **Layout** and **Current consumers** above.
6. If it replaces code in the project it came from, update that project to
   consume this module as a submodule instead of owning the file — see
   that project's own `AGENTS.md` for how it wires submodules in.

## License

MIT — see `LICENSE`.
