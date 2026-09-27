#!/usr/bin/env bash
# Bring the rendered mix to -14 LUFS integrated / -1 dBTP (YouTube, LinkedIn,
# X all normalise to about this), two-pass loudnorm, video stream copied.
#   scripts/master.sh out/raw.mp4 out/vgi-explainer.mp4
set -euo pipefail
in=$1 out=$2
stats=$(ffmpeg -hide_banner -i "$in" -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$stats" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
build=$(dirname "$0")/../src/generated/build.json
field() { python3 -c "import json; print(json.load(open('$build'))['$1'])"; }
ffmpeg -hide_banner -loglevel error -y -i "$in" -c:v copy \
  -metadata title="VGI: Vector Gateway Interface for Python" \
  -metadata creation_time="$(field date)T00:00:00Z" \
  -metadata date="$(field date)" \
  -metadata comment="vgi-python $(field version), rendered $(field date). https://query.farm/vgi/docs/python" \
  -af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true" \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$out"
echo "mastered $out (was $(get input_i) LUFS)"
