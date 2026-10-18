#!/usr/bin/env bash
# Render every frame (60 fps, GPU) and encode out/<film>/video_16x9.mp4. Run from video/:
#   bash niticore-healthcare-v2/tools/render_all.sh [film]
set -e
# frames (about 8 GB) go to $FRAMES when set, e.g. a folder on a drive with room; the video lands in out/<film>/
F=${1:-niticore-healthcare-v2}
FR=${FRAMES:-$(pwd -W)/out/$F/frames}   # absolute: render_range.mjs resolves --dir against out/<film>/
N=$(python -c "import json;print(round(json.load(open('$F/film.json'))['duration']*60))")
echo "== $F 16x9 ($N frames)"
node $F/tools/render_range.mjs --frames 0:$N --format 16x9 --gpu --workers 4 --fps 60 --resume --dir "$FR"
bin/ffmpeg.exe -hide_banner -loglevel error -y -framerate 60 -i "$FR/%05d.png" -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -profile:v high -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -an -frames:v $N -movflags +faststart out/$F/video_16x9.mp4
echo "-> out/$F/video_16x9.mp4"
