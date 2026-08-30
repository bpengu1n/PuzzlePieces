# AGENTS.md — PuzzlePieces

Agent-readable guide to this repository. Keep this file current when you add
modules, change layout conventions, or change how consuming repos wire
things in.

---

## What this repo is

PuzzlePieces is a library of small, reusable, dependency-light modules
extracted from real projects, organized by language, meant to be pulled into
other repositories as **git submodules** rather than copy-pasted or
reimplemented. It has no build of its own — it is not an app, it does not
get deployed, and it has no single "entry point." Each module stands alone.

**Repository:** https://github.com/bpengu1n/PuzzlePieces
**Active branch:** `claude/cryptoproof-puzzlepieces-refactor-jkmide`

---

## Hard constraints

- **One directory per module**, under its language's top-level directory
  (`js/`, `python/`, `c/`, `cpp/`, ...). A module must not import or require
  another module in this repo — if two modules need to share code, that
  shared code becomes its own module, or the dependency is a sign the two
  should be one module.
- **Zero runtime dependencies by default.** Most modules here exist
  *because* the original project could not afford a dependency (offline
  apps, strict CSPs, no bundler). A module may take on a dependency only
  when it is the module's entire reason for existing (e.g. `pages-qr` wraps
  `segno` because hand-rolling a QR encoder is not worthwhile) — say so
  plainly in that module's README.
- **No build step to consume a module.** A consumer should be able to
  `<script src="...">` a JS module or `import` a Python module directly from
  its checked-out path. Build/test tooling *within* a module directory (a
  Makefile, a CMakeLists.txt, a package.json for that module's own tests) is
  fine; it must not be required just to use the module.
- **Every module directory has a `README.md`**: what it does, its public
  API, a usage example, and its dependencies.
- **No app-specific naming or content.** Global names, exported symbols, and
  comments should read as generic library code, not as if they still belong
  to the project they were extracted from. If you're extracting a module and
  find app-specific behavior baked in (e.g. hardcoded UI text, a specific
  storage key, a specific route), leave that behind in the consuming
  project's own thin wrapper — don't drag it in here.

---

## Repository layout

```
js/
  math-renderer/         LaTeX-subset -> HTML renderer (window.MathRenderer)
  local-store/           guarded localStorage wrapper (window.LocalStore)
  pwa-install-detect/    PWA install-prompt detection (window.PwaInstallDetect)
python/
  static-dev-server/     zero-dependency local static file server
  png-writer/            minimal PNG writer (zlib + struct only)
  pages-qr/              GitHub Pages install QR code generator (needs segno)
c/                       no modules yet
cpp/                     no modules yet
README.md                human-facing overview and usage
AGENTS.md                this file
LICENSE                  MIT
```

Each module's own `README.md` is the source of truth for its API — do not
duplicate API docs here; keep the layout table above to one line per module.

---

## Adding a new module

1. Identify the language directory; create one (with its own placeholder
   `README.md`) if it doesn't exist yet.
2. Create `<lang>/<module-name>/` with a short, descriptive kebab-case name.
3. Move the source in, generalizing it: rename app-specific globals/exports
   to generic names, remove hardcoded app text/branding/routes, and
   parameterize anything that was previously a hardcoded app value (e.g. a
   storage-key prefix becomes a constructor argument, per `local-store`).
4. Write the module's `README.md`.
5. Add one line for it to the layout table in this file and in the
   top-level `README.md`, plus a row in `README.md`'s **Current consumers**
   section naming the project(s) that use it.
6. If this module replaces code that still lives in the project it came
   from, that project needs to be updated to consume it as a submodule
   instead — see **Cross-repo workflow** below. Do that update as part of
   the same piece of work; a module landing here with its old copy still
   duplicated in the source project is an unfinished migration.

## Changing an existing module

- Edit it here. Never make the equivalent edit inside a consuming project's
  vendored submodule copy — that copy is a pinned commit reference, not a
  place to patch; edits made there are invisible to every other consumer and
  are silently discarded the next time that consumer runs
  `git submodule update`.
- Keep the module's public API stable when you can. If a change is
  breaking (removes/renames an exported function, changes a function's
  signature or return shape, changes stored-data format), say so plainly in
  the commit message (prefix the subject with `BREAKING:`) so a consumer
  reviewing `git log` on the submodule before updating its pointer notices.
- Update the module's `README.md` in the same commit if its API or behavior
  changed.

## Cross-repo workflow (for agents working across repos)

This repo is consumed by other repositories via `git submodule add
https://github.com/bpengu1n/PuzzlePieces.git <path>` (by convention,
`vendor/puzzlepieces` in the consuming repo). The consuming repo's own
`AGENTS.md` documents exactly where it mounts the submodule and which
modules it uses.

When work in a consuming repo turns out to need a change to shared logic:

1. **Make the change here, in PuzzlePieces**, following the constraints
   above. Commit and push it to this repo.
2. **Then**, in the consuming repo, update the submodule pointer (`git
   submodule update --remote <path>` or `cd <path> && git pull && cd - && git
   add <path>`) and commit that pointer bump there.
3. Never edit the files inside a consuming repo's submodule checkout
   directly and leave it at that — it is not tracked as a change to this
   repo, and the next `git submodule update` in that consumer discards it.

If you're an agent working *inside* a consuming repo and you find yourself
needing to change something under its submodule path, stop and make the
change in this repo instead (cloning/opening it if it isn't already
checked out alongside), then come back and bump the pointer. This is true
even for a change that looks tiny or purely local to that consumer's use
case — a one-line fix made in the submodule checkout is a one-line fix
that gets silently lost.

## Extracting a new module from a consuming project

This is the common way modules are born here. When a consuming project has
logic that isn't specific to it and could plausibly serve other projects
(a renderer, a data structure, a parser, a small server, a codegen tool):

1. Copy the code into a new module directory here, generalizing per
   **Adding a new module** above.
2. In the consuming project, remove the file(s) that duplicate it. If the
   consuming project needs a thin app-specific wrapper around the generic
   module (e.g. instantiating `LocalStore` with its own key prefix, or
   layering app-specific banner UI on top of `pwa-install-detect`'s
   detection), that wrapper stays in the consuming project — only the
   generic logic moves here.
3. Wire the consuming project to load the module from its submodule path
   instead (update its asset lists, script tags, import paths, and its own
   service-worker cache manifest or equivalent, if it has one).
4. Update the consuming project's `AGENTS.md`/`README.md` to reflect the new
   submodule dependency and to state the rule in **Cross-repo workflow**
   above: shared-module changes happen in PuzzlePieces, not in the vendored
   copy.

## Testing

Modules here are small enough that most are exercised indirectly through
the consuming project's own test suite. If a module in this repo is complex
enough to warrant its own tests, put them alongside it in its module
directory (e.g. `<lang>/<module-name>/test.js`) with a one-line "how to run"
note in that module's README — do not add a repo-wide test framework unless
multiple modules actually need one.

## Commit and push

This repo uses no CI; push directly to the feature branch:

```bash
git add <files>
git commit -m "descriptive message"
git push -u origin claude/cryptoproof-puzzlepieces-refactor-jkmide
```

Do not push to `main` directly. Open a pull request on GitHub when a change
is complete.
