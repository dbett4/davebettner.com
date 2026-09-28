"""Monitor interfaces for the workstation loop, drawn as 1600x900 textures.

The left monitor is a light forecast spreadsheet; the right monitor is a dark
coding-agent session. Both are illustrative: no client data, product logos or
live sessions. Every state is a periodic function of time (see timeline.py).
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

import timeline as tl

W, H = 1600, 900
FONT_DIR = Path(__file__).resolve().parent / 'fonts'
_fonts = {}


def font(name, size):
    key = (name, size)
    if key not in _fonts:
        _fonts[key] = ImageFont.truetype(str(FONT_DIR / name), size)
    return _fonts[key]


SANS, SANS_MED, SANS_BOLD, MONO = 'Roboto-Regular.ttf', 'Roboto-Medium.ttf', 'Roboto-Bold.ttf', 'NotoSansMono-Regular.ttf'


def check(d, x, y, s, fill, width):
    d.line([(x, y + s * .55), (x + s * .38, y + s * .9), (x + s, y + s * .08)], fill=fill, width=width, joint='curve')


# ---------------------------------------------------------------- spreadsheet
COLS = [0, 64, 470, 700, 930, 1150, 1262]          # row numbers, A..E, then the chart gutter
ROW_TOP, ROW_H = 206, 50
ROWS = [
    ('Revenue', '1,240,000', '1,286,400', '46,400'),
    ('Cost of sales', '(412,000)', '(425,300)', '(13,300)'),
    ('Gross margin', '828,000', '861,100', '33,100'),
    ('Payroll', '(318,500)', '(312,900)', '5,600'),
    ('Benefits', '(64,200)', '(65,800)', '(1,600)'),
    ('Contractors', '(48,000)', '(41,250)', '6,750'),
    ('Software', '(36,400)', '(38,900)', '(2,500)'),
    ('Facilities', '(52,000)', '(52,000)', '0'),
    ('Travel', '(18,000)', '(12,450)', '5,550'),
    ('Marketing', '(44,000)', '(47,700)', '(3,700)'),
    ('Operating income', '246,900', '290,100', '43,200'),
]
GREEN, GREEN_DARK, INK, MUTED, GRID = '#1f7a4d', '#17603c', '#26302a', '#6c776f', '#d8dfd9'


def cell_center(col, row):
    """Center of spreadsheet cell; col 1..5 is A..E, row 1 is the header row."""
    return (COLS[col] + COLS[col + 1]) / 2, ROW_TOP + (row - 1) * ROW_H + ROW_H / 2


POINTER = [(0.0, (4, 5)), (0.45, (4, 5)), (0.85, (4, 7)), (1.20, (4, 7)), (1.55, (4, 10)), (1.85, (4, 10)),
           (2.15, (3, 10)), (8.30, (3, 10)), (8.80, (4, 5)), (10.0, (4, 5))]
SELECT = [(0.0, (4, 5))] + list(zip(tl.CLICKS, [(4, 7), (4, 10), (3, 10), (4, 5)]))


def pointer_cell(t):
    """Continuous pointer position in cell units (col, row), eased between keys."""
    t = tl.wrap(t)
    for (t0, a), (t1, b) in zip(POINTER, POINTER[1:]):
        if t0 <= t <= t1:
            u = tl.smoother((t - t0) / (t1 - t0 or 1))
            return a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u
    return POINTER[-1][1]


def pointer_xy(t):
    c, r = pointer_cell(t)
    # Interpolate within the column table so fractional columns glide smoothly.
    ci = int(min(max(c, 1), 5))
    frac = c - ci
    x0, _ = cell_center(ci, 1)
    x1, _ = cell_center(min(ci + 1, 5), 1)
    x = x0 + (x1 - x0) * frac + 26
    y = ROW_TOP + (r - 1) * ROW_H + ROW_H / 2 + 8
    return x, y


def spreadsheet(t):
    t = tl.wrap(t)
    im = Image.new('RGB', (W, H), '#fbfcfb')
    d = ImageDraw.Draw(im)
    sel_col, sel_row = tl.step(SELECT, t)
    # Title bar
    d.rectangle([0, 0, W, 58], fill=GREEN)
    d.rounded_rectangle([22, 15, 50, 43], radius=5, fill='#e9f4ee')
    for i in range(3):
        d.line([(26, 22 + i * 7), (46, 22 + i * 7)], fill=GREEN, width=2)
    d.text((66, 14), 'Q3 forecast', font=font(SANS_MED, 26), fill='#f4faf6')
    d.rounded_rectangle([1426, 14, 1576, 44], radius=15, fill='#2d8a5a')
    d.text((1452, 16), 'Saved', font=font(SANS_MED, 20), fill='#e3f3ea')
    # Ribbon
    d.rectangle([0, 58, W, 116], fill='#f2f4f2')
    for i, label in enumerate(['File', 'Home', 'Insert', 'Formulas', 'Data', 'Review']):
        x = 26 + i * 132
        d.text((x, 74), label, font=font(SANS, 22), fill='#4a544d' if label != 'Home' else GREEN_DARK)
        if label == 'Home':
            d.rectangle([x - 4, 108, x + 62, 113], fill=GREEN)
    for i in range(7):
        d.rounded_rectangle([860 + i * 64, 70, 900 + i * 64, 104], radius=5, fill='#e2e7e3')
    # Formula bar
    d.rectangle([0, 116, W, 164], fill='#ffffff')
    d.line([(0, 164), (W, 164)], fill=GRID, width=2)
    d.rounded_rectangle([12, 124, 120, 156], radius=4, outline='#c9d1ca', width=2)
    ref = 'ABCDE'[sel_col - 1] + str(sel_row)
    d.text((28, 127), ref, font=font(SANS_MED, 22), fill=INK)
    d.text((140, 126), 'fx', font=font(SANS, 22), fill='#8b958d')
    formula = {3: f'=SUMIFS(Ledger!F:F, Ledger!B:B, A{sel_row})', 4: f'=C{sel_row}-B{sel_row}'}.get(sel_col, '')
    d.text((190, 126), formula, font=font(SANS, 22), fill='#39433c')
    # Column headers
    d.rectangle([0, 164, COLS[6], ROW_TOP], fill='#eef1ee')
    for i, letter in enumerate('ABCDE'):
        x0, x1 = COLS[i + 1], COLS[i + 2]
        if i + 1 == sel_col:
            d.rectangle([x0, 164, x1, ROW_TOP], fill='#d7eadc')
            d.rectangle([x0, ROW_TOP - 5, x1, ROW_TOP], fill=GREEN)
        d.text(((x0 + x1) / 2 - 7, 172), letter, font=font(SANS_MED, 22), fill='#5d6861')
    # Grid body
    pending = tl.PENDING[0] <= t < tl.PENDING[1]
    sweep_t0, sweep_t1 = tl.SWEEP
    for r in range(1, 13):
        y0 = ROW_TOP + (r - 1) * ROW_H
        y1 = y0 + ROW_H
        header = r == 1
        base = '#e3ece5' if header else ('#f6f8f6' if r in (4, 12) else '#ffffff')
        d.rectangle([COLS[1], y0, COLS[6], y1], fill=base)
        # Verification sweep: each row flashes as the agent re-checks it.
        if not header:
            k = (r - 2) / 10
            at = sweep_t0 + k * (sweep_t1 - sweep_t0 - .35)
            glow = tl.pulse(t, at, .08, .45)
            if glow > 0:
                d.rectangle([COLS[1], y0, COLS[6], y1], fill=_mix('#ffffff', '#cdebd7', glow))
        d.rectangle([0, y0, COLS[1], y1], fill='#d7eadc' if r == sel_row else '#eef1ee')
        d.text((22 if r < 10 else 14, y0 + 12), str(r), font=font(SANS, 21), fill='#7b857e')
        if header:
            for i, label in enumerate(['Line item', 'Budget', 'Actual', 'Variance', 'Status']):
                x0, x1 = COLS[i + 1], COLS[i + 2]
                if i == 0:
                    d.text((x0 + 18, y0 + 11), label, font=font(SANS_BOLD, 23), fill='#2d4033')
                else:
                    w = d.textlength(label, font=font(SANS_BOLD, 23))
                    d.text((x1 - 18 - w, y0 + 11), label, font=font(SANS_BOLD, 23), fill='#2d4033')
            continue
        name, budget, actual, var = ROWS[r - 2]
        bold = name in ('Gross margin', 'Operating income')
        f = font(SANS_MED if bold else SANS, 23)
        d.text((COLS[1] + 18, y0 + 11), name, font=f, fill=INK)
        for i, v in enumerate([budget, actual, var]):
            x1 = COLS[i + 3]
            neg = v.startswith('(') and i == 2
            w = d.textlength(v, font=f)
            d.text((x1 - 18 - w, y0 + 11), v, font=f, fill='#b03c2e' if neg else INK)
        sx = (COLS[5] + COLS[6]) / 2
        k = (r - 2) / 10
        done_at = sweep_t0 + k * (sweep_t1 - sweep_t0 - .35) + .06
        waiting = pending or (sweep_t0 <= t < done_at)
        if waiting:
            for j in range(3):
                d.ellipse([sx - 20 + j * 16, y0 + 23, sx - 12 + j * 16, y0 + 31], fill='#a9b3ab')
        else:
            check(d, sx - 14, y0 + 13, 26, '#2f8f59', 5)
    for x in COLS[1:]:
        d.line([(x, 164), (x, ROW_TOP + 12 * ROW_H)], fill=GRID, width=2)
    for r in range(13):
        y = ROW_TOP + r * ROW_H
        d.line([(0, y), (COLS[6], y)], fill=GRID, width=2)
    # Active cell
    x0, x1 = COLS[sel_col], COLS[sel_col + 1]
    y0 = ROW_TOP + (sel_row - 1) * ROW_H
    d.rectangle([x0 - 2, y0 - 2, x1 + 2, y0 + ROW_H + 2], outline=GREEN, width=5)
    d.rectangle([x1 - 6, y0 + ROW_H - 6, x1 + 4, y0 + ROW_H + 4], fill=GREEN)
    # Chart card
    d.rounded_rectangle([1286, 214, 1584, 560], radius=10, fill='#ffffff', outline='#dfe5e0', width=2)
    d.text((1306, 230), 'Actual vs budget', font=font(SANS_MED, 21), fill='#46524a')
    base_y = 530
    heights = [(210, 226), (150, 142), (170, 188), (120, 114), (96, 110), (140, 156)]
    for i, (b, a) in enumerate(heights):
        x = 1310 + i * 44
        d.rectangle([x, base_y - b, x + 16, base_y], fill='#cfe0d4')
        d.rectangle([x + 18, base_y - a, x + 34, base_y], fill=GREEN)
    d.line([(1302, base_y), (1570, base_y)], fill='#c7d0c9', width=2)
    d.rounded_rectangle([1286, 580, 1584, 736], radius=10, fill='#ffffff', outline='#dfe5e0', width=2)
    d.text((1306, 596), 'Operating income', font=font(SANS, 21), fill='#5b665e')
    d.text((1306, 634), '+43.2K', font=font(SANS_BOLD, 44), fill=GREEN_DARK)
    d.text((1306, 694), 'vs budget', font=font(SANS, 20), fill='#7b857e')
    # Sheet tabs
    d.rectangle([0, 858, W, H], fill='#eef1ee')
    d.rectangle([60, 858, 236, H], fill='#ffffff')
    d.rectangle([60, 893, 236, H], fill=GREEN)
    d.text((86, 866), 'Variance', font=font(SANS_MED, 21), fill=GREEN_DARK)
    d.text((270, 866), 'Detail', font=font(SANS, 21), fill='#66716a')
    d.text((380, 866), 'Ledger', font=font(SANS, 21), fill='#66716a')
    # Pointer
    px, py = pointer_xy(t)
    pressed = any(0 <= (t - c) < .12 for c in tl.CLICKS)
    s = 1.15 if not pressed else 1.0
    arrow = [(0, 0), (0, 34), (9, 26), (15, 40), (21, 37), (15, 24), (27, 24)]
    pts = [(px + x * s, py + y * s) for x, y in arrow]
    d.polygon(pts, fill='#ffffff')
    d.line(pts + [pts[0]], fill='#1c2420', width=3)
    inner = [(px + x * s * .72 + 3, py + y * s * .72 + 7) for x, y in arrow]
    d.polygon(inner, fill='#1c2420')
    return im


def _mix(a, b, u):
    ca = [int(a[i:i + 2], 16) for i in (1, 3, 5)]
    cb = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return tuple(round(x + (y - x) * u) for x, y in zip(ca, cb))


# ---------------------------------------------------------------- agent
BG, PANEL, TEXT, DIM, BLUE, GREENT, AMBER, RED = '#1b1f24', '#242a31', '#dfe4e8', '#8e98a2', '#8cb8f2', '#63c48f', '#e2bd78', '#e07b6f'
LINE_H, LINES_VISIBLE = 46, 15
TOP, BOTTOM = 76, 76 + LINES_VISIBLE * LINE_H   # transcript area
BLOCK = [
    [('›', BLUE), ('Recheck Q3 variance against the ledger', TEXT)],
    [('●', GREENT), ('Read ', TEXT), ('forecast.xlsx', AMBER), (' · Variance sheet', DIM)],
    [('●', GREENT), ('Match 11 lines to GL detail', TEXT)],
    [('⎿', DIM), ('11 matched · 0 unexplained', DIM)],
    [('●', GREENT), ('Update ', TEXT), ('variance-notes.md', AMBER)],
    [('⎿', DIM), ('+4 lines', GREENT), ('  -1 line', RED)],
    [('✓', GREENT), ('No differences above $500', TEXT)],
    [],
]
HISTORY = BLOCK * 2
SCROLL_EVENTS = [tl.AGENT_LINES[0], tl.SPINNER[0]] + tl.AGENT_LINES[1:6] + [tl.AGENT_LINES[7]]


def glyph(d, kind, x, y, color):
    cy = y + 23
    if kind == '●':
        d.ellipse([x + 4, cy - 8, x + 20, cy + 8], fill=color)
    elif kind == '⎿':
        d.line([(x + 30, cy - 16), (x + 30, cy + 2), (x + 48, cy + 2)], fill=color, width=3)
    elif kind == '✓':
        check(d, x + 2, cy - 12, 22, color, 5)
    elif kind == '›':
        d.line([(x + 6, cy - 10), (x + 16, cy), (x + 6, cy + 10)], fill=color, width=4)
    elif kind == '✳':
        for i in range(4):
            import math
            a = i * math.pi / 4 + y * 0
            d.line([(x + 12 - 10 * math.cos(a), cy - 10 * math.sin(a)), (x + 12 + 10 * math.cos(a), cy + 10 * math.sin(a))], fill=color, width=3)


def draw_line(d, parts, x, y):
    if not parts:
        return
    kind, color = parts[0]
    glyph(d, kind, x, y, color)
    cx = x + (58 if kind == '⎿' else 34)
    for text, col in parts[1:]:
        d.text((cx, y + 7), text, font=font(MONO, 27), fill=col)
        cx += d.textlength(text, font=font(MONO, 27))


def agent(t):
    t = tl.wrap(t)
    im = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 56], fill=PANEL)
    for i, c in enumerate(['#e0655a', '#e0b34f', '#5fbf73']):
        d.ellipse([22 + i * 30, 19, 40 + i * 30, 37], fill=c)
    d.text((640, 12), 'forecast-checks', font=font(MONO, 25), fill='#aeb7c0')
    d.text((1410, 12), 'main', font=font(MONO, 25), fill='#8fc5a4')
    revealed = sum(1 for k in tl.AGENT_LINES if t >= k)
    lines = HISTORY + BLOCK[:revealed]
    spinner = tl.SPINNER[0] <= t < tl.SPINNER[1]
    if spinner:
        lines = lines + [None]
    scroll = sum(tl.smooth((t - e) / .16) for e in SCROLL_EVENTS if t >= e)
    shown = len(HISTORY) + scroll          # continuous line count at the bottom edge
    region = Image.new('RGB', (W, BOTTOM - TOP), BG)
    rd = ImageDraw.Draw(region)
    for j, parts in enumerate(lines):
        y = (BOTTOM - TOP) - (shown - j) * LINE_H
        if y < -LINE_H or y > BOTTOM - TOP:
            continue
        if parts is None:
            import math
            phase = int(t * 8) % 4
            glyph(rd, '✳', 36, y, ['#e2bd78', '#d9a860', '#e2bd78', '#f0cf8e'][phase])
            dots = '.' * (1 + int(t * 3) % 3)
            rd.text((74, y + 7), 'Checking ledger detail' + dots, font=font(MONO, 27), fill=AMBER)
            continue
        draw_line(rd, parts, 36, y)
    im.paste(region, (0, TOP))
    # Prompt input
    d.rounded_rectangle([28, 790, 1572, 868], radius=12, fill='#20262d', outline='#434c57', width=3)
    glyph(d, '›', 52, 806, BLUE)
    n = tl.typed_chars(t)
    typed = tl.PROMPT[:n]
    d.text((92, 813), typed, font=font(MONO, 27), fill=TEXT)
    cx = 92 + d.textlength(typed, font=font(MONO, 27))
    typing = tl.TYPE_START <= t < tl.SUBMIT
    if typing or int(t * 2) % 2 == 0:
        d.rectangle([cx + 2, 816, cx + 16, 848], fill='#cfd6dc')
    d.text((36, 874), '● ready' if not spinner else '● working', font=font(MONO, 20), fill='#77828c' if not spinner else AMBER)
    return im


if __name__ == '__main__':
    import sys
    out = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
    out.mkdir(parents=True, exist_ok=True)
    for t in [0.0, 1.2, 3.8, 5.8, 7.6, 9.99]:
        spreadsheet(t).save(out / f'sheet-{t:05.2f}.png')
        agent(t).save(out / f'agent-{t:05.2f}.png')
