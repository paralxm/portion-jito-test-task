import { useId, useState, type ReactNode } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';

import { FilterChip } from '../../../design-system/components/Chip/Chip';
import { EmptyState } from '../../../design-system/components/EmptyState/EmptyState';
import { LoadingState } from '../../../design-system/components/LoadingState/LoadingState';
import { Icon } from '../../../design-system/icons/Icon';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Text } from '../../../design-system/primitives/Text/Text';
import { VisuallyHidden } from '../../../design-system/primitives/VisuallyHidden/VisuallyHidden';
import { AppHeader } from '../../../design-system/patterns/AppHeader/AppHeader';
import { RecipeCard } from '../../../design-system/patterns/RecipeCard/RecipeCard';
import { RootScreenLayout } from '../../../design-system/templates/RootScreenLayout/RootScreenLayout';
import { CriteriaToolbar } from '../components/CriteriaToolbar';
import { FilterAction } from '../components/FilterAction';
import { dietaryLabels } from '../components/RecipeList';
import { discoveryCount, discoveryGroups, HIGH_PROTEIN_MIN_G, QUICK_MAX_MINUTES, type DiscoveryGroup } from '../domain/discovery';
import { activeCriteriaCount, dietaryOf, DIETARY_OPTIONS, matchEvidence, type CriterionKey, type DietaryPreference, type Recipe, type RecipeCriteria } from '../domain/matching';
import styles from './RecipesScreen.module.css';

export type RecipesStatus = 'loading' | 'ready' | 'failure';

export interface RecipesScreenProps {
  /** The whole catalogue; the screen derives its groups and count from it and the criteria. */
  recipes: readonly Recipe[];
  criteria: RecipeCriteria;
  status: RecipesStatus;
  onApplyCriteria: (criteria: RecipeCriteria) => void;
  onRemoveCriterion: (key: CriterionKey) => void;
  onClearCriteria: () => void;
  /** A quick chip toggles one dietary constraint and applies at once. */
  onToggleDietary: (id: DietaryPreference) => void;
  onRetry: () => void;
  onOpenRecipe: (id: string) => void;
  /** Opens shared Search in the Recipes scope with a deliberate criteria snapshot (the active criteria, plus a group's rule). */
  onOpenSearch: (snapshot: RecipeCriteria) => void;
  navigation: ReactNode;
}

/** The criteria snapshot a group's "View all" hands to Search: the active criteria plus the group's own rule. */
export function groupSnapshot(group: DiscoveryGroup['id'], criteria: RecipeCriteria): RecipeCriteria {
  if (group === 'quick') return { ...criteria, preparationMax: Math.min(criteria.preparationMax ?? QUICK_MAX_MINUTES, QUICK_MAX_MINUTES) };
  if (group === 'protein') return { ...criteria, proteinMin: Math.max(criteria.proteinMin ?? HIGH_PROTEIN_MIN_G, HIGH_PROTEIN_MIN_G) };
  return { ...criteria };
}

/**
 * S03 — Recipes as curated discovery (ledger §12 B1, after R2): the real count, a search
 * entry that opens Search's Recipes scope, the filter action for the numeric criteria,
 * quick dietary chips that toggle constraints at once (AND), then a small number of
 * groups derived from each recipe's own record — Featured (an editorial flag), Ready in
 * under 30 minutes, 30 g protein or more — as photographic rails. The complete catalogue
 * lives in Search / Recipes; every "View all" hands it a deliberate criteria snapshot.
 */
