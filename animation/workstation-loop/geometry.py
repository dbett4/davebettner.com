"""Shared coordinates in the 1254 px artwork, used by render.py and prepare_mattes.py."""

# Matte crops: name -> (x0, y0, x1, y1).
CROPS = {
    'head': (400, 270, 580, 440),
    'rarm': (600, 440, 790, 600),
    'lhand': (515, 405, 610, 475),
    'dog': (740, 760, 1040, 1030),
    'ear': (850, 780, 935, 875),
}

# The dog's ear flap, traced along its brown edge (including the fold at the root).
EAR_OUTLINE = [(913, 797), (916, 806), (914, 820), (913, 832), (911, 845), (906, 855), (899, 859),
               (891, 857), (884, 852), (877, 845), (871, 836), (868, 826), (869, 816), (873, 808),
               (880, 802), (890, 798), (902, 796)]
