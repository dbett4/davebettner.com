"""Create the transparent workstation fallback from the approved still.

The source is intentionally the public approved still, so this remains reproducible
without a private or external image provider. The outer studio backdrop is cleared by
border-connected flood fill, and three visually confirmed enclosed studio pockets are
cleared by explicit local seeds. White display pixels, shoes, the silver can, skin,
rug, and other enclosed subject pixels remain opaque because they are not in those
seeded components.
"""
from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path
from typing import Iterable

from PIL import Image


DEFAULT_INPUT = Path("public/images/dave-workstation.webp")
DEFAULT_OUTPUT = Path("public/images/dave-workstation-transparent.webp")
# These are source-image coordinates from the reviewed workstation still:
# the large gap inside the mic arm/behind the head, the white strip beneath
# the left monitor, and the narrow gap through the monitor/mic stands.
LOCAL_BACKGROUND_SEEDS: dict[str, tuple[int, int]] = {
    "mic_head_gap": (420, 220),
    "left_monitor_gap": (500, 320),
    "stand_gap": (558, 330),
}
# Regression sentinels for enclosed light foreground that must not be keyed out.
PROTECTED_FOREGROUND_POINTS: dict[str, tuple[int, int]] = {
    "spreadsheet_screen": (330, 315),
    "silver_can_or_desk_object": (570, 575),
    "light_foreground_detail": (488, 555),
    "rug_detail": (725, 630),
}
POCKET_CROP = (290, 175, 610, 380)


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


def flood_eligible(
    eligible: bytearray,
    width: int,
    height: int,
    seeds: Iterable[tuple[int, int]],
) -> bytearray:
    connected = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()
    for x, y in seeds:
        if not (0 <= x < width and 0 <= y < height):
            raise ValueError(f"seed outside image: {(x, y)}")
        index = y * width + x
        if not eligible[index]:
            raise ValueError(f"seed is not confirmed neutral backdrop: {(x, y)}")
        if not connected[index]:
            connected[index] = 1
            queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        for nx, ny in (
            (x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1),
            (x - 1, y - 1), (x + 1, y - 1), (x - 1, y + 1), (x + 1, y + 1),
        ):
            if nx < 0 or ny < 0 or nx >= width or ny >= height:
                continue
            index = ny * width + nx
            if eligible[index] and not connected[index]:
                connected[index] = 1
                queue.append((nx, ny))
    return connected


def connected_backdrop(
    pixels: list[tuple[int, int, int]], width: int, height: int,
) -> bytearray:
    eligible = bytearray(width * height)
    for index, rgb in enumerate(pixels):
        if backdrop_candidate(rgb):
            eligible[index] = 1
    return flood_eligible(eligible, width, height, border_points(width, height))


def seeded_backdrop(
    pixels: list[tuple[int, int, int]], width: int, height: int,
) -> bytearray:
    eligible = bytearray(width * height)
    for index, rgb in enumerate(pixels):
        if backdrop_candidate(rgb):
            eligible[index] = 1
    return flood_eligible(eligible, width, height, LOCAL_BACKGROUND_SEEDS.values())


def matte(source: Image.Image) -> Image.Image:
    image = source.convert("RGB")
    width, height = image.size
    pixels = list(image.getdata())
    background = connected_backdrop(pixels, width, height)
    enclosed = seeded_backdrop(pixels, width, height)
    for index, marked in enumerate(enclosed):
        if marked:
            background[index] = 1

    # A small dilation of the cleared region identifies only the captured edge,
    # not the white shoes or silver can, which are enclosed by non-background pixels.
    edge = bytearray(width * height)
    for y in range(height):
        for x in range(width):
            index = y * width + x
            if background[index]:
                continue
            for nx, ny in (
                (x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1),
                (x - 1, y - 1), (x + 1, y - 1), (x - 1, y + 1), (x + 1, y + 1),
            ):
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

    result = Image.frombytes("RGBA", (width, height), bytes(output))
    for label, (x, y) in LOCAL_BACKGROUND_SEEDS.items():
        if result.getpixel((x, y))[3] != 0:
            raise AssertionError(f"confirmed enclosed background was not cleared: {label} {(x, y)}")
    for label, (x, y) in PROTECTED_FOREGROUND_POINTS.items():
        if result.getpixel((x, y))[3] != 255:
            raise AssertionError(f"protected foreground lost opacity: {label} {(x, y)}")
    return result


def composite(image: Image.Image, colour: tuple[int, int, int]) -> Image.Image:
    background = Image.new("RGB", image.size, colour)
    background.paste(image, mask=image.getchannel("A"))
    return background


def write_evidence(result: Image.Image, evidence_dir: Path, before: Image.Image | None) -> None:
    evidence_dir.mkdir(parents=True, exist_ok=True)
    for label, colour in (("light", (230, 235, 240)), ("dark", (17, 22, 29))):
        composite(result, colour).save(evidence_dir / f"workstation-on-{label}.png")
        if before is not None:
            composite(before, colour).crop(POCKET_CROP).save(evidence_dir / f"pockets-before-{label}.png")
            composite(result, colour).crop(POCKET_CROP).save(evidence_dir / f"pockets-after-{label}.png")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--before", type=Path, help="Existing RGBA/WebP candidate for before/after crop evidence")
    parser.add_argument("--evidence-dir", type=Path)
    args = parser.parse_args()

    source = Image.open(args.input)
    if source.size != (1000, 1000):
        raise SystemExit(f"expected 1000x1000 source, got {source.size}")
    result = matte(source)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    result.save(args.output, format="WEBP", lossless=True, method=6)

    before = Image.open(args.before).convert("RGBA") if args.before else None
    if before is not None and before.size != result.size:
        raise SystemExit(f"before image size {before.size} does not match result {result.size}")
    if args.evidence_dir:
        write_evidence(result, args.evidence_dir, before)

    alpha = result.getchannel("A")
    histogram = alpha.histogram()
    clear = histogram[0]
    opaque = histogram[255]
    partial = result.width * result.height - clear - opaque
    print(f"wrote {args.output} ({result.width}x{result.height} RGBA WebP)")
    print(f"alpha: clear={clear} ({clear / (result.width * result.height):.1%}), "
          f"partial={partial}, opaque={opaque}")
    print(f"cleared enclosed pockets: {', '.join(LOCAL_BACKGROUND_SEEDS)}")
    print(f"protected opaque sentinels: {', '.join(PROTECTED_FOREGROUND_POINTS)}")


if __name__ == "__main__":
    main()
