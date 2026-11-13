#!/bin/bash
# usage: frames-sheet.sh <video> <out.png> <t1> <t2> ...   (4 columns, 480x270 each)
V=$1; OUT=$2; shift 2; D=$(mktemp -d); i=0; ARGS=(); LAY=""
for t in "$@"; do ffmpeg -y -v error -ss "$t" -i "$V" -frames:v 1 -vf scale=480:270 "$D/f$i.png"; ARGS+=(-i "$D/f$i.png"); LAY="$LAY$([ $i -gt 0 ] && echo '|')$(( (i%4)*480 ))_$(( (i/4)*270 ))"; i=$((i+1)); done
[ $i -eq 1 ] && { cp "$D/f0.png" "$OUT"; rm -rf "$D"; exit 0; }
IN=""; for k in $(seq 0 $((i-1))); do IN="$IN[$k]"; done
ffmpeg -y -v error "${ARGS[@]}" -filter_complex "${IN}xstack=inputs=${i}:layout=${LAY}" "$OUT"; rm -rf "$D"
