#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SKILL="/Users/evansmacbookpro/.codex/skills/paper-collage-ad-codex"
FRAMES="$ROOT/assets/keyframes"
BACKGROUNDS="$ROOT/assets/animated-backgrounds"
MANIFESTS="$ROOT/manifests"
RENDERS="$ROOT/renders/animated"

mkdir -p "$BACKGROUNDS" "$RENDERS"

# Build neutral paper fields so each finished collage can physically enter the shot.
# The untouched keyframe is still used as the final lock frame by layer-animate.
for scene in 01 02 03 04 05; do
  magick -size 1920x1080 xc:'#eee8dc' \
    -attenuate 0.03 +noise Gaussian \
    "$BACKGROUNDS/scene-$scene-field.png"
done

for scene in 01 02 03 04 05; do
  node "$SKILL/scripts/layer-animate.mjs" \
    --manifest "$MANIFESTS/animated-scene-$scene.json" \
    --output "$RENDERS/scene-$scene.mp4"
done

echo "rendered animated scene videos"
