#!/usr/bin/env bash
# Render every frame into out/niticore-healthcare-v2/frames (60 fps, GPU), encode video_16x9.mp4, then SFX and the
# mix, which writes final.mp4. Run from video/:  bash niticore-healthcare-v2/tools/render_final.sh
set -e
F=niticore-healthcare-v2
SK="C:/Users/ArvindRK/.claude/plugins/synced/3f695c9f-1eec-4e08-b004-43f886b18657_d521bc65-3695-40ab-83e6-3de285191fc2/d92346f7-5140-4ddb-b284-a3b42995e5b0~g2/skills/motion-reel"
export PATH="$PWD/bin:$PATH"
bash $F/tools/render_all.sh $F
node "$SK/scripts/sfx.mjs" $F
node "$SK/scripts/mix.mjs" $F
echo ALL_DONE
