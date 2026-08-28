#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEYFRAMES="$ROOT/assets/keyframes"
SCREENSHOTS="$ROOT/assets/screenshots"
BRAND="$ROOT/assets/brand"
FONT="/System/Library/Fonts/SFNS.ttf"
MONO="/System/Library/Fonts/SFNSMono.ttf"

mkdir -p "$KEYFRAMES"

base_args=(-resize '1920x1080^' -gravity center -extent '1920x1080' -gravity northwest)
text_args=(-font "$FONT" -fill '#1A1B1E' -stroke '#F2EEE5' -strokewidth 2)

magick "$KEYFRAMES/scene-01-style-anchor.png" "${base_args[@]}" \
  "${text_args[@]}" -pointsize 42 -annotate +92+72 'GEX  THE  MAP  BEHIND  THE  MOVE' \
  -pointsize 28 -annotate +1290+125 'CALL WALL' -annotate +660+815 'PUT WALL' \
  "$KEYFRAMES/scene-01-final.png"

magick "$KEYFRAMES/scene-02-gamma-split.png" "${base_args[@]}" \
  "${text_args[@]}" -pointsize 42 -annotate +170+72 'POSITIVE  GEX' \
  -pointsize 25 -annotate +170+126 'hedge against the move' \
  -pointsize 42 -annotate +1060+72 'NEGATIVE  GEX' \
  -pointsize 25 -annotate +1060+126 'hedge with the move' \
  -pointsize 26 -annotate +235+905 'calmer range' -annotate +1270+905 'faster trend' \
  "$KEYFRAMES/scene-02-final.png"

magick "$KEYFRAMES/scene-03-map-fold.png" "${base_args[@]}" \
  \( "$SCREENSHOTS/rank-symbols-ui.png" -resize '820x461!' \) -geometry +1010+270 -composite \
  "${text_args[@]}" -pointsize 42 -annotate +95+72 'START WITH THE MOOD' \
  -pointsize 31 -annotate +95+160 '1  RANK  /  SYMBOLS' -annotate +95+230 '2  SORT  BY  GEX' -annotate +95+300 '3  OPEN  A  TICKER' \
  "$KEYFRAMES/scene-03-final.png"

magick "$KEYFRAMES/scene-03-map-fold.png" "${base_args[@]}" \
  \( "$SCREENSHOTS/symbol-drawer-ui.png" -resize '940x529!' \) -geometry +870+275 -composite \
  "${text_args[@]}" -pointsize 42 -annotate +95+72 'READ IN ORDER' \
  -pointsize 30 -annotate +110+220 'GEX ENVIRONMENT' -annotate +110+290 'ZERO GAMMA' -annotate +110+360 'CALL WALL  /  PUT WALL' \
  -pointsize 24 -annotate +1080+890 'GEX STRUCTURE  ·  LATEST SNAPSHOT' \
  "$KEYFRAMES/scene-04-final.png"

magick "$KEYFRAMES/scene-01-style-anchor.png" "${base_args[@]}" \
  -fill '#1A1B1E' -stroke none -draw 'rectangle 108,88 688,220' -draw 'rectangle 1060,760 1820,950' \
  \( "$BRAND/tradingflow-logo.png" -resize '520x118!' \) -geometry +140+96 -composite \
  -font "$FONT" -fill '#F2EEE5' -pointsize 40 -annotate +1105+790 'WEATHER  +  MAP  +  TAPE' \
  -pointsize 34 -annotate +1110+850 'EXPLORE GEX IN TRADINGFLOW' \
  -font "$MONO" -fill '#6FB7FF' -pointsize 25 -annotate +1110+900 'app.tradingflow.com/app/rank/symbols' \
  "$KEYFRAMES/scene-05-final.png"

echo "built 5 composited 1920x1080 keyframes"
