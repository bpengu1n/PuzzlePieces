# local-store

A guarded `localStorage` wrapper, in plain ES5 with zero dependencies.
Private browsing modes and locked-down site data settings make
`localStorage` throw on read or write in some browsers; this wraps every
call so a blocked store degrades to "use the default" instead of crashing
the app.

## Usage

```html
<script src="local-store.js"></script>
<script>
  var store = LocalStore('myapp:');   // every key gets this prefix
  store.set('seen-intro', true);
  store.get('seen-intro', false);     // -> true, or false if unset/blocked
</script>
```

Node (also exported as a CommonJS module):

```js
const LocalStore = require('./local-store.js');
const store = LocalStore('myapp:');
```

## API

`LocalStore(prefix)` returns `{ get, set }`:

| Call | Behavior |
|------|----------|
| `get(key, dflt)` | Returns the JSON-parsed value at `prefix + key`, or `dflt` if unset, unparsable, or storage is blocked. |
| `set(key, value)` | JSON-stringifies and stores `value` at `prefix + key`. Returns `true` on success, `false` if storage is blocked (write is silently dropped). |

Give each consuming app its own `prefix` (e.g. `'myapp:'`) — `localStorage`
is already scoped per-origin, so the prefix is only to keep keys legible
within one app's storage, not to prevent cross-app collisions.

## Changing this module

This file is consumed by other repositories as a git submodule. Make changes
here, not in a vendored copy — see the top-level `AGENTS.md` for the
cross-repo workflow.
