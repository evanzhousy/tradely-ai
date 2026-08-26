#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SKILL="/Users/evansmacbookpro/.codex/skills/paper-collage-ad-codex"

for scene in 01 02 03 04 05; do
  node "$SKILL/scripts/render.mjs" \
    --manifest "$ROOT/manifests/render-scene-$scene.json" \
    --output "$ROOT/renders/scene-$scene.mp4"
done

echo "rendered 5 scene MP4s"
