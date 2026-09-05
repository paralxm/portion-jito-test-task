import { useId, useState, type ReactNode } from 'react';
import { Clock } from '@phosphor-icons/react';

import { EmptyState } from '../../../design-system/components/EmptyState/EmptyState';
import { LoadingState } from '../../../design-system/components/LoadingState/LoadingState';
import { MatchCriteria } from '../../../design-system/components/MatchCriteria/MatchCriteria';
import { MediaFrame } from '../../../design-system/components/MediaFrame/MediaFrame';
import { Icon } from '../../../design-system/icons/Icon';
import { NBSP } from '../../../design-system/nutrition/nutrition';
import { Badge } from '../../../design-system/primitives/Badge/Badge';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Surface } from '../../../design-system/primitives/Surface/Surface';
import { Text } from '../../../design-system/primitives/Text/Text';
import { AppHeader } from '../../../design-system/patterns/AppHeader/AppHeader';
import { NutritionSummary, type NamedNutrient } from '../../../design-system/patterns/NutritionSummary/NutritionSummary';
import { RootScreenLayout } from '../../../design-system/templates/RootScreenLayout/RootScreenLayout';
import { dietaryLabels } from '../components/RecipeList';
import { matchEvidence, type Recipe, type RecipeCriteria } from '../domain/matching';
import styles from './RecipeDetailsScreen.module.css';

export type RecipeDetailsState = { status: 'loading' } | { status: 'loaded'; recipe: Recipe } | { status: 'unavailable' };

export interface RecipeDetailsScreenProps {
  state: RecipeDetailsState;
  /** Criteria from the originating list; details compare each active one with its known value. */
  criteria: RecipeCriteria;
  /** Back restores the exact originating list, query, criteria and scroll (or Home). */
  onBack: () => void;
  backLabel?: string;
  /** Retry reloads the same recipe. */
  onRetry: () => void;
  /** `Add` beside the title opens the Add-to-meal sheet; nothing is written before the sheet confirms (ledger D-23). */
  onAdd: (recipe: Recipe) => void;
  /** The bottom bar, retained with the actual originating destination selected. */
  navigation: ReactNode;
}

function named(list: Recipe['vitamins']): NamedNutrient[] | undefined {
  return list?.map((n) => ({ id: n.id, name: n.name, value: n.valueMg, unit: 'mg' as const }));
}

/**
 * S08 — Recipe details: S08-2 Loading → S08-1 Loaded or S08-3 Unavailable. Order (ledger
 * D-29): hero → time and dietary tags → title with `Add` → filter evidence → nutrition on
 * one surface → ingredients → numbered method. A loaded recipe without a photo (S08-4)
 * is still ordinary loaded content. Finding and evaluating a recipe completes the task;
 * adding it to a meal is optional.
 */
export function RecipeDetailsScreen({ state, criteria, onBack, backLabel = 'Back to results', onRetry, onAdd, navigation }: RecipeDetailsScreenProps) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const header = <AppHeader variant="focused" title="Recipe" onBack={onBack} backLabel={backLabel} />;

  if (state.status === 'loading') {
    return (
      <RootScreenLayout header={header} navigation={navigation}>
        <LoadingState label="Loading recipe" />
      </RootScreenLayout>
    );
  }

  if (state.status === 'unavailable') {
    return (
      <RootScreenLayout header={header} navigation={navigation}>
        <EmptyState
          kind="failure"
          title="This recipe could not be loaded"
          actions={
            <>
              <Button variant="primary" onClick={onRetry}>
                Try again
              </Button>
              <Button variant="text" onClick={onBack}>
                {backLabel}
              </Button>
            </>
          }
        >
          The recipe service did not respond. Your results and filters are unchanged.
        </EmptyState>
      </RootScreenLayout>
    );
  }

  const { recipe } = state;
  const evidence = matchEvidence(recipe, criteria);
  const dietary = dietaryLabels(recipe.dietary);

  return (
    <RootScreenLayout header={header} navigation={navigation}>
      <MediaFrame aspect="16:9" imageUrl={recipe.imageUrl} imageAlt="" eager className={styles.hero} />

      <div className={styles.identity}>
        <div className={styles.meta}>
          <Badge kind="label" className={styles.time}>
            <Icon icon={Clock} size="compact" />
            {recipe.preparationMinutes === null ? (
              'Preparation time not available'
            ) : (
              <span className="portion-numeric">
                {recipe.preparationMinutes}
                {NBSP}min preparation
              </span>
            )}
          </Badge>
          {dietary.map((label) => (
            <Badge key={label}>{label}</Badge>
          ))}
        </div>
        <div className={styles.titleRow}>
          <Text as="h2" variant="detail-heading" color="primary" wrap className={styles.title}>
            {recipe.title}
          </Text>
          <Button variant="primary" onClick={() => onAdd(recipe)} aria-haspopup="dialog" aria-label={`Add ${recipe.title} to a meal`} className={styles.add}>
            Add
          </Button>
        </div>
      </div>

      {evidence.length > 0 ? (
        <section className={styles.section} aria-labelledby={`${id}-match`}>
          <Text as="h3" id={`${id}-match`} variant="section-title" color="primary">
            Your filters
          </Text>
          <MatchCriteria criteria={evidence} presentation="detailed" />
        </section>
      ) : null}

      <Surface tone="surface" border="none" radius="grouped" padding={16}>
        <NutritionSummary
          energy={recipe.energyKcal}
          protein={recipe.proteinG}
          carbohydrates={recipe.carbohydratesG}
          fat={recipe.fatG}
          basis={`Per serving (${recipe.servingGrams} g)`}
          additional={{ fibre: recipe.fibreG, vitamins: named(recipe.vitamins), minerals: named(recipe.minerals) }}
          expanded={expanded}
          onToggleExpanded={setExpanded}
        />
      </Surface>

      <section className={styles.section} aria-labelledby={`${id}-ingredients`}>
        <div className={styles.sectionHeader}>
          <Text as="h3" id={`${id}-ingredients`} variant="section-title" color="primary">
            Ingredients
          </Text>
          <Text as="p" variant="supporting" color="secondary" numeric>
            {recipe.ingredients.length} {recipe.ingredients.length === 1 ? 'item' : 'items'}
          </Text>
        </div>
        <ul className={styles.ingredients}>
          {recipe.ingredients.map((item, index) => (
            <li key={index} className={styles.ingredient}>
              <Text variant="body" color="primary" wrap>
                {item}
              </Text>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby={`${id}-method`}>
        <div className={styles.sectionHeader}>
          <Text as="h3" id={`${id}-method`} variant="section-title" color="primary">
            Method
          </Text>
          <Text as="p" variant="supporting" color="secondary" numeric>
            {recipe.instructions.length} {recipe.instructions.length === 1 ? 'step' : 'steps'}
          </Text>
        </div>
        <ol className={styles.steps}>
          {recipe.instructions.map((instruction, index) => (
            <li key={index} className={styles.step}>
              <Text variant="action-sm" color="primary" numeric className={styles.stepNumber} aria-hidden="true">
                {index + 1}
              </Text>
              <Text variant="body" color="primary" wrap>
                {instruction}
              </Text>
            </li>
          ))}
        </ol>
      </section>
    </RootScreenLayout>
  );
}
