#!/usr/bin/env python3
"""Run with: python3 test_serve.py"""
import os, subprocess, sys, tempfile, time, unittest, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SERVE = os.path.join(HERE, 'serve.py')


def wait_up(url, timeout=5):
    deadline = time.time() + timeout
    last = None
    while time.time() < deadline:
        try:
            urllib.request.urlopen(url, timeout=0.5)
            return
        except Exception as e:
            last = e
            time.sleep(0.05)
    raise last


class TestServe(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        with open(os.path.join(self.dir, 'index.html'), 'w') as f:
            f.write('<h1>hi</h1>')
        with open(os.path.join(self.dir, 'app.webmanifest'), 'w') as f:
            f.write('{}')
        self.port = 8199
        self.proc = subprocess.Popen(
            [sys.executable, SERVE, str(self.port), self.dir],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        wait_up('http://localhost:%d/index.html' % self.port)

    def tearDown(self):
        self.proc.terminate()
        self.proc.wait(timeout=5)

    def test_serves_a_file_from_the_given_root(self):
        with urllib.request.urlopen('http://localhost:%d/index.html' % self.port) as r:
            self.assertEqual(r.status, 200)
            self.assertEqual(r.read(), b'<h1>hi</h1>')

    def test_disables_caching(self):
        with urllib.request.urlopen('http://localhost:%d/index.html' % self.port) as r:
            self.assertEqual(r.headers.get('Cache-Control'), 'no-store')

    def test_serves_webmanifest_with_the_correct_mime_type(self):
        with urllib.request.urlopen('http://localhost:%d/app.webmanifest' % self.port) as r:
            self.assertEqual(r.headers.get('Content-Type'), 'application/manifest+json')

    def test_missing_file_is_a_404(self):
        try:
            urllib.request.urlopen('http://localhost:%d/nope.html' % self.port)
            self.fail('expected an HTTPError')
        except urllib.error.HTTPError as e:
            self.assertEqual(e.code, 404)


if __name__ == '__main__':
    unittest.main()
