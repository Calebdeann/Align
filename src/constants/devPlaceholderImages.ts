// DEV-ONLY: placeholder photos used to fill out the Discover feed before real
// user photos are widespread. Cycles by index. Delete this file and its imports
// once enough real workouts have photos.

export const DEV_PLACEHOLDER_PHOTOS = [
  require('../../assets/temp-images/Frame-2018776599.png'),
  require('../../assets/temp-images/Frame-2018776600.png'),
  require('../../assets/temp-images/Frame-2018776601.png'),
  require('../../assets/temp-images/Frame-2018776602.png'),
  require('../../assets/temp-images/Frame-2018776628.png'),
  require('../../assets/temp-images/Frame-2018776629.png'),
  require('../../assets/temp-images/Frame-2018776630.png'),
  require('../../assets/temp-images/Frame-2018776631.png'),
  require('../../assets/temp-images/Frame-2018776632.png'),
];

export function getPlaceholderPhoto(index: number) {
  const n = DEV_PLACEHOLDER_PHOTOS.length;
  return DEV_PLACEHOLDER_PHOTOS[((index % n) + n) % n];
}

// Avatar placeholder uses the same set (shuffled by adding an offset) so the
// avatar on a card doesn't match the body photo.
export function getPlaceholderAvatar(index: number) {
  return getPlaceholderPhoto(index + 3);
}

// Aspect ratios (H/W) cycled per placeholder card so the Pinterest feed still
// has height variation. All values are kept close to 1.25 (the natural H/W of
// the 2160×2700 source PNGs) so cover-cropping never zooms the image more than
// ~10% on any side.
const DEV_PLACEHOLDER_ASPECT_RATIOS = [1.1, 1.25, 1.0, 1.35, 1.2, 1.3, 1.05, 1.4, 1.15];

export function getPlaceholderAspectRatio(index: number) {
  const n = DEV_PLACEHOLDER_ASPECT_RATIOS.length;
  return DEV_PLACEHOLDER_ASPECT_RATIOS[((index % n) + n) % n];
}
