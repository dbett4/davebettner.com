#!/usr/bin/env bash
set -euo pipefail

source_image="public/images/dave-bettner-headshot-c13-navy.png"
cutout_image="public/images/dave-bettner-headshot-c13-navy-cutout.png"

for command_name in identify convert compare; do
  command -v "$command_name" >/dev/null || {
    printf 'Missing required image verification command: %s\n' "$command_name" >&2
    exit 1
  }
done

for image in "$source_image" "$cutout_image"; do
  [[ -f "$image" ]] || {
    printf 'Missing portrait asset: %s\n' "$image" >&2
    exit 1
  }
done

[[ "$(identify -format '%wx%h' "$source_image")" == "1537x1023" ]] || {
  printf 'Unexpected source portrait dimensions\n' >&2
  exit 1
}
[[ "$(identify -format '%wx%h' "$cutout_image")" == "1100x1023" ]] || {
  printf 'Unexpected cutout portrait dimensions\n' >&2
  exit 1
}

rgb_difference="$(compare -metric AE \( "$source_image" -crop 1100x1023+220+0 +repage \) \( "$cutout_image" -alpha off \) null: 2>&1)"
[[ "$rgb_difference" == "0" ]] || {
  printf 'Cutout changes %s source RGB pixels\n' "$rgb_difference" >&2
  exit 1
}

alpha_contract="$(convert "$cutout_image" -alpha extract -format '%[fx:minima==0&&maxima==1&&mean>0.40&&mean<0.55]' info:)"
[[ "$alpha_contract" == "1" ]] || {
  printf 'Cutout alpha coverage is outside the accepted portrait contract\n' >&2
  exit 1
}

corner_sum="$(convert "$cutout_image" -alpha extract -format '%[fx:p{0,0}+p{1099,0}+p{0,1022}+p{1099,1022}]' info:)"
[[ "$corner_sum" == "0" ]] || {
  printf 'Cutout corners are not fully transparent\n' >&2
  exit 1
}

pocket_sum="$(convert "$cutout_image" -alpha extract -format '%[fx:p{290,950}+p{290,1000}+p{820,950}+p{825,1000}]' info:)"
[[ "$pocket_sum" == "0" ]] || {
  printf 'Cutout retains background between a sleeve and the torso\n' >&2
  exit 1
}

suit_anchor_min="$(convert "$cutout_image" -alpha extract -format '%[fx:min(min(p{278,950},p{307,950}),min(p{798,950},p{842,950}))]' info:)"
awk -v value="$suit_anchor_min" 'BEGIN { exit !(value > 0.95) }' || {
  printf 'Cutout removes suit pixels beside an interior pocket\n' >&2
  exit 1
}

printf 'Portrait cutout verified: lossless crop 1100x1023, source RGB unchanged, sleeve-to-torso pockets transparent, suit anchors preserved.\n'
