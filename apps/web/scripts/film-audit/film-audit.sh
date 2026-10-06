#!/bin/bash
# Browser acceptance checks for the lesson films (docs/runbook/create-svg-animation.md, §7).
#
#   film-audit.sh check LESSON END          scan + flight + timing, problems only
#   film-audit.sh scan LESSON END           every 0.5 s at 1440 and 390, EN and ZH; contact sheets
#   film-audit.sh flight LESSON END         every 0.1 s: marks in flight, entrances, carries
#   film-audit.sh timing LESSON [rows]      holds, copy length, figures, hero-lock, class names
#   film-audit.sh frames LESSON PREFIX TIMES SIZE LOCALE    screenshots at given times
#   film-audit.sh play LESSON...            real-time playback at the default rate
#   film-audit.sh evidence DIR "lesson:end:heroStart:heroEnd ..."   frames, GIFs and results for a review
#
# END is the film's END constant (its timeline runs to END − 2). TIMES is "a,b,c" or
# "start:end:step" in timeline seconds; SIZE is 1440x900x1 or 390x844x2m.
#
# Pages run in ego-browser against a vite dev server on port 8262, started here if it is not
# already up and stopped afterwards. Reports, frames and GIFs go to $FILM_AUDIT_OUT (default
# $TMPDIR/tradely-film-audit), never into the repository.
set -o pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
WEB="$(cd "$HERE/../.." && pwd)"
REPO="$(cd "$WEB/../.." && pwd)"
OUT="${FILM_AUDIT_OUT:-${TMPDIR:-/tmp}/tradely-film-audit}"
OUT="${OUT%/}"
PORT=8262
mkdir -p "$OUT"

# One ego-browser task space for every run; a browser restart loses it, so make a new one then.
space() {
	local id
	id="$(cat "$OUT/space.txt" 2>/dev/null)"
	# stdin closed: with -e, ego-browser otherwise waits on it.
	if [ -n "$id" ] && ego-browser nodejs -e "await taskSpace(Number($id));" </dev/null >/dev/null 2>&1; then
		echo "$id"
		return
	fi
	id="$(ego-browser nodejs -e 'const t = await taskSpace("tradely film audit"); console.log("SPACE " + t.spaceId);' </dev/null 2>/dev/null | sed -n 's/^SPACE //p')"
	echo "$id" > "$OUT/space.txt"
	echo "$id"
}

VITE=""
server_up() {
	curl -s -o /dev/null --max-time 2 "http://localhost:$PORT/" && return
	(cd "$WEB" && npx vite dev --port $PORT --strictPort > "$OUT/vite-$PORT.log" 2>&1) &
	VITE=$!
	for _ in $(seq 1 60); do curl -s -o /dev/null --max-time 2 "http://localhost:$PORT/" && return; sleep 1; done
	echo "vite did not start; see $OUT/vite-$PORT.log" >&2
	exit 1
}
server_down() { if [ -n "$VITE" ]; then pkill -P "$VITE" 2>/dev/null; kill "$VITE" 2>/dev/null; wait "$VITE" 2>/dev/null; fi; }
trap server_down EXIT

# run SCRIPT KEY=VALUE... : one page script in ego-browser with an `env` object in front of it.
# A page that returns nothing gets one retry; the raw output of a failed attempt is kept in
# $OUT/run-failed.txt.
run() {
	local script="$1" raw out; shift
	for _ in 1 2; do
		raw="$({
			printf 'const env = {'
			for kv in "$@"; do printf ' %s: %s,' "${kv%%=*}" "$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "${kv#*=}")"; done
			printf ' };\n'
			cat "$HERE/$script"
		} | ego-browser nodejs 2>&1)"
		# The result is the first JSON object, even with a warning printed in front of it.
		out="$(sed -En 's/^[^{]*(\{(\}|").*)$/\1/p' <<< "$raw" | head -1)"
		[ -n "$out" ] && break
		printf '%s %s\n%s\n' "$script" "$*" "$raw" > "$OUT/run-failed.txt"
	done
	echo "$out"
}

CONFIGS="1440x900x1:en 1440x900x1:zh 390x844x2m:en 390x844x2m:zh"

stamp() {
	local f="$WEB/src/features/learning/lessons/$1-film.tsx"
	local dirty=""
	git -C "$REPO" status --porcelain -- apps/web/src | grep -v '^ D' | grep -q . && dirty="+dirty"
	echo "$(git -C "$REPO" rev-parse --short HEAD)$dirty film:$(md5 -q "$f" | cut -c1-8) kit:$(md5 -q "$WEB/src/features/learning/walkthrough/film-kit.tsx" | cut -c1-8) $(date +%H:%M:%S)"
}

