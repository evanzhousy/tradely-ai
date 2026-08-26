#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AUDIO="$ROOT/assets/audio"
mkdir -p "$AUDIO"

ffmpeg -y -loglevel error \
  -f lavfi -i 'sine=frequency=220:duration=38:sample_rate=48000' \
  -f lavfi -i 'sine=frequency=277.18:duration=38:sample_rate=48000' \
  -f lavfi -i 'sine=frequency=329.63:duration=38:sample_rate=48000' \
  -filter_complex '[0:a]volume=0.035,lowpass=f=500[a0];[1:a]volume=0.025,lowpass=f=600[a1];[2:a]volume=0.02,lowpass=f=700[a2];[a0][a1][a2]amix=inputs=3:duration=longest,afade=t=in:st=0:d=1,afade=t=out:st=36:d=2,volume=0.8' \
  -ar 48000 -ac 2 "$AUDIO/underscore.wav"

ffmpeg -y -loglevel error -f lavfi -i 'anoisesrc=color=pink:duration=0.12:sample_rate=48000:amplitude=0.4' \
  -af 'highpass=f=700,lowpass=f=5000,afade=t=out:st=0.03:d=0.09,volume=0.5' \
  -ar 48000 -ac 1 "$AUDIO/click-soft.wav"

ffmpeg -y -loglevel error -f lavfi -i 'anoisesrc=color=pink:duration=0.4:sample_rate=48000:amplitude=0.35' \
  -af 'highpass=f=180,lowpass=f=3500,afade=t=in:st=0:d=0.12,afade=t=out:st=0.18:d=0.22,volume=0.35' \
  -ar 48000 -ac 1 "$AUDIO/whoosh-short.wav"

echo "generated underscore and paper SFX"
