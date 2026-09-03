import type { ReactNode } from 'react';
import { Clock } from '@phosphor-icons/react';

import { MatchCriteria, type MatchCriterion } from '../../components/MatchCriteria/MatchCriteria';
import { MediaFrame } from '../../components/MediaFrame/MediaFrame';
import { Icon } from '../../icons/Icon';
import { Badge } from '../../primitives/Badge/Badge';
import { Text } from '../../primitives/Text/Text';
import { formatQuantity, MISSING_GLYPH, NOT_AVAILABLE, NBSP } from '../../nutrition/nutrition';
import { VisuallyHidden } from '../../primitives/VisuallyHidden/VisuallyHidden';
import styles from './RecipeCard.module.css';

export interface RecipeCardProps {
  /** Full recipe title (compact-title 18/24). Wraps; the card grows. */
  title: string;
  /** 4:3 image. Absent or failed images leave a quiet neutral region — the recipe is still valid. */
  imageUrl?: string;
  /** Alternative text; empty when the photo is purely decorative for the card. */
  imageAlt?: string;
  calories: number | null;
  protein: number | null;
  /** The per-serving basis the values belong to, e.g. "per serving (300 g)". */
  servingBasis: string;
  preparationMinutes?: number | null;
  dietary?: readonly string[];
  /** Active criteria only. With none, the card shows plain metadata and no match claim. */
  criteria?: readonly MatchCriterion[];
  onOpen: () => void;
  className?: string;
  children?: ReactNode;
}

/**
 * Scannable recipe card. The title is the single control; its hit area stretches over
 * the card so the whole surface opens details without nesting interactive elements.
 */
export function RecipeCard({ title, imageUrl, imageAlt = '', calories, protein, servingBasis, preparationMinutes, dietary, criteria, onOpen, className, children }: RecipeCardProps) {
  return (
    <article className={[styles.card, className].filter(Boolean).join(' ')}>
      <MediaFrame aspect="4:3" imageUrl={imageUrl} imageAlt={imageAlt} />
      <div className={styles.body}>
        <h3 className={styles.titleRow}>
          <button type="button" className={styles.titleButton} onClick={onOpen}>
            <Text variant="compact-title" color="primary" wrap>
              {title}
            </Text>
          </button>
        </h3>
        <p className={styles.values}>
          <Text variant="metric-inline" numeric color="primary">
            {calories === null ? (
              <>
                <span aria-hidden="true">{MISSING_GLYPH}</span>
                <VisuallyHidden>Calories {NOT_AVAILABLE}</VisuallyHidden>
              </>
            ) : (
              `${formatQuantity(calories, 'kcal')}${NBSP}kcal`
            )}
          </Text>
          <Text variant="supporting" color="secondary" aria-hidden="true">
            ·
          </Text>
          <Text variant="metric-inline" numeric color="primary">
            {protein === null ? (
              <>
                <span aria-hidden="true">{MISSING_GLYPH}</span>
                <VisuallyHidden>Protein {NOT_AVAILABLE}</VisuallyHidden>
              </>
            ) : (
              `${formatQuantity(protein, 'g')}${NBSP}g protein`
            )}
          </Text>
        </p>
        <Text as="p" variant="supporting" color="secondary" wrap>
          {servingBasis}
        </Text>
        {(preparationMinutes !== undefined && preparationMinutes !== null) || (dietary && dietary.length > 0) ? (
          <div className={styles.meta}>
            {preparationMinutes !== undefined && preparationMinutes !== null ? (
              <span className={styles.time}>
                <Icon icon={Clock} size="compact" />
                <Text variant="supporting" color="secondary" numeric>
                  {preparationMinutes}
                  {NBSP}min
                </Text>
              </span>
            ) : null}
            {dietary?.map((tag) => (
              <Badge key={tag} kind="label">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
        {criteria && criteria.length > 0 ? <MatchCriteria criteria={criteria} presentation="summary" /> : null}
        {children}
      </div>
    </article>
  );
}
