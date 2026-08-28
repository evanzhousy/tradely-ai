#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS="$ROOT/assets/voice-scripts"
RAW="$ROOT/assets/voice-raw"
FINAL="$ROOT/assets/voice-final"
PYTHON="${HOME}/.tts-venv/bin/python"

mkdir -p "$RAW" "$FINAL"
test -x "$PYTHON"

for scene in 01 02 03 04 05; do
  "$PYTHON" "$ROOT/../../video/tts_caption.py" \
    "$SCRIPTS/$scene.txt" "$RAW/$scene-24k.wav" "$RAW/$scene.ass" \
    am_adam en-us 1.05 SFNS
  ffmpeg -y -loglevel error -i "$RAW/$scene-24k.wav" \
    -af 'highpass=f=70,lowpass=f=14000,loudnorm=I=-20:TP=-2:LRA=7' \
    -ar 48000 -ac 1 "$FINAL/$scene.wav"
done

echo "generated and normalized 5 Kokoro narration WAVs"
