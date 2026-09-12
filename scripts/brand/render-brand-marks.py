"""Rasterize the canonical flat SVG logo. Requires ImageMagick (`magick`).
Run: python3 scripts/brand/render-brand-marks.py
The interactive 3D character is maintained separately in build-avatar.py.
"""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
BRAND = ROOT / 'apps/web/public/brand'
for name, size in [
    ('tradely-mark.png', 1254),
    ('tradely-mark-128.png', 128),
    ('tradely-favicon-64.png', 64),
    ('tradely-apple-touch-icon.png', 180),
]:
    subprocess.run([
        'magick', '-background', 'none', '-density', '1200',
        str(BRAND / 'tradely-mark.svg'), '-resize', f'{size}x{size}',
        str(BRAND / name),
    ], check=True)
