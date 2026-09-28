"""Shared 10-second choreography for the workstation loop.

Every channel is periodic: the state at t = PERIOD equals the state at t = 0,
so the encoded clip loops without a cut. Times are seconds.
"""
import math

PERIOD = 10.0
FPS = 30

# Right hand works the mouse; each click selects the spreadsheet cell under the pointer.
CLICKS = [1.00, 1.65, 2.25, 9.00]

# Dave glances from the spreadsheet to the agent and back.
HEAD_KEYS = [(0.0, 0.0), (2.35, 0.0), (2.95, 1.0), (7.65, 1.0), (8.35, 0.0), (10.0, 0.0)]

# Prompt typed with the left hand while the right hand rests on the mouse.
PROMPT = 'Recheck Q3 variance against the ledger'
TYPE_START, TYPE_END = 2.95, 4.35
SUBMIT = 4.50

# Agent transcript lines appear at these times (seconds); the prompt echo first.
AGENT_LINES = [4.50, 5.05, 5.55, 6.10, 6.55, 6.90, 7.25, 7.40]
SPINNER = (4.62, 7.25)
SWEEP = (7.30, 8.10)                        # status cells re-check row by row
PENDING = (4.62, 7.30)                      # status cells show pending while the agent runs

# The dog. Dave, 2026-09-28: the rigged ear flick and tail wag looked wrong ("ears
# don't move like that"), so the dog holds perfectly still, exactly as painted,
# until a better method replaces this rig. The channels below are kept for that work.
DOG_STILL = True
# When animated: ear flick, a look toward Dave, blinks and a short tail wag.
DOG_HEAD_KEYS = [(0.0, 0.0), (4.90, 0.0), (5.60, 1.0), (7.70, 1.0), (8.50, 0.0), (10.0, 0.0)]
EAR_FLICKS = [3.55, 8.95]
BLINKS = [1.75, 6.20, 6.55]
TAIL = (6.35, 7.55)


def wrap(t):
    return t % PERIOD


def smooth(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def smoother(x):
    x = min(1.0, max(0.0, x))
    return x * x * x * (x * (x * 6 - 15) + 10)


def keyed(keys, t):
    """Ease between keyframes with zero velocity at every key (quintic smoothstep)."""
    t = wrap(t)
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t0 <= t <= t1:
            return v0 + (v1 - v0) * smoother((t - t0) / (t1 - t0 or 1))
    return keys[-1][1]


def step(keys, t):
    t = wrap(t)
    value = keys[0][1]
    for k, v in keys:
        if t >= k:
            value = v
    return value


def pulse(t, at, rise, fall):
    """0→1→0 impulse starting at `at`; periodic."""
    d = (wrap(t) - at) % PERIOD
    if d < rise:
        return smooth(d / rise)
    if d < rise + fall:
        return 1 - smooth((d - rise) / fall)
    return 0.0


def keystrokes():
    """Deterministic, slightly irregular key times for the prompt."""
    n = len(PROMPT)
    times = []
    for i in range(n):
        u = i / (n - 1)
        jitter = 0.012 * math.sin(i * 2.7) + 0.008 * math.sin(i * 5.3)
        times.append(TYPE_START + u * (TYPE_END - TYPE_START) + jitter)
    return times


KEY_TIMES = keystrokes()


# The typing hand visits a different part of the keyboard for each word. Zones
# are (along the keys, up the rows); the hand only reaches right and up from its
# resting place, so it never slides into the shoulder in front of it.
WORD_STARTS = [i for i, ch in enumerate(PROMPT) if i == 0 or PROMPT[i - 1] == ' ']
ZONES = [(0, 0), (1, -.6), (.4, -1), (1, .2), (.2, -.7), (.8, -.3)]


def hand_zone(t):
    """Eased lateral/forward offset (in zone units) of the typing hand."""
    keys = [(TYPE_START - .25, (0.0, 0.0))]
    for w, i in enumerate(WORD_STARTS):
        keys.append((KEY_TIMES[i] - .07, ZONES[w % len(ZONES)]))
    keys += [(TYPE_END + .12, keys[-1][1]), (TYPE_END + .5, (0.0, 0.0))]
    t = wrap(t)
    for (t0, a), (t1, b) in zip(keys, keys[1:]):
        if t0 <= t <= t1:
            u = smoother((t - t0) / (t1 - t0))
            return a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u
    return 0.0, 0.0


def typed_chars(t):
    t = wrap(t)
    if t < TYPE_START or t >= SUBMIT:
        return 0
    return sum(1 for k in KEY_TIMES if k <= t)
