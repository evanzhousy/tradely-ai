#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$ROOT/assets/voice-raw"
FINAL="$ROOT/assets/voice-final"
mkdir -p "$RAW" "$FINAL"

say -v Alex -o "$RAW/01.aiff" 'Price taps the same ceiling. Again. Again. Then one day, it flies through.'
say -v Alex -o "$RAW/02.aiff" "The difference can be pressure you can't see."
say -v Alex -o "$RAW/03.aiff" "Start with the market's mood, not a prediction."
say -v Alex -o "$RAW/04.aiff" "Calm can mean mean reversion. Tension can mean acceleration. Either way, levels are possibilities, not promises."
say -v Alex -o "$RAW/05.aiff" 'Weather. Map. Then the tape. Explore GEX in TradingFlow.'

for scene in 01 02 03 04 05; do
  ffmpeg -y -loglevel error -i "$RAW/$scene.aiff" \
    -af 'highpass=f=70,lowpass=f=14000,loudnorm=I=-20:TP=-2:LRA=7' \
    -ar 48000 -ac 1 "$FINAL/$scene.wav"
done

echo "generated and normalized 5 narration WAVs"
