# pages-qr

Generates a QR code for a project's GitHub Pages URL, for README install
instructions on installable web apps. Derives the URL from the git remote
(`https://<owner>.github.io/<repo>/`) unless one is given explicitly.

Depends on [`segno`](https://pypi.org/project/segno/) (`pip install segno`)
— the one module in this repo with an external dependency, because a
correct QR encoder is not worth hand-rolling.

## Usage

```sh
pip install segno
python3 make_qr.py docs/install-qr.png                 # derive URL from origin
python3 make_qr.py docs/install-qr.png https://a.b/app  # explicit URL
```

Run it from inside the target repository (it reads `git remote get-url
origin` in the current directory) if relying on URL derivation.

## Changing this module

This file is consumed by other repositories as a git submodule. Make changes
here, not in a vendored copy — see the top-level `AGENTS.md` for the
cross-repo workflow.
