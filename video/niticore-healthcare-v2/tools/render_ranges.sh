#!/usr/bin/env bash
# Re-render only the frames that changed into out/niticore-healthcare-v2/frames (overwriting), then encode
# video_16x9.mp4, SFX and the mix (final.mp4). Run from video/:
#   bash niticore-healthcare-v2/tools/render_ranges.sh a:b [c:d ...]
set -e
F=niticore-healthcare-v2
SK="C:/Users/ArvindRK/.claude/plugins/synced/3f695c9f-1eec-4e08-b004-43f886b18657_d521bc65-3695-40ab-83e6-3de285191fc2/d92346f7-5140-4ddb-b284-a3b42995e5b0~g2/skills/motion-reel"
export PATH="$PWD/bin:$PATH"
N=$(python -c "import json;print(round(json.load(open('$F/film.json'))['duration']*60))")
for r in "$@"; do
  echo "== frames $r"
  node $F/tools/render_range.mjs --frames $r --format 16x9 --gpu --workers 4 --fps 60
done
bin/ffmpeg.exe -hide_banner -loglevel error -y -framerate 60 -i "out/$F/frames/%05d.png" -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -profile:v high -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -an -frames:v $N -movflags +faststart out/$F/video_16x9.mp4
node "$SK/scripts/sfx.mjs" $F
node "$SK/scripts/mix.mjs" $F
echo ALL_DONE
