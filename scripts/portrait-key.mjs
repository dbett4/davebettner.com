/**
 * Facts about the hero portrait cutout, shared by the markup contract and the verifier.
 *
 * The shipped cutout is a supplied asset, not a build output: it is not derived from
 * `dave-bettner-headshot-c13-navy.png` in this repository, and no script here regenerates
 * it. What is still checked is the studio backdrop it was cut from, because a bad cut
 * leaves that backdrop behind. Normalised blueness — (blue - red) / luma — is invariant to
 * shading, and the backdrop occupies a band no part of the subject occupies: backdrop
 * 0.34-0.40, suit 0.02-0.10, shirt ~0.00, skin and hair negative. The navy tie is bluer
 * still (~0.8), hence the upper bound on the band.
 */

export const CUTOUT_IMAGE = 'public/images/dave-bettner-headshot-20260816-cutout.png';
export const CUTOUT_SHA256 = 'b34ff1a55c4025f92593a8e2c6685f64dc2ba117604aaa0b1efbb52abb2fd102';

// The one place these dimensions are written down: the markup, the site contract and the
// cutout contract all read them from here, so swapping the asset cannot leave a stale
// width/height attribute behind.
export const CUTOUT_SIZE = { width: 1312, height: 1199 };

export const BACKGROUND_KEY_MIN = 0.30;
export const BACKGROUND_KEY_MAX = 0.55;

export const blueness = (red, green, blue) => {
  const luma = Math.max((red + green + blue) / 3, 1);
  return (blue - red) / luma;
};

export const isBackdropColour = (red, green, blue) => {
  const key = blueness(red, green, blue);
  return key >= BACKGROUND_KEY_MIN && key <= BACKGROUND_KEY_MAX;
};
