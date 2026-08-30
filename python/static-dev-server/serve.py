#!/usr/bin/env python3
"""Serve a directory of static files locally over http://, with caching
disabled so edits are always visible. Service workers in particular need
http:// (or https://), not file://, to register at all.

    python3 serve.py                  # serve . on http://localhost:8000
    python3 serve.py 8080              # custom port
    python3 serve.py 8080 /path/to/app # custom port and root directory
"""
import http.server, os, socketserver, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = sys.argv[2] if len(sys.argv) > 2 else '.'
os.chdir(ROOT)

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map,
                          **{'.webmanifest': 'application/manifest+json'})
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')   # always see your edits
        super().end_headers()

class Server(socketserver.TCPServer):
    # Without this, a quick restart on the same port (a save-and-reload loop,
    # or a test suite) fails with "Address already in use" while the old
    # socket sits in TIME_WAIT, even though nothing is still listening.
    allow_reuse_address = True

if __name__ == '__main__':
    with Server(('', PORT), Handler) as httpd:
        print('serving %s on http://localhost:%d  (ctrl-c to stop)' % (os.getcwd(), PORT))
        httpd.serve_forever()
