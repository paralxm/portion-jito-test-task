/**
 * Local photography, imported so Vite owns the hashed build output and the runtime,
 * Storybook, tests and captures stay deterministic and offline. Every file is registered
 * (provider, creator, item URL, licence, access date, crop) in
 * docs/design/hifi-decisions.md §5. Each file is a 1200 × 900 (4:3) WebP crop; the 16:9
 * recipe hero uses `object-fit: cover` on the same file.
 *
 * A photograph is evidence of appearance only: it never establishes calories,
 * ingredients, dietary status or portion size.
 */
import chickenSaladPhoto from './recipes/chicken-salad.webp';
import lentilSoupPhoto from './recipes/lentil-soup.webp';
import pastaRoastedVegetablesPhoto from './recipes/pasta-roasted-vegetables.webp';
import tofuStirFryPhoto from './recipes/tofu-stir-fry.webp';
import vegetableTraybakePhoto from './recipes/vegetable-traybake.webp';
import sampleCapturePhoto from './foods/sample-capture.webp';

/** Intrinsic size of every registered photo, for aspect declarations and layout stability. */
export const PHOTO_INTRINSIC = { width: 1200, height: 900 } as const;

export { chickenSaladPhoto, lentilSoupPhoto, pastaRoastedVegetablesPhoto, sampleCapturePhoto, tofuStirFryPhoto, vegetableTraybakePhoto };
