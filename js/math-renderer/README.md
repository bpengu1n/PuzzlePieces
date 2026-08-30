# math-renderer

Tiny LaTeX-subset → HTML renderer, in plain ES5 with zero dependencies and no
network access. A drop-in for offline or CSP-strict web apps that need a
handful of math notation but can't pull KaTeX or MathJax from a CDN.

Renders: greek letters, relations, arrows, common operators (`\frac`,
`\sqrt`, `\binom`, `\sum`, `\prod`, ...), sub/superscripts, `\text{}` /
`\mathrm{}` / `\mathsf{}`, `\mathcal{}` script letters, blackboard-bold
letters, and a small set of named-function macros (`\Pr`, `\Adv`, `\negl`,
`\Enc`, `\Dec`, ...) useful for cryptography and algorithms notation. It is
**not** a full LaTeX engine — it covers the subset one project (a crypto
proof-writing app) actually needed, and grows by adding entries to `MACROS`
or `WORDS`, or a `case` in `Parser.prototype.command`.

## Usage

Browser:

```html
<script src="math-renderer.js"></script>
<script>
  MathRenderer.render('\\frac{n}{d}');           // math expression -> HTML
  MathRenderer.text('Prose with $x^2$ inline and $$\\sum_i x_i$$ display.');
</script>
```

Node (also exported as a CommonJS module, e.g. for content linting scripts):

```js
const MathRenderer = require('./math-renderer.js');
MathRenderer.text('...');
```

## API

| Call | Use |
|------|-----|
| `MathRenderer.render(src)` | Pure math expression → HTML |
| `MathRenderer.text(str)` | Prose with embedded `$...$` / `$$...$$` math and light `**bold**`/`*italic*`/`` `code` `` markup → HTML |

## Output styling

The renderer emits plain elements with classes (`mfrac`, `mnum`, `mden`,
`msym`, `mu`, `mover`, `mbinom`, `mquad`, `mthin`, `sub`, `sup`, `math`,
`mathblock`) and expects the consuming app to style them — this module ships
no CSS. See a consumer's stylesheet (e.g. CryptoProofHelper's `css/app.css`)
for a worked example.

## Adding a symbol

Before using any `\command` in content, confirm it's handled: check `MACROS`
(single-codepoint substitutions), `WORDS` (multi-character names typeset
upright), or a `case` in `Parser.prototype.command`. An unrecognized command
falls through to plain upright text (the name without the backslash), which
silently renders wrong — add it to the appropriate table instead.

## Testing

```sh
node --test test.js
```

Uses Node's built-in test runner — no dependencies, no npm install.

## Changing this module

This file is consumed by other repositories as a git submodule. Make changes
here, not in a vendored copy — see the top-level `AGENTS.md` for the
cross-repo workflow.
