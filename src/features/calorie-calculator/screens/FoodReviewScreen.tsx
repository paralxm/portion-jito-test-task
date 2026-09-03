import { useMemo, useState } from 'react';
import { PencilSimple } from '@phosphor-icons/react';

import { AmountField } from '../../../design-system/components/AmountField/AmountField';
import { InlineMessage } from '../../../design-system/components/InlineMessage/InlineMessage';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Stack } from '../../../design-system/primitives/layout/Stack';
import { Text } from '../../../design-system/primitives/Text/Text';
import { AppHeader } from '../../../design-system/patterns/AppHeader/AppHeader';
import { NutritionSummary } from '../../../design-system/patterns/NutritionSummary/NutritionSummary';
import { UnitSheet } from '../../../design-system/patterns/UnitSheet/UnitSheet';
import { FocusedFlowLayout } from '../../../design-system/templates/FocusedFlowLayout/FocusedFlowLayout';
import {
  canCalculateEnergy,
  convertQuantity,
  describePortionBasis,
  describeReferenceBasis,
  findUnit,
  formatQuantityDraft,
  parseAmount,
  scaleNutrition,
  type FoodCandidate,
  type Portion,
} from '../domain/calculation';
import styles from './FoodReviewScreen.module.css';

export interface FoodReviewScreenProps {
  candidate: FoodCandidate;
  /** Name of the current calculation this review would replace, if one exists. */
  replaces?: string | null;
  /** Portion to start from; defaults to the reference basis. */
  initialPortion?: Portion;
  /** Confirms once and opens Calculate with the reviewed calculation. */
  onConfirm: (portion: Portion) => void;
  /** Returns to the actual preceding step with its input intact. */
  onBack: () => void;
  /** Correction route: search or manual entry, decided by the caller from the source. */
  onChangeMatch: () => void;
}

const sourceExplanation: Record<FoodCandidate['source'], string | null> = {
  search: null,
  barcode: 'Matched from the barcode. If this is not the right product, change it before confirming.',
  photo: 'Suggested from your photo. Check the food and set the amount you will eat — the photo does not measure it.',
  manual: 'Entered by you. The amount below is the portion you are calculating, not the reference basis.',
};

/**
 * S07 — Food review and portion. Common to every entry method; only the source
 * explanation differs. Confirming commits the candidate once; Back and Change keep it a
 * draft, and the existing calculation is untouched until confirmation.
 */
export function FoodReviewScreen({ candidate, replaces, initialPortion, onConfirm, onBack, onChangeMatch }: FoodReviewScreenProps) {
  const defaultUnit = candidate.reference.unitId;
  const [quantity, setQuantity] = useState(() => formatQuantityDraft(initialPortion?.quantity ?? candidate.reference.quantity));
  const [unitId, setUnitId] = useState(initialPortion?.unitId ?? defaultUnit);
  const [touched, setTouched] = useState(false);
  const [unitSheetOpen, setUnitSheetOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const parsed = parseAmount(quantity);
  const portion: Portion | null = parsed.ok ? { quantity: parsed.value, unitId } : null;
  const result = useMemo(() => (portion ? scaleNutrition(candidate, portion) : null), [candidate, portion]);
  const energyAvailable = canCalculateEnergy(candidate);
  const partial = [candidate.nutrition.proteinG, candidate.nutrition.carbohydratesG, candidate.nutrition.fatG].some((v) => v === null);

  const amountError =
    touched && !parsed.ok
      ? parsed.reason === 'empty'
        ? 'Enter the amount you want to calculate'
        : parsed.reason === 'not-positive'
          ? 'Enter an amount greater than zero'
          : 'Enter a number, for example 250 or 0.5'
      : undefined;

  const explanation = sourceExplanation[candidate.source];
  const unit = findUnit(candidate, unitId);

  const confirm = () => {
    setTouched(true);
    if (portion && result && result.energyKcal !== null) onConfirm(portion);
  };

  return (
    <FocusedFlowLayout
      header={<AppHeader variant="focused" title="Review food" onBack={onBack} />}
      footer={
        <Stack gap={8}>
          <Button variant="primary" block onClick={confirm} disabled={!energyAvailable}>
            {replaces ? 'Replace and calculate' : 'Confirm and calculate'}
          </Button>
          <Button variant="text" block onClick={onBack}>
            Cancel
          </Button>
        </Stack>
      }
    >
      <section className={styles.identity} aria-labelledby="review-food-name">
        <Stack gap={4}>
          <Text as="h2" id="review-food-name" variant="detail-heading" color="primary" wrap>
            {candidate.name}
          </Text>
          {candidate.detail ? (
            <Text as="p" variant="supporting" color="secondary" wrap>
              {candidate.detail}
            </Text>
          ) : null}
          <Text as="p" variant="supporting" color="secondary">
            Nutrition basis: {describeReferenceBasis(candidate).toLowerCase()}
          </Text>
        </Stack>
        <Button variant="secondary" icon={PencilSimple} onClick={onChangeMatch}>
          Change food
        </Button>
      </section>

      {explanation ? (
        <InlineMessage tone="info" announce="none">
          {explanation}
        </InlineMessage>
      ) : null}

      {!energyAvailable ? (
        <InlineMessage
          tone="error"
          title="Calories are not available for this food"
          announce="none"
          actions={
            <Button variant="secondary" size="compact" onClick={onChangeMatch}>
              Choose a different food
            </Button>
          }
        >
          Nutrition information is unavailable for this ingredient, so a portion cannot be calculated. Choose another match or enter the values manually.
        </InlineMessage>
      ) : null}

      <AmountField
        label="Amount to calculate"
        value={quantity}
        onChange={(v) => setQuantity(v)}
        onBlur={() => setTouched(true)}
        unit={unit?.label ?? unitId}
        onRequestUnitChange={candidate.units.length > 1 ? () => setUnitSheetOpen(true) : undefined}
        error={amountError}
        helper={!amountError ? 'The result updates as you type a valid amount.' : undefined}
        disabled={!energyAvailable}
      />

      {energyAvailable ? (
        <NutritionSummary
          energy={result?.energyKcal ?? null}
          protein={result?.proteinG ?? null}
          carbohydrates={result?.carbohydratesG ?? null}
          fat={result?.fatG ?? null}
          basis={portion ? describePortionBasis(candidate, portion) : ''}
          status={portion && result ? 'known' : 'stale'}
          additional={result?.fibreG !== undefined ? { fibre: result?.fibreG ?? null } : undefined}
          expanded={expanded}
          onToggleExpanded={setExpanded}
        />
      ) : null}

      {partial && energyAvailable ? (
        <InlineMessage tone="info" announce="none">
          Some nutrition values are not available for this food. They are shown as not available, not as zero.
        </InlineMessage>
      ) : null}

      {replaces ? (
        <InlineMessage tone="warning" title="This replaces your current calculation" announce="none">
          Confirming replaces “{replaces}” with this food. Foods are not added together.
        </InlineMessage>
      ) : null}

      <UnitSheet
        open={unitSheetOpen}
        options={candidate.units.map((u) => ({ id: u.id, label: u.label, description: u.description }))}
        value={unitId}
        onConfirm={(next) => {
          setUnitSheetOpen(false);
          if (next === unitId) return;
          // Keep the portion: re-express a valid draft in the new unit.
          if (parsed.ok) {
            const converted = convertQuantity(candidate, parsed.value, unitId, next);
            if (converted !== null && converted > 0) setQuantity(formatQuantityDraft(converted));
          }
          setUnitId(next);
        }}
        onCancel={() => setUnitSheetOpen(false)}
      />
    </FocusedFlowLayout>
  );
}
