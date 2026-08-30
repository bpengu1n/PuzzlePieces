#!/usr/bin/env python3
"""Run with: python3 test_make_qr.py
QR-image generation itself needs `pip install segno`; that part is skipped
(not failed) when segno isn't installed, since it's this module's one
optional dependency.
"""
import os, subprocess, sys, tempfile, unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_qr import pages_url_from_remote

try:
    import segno  # noqa: F401
    HAVE_SEGNO = True
except ImportError:
    HAVE_SEGNO = False


def make_repo_with_remote(remote_url):
    d = tempfile.mkdtemp()
    subprocess.run(['git', 'init', '-q'], cwd=d, check=True)
    subprocess.run(['git', 'remote', 'add', 'origin', remote_url], cwd=d, check=True)
    return d


class TestPagesUrlFromRemote(unittest.TestCase):
    def test_https_remote(self):
        d = make_repo_with_remote('https://github.com/SomeOwner/SomeRepo.git')
        cwd = os.getcwd()
        try:
            os.chdir(d)
            self.assertEqual(pages_url_from_remote(), 'https://someowner.github.io/SomeRepo/')
        finally:
            os.chdir(cwd)

    def test_ssh_remote(self):
        d = make_repo_with_remote('git@github.com:SomeOwner/SomeRepo.git')
        cwd = os.getcwd()
        try:
            os.chdir(d)
            self.assertEqual(pages_url_from_remote(), 'https://someowner.github.io/SomeRepo/')
        finally:
            os.chdir(cwd)

    def test_remote_without_a_git_suffix(self):
        d = make_repo_with_remote('https://github.com/SomeOwner/SomeRepo')
        cwd = os.getcwd()
        try:
            os.chdir(d)
            self.assertEqual(pages_url_from_remote(), 'https://someowner.github.io/SomeRepo/')
        finally:
            os.chdir(cwd)

    def test_non_github_remote_raises(self):
        d = make_repo_with_remote('https://gitlab.com/SomeOwner/SomeRepo.git')
        cwd = os.getcwd()
        try:
            os.chdir(d)
            with self.assertRaises(ValueError):
                pages_url_from_remote()
        finally:
            os.chdir(cwd)


@unittest.skipUnless(HAVE_SEGNO, 'segno not installed (pip install segno)')
class TestMainGeneratesAFile(unittest.TestCase):
    def test_writes_a_png_to_the_given_path(self):
        with tempfile.TemporaryDirectory() as d:
            out = os.path.join(d, 'sub', 'qr.png')
            subprocess.run(
                [sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'make_qr.py'),
                 out, 'https://example.com/app/'],
                check=True, capture_output=True, text=True)
            self.assertTrue(os.path.isfile(out))
            with open(out, 'rb') as f:
                self.assertEqual(f.read(8), b'\x89PNG\r\n\x1a\n')


if __name__ == '__main__':
    unittest.main()
