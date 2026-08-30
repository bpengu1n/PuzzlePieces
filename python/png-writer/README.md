# png-writer

Minimal 8-bit RGB PNG writer using only `zlib` and `struct` from the
standard library — no Pillow, no other imaging dependency. Good enough for
generating small flat-color assets (app icons, badges) at build time.

## Usage

```python
from png_writer import new_canvas, fill_rounded_rect, write_png

px = new_canvas(192, (0x13, 0x19, 0x23))              # size, background color
fill_rounded_rect(px, 20, 20, 152, 40, (0x7a, 0xa2, 0xf7))
write_png('out.png', px)
```

## API

| Call | Use |
|------|-----|
| `new_canvas(size, color)` | A `size x size` pixel grid filled with one `(r, g, b)` color. |
| `fill_rounded_rect(px, x, y, w, h, color, radius=None)` | Paints a filled rounded rectangle onto the grid in place. `radius` defaults to a full stadium/circle cap. |
| `write_png(path, px)` | Writes the pixel grid to `path` as an 8-bit RGB PNG. |

Only flat-color, anti-alias-free shapes are supported — there's no
resampling or blending. For anything beyond simple icon-style art, use
Pillow instead; this exists specifically to avoid that dependency for
projects that don't otherwise need it.

## Testing

```sh
python3 test_png_writer.py -v
```

Round-trips a drawn canvas through a small PNG-reading helper defined in the
test itself (decompress + reparse, using the same stdlib `zlib`/`struct`)
and checks the pixels come back unchanged. No dependencies beyond the
standard library.

## Changing this module

This file is consumed by other repositories as a git submodule. Make changes
here, not in a vendored copy — see the top-level `AGENTS.md` for the
cross-repo workflow.
