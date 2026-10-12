#!/usr/bin/env bash
# Render every format's frames (30 fps, GPU), then encode each to out/niticore-event/video_<fmt>.mp4. Run from video/.
set -e
N=$(python -c "import json;print(round(json.load(open('niticore-event/film.json'))['duration']*30))")
for f in 9x16 4x5 1x1 16x9; do
  echo "== $f ($N frames)"
  node niticore-event/tools/render_range.mjs --frames 0:$N --format $f --gpu --workers 4 --fps 30 --resume
  dir=out/niticore-event/frames$([ "$f" = "16x9" ] || echo "_$f")
  bin/ffmpeg.exe -hide_banner -loglevel error -y -framerate 30 -i "$dir/%05d.png" -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
    -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -profile:v high -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
    -an -frames:v $N -movflags +faststart out/niticore-event/video_$f.mp4
  echo "-> video_$f.mp4"
done
echo ALL_DONE
