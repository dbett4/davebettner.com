/**
 * One definition of the studio backdrop key, shared by the cutout generator and the
 * cutout verifier so the contract is checked against the same measurement that built it.
 *
 * Normalised blueness — (blue - red) / luma — is invariant to shading, which is what makes
 * it usable both on the open backdrop and inside the shadowed crevice between a sleeve and
 * the torso. Measured on this frame: backdrop 0.34-0.40, suit 0.02-0.10, shirt ~0.00,
 * skin and hair negative, navy tie ~0.8 (bluer than the backdrop, hence the upper bound).
 */

export const SOURCE_IMAGE = 'public/images/dave-bettner-headshot-c13-navy.png';
export const CUTOUT_IMAGE = 'public/images/dave-bettner-headshot-c13-navy-cutout.png';

export const SOURCE_SIZE = { width: 1537, height: 1023 };
export const CUTOUT_CROP = { left: 220, top: 0, width: 1100, height: 1023 };

export const BACKGROUND_KEY_MIN = 0.30;
export const BACKGROUND_KEY_MAX = 0.55;
export const FOREGROUND_KEY_MAX = 0.15;

export const blueness = (red, green, blue) => {
  const luma = Math.max((red + green + blue) / 3, 1);
  return (blue - red) / luma;
};

export const isBackdropColour = (red, green, blue) => {
  const key = blueness(red, green, blue);
  return key >= BACKGROUND_KEY_MIN && key <= BACKGROUND_KEY_MAX;
};