export function RecipesScreen({ recipes, criteria, status, onApplyCriteria, onRemoveCriterion, onClearCriteria, onToggleDietary, onRetry, onOpenRecipe, onOpenSearch, navigation }: RecipesScreenProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const id = useId();
  const active = activeCriteriaCount(criteria);
  const dietary = dietaryOf(criteria);
  const groups = status === 'ready' ? discoveryGroups(recipes, criteria) : [];
  const count = status === 'ready' ? discoveryCount(recipes, criteria) : 0;
  const countText = status !== 'ready' ? '' : active > 0 ? `${count} ${count === 1 ? 'recipe matches' : 'recipes match'} your filters` : `${count} ${count === 1 ? 'recipe' : 'recipes'}`;

  let content: ReactNode;
  if (status === 'loading') {
    content = <LoadingState label="Loading recipes" />;
  } else if (status === 'failure') {
    content = (
      <EmptyState
        kind="failure"
        title="Recipes could not be loaded"
        actions={
          <Button variant="primary" onClick={onRetry}>
            Try again
          </Button>
        }
      >
        The recipe service did not respond. Your filters are kept.
      </EmptyState>
    );
  } else if (count === 0 && active > 0) {
    content = (
      <EmptyState
        kind="no-match"
        title="No recipes match your filters"
        actions={
          <>
            <Button variant="primary" onClick={() => setFiltersOpen(true)}>
              Change filters
            </Button>
            <Button variant="text" onClick={onClearCriteria}>
              Clear all filters
            </Button>
          </>
        }
      >
        Every recipe is compared with all of your filters. Loosen one, or clear them to see every recipe.
      </EmptyState>
    );
  } else if (count === 0) {
    content = <EmptyState title="No recipes available">There is nothing to show yet.</EmptyState>;
  } else {
    content = (
      <>
        {groups.map((group) => (
          <section key={group.id} className={styles.group} aria-labelledby={`${id}-${group.id}`}>
            <div className={styles.groupHeader}>
              <div className={styles.groupTitle}>
                <Text as="h2" id={`${id}-${group.id}`} variant="section-title" color="primary">
                  {group.title}
                </Text>
                <Text as="p" variant="supporting" color="secondary" wrap>
                  {group.description}
                </Text>
              </div>
              <Button variant="text" size="small" onClick={() => onOpenSearch(groupSnapshot(group.id, criteria))} aria-label={`View all ${group.recipes.length} in ${group.title}`}>
                View all {group.recipes.length}
              </Button>
            </div>
            <ul className={styles.rail} aria-labelledby={`${id}-${group.id}`}>
              {group.recipes.map((recipe) => (
                <li key={recipe.id} className={styles.tile}>
                  <RecipeCard
                    presentation="tile"
                    title={recipe.title}
                    imageUrl={recipe.imageUrl}
                    calories={recipe.energyKcal}
                    protein={recipe.proteinG}
                    servingBasis={`per serving (${recipe.servingGrams} g)`}
                    preparationMinutes={recipe.preparationMinutes}
                    dietary={dietaryLabels(recipe.dietary)}
                    criteria={active > 0 ? matchEvidence(recipe, criteria) : undefined}
                    onOpen={() => onOpenRecipe(recipe.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
        <div className={styles.all}>
          <Button variant="secondary" block onClick={() => onOpenSearch({ ...criteria })}>
            {active > 0 ? `Browse all ${count} matching ${count === 1 ? 'recipe' : 'recipes'}` : `Browse all ${count} recipes`}
          </Button>
        </div>
      </>
    );
  }

  return (
    <RootScreenLayout header={<AppHeader variant="section" title="Recipes" />} navigation={navigation}>
      <div className={styles.searchRow}>
        <button type="button" className={styles.searchEntry} onClick={() => onOpenSearch({ ...criteria })}>
          <Icon icon={MagnifyingGlass} size="small-action" />
          <Text variant="body" color="secondary">
            Search recipes
          </Text>
        </button>
        <FilterAction count={active} expanded={filtersOpen} onClick={() => setFiltersOpen(true)} className={styles.filter} />
      </div>

      <div className={styles.quick} role="group" aria-labelledby={`${id}-dietary`}>
        <VisuallyHidden as="span" id={`${id}-dietary`}>
          Dietary
        </VisuallyHidden>
        <FilterChip selected={dietary.length === 0} onClick={() => (dietary.length > 0 ? onApplyCriteria({ ...criteria, dietary: [] }) : undefined)}>
          All
        </FilterChip>
        {DIETARY_OPTIONS.map((option) => (
          <FilterChip key={option.id} selected={dietary.includes(option.id)} onClick={() => onToggleDietary(option.id)}>
            {option.label}
          </FilterChip>
        ))}
      </div>

      <CriteriaToolbar criteria={criteria} hideDietary sheetOpen={filtersOpen} onCloseSheet={() => setFiltersOpen(false)} onApply={onApplyCriteria} onRemove={onRemoveCriterion} />

      <div className={styles.count}>
        <Text as="p" variant="supporting" color="secondary" numeric role="status" aria-label="Results summary">
          {status === 'loading' ? '' : status === 'failure' ? '' : count === 0 ? (active > 0 ? 'No recipes match your filters' : 'No recipes available') : countText}
        </Text>
      </div>

      {content}
    </RootScreenLayout>
  );
}
