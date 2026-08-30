#!/usr/bin/env python3
"""Generate a QR code pointing at a project's GitHub Pages URL, derived from
the git remote unless a URL is passed explicitly. Meant for README install
instructions on offline-first / installable web apps.

    pip install segno
    python3 make_qr.py docs/install-qr.png                 # derive URL from origin
    python3 make_qr.py docs/install-qr.png https://a.b/app  # explicit URL
"""
import os, subprocess, sys


def pages_url_from_remote():
    """Derive an owner.github.io/repo/ URL from the git remote in the cwd."""
    remote = subprocess.check_output(
        ['git', 'remote', 'get-url', 'origin'], text=True).strip()
    slug = remote.split('github.com')[-1].lstrip(':/').removesuffix('.git')
    if slug.count('/') != 1:
        raise ValueError('could not parse owner/repo from remote: %r' % remote)
    owner, repo = slug.split('/')
    return 'https://%s.github.io/%s/' % (owner.lower(), repo)


def main():
    if len(sys.argv) < 2:
        sys.exit('usage: make_qr.py <output-path.png> [url]')
    out = sys.argv[1]
    url = sys.argv[2] if len(sys.argv) > 2 else pages_url_from_remote()

    try:
        import segno
    except ImportError:
        sys.exit('segno is needed to generate the QR code: pip install segno')

    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    # Opaque white quiet zone so it scans on both light and dark viewers.
    segno.make(url, error='m').save(out, scale=6, border=3,
                                    dark='#000000', light='#ffffff')
    print('wrote', out, '->', url)


if __name__ == '__main__':
    main()
