import { useEffect, useState, type ReactNode } from 'react';

import { AmountField } from '../../../design-system/components/AmountField/AmountField';
import { InlineMessage } from '../../../design-system/components/InlineMessage/InlineMessage';
import { AppHeader } from '../../../design-system/patterns/AppHeader/AppHeader';
import { NutritionSummary } from '../../../design-system/patterns/NutritionSummary/NutritionSummary';
import { UnitSheet } from '../../../design-system/patterns/UnitSheet/UnitSheet';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Stack } from '../../../design-system/primitives/layout/Stack';
import { Surface } from '../../../design-system/primitives/Surface/Surface';
import { Text } from '../../../design-system/primitives/Text/Text';
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

export interface HomeScreenProps {
  /** The committed calculation, or `null` for a new session. */
  current: CurrentCalculation | null;
  /** Valid portion edits recalculate locally and in place; the caller stores the result. */
  onPortionChange: (portion: Portion) => void;
  /** Opens the shared method chooser to identify a different food. */
  onChangeFood: () => void;
  /** The body Add food CTA — the same action and O01 instance as the trailing plus. */
  onAddFood: () => void;
  /** Opens the existing Recipes browse destination (S03-1), unfiltered by the current food. */
  onFindRecipes: () => void;
  /** The four-control NavigationBar, owned by the app shell. */
  navigation: ReactNode;
}

/**
 * S01 — Home. A dashboard for both user stories: a food-calorie module (empty, or the
 * working calculation once a food is confirmed) and a recipe-discovery module, always
 * present. Editing a valid amount updates the result without a submit step; an invalid
 * draft shows a stale result instead of presenting the old number as current.
 */
export function HomeScreen({ current, onPortionChange, onChangeFood, onAddFood, onFindRecipes, navigation }: HomeScreenProps) {
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

  const header = <AppHeader title="Home" showWordmark />;
  const orientation = (
    <Text as="p" variant="body" color="secondary">
      Calculate a food&rsquo;s calories or find a recipe that fits your criteria.
    </Text>
  );

  const recipeModule = (
    <Surface as="section" aria-labelledby="home-recipes-heading" radius="card" padding={16}>
      <Stack gap={12}>
        <Text as="h2" id="home-recipes-heading" variant="section-title" color="primary">
          Find a recipe
        </Text>
        <Text as="p" variant="body" color="secondary">
          Browse recipes, or narrow them by calories, protein, preparation time and dietary preference.
        </Text>
        <Button variant="secondary" block onClick={onFindRecipes}>
          Find recipes
        </Button>
      </Stack>
    </Surface>
  );

  if (!current) {
    return (
      <RootScreenLayout header={header} navigation={navigation}>
        {orientation}
        <Surface as="section" aria-labelledby="home-calculate-heading" radius="card" padding={16}>
          <Stack gap={12}>
            <Text as="h2" id="home-calculate-heading" variant="section-title" color="primary">
              Calculate calories
            </Text>
            <Text as="p" variant="body" color="secondary">
              Add a product or dish to see the calories and nutrition for the portion you choose.
            </Text>
            <Button variant="primary" block onClick={onAddFood}>
              Add food
            </Button>
          </Stack>
        </Surface>
        {recipeModule}
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
      {orientation}
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

      {recipeModule}

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
