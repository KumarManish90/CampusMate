#!/bin/bash
# CampusMate demo reel generator — real, short, playable MP4s, made entirely
# offline with ffmpeg's lavfi gradient source + drawtext (no network, no
# scraped footage). Run generate_demo_media.py first for the matching
# thumbnails, avatars, post images, club logos and event banners.
#
# Usage:
#   sudo apt-get install ffmpeg   # if not already installed
#   bash scripts/make_reels.sh
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/uploads/reels"
mkdir -p "$OUT"
cd "$OUT"

CAPS=("Campus vibes before the hackathon" "60s inside Sanskriti rehearsal" "RoboWar bot survives round 1" "POV your PR gets merged" "Late night debugging squad" "Coffee break with the club")
COLORS1=("0x6D5DF6" "0x38BDF8" "0xF5A524" "0xA855F7" "0x6D5DF6" "0x38BDF8")
COLORS2=("0xA855F7" "0x6D5DF6" "0xFB4570" "0xF5A524" "0x38BDF8" "0xF5A524")
DURS=(6 8 10 12 15 20)

FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
if [ ! -f "$FONT" ]; then
  echo "DejaVu Sans Bold font not found at $FONT — install fonts-dejavu-core or edit FONT= above." >&2
  exit 1
fi

for i in 0 1 2 3 4 5; do
  n=$((i+1))
  cap="${CAPS[$i]}"
  c1="${COLORS1[$i]}"
  c2="${COLORS2[$i]}"
  dur="${DURS[$i]}"
  out=$(printf "reel-%02d.mp4" $n)
  ffmpeg -y -f lavfi -i "gradients=s=720x1280:c0=${c1}:c1=${c2}:x0=0:y0=0:x1=720:y1=1280:d=${dur}" \
    -vf "drawtext=fontfile=${FONT}:text='${cap}':fontcolor=white:fontsize=42:x=(w-text_w)/2:y=h-260:box=1:boxcolor=black@0.35:boxborderw=20, drawtext=fontfile=${FONT}:text='CampusMate demo reel':fontcolor=white@0.8:fontsize=26:x=(w-text_w)/2:y=h-180" \
    -c:v libx264 -t "$dur" -pix_fmt yuv420p -movflags +faststart "$out" -loglevel error
  echo "made $out ($(du -h "$out" | cut -f1))"
done

echo "Done. Reels are in $OUT"
