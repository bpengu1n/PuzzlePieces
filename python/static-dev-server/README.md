# static-dev-server

A zero-dependency local static file server for developing web apps that
need real `http://`, not `file://` (most commonly: service workers, which
refuse to register from `file://`).

## Usage

```sh
python3 serve.py                    # serve . on http://localhost:8000
python3 serve.py 8080               # custom port
python3 serve.py 8080 /path/to/app  # custom port and root directory
```

Every response gets `Cache-Control: no-store`, so edits are always visible
without a hard refresh. `.webmanifest` files are served with the correct
`application/manifest+json` MIME type, which Python's default map doesn't
know.

## Testing

```sh
python3 test_serve.py -v
```

Launches the server as a subprocess against a temp directory and checks the
response, headers, MIME type, and 404 behavior over real HTTP. No
dependencies beyond the standard library.

## Changing this module

This file is consumed by other repositories as a git submodule. Make changes
here, not in a vendored copy — see the top-level `AGENTS.md` for the
cross-repo workflow.
