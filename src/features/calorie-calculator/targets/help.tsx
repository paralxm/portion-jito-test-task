import type { ReactNode } from 'react';

import { Text } from '../../../design-system/primitives/Text/Text';
import { LOSS_DEFICIT_KCAL, LOSS_FLOOR_KCAL } from '../domain/energy-estimate';
import { formatKcal } from '../domain/daily-log';

export interface HelpTopic {
  title: string;
  body: ReactNode[];
  details?: ReactNode;
}

const P = ({ children }: { children: ReactNode }) => (
  <Text as="p" variant="body" color="secondary" wrap>
    {children}
  </Text>
);
const D = ({ children }: { children: ReactNode }) => (
  <Text as="p" variant="supporting" color="secondary" wrap>
    {children}
  </Text>
);

/** The longer methodology, shared by every step's disclosure (ledger §13.4; sources in docs/ux/targets-and-estimation.md). */
const CALCULATION_DETAILS = (
  <>
    <D>The estimate uses the adult Estimated Energy Requirement equations of the 2023 Dietary Reference Intakes for Energy: one linear equation per sex and activity category in age, height and weight.</D>
    <D>Maintain keeps that estimate. Lose weight subtracts {formatKcal(LOSS_DEFICIT_KCAL)} kcal a day, the lower end of the range clinical guidelines use, and is refused below {formatKcal(LOSS_FLOOR_KCAL)} kcal a day. Gain weight adds nothing, because no verified rule for a surplus is available.</D>
    <D>Suggested macros split the calories with the Balanced 20/50/30, Higher protein 30/45/25 or Lower carb 25/45/30 shares — all inside the adult acceptable ranges — at 4 kcal per gram of protein and carbohydrate and 9 per gram of fat.</D>
    <D>Sources and limits are listed in the product documentation (targets and estimation).</D>
  </>
);

export const HELP: Record<'about' | 'activity' | 'goal' | 'review' | 'editor', HelpTopic> = {
  about: {
    title: 'Why these details?',
    body: [<P key="1">The estimate uses your age, sex, height and weight to work out a typical daily energy need for people like you.</P>, <P key="2">It covers adults aged 19 and over. Nothing is saved until you save the result.</P>],
    details: CALCULATION_DETAILS,
  },
  activity: {
    title: 'Choosing an activity level',
    body: [<P key="1">Pick the level closest to a typical week. Each option is one of the four categories the estimate uses, so a rough fit is fine.</P>],
    details: CALCULATION_DETAILS,
  },
  goal: {
    title: 'What the goal changes',
    body: [
      <P key="1">Maintain uses the estimate as it is. Lose weight sets the target {formatKcal(LOSS_DEFICIT_KCAL)} kcal a day below it, never under {formatKcal(LOSS_FLOOR_KCAL)} kcal.</P>,
      <P key="2">Gain weight shows the maintenance estimate — no surplus is added — so you add what you want above it.</P>,
    ],
    details: CALCULATION_DETAILS,
  },
  review: {
    title: 'About this estimate',
    body: [
      <P key="1">It is an estimate for people like you, not a measurement or medical advice; your own need may be higher or lower.</P>,
      <P key="2">Adjust changes the number here and marks it as adjusted. Suggested macros are a split of your calories, not a personal prescription.</P>,
    ],
    details: CALCULATION_DETAILS,
  },
  editor: {
    title: 'How targets apply',
    body: [
      <P key="1">Targets apply from their start date until you change or remove them; earlier days keep what they had.</P>,
      <P key="2">Suggested macros follow your calories; Custom keeps the grams you enter, any of them blank.</P>,
    ],
    details: CALCULATION_DETAILS,
  },
};
