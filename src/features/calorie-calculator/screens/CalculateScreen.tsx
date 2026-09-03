import { useEffect, useState, type ReactNode } from 'react';

import { AmountField } from '../../../design-system/components/AmountField/AmountField';
import { EmptyState } from '../../../design-system/components/EmptyState/EmptyState';
import { InlineMessage } from '../../../design-system/components/InlineMessage/InlineMessage';
import { AppHeader } from '../../../design-system/patterns/AppHeader/AppHeader';
import { NutritionSummary } from '../../../design-system/patterns/NutritionSummary/NutritionSummary';
import { UnitSheet } from '../../../design-system/patterns/UnitSheet/UnitSheet';
import { RootScreenLayout } from '../../../design-system/templates/RootScreenLayout/RootScreenLayout';
import { FoodIdentityHeader } from '../components/FoodIdentityHeader';
import {
  convertQuantity,
  describePortionBasis,
  findUnit,
  formatQuantityDraft,
  parseAmount,
  scaleNutrition,
  type CurrentCalculation,
  type Portion,
} from '../domain/calculation';

export interface CalculateScreenProps {
  /** The committed calculation, or `null` for a new session. */
  current: CurrentCalculation | null;
  /** Valid portion edits recalculate locally and in place; the caller stores the result. */
  onPortionChange: (portion: Portion) => void;
  /** Opens the shared method chooser to identify a different food. */
  onChangeFood: () => void;
  /** The four-control NavigationBar, owned by the app shell. */
  navigation: ReactNode;
}

/**
 * S01 — Calculate. Launches empty; after a reviewed food is confirmed it becomes the
 * working calculation: identity, portion, result and available nutrition stay connected
 * and correctable. Editing a valid amount updates the result without a submit step;
 * an invalid draft shows a stale result instead of the previous number.
 */
export function CalculateScreen({ current, onPortionChange, onChangeFood, navigation }: CalculateScreenProps) {
  const [quantity, setQuantity] = useState('');
  const [unitId, setUnitId] = useState(current?.portion.unitId ?? '');
  const [touched, setTouched] = useState(false);
  const [unitSheetOpen, setUnitSheetOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Resync the draft when a different calculation is committed (not on every edit).
  const committedKey = current ? `${current.candidate.id}:${current.committedAt}` : 'none';
  useEffect(() => {
    if (current) {
      setQuantity(formatQuantityDraft(current.portion.quantity));
      setUnitId(current.portion.unitId);
    }
    setTouched(false);
    setExpanded(false);
  }, [committedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const header = <AppHeader title="Calculate" showWordmark />;

  if (!current) {
    return (
      <RootScreenLayout header={header} navigation={navigation}>
        <EmptyState title="Nothing calculated yet" kind="empty">
          Add a food or dish to see the calories and nutrition for the amount you choose. Use Add food below to search, scan a barcode, take a photo or enter values yourself.
        </EmptyState>
      </RootScreenLayout>
    );
  }

  const { candidate } = current;
  const parsed = parseAmount(quantity);
  const draftPortion: Portion | null = parsed.ok ? { quantity: parsed.value, unitId } : null;
  const preview = draftPortion ? scaleNutrition(candidate, draftPortion) : null;
  const stale = !draftPortion || !preview;
  const unit = findUnit(candidate, unitId);

  const amountError =
    touched && !parsed.ok
      ? parsed.reason === 'empty'
        ? 'Enter an amount to see the result'
        : parsed.reason === 'not-positive'
          ? 'Enter an amount greater than zero'
          : 'Enter a number, for example 250 or 0.5'
      : undefined;

  const handleQuantity = (value: string) => {
    setQuantity(value);
    const next = parseAmount(value);
    if (next.ok) onPortionChange({ quantity: next.value, unitId });
  };

  // Switching unit keeps the portion: the quantity is re-expressed in the new unit when
  // the draft is valid; an invalid draft just changes the unit and stays stale.
  const handleUnit = (nextUnitId: string) => {
    setUnitSheetOpen(false);
    if (nextUnitId === unitId) return;
    setUnitId(nextUnitId);
    if (!parsed.ok) return;
    const converted = convertQuantity(candidate, parsed.value, unitId, nextUnitId);
    if (converted === null || !(converted > 0)) return;
    setQuantity(formatQuantityDraft(converted));
    onPortionChange({ quantity: converted, unitId: nextUnitId });
  };

  const partial = [current.result.proteinG, current.result.carbohydratesG, current.result.fatG].some((v) => v === null);

  return (
    <RootScreenLayout header={header} navigation={navigation}>
      <FoodIdentityHeader candidate={candidate} onChangeFood={onChangeFood} headingId="current-food-name" />

      <AmountField
        label="Amount"
        value={quantity}
        onChange={handleQuantity}
        onBlur={() => setTouched(true)}
        unit={unit?.label ?? unitId}
        onRequestUnitChange={candidate.units.length > 1 ? () => setUnitSheetOpen(true) : undefined}
        error={amountError}
      />

      <NutritionSummary
        energy={stale ? null : (preview?.energyKcal ?? null)}
        protein={stale ? null : (preview?.proteinG ?? null)}
        carbohydrates={stale ? null : (preview?.carbohydratesG ?? null)}
        fat={stale ? null : (preview?.fatG ?? null)}
        basis={draftPortion ? describePortionBasis(candidate, draftPortion) : ''}
        status={stale ? 'stale' : 'known'}
        additional={
          preview && (preview.fibreG !== undefined || preview.vitamins || preview.minerals)
            ? {
                fibre: preview.fibreG,
                vitamins: preview.vitamins?.map((v) => ({ id: v.id, name: v.name, value: v.valueMg, unit: 'mg' as const })),
                minerals: preview.minerals?.map((m) => ({ id: m.id, name: m.name, value: m.valueMg, unit: 'mg' as const })),
              }
            : undefined
        }
        expanded={expanded}
        onToggleExpanded={setExpanded}
      />

      {partial ? (
        <InlineMessage tone="info" announce="none">
          Some nutrition values are not available for this food. They are shown as not available, not as zero.
        </InlineMessage>
      ) : null}

      <UnitSheet
        open={unitSheetOpen}
        options={candidate.units.map((u) => ({ id: u.id, label: u.label, description: u.description }))}
        value={unitId}
        onConfirm={handleUnit}
        onCancel={() => setUnitSheetOpen(false)}
      />
    </RootScreenLayout>
  );
}
