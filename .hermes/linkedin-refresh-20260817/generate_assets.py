from pathlib import Path
import hashlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
SOURCE = Path('/srv/hermes/work/davebettner.com/public/images/dave-bettner-headshot-20260808-portrait.webp')


def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)


def color(hex_value):
    return np.array(tuple(int(hex_value[i:i+2], 16) for i in (1, 3, 5)), dtype=np.float32)


def shader_field(w, h, variant='orbital', calm=False):
    yy, xx = np.mgrid[0:h, 0:w]
    x = xx / max(w - 1, 1)
    y = yy / max(h - 1, 1)
    base_a = color('#07090c')
    base_b = color('#12171d')
    img = base_a[None, None, :] * (1 - y[..., None]) + base_b[None, None, :] * y[..., None]

    cyan = color('#7e96ab')
    cyan_deep = color('#40566a')
    orange = color('#c9682a')
    orange_deep = color('#6f2f18')
    ivory = color('#e7e9ed')

    if variant == 'orbital':
        cx, cy = (0.79, 0.54) if not calm else (0.68, 0.52)
        dx = (x - cx) / (0.30 if not calm else 0.46)
        dy = (y - cy) / (0.88 if not calm else 0.64)
        r = np.sqrt(dx * dx + dy * dy)
        ang = np.arctan2(dy, dx)
        ring = np.exp(-((r - 0.72 - 0.08 * np.sin(3.0 * ang)) / 0.14) ** 2)
        core = np.exp(-((r - 0.34) / 0.32) ** 2)
        cyan_field = ring * smoothstep(-0.4, 0.8, -np.sin(ang + 0.5))
        orange_field = (0.75 * ring + 0.55 * core) * smoothstep(-0.8, 0.7, np.sin(ang - 0.25))
        ribbon = np.exp(-((y - (0.56 + 0.14 * np.sin(5.2 * x + 0.5))) / 0.075) ** 2)
        cyan_field += 0.42 * ribbon * smoothstep(0.35, 0.98, x)
        orange_field += 0.30 * ribbon * smoothstep(0.50, 0.95, x)
    else:
        sweep1 = y - (0.31 + 0.10 * np.sin(4.2 * x + 0.7))
        sweep2 = y - (0.69 + 0.08 * np.sin(4.9 * x - 0.8))
        cyan_field = np.exp(-(sweep1 / 0.038) ** 2) * smoothstep(0.50, 0.78, x)
        orange_field = np.exp(-(sweep2 / 0.044) ** 2) * smoothstep(0.54, 0.82, x)
        knot = np.exp(-(((x - 0.83) / 0.13) ** 2 + ((y - 0.50) / 0.42) ** 2))
        cyan_field += 0.20 * knot * smoothstep(0.55, 0.0, y)
        orange_field += 0.22 * knot * smoothstep(0.42, 0.95, y)
        center_accent = np.exp(-(((x - 0.53) / 0.055) ** 2 + ((y - 0.46) / 0.20) ** 2))
        cyan_field += 0.18 * center_accent
        orange_field += 0.10 * center_accent

    quiet_left = smoothstep(0.38 if not calm else 0.05, 0.66 if not calm else 0.80, x)
    intensity = 0.52 if calm else 0.94
    cyan_field *= quiet_left * intensity
    orange_field *= quiet_left * intensity

    def screen_mix(dst, tint, strength):
        s = np.clip(strength[..., None], 0, 1)
        return 255 - (255 - dst) * (255 - tint[None, None, :] * s) / 255

    img = screen_mix(img, cyan_deep, cyan_field * 0.70)
    img = screen_mix(img, cyan, cyan_field * (0.64 if calm else 0.82))
    img = screen_mix(img, orange_deep, orange_field * 0.75)
    img = screen_mix(img, orange, orange_field * (0.68 if calm else 0.88))

    highlight = np.exp(-(((x - 0.83) / 0.24) ** 2 + ((y - 0.42) / 0.34) ** 2)) * quiet_left
    img = screen_mix(img, ivory, highlight * (0.08 if calm else 0.12))

    vignette = 1 - 0.26 * np.clip(((x - 0.55) / 0.72) ** 2 + ((y - 0.5) / 0.86) ** 2, 0, 1)
    img *= vignette[..., None]

    rng = np.random.default_rng(20260817 if variant == 'orbital' else 20260818)
    noise = rng.normal(0, 1.6 if calm else 2.1, (h, w, 1))
    img = np.clip(img + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(img, 'RGB')


def portrait_for(variant):
    bg = shader_field(1200, 1200, variant=variant, calm=True).convert('RGBA')
    src = Image.open(SOURCE).convert('RGBA').resize((1200, 1200), Image.Resampling.LANCZOS)
    alpha = src.getchannel('A')
    halo = alpha.filter(ImageFilter.GaussianBlur(28))
    halo_rgba = Image.new('RGBA', bg.size, (78, 139, 168, 0))
    halo_rgba.putalpha(halo.point(lambda p: int(p * 0.12)))
    bg = Image.alpha_composite(bg, halo_rgba)
    out = Image.alpha_composite(bg, src)
    return out.convert('RGB'), src


def circle_crop(im, size):
    fit = im.resize((size, size), Image.Resampling.LANCZOS)
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(fit.convert('RGBA'), (0, 0), mask)
    return out


def font(size, bold=False):
    candidates = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def contact_sheet(banner, portrait, variant):
    canvas = Image.new('RGB', (1500, 1050), '#eef0f2')
    draw = ImageDraw.Draw(canvas)
    banner_fit = banner.resize((1400, 350), Image.Resampling.LANCZOS)
    canvas.paste(banner_fit, (50, 45))
    avatar = circle_crop(portrait, 260)
    canvas.paste(avatar, (120, 285), avatar)
    draw.ellipse((119, 284, 381, 546), outline='#ffffff', width=8)
    draw.text((420, 435), 'Dave Bettner', fill='#111827', font=font(46, True))
    draw.text((420, 495), 'Customer Deployment & Professional Services Leader', fill='#374151', font=font(25))
    draw.text((420, 535), 'Enterprise AI Agents, Integrations & Adoption', fill='#374151', font=font(25))
    draw.line((50, 610, 1450, 610), fill='#c8cdd3', width=2)
    draw.text((70, 650), f'LinkedIn visual study — {variant}', fill='#111827', font=font(28, True))
    draw.text((70, 700), 'Circle-crop checks', fill='#4b5563', font=font(20))
    x = 70
    for size in (48, 96, 160):
        c = circle_crop(portrait, size)
        canvas.paste(c, (x, 760), c)
        draw.ellipse((x - 1, 759, x + size + 1, 761 + size), outline='#ffffff', width=2)
        draw.text((x, 930), f'{size}px', fill='#4b5563', font=font(16))
        x += size + 90
    return canvas


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    for variant in ('orbital', 'flow'):
        banner = shader_field(1584, 396, variant=variant, calm=False)
        portrait, src = portrait_for(variant)
        banner_path = ROOT / f'linkedin-banner-{variant}.png'
        portrait_path = ROOT / f'linkedin-profile-{variant}.jpg'
        sheet_path = ROOT / f'linkedin-preview-{variant}.jpg'
        banner.save(banner_path, optimize=True)
        portrait.save(portrait_path, quality=95, subsampling=0)
        contact_sheet(banner, portrait, variant).save(sheet_path, quality=92, subsampling=0)

        # Verify fully opaque source pixels remain byte-identical after compositing.
        out_arr = np.array(portrait)
        src_arr = np.array(src)
        opaque = src_arr[:, :, 3] == 255
        max_diff = int(np.abs(out_arr[opaque].astype(int) - src_arr[:, :, :3][opaque].astype(int)).max()) if opaque.any() else -1
        print(variant, banner_path, portrait_path, sheet_path, 'opaque_max_diff', max_diff)

    for p in sorted(ROOT.glob('linkedin-*')):
        if p.is_file():
            print(hashlib.sha256(p.read_bytes()).hexdigest(), p.name, p.stat().st_size)


if __name__ == '__main__':
    main()
