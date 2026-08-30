#!/usr/bin/env python3
"""Run with: python3 test_png_writer.py"""
import os, struct, sys, tempfile, unittest, zlib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from png_writer import new_canvas, fill_rounded_rect, write_png


def read_png(path):
    """Minimal PNG reader (inverse of write_png) for round-tripping in tests."""
    with open(path, 'rb') as f:
        data = f.read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'bad PNG signature'
    i, idat = 8, b''
    width = height = None
    while i < len(data):
        length = struct.unpack('>I', data[i:i + 4])[0]
        tag = data[i + 4:i + 8]
        body = data[i + 8:i + 8 + length]
        if tag == b'IHDR':
            width, height = struct.unpack('>II', body[:8])
        elif tag == b'IDAT':
            idat += body
        i += 8 + length + 4  # length + tag + data + crc
    raw = zlib.decompress(idat)
    stride = 1 + width * 3
    px = []
    for y in range(height):
        row = raw[y * stride + 1: y * stride + stride]
        px.append([tuple(row[x * 3:x * 3 + 3]) for x in range(width)])
    return px


class TestNewCanvas(unittest.TestCase):
    def test_dimensions_and_fill(self):
        px = new_canvas(4, (1, 2, 3))
        self.assertEqual(len(px), 4)
        self.assertTrue(all(len(row) == 4 for row in px))
        self.assertTrue(all(cell == (1, 2, 3) for row in px for cell in row))

    def test_rows_are_independent(self):
        px = new_canvas(3, (0, 0, 0))
        px[0][0] = (9, 9, 9)
        self.assertNotEqual(px[1][0], (9, 9, 9), 'rows must not alias the same list')


class TestFillRoundedRect(unittest.TestCase):
    def test_full_square_radius_zero_fills_the_whole_box(self):
        px = new_canvas(10, (0, 0, 0))
        fill_rounded_rect(px, 2, 2, 5, 5, (255, 0, 0), radius=0)
        self.assertEqual(px[4][4], (255, 0, 0))
        self.assertEqual(px[2][2], (255, 0, 0))
        self.assertEqual(px[0][0], (0, 0, 0), 'outside the box must stay untouched')

    def test_rounded_corner_leaves_the_extreme_corner_pixel_unpainted(self):
        px = new_canvas(20, (0, 0, 0))
        fill_rounded_rect(px, 0, 0, 20, 20, (255, 255, 255))  # radius=None -> full circle
        self.assertEqual(px[0][0], (0, 0, 0), 'a full circle must not paint its bounding-box corner')
        self.assertEqual(px[10][10], (255, 255, 255), 'the center must be painted')

    def test_out_of_bounds_rect_is_clipped_not_an_error(self):
        px = new_canvas(5, (0, 0, 0))
        fill_rounded_rect(px, -3, -3, 6, 6, (1, 1, 1), radius=0)
        self.assertEqual(px[0][0], (1, 1, 1))


class TestWritePng(unittest.TestCase):
    def test_round_trip_matches_the_original_pixels(self):
        px = new_canvas(6, (10, 20, 30))
        fill_rounded_rect(px, 1, 1, 3, 3, (200, 100, 50), radius=0)
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, 'out.png')
            write_png(path, px)
            self.assertTrue(os.path.getsize(path) > 0)
            self.assertEqual(read_png(path), px)


if __name__ == '__main__':
    unittest.main()
