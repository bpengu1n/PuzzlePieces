"""Minimal PNG writer with no image-library dependency (zlib + struct only).

Useful for generating small fixed assets (app icons, badges) at build time
without pulling in Pillow. Only supports 8-bit RGB, which is all icon-style
flat-color art needs.

    from png_writer import new_canvas, fill_rounded_rect, write_png

    px = new_canvas(192, (0x13, 0x19, 0x23))
    fill_rounded_rect(px, 20, 20, 152, 40, (0x7a, 0xa2, 0xf7))
    write_png('out.png', px)
"""
import struct, zlib


def new_canvas(size, color):
    """A size x size grid of (r, g, b) tuples, one row per list."""
    return [[color] * size for _ in range(size)]


def fill_rounded_rect(px, x, y, w, h, color, radius=None):
    """Filled rounded rectangle, coordinates and size in pixels."""
    size = len(px)
    if radius is None:
        radius = min(w, h) / 2.0
    radius = min(radius, w / 2.0, h / 2.0)
    for yy in range(max(0, int(y)), min(size, int(y + h) + 1)):
        for xx in range(max(0, int(x)), min(size, int(x + w) + 1)):
            cx = min(max(xx + 0.5, x + radius), x + w - radius)
            cy = min(max(yy + 0.5, y + radius), y + h - radius)
            dx, dy = xx + 0.5 - cx, yy + 0.5 - cy
            if dx * dx + dy * dy <= radius * radius + 1e-9:
                px[yy][xx] = color


def write_png(path, px):
    """Write an 8-bit RGB PNG from a new_canvas()-shaped pixel grid."""
    size = len(px)
    raw = b''.join(b'\x00' + bytes(v for p in row for v in p) for row in px)

    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(raw, 9))
           + chunk(b'IEND', b''))
    with open(path, 'wb') as f:
        f.write(png)