sheets() { # DIR PREFIX PERROW ROWSPERSHEET WIDTH STAMP
	local dir=$1 prefix=$2 per=$3 rows=$4 w=$5 label=$6
	(
		cd "$dir" || exit
		shopt -s nullglob
		rm -f "$prefix"-row-*.png "$prefix"-sheet-*.png
		local files=("$prefix"-[0-9]*.png) r=0 n=0
		for ((i = 0; i < ${#files[@]}; i += per)); do
			magick "${files[@]:i:per}" -resize "${w}x" -bordercolor "#888" -border 2 +append "$prefix-row-$(printf %02d $r).png"; r=$((r + 1))
		done
		local rowsf=("$prefix"-row-*.png)
		for ((i = 0; i < ${#rowsf[@]}; i += rows)); do
			magick "${rowsf[@]:i:rows}" -append -font /System/Library/Fonts/Courier.ttc -gravity SouthEast -fill "#e33" -undercolor "#fff" -pointsize 15 -annotate +4+4 "$label" "$prefix-sheet-$n.png"; n=$((n + 1))
		done
		rm -f "$prefix"-row-*.png
	)
}

cmd_frames() { # LESSON PREFIX TIMES SIZE LOCALE [DIR]
	local dir="${6:-$OUT/frames-$1}"
	mkdir -p "$dir"
	run frame-scan.mjs SPACE="$(space)" LESSON="$1" OUT="$dir" PREFIX="$2" TIMES="$3" SIZE="$4" LOCALE="$5" PORT="$PORT"
}

cmd_scan() { # LESSON END
	local L=$1 END=$2 dir="$OUT/scan-$1" label
	mkdir -p "$dir"
	find "$dir" -maxdepth 1 -type f -name '*.png' -delete
	label="$(stamp "$L")"
	echo "stamp $label"
	for c in $CONFIGS; do
		local SZ=${c%%:*} LOC=${c##*:}
		cmd_frames "$L" "${SZ%%x*}-$LOC" "0:$(python3 -c "print($END-2)"):0.5" "$SZ" "$LOC" "$dir" | python3 "$HERE/report.py" scan "$L $SZ $LOC"
	done
	sheets "$dir" 1440-en 5 6 380 "$label"
	sheets "$dir" 390-zh 6 6 300 "$label"
}

cmd_flight() { # LESSON END
	for c in $CONFIGS; do
		run flight.mjs SPACE="$(space)" LESSON="$1" END="$2" SIZE="${c%%:*}" LOCALE="${c##*:}" PORT="$PORT" | python3 "$HERE/report.py" flight "$1 $c"
	done
}

cmd_timing() { # LESSON [rows]
	for c in $CONFIGS; do
		run timing.mjs SPACE="$(space)" LESSON="$1" SIZE="${c%%:*}" LOCALE="${c##*:}" PORT="$PORT" | python3 "$HERE/report.py" timing "$1 $c" "${2:-}"
	done
}

cmd_check() { # LESSON END
	{ cmd_scan "$1" "$2"; cmd_flight "$1" "$2"; cmd_timing "$1"; } | grep -v -e "hits=0$" -e "edges=0$" -e "fails=0$" -e "^/"
}

cmd_play() { # LESSON...
	printf '%s\n' "$@" > "$OUT/play-list.txt"
	for c in 1440x900x1:en 390x844x2m:zh; do
		echo "# $c"
		run playthrough.mjs SPACE="$(space)" LIST="$OUT/play-list.txt" SIZE="${c%%:*}" LOCALE="${c##*:}" PORT="$PORT" THROTTLE="${FILM_AUDIT_THROTTLE:-1}" | python3 "$HERE/report.py" play "$c"
	done
}

cmd_evidence() { # DIR "lesson:end:heroStart:heroEnd ..."
	local J=$1 lessons=()
	case "$J" in "$OUT"/?*) ;; *) echo "evidence goes under $OUT"; exit 1 ;; esac
	mkdir -p "$J/gifs"
	find "$J" -type f \( -name '*.png' -o -name '*.gif' -o -name '*.txt' \) -delete
	git -C "$REPO" rev-parse --short HEAD > "$J/COMMIT.txt"
	for spec in $2; do
		IFS=: read -r L E A B <<< "$spec"
		lessons+=("$L")
		local D; D=$(python3 -c "print(round($E-2,2))")
		mkdir -p "$J/$L/all" "$J/$L/hero"
		for c in 1440x900x1:en 390x844x2m:en 390x844x2m:zh; do
			local SZ=${c%%:*} LOC=${c##*:} P="${c%%x*}-${c##*:}"
			cmd_frames "$L" "$P" "0:$D:0.25" "$SZ" "$LOC" "$J/$L/all" > /dev/null
			cmd_frames "$L" "$P" "$A:$B:0.1" "$SZ" "$LOC" "$J/$L/hero" > /dev/null
			ffmpeg -loglevel error -y -framerate 4 -pattern_type glob -i "$J/$L/all/$P-[0-9]*.png" \
				-vf "scale=$([ "$SZ" = 1440x900x1 ] && echo 720 || echo 390):-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" \
				"$J/gifs/$L-$P-1x.gif"
		done
	done
	{
		echo "# Checks at $(cat "$J/COMMIT.txt")"
		for spec in $2; do IFS=: read -r L E _ _ <<< "$spec"; cmd_check "$L" "$E"; done
		echo; echo "# Timing audit rows (1440 EN)"
		for spec in $2; do IFS=: read -r L _ _ _ <<< "$spec"; cmd_timing "$L" rows | sed -n '/1440x900x1:en/,/1440x900x1:zh/p' | grep -v "1440x900x1:zh"; done
		echo; echo "# Real-time playthrough"
		cmd_play "${lessons[@]}"
	} > "$J/verify.txt" 2>&1
	ls "$J/gifs"
}

[ $# -ge 1 ] || { sed -n '2,20p' "$0"; exit 1; }
sub=$1; shift
case "$sub" in
	check | scan | flight | timing | frames | play | evidence) server_up; "cmd_$sub" "$@" ;;
	*) sed -n '2,20p' "$0"; exit 1 ;;
esac
