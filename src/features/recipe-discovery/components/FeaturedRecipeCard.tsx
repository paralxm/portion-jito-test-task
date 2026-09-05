import { Clock } from '@phosphor-icons/react';

import { MediaFrame } from '../../../design-system/components/MediaFrame/MediaFrame';
import { Icon } from '../../../design-system/icons/Icon';
import { Badge } from '../../../design-system/primitives/Badge/Badge';
import { Text } from '../../../design-system/primitives/Text/Text';
import { formatQuantity, NBSP } from '../../../design-system/nutrition/nutrition';
import type { Recipe } from '../domain/matching';
import { dietaryLabels } from './RecipeList';
import styles from './FeaturedRecipeCard.module.css';

export interface FeaturedRecipeCardProps {
  recipe: Recipe;
  /** The label over the photograph: "Featured recipe" — never "Recipe of the day" without daily selection logic. */
  label?: string;
  onOpen: (id: string) => void;
  className?: string;
}

/**
 * The discovery page's photographic lead (ledger §13, after H-REF 2): one existing
 * catalogue recipe with its 16:9 photograph, the "Featured recipe" label on the image,
 * then the facts the record supports — time, calories and protein on the per-serving
 * basis, declared dietary tags — and the title as the card's single control, whose hit
 * area covers the whole card. Opens that recipe's own detail screen by its stable id.
 */
export function FeaturedRecipeCard({ recipe, label = 'Featured recipe', onOpen, className }: FeaturedRecipeCardProps) {
  const hasTime = recipe.preparationMinutes !== null && recipe.preparationMinutes !== undefined;
  const dietary = dietaryLabels(recipe.dietary);
  return (
    <article className={[styles.card, className].filter(Boolean).join(' ')} aria-label={`${label}: ${recipe.title}`}>
      <div className={styles.media}>
        <MediaFrame aspect="16:9" imageUrl={recipe.imageUrl} imageAlt="" eager />
        <span className={styles.label}>
          <Text variant="caption-strong" color="primary">
            {label}
          </Text>
        </span>
      </div>
      <div className={styles.body}>
        <p className={styles.facts}>
          {hasTime ? (
            <span className={styles.time}>
              <Icon icon={Clock} size="compact" />
              <Text variant="supporting" color="secondary" numeric>
                {recipe.preparationMinutes}
                {NBSP}min
              </Text>
            </span>
          ) : null}
          {recipe.energyKcal === null ? (
            <Text variant="supporting" color="secondary">
              Calories not available
            </Text>
          ) : (
            <Text variant="supporting" color="secondary" numeric>
              {formatQuantity(recipe.energyKcal, 'kcal')}
              {NBSP}kcal
            </Text>
          )}
          {recipe.proteinG === null ? (
            <Text variant="supporting" color="secondary">
              Protein not available
            </Text>
          ) : (
            <Text variant="supporting" color="secondary" numeric>
              {formatQuantity(recipe.proteinG, 'g')}
              {NBSP}g protein
            </Text>
          )}
          <Text variant="supporting" color="secondary">
            per serving ({recipe.servingGrams}
            {NBSP}g)
          </Text>
        </p>
        <h2 className={styles.titleRow}>
          <button type="button" className={styles.titleButton} onClick={() => onOpen(recipe.id)}>
            <Text variant="section-title" color="primary" wrap>
              {recipe.title}
            </Text>
          </button>
        </h2>
        {dietary.length > 0 ? (
          <div className={styles.tags}>
            {dietary.map((tag) => (
              <Badge key={tag} kind="label">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
