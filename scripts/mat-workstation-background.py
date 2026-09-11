"""Create the transparent workstation fallback from the approved still.

The source is intentionally the public approved still, so this remains reproducible
without a private or external image provider. Only pixels in the border-connected,
near-neutral studio backdrop are cleared. A two-pixel matte softens the cut edge and
decontaminates pale edge pixels against the known white capture background.
"""
from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path
from typing import Iterable

from PIL import Image


DEFAULT_INPUT = Path("public/images/dave-workstation.webp")
DEFAULT_OUTPUT = Path("public/images/dave-workstation-transparent.webp")


def luminance(rgb: tuple[int, int, int]) -> float:
    r, g, b = rgb
    return 0.299 * r + 0.587 * g + 0.114 * b


def chroma(rgb: tuple[int, int, int]) -> int:
    return max(rgb) - min(rgb)


def backdrop_candidate(rgb: tuple[int, int, int]) -> bool:
    # The capture background is neutral white. The luminance floor leaves the
    # warm rug fringe and the grey contact shadow as subject barriers.
    return luminance(rgb) >= 226 and chroma(rgb) <= 22


def border_points(width: int, height: int) -> Iterable[tuple[int, int]]:
    for x in range(width):
        yield x, 0
        yield x, height - 1
    for y in range(1, height - 1):
        yield 0, y
        yield width - 1, y


def connected_backdrop(pixels: list[tuple[int, int, int]], width: int, height: int) -> bytearray:
    eligible = bytearray(width * height)
    for index, rgb in enumerate(pixels):
        if backdrop_candidate(rgb):
            eligible[index] = 1

    connected = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()
    for x, y in border_points(width, height):
        index = y * width + x
        if eligible[index] and not connected[index]:
            connected[index] = 1
            queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1),
                       (x - 1, y - 1), (x + 1, y - 1), (x - 1, y + 1), (x + 1, y + 1)):
            if nx < 0 or ny < 0 or nx >= width or ny >= height:
                continue
            index = ny * width + nx
            if eligible[index] and not connected[index]:
                connected[index] = 1
                queue.append((nx, ny))
    return connected


def matte(source: Image.Image) -> Image.Image:
    image = source.convert("RGB")
    width, height = image.size
    pixels = list(image.getdata())
    background = connected_backdrop(pixels, width, height)

    # A small dilation of the cleared region identifies only the captured edge,
    # not the white shoes or silver can, which are enclosed by non-background pixels.
    edge = bytearray(width * height)
    for y in range(height):
        for x in range(width):
            index = y * width + x
            if background[index]:
                continue
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1),
                           (x - 1, y - 1), (x + 1, y - 1), (x - 1, y + 1), (x + 1, y + 1)):
                if 0 <= nx < width and 0 <= ny < height and background[ny * width + nx]:
                    edge[index] = 1
                    break

    output = bytearray(width * height * 4)
    clear = 0
    partial = 0
    opaque = 0
    for index, rgb in enumerate(pixels):
        r, g, b = rgb
        if background[index]:
            alpha = 0
            clear += 1
        else:
            alpha = 255
            # Neutral pale pixels on the captured edge can carry a white matte.
            # Leave colored pixels and all enclosed light objects fully opaque.
            if edge[index] and luminance(rgb) >= 190:
                alpha = max(64, min(238, round((255 - min(rgb)) * 5.2)))
                if alpha < 255:
                    # Unmix the known white capture background from the RGB edge.
                    r = min(255, max(0, round((r - (255 - alpha / 255 * 255)) / (alpha / 255))))
                    g = min(255, max(0, round((g - (255 - alpha / 255 * 255)) / (alpha / 255))))
                    b = min(255, max(0, round((b - (255 - alpha / 255 * 255)) / (alpha / 255))))
            if alpha == 255:
                opaque += 1
            else:
                partial += 1
        offset = index * 4
        output[offset:offset + 4] = bytes((r, g, b, alpha))

    # Edge pixels already carry the source renderer's antialiasing. Blurring the
    # alpha channel here would spread white RGB from the cleared backdrop back into
    # the subject as a halo, so keep the decontaminated matte as authored above.
    return Image.frombytes("RGBA", (width, height), bytes(output))


def composite(image: Image.Image, colour: tuple[int, int, int]) -> Image.Image:
    background = Image.new("RGB", image.size, colour)
    background.paste(image, mask=image.getchannel("A"))
    return background


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--evidence-dir", type=Path)
    args = parser.parse_args()

    source = Image.open(args.input)
    if source.size != (1000, 1000):
        raise SystemExit(f"expected 1000x1000 source, got {source.size}")
    result = matte(source)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    result.save(args.output, format="WEBP", lossless=True, method=6)

    if args.evidence_dir:
        args.evidence_dir.mkdir(parents=True, exist_ok=True)
        composite(result, (230, 235, 240)).save(args.evidence_dir / "workstation-on-light.png")
        composite(result, (17, 22, 29)).save(args.evidence_dir / "workstation-on-dark.png")

    alpha = result.getchannel("A")
    histogram = alpha.histogram()
    clear = histogram[0]
    opaque = histogram[255]
    partial = result.width * result.height - clear - opaque
    print(f"wrote {args.output} ({result.width}x{result.height} RGBA WebP)")
    print(f"alpha: clear={clear} ({clear / (result.width * result.height):.1%}), "
          f"partial={partial}, opaque={opaque}")


if __name__ == "__main__":
    main()
