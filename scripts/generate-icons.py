import math
import os
from PIL import Image, ImageDraw

def create_sumi_icon(size):
    scale = 8
    S = size * scale
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded squircle container (Apple / Linear style radius)
    radius = int(S * 0.225)
    bg_color = (18, 18, 20, 255) # deep charcoal ink-950
    draw.rounded_rectangle([0, 0, S, S], radius=radius, fill=bg_color)

    # Droplet geometry normalized to 24x24
    f = S / 24.0

    def cubic_bezier(p0, p1, p2, p3, steps=80):
        pts = []
        for i in range(steps + 1):
            t = i / steps
            u = 1 - t
            x = u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0]
            y = u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1]
            pts.append((x, y))
        return pts

    # Left flank curve down to bottom circle
    pts = cubic_bezier((12*f, 3.5*f), (10.3*f, 6.5*f), (7*f, 11*f), (7*f, 15*f))
    # Bottom circle arc
    cx, cy, r = 12*f, 15*f, 5*f
    for i in range(80):
        angle = math.pi - (math.pi * i / 79)
        pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    # Right flank curve back up to apex
    pts += cubic_bezier((17*f, 15*f), (17*f, 11*f), (13.7*f, 6.5*f), (12*f, 3.5*f))

    draw.polygon(pts, fill=(255, 255, 255, 255))
    return img.resize((size, size), Image.Resampling.LANCZOS)

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assets = [
        (os.path.join(root, 'public/icons/icon16.png'), 16),
        (os.path.join(root, 'public/icons/icon48.png'), 48),
        (os.path.join(root, 'public/icons/icon128.png'), 128),
        (os.path.join(root, 'public/favicon.png'), 32),
    ]

    for path, size in assets:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        icon = create_sumi_icon(size)
        icon.save(path)
        print(f'Generated {path} ({size}x{size})')

if __name__ == '__main__':
    main()
