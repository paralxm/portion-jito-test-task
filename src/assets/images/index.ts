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
import salmonRiceBowlPhoto from './recipes/salmon-rice-bowl.webp';
import yoghurtParfaitPhoto from './recipes/yoghurt-parfait.webp';
import overnightOatsPhoto from './recipes/overnight-oats.webp';
import chickpeaCurryPhoto from './recipes/chickpea-curry.webp';
import vegetableOmelettePhoto from './recipes/vegetable-omelette.webp';
import sampleCapturePhoto from './foods/sample-capture.webp';
import greekYoghurtPhoto from './foods/greek-yoghurt.webp';
import almondButterPhoto from './foods/almond-butter.webp';
import saladLeavesPhoto from './foods/salad-leaves.webp';
import oatmealPhoto from './foods/oatmeal.webp';
import bananaPhoto from './foods/banana.webp';
import avocadoToastPhoto from './foods/avocado-toast.webp';
import hummusPhoto from './foods/hummus.webp';
import scrambledEggsPhoto from './foods/scrambled-eggs.webp';
import sparklingWaterPhoto from './drinks/sparkling-water.webp';
import orangeJuicePhoto from './drinks/orange-juice.webp';
import oatDrinkPhoto from './drinks/oat-drink.webp';

/** Intrinsic size of every registered photo, for aspect declarations and layout stability. */
export const PHOTO_INTRINSIC = { width: 1200, height: 900 } as const;

export {
  almondButterPhoto,
  avocadoToastPhoto,
  bananaPhoto,
  chickenSaladPhoto,
  chickpeaCurryPhoto,
  greekYoghurtPhoto,
  hummusPhoto,
  lentilSoupPhoto,
  oatDrinkPhoto,
  oatmealPhoto,
  orangeJuicePhoto,
  overnightOatsPhoto,
  pastaRoastedVegetablesPhoto,
  saladLeavesPhoto,
  salmonRiceBowlPhoto,
  sampleCapturePhoto,
  scrambledEggsPhoto,
  sparklingWaterPhoto,
  tofuStirFryPhoto,
  vegetableOmelettePhoto,
  vegetableTraybakePhoto,
  yoghurtParfaitPhoto,
};
