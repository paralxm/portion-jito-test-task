import { useId, useState, type ReactNode } from 'react';
import { Clock } from '@phosphor-icons/react';

import { EmptyState } from '../../../design-system/components/EmptyState/EmptyState';
import { LoadingState } from '../../../design-system/components/LoadingState/LoadingState';
import { MatchCriteria } from '../../../design-system/components/MatchCriteria/MatchCriteria';
import { Icon } from '../../../design-system/icons/Icon';
import { NBSP } from '../../../design-system/nutrition/nutrition';
import { Badge } from '../../../design-system/primitives/Badge/Badge';
import { Button } from '../../../design-system/primitives/Button/Button';
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
  /** Back restores the exact originating list, query, criteria and scroll. */
  onBack: () => void;
  /** Retry reloads the same recipe. */
  onRetry: () => void;
  /** The bottom bar, retained with the actual originating destination selected. */
  navigation: ReactNode;
}

function named(list: Recipe['vitamins']): NamedNutrient[] | undefined {
  return list?.map((n) => ({ id: n.id, name: n.name, value: n.valueMg, unit: 'mg' as const }));
}

/**
 * S08 — Recipe details: S08-2 Loading → S08-1 Loaded or S08-3 Unavailable. A loaded
 * recipe without a photo (S08-4) is still ordinary loaded content. Finding and
 * evaluating a recipe completes the task; nothing has to be saved or cooked.
 */
export function RecipeDetailsScreen({ state, criteria, onBack, onRetry, navigation }: RecipeDetailsScreenProps) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const header = <AppHeader variant="focused" title="Recipe" onBack={onBack} backLabel="Back to results" />;

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
                Back to results
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
      <div className={styles.hero}>
        {recipe.imageUrl ? (
          <img className={styles.image} src={recipe.imageUrl} alt="" />
        ) : (
          <div className={styles.noPhoto}>
            <Text variant="supporting" color="secondary">
              No photo
            </Text>
          </div>
        )}
      </div>

      <div className={styles.identity}>
        <Text as="h2" variant="detail-heading" color="primary" wrap>
          {recipe.title}
        </Text>
        <div className={styles.meta}>
          <span className={styles.time}>
            <Icon icon={Clock} size="compact" />
            {recipe.preparationMinutes === null ? (
              <Text variant="supporting" color="secondary">
                Preparation time not available
              </Text>
            ) : (
              <Text variant="supporting" color="secondary" numeric>
                {recipe.preparationMinutes}
                {NBSP}min preparation
              </Text>
            )}
          </span>
          {dietary.map((label) => (
            <Badge key={label}>{label}</Badge>
          ))}
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

      <section className={styles.section} aria-labelledby={`${id}-ingredients`}>
        <Text as="h3" id={`${id}-ingredients`} variant="section-title" color="primary">
          Ingredients
        </Text>
        <ul className={styles.ingredients}>
          {recipe.ingredients.map((item, index) => (
            <li key={index}>
              <Text variant="body" color="primary" wrap>
                {item}
              </Text>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby={`${id}-method`}>
        <Text as="h3" id={`${id}-method`} variant="section-title" color="primary">
          Method
        </Text>
        <ol className={styles.steps}>
          {recipe.instructions.map((instruction, index) => (
            <li key={index} className={styles.step}>
              <Text variant="action" color="primary" numeric className={styles.stepNumber} aria-hidden="true">
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
