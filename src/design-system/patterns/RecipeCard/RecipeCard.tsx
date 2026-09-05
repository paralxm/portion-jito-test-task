import type { ReactNode } from 'react';
import { Clock } from '@phosphor-icons/react';

import { MatchCriteria, type MatchCriterion } from '../../components/MatchCriteria/MatchCriteria';
import { MediaFrame } from '../../components/MediaFrame/MediaFrame';
import { Icon } from '../../icons/Icon';
import { Badge } from '../../primitives/Badge/Badge';
import { Text } from '../../primitives/Text/Text';
import { formatQuantity, NBSP } from '../../nutrition/nutrition';
import styles from './RecipeCard.module.css';

export interface RecipeCardProps {
  /** Full recipe title (compact-title 18/24). Wraps; the card grows. */
  title: string;
  /** 4:3 thumbnail. Absent or failed images leave a quiet neutral region — the recipe is still valid. */
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
  /** `row` (default): thumbnail beside the text. `tile`: the photo above the text, for a rail of equal cards. */
  presentation?: 'row' | 'tile';
  className?: string;
  children?: ReactNode;
}

/**
 * Scannable recipe card in the order a person judges a recipe: identity, why it
 * qualifies, the facts (calories · protein on the stated basis, time, declared dietary
 * types), and a supporting 4:3 thumbnail beside the text rather than above it — so a
 * list of five recipes fits in two screens instead of five. The title is the single
 * control; its hit area stretches over the whole card without nesting interactive
 * elements. Under 17 rem of card width (200 % text on every supported viewport) the
 * thumbnail moves above the text.
 */
export function RecipeCard({ title, imageUrl, imageAlt = '', calories, protein, servingBasis, preparationMinutes, dietary, criteria, onOpen, presentation = 'row', className, children }: RecipeCardProps) {
  const hasTime = preparationMinutes !== undefined && preparationMinutes !== null;
  const hasDietary = Boolean(dietary && dietary.length > 0);
  return (
    <article className={[styles.card, className].filter(Boolean).join(' ')} data-presentation={presentation}>
      <div className={styles.layout}>
        <div className={styles.media}>
          <MediaFrame aspect="4:3" imageUrl={imageUrl} imageAlt={imageAlt} compact />
        </div>
        <div className={styles.body}>
          <h3 className={styles.titleRow}>
            <button type="button" className={styles.titleButton} onClick={onOpen}>
              <Text variant="compact-title" color="primary" wrap>
                {title}
              </Text>
            </button>
          </h3>
          {criteria && criteria.length > 0 ? <MatchCriteria criteria={criteria} presentation="summary" className={styles.match} /> : null}
          <p className={styles.values}>
            {calories === null ? (
              <Text variant="supporting" color="secondary">
                Calories not available
              </Text>
            ) : (
              <Text variant="metric-inline" numeric color="primary">
                {formatQuantity(calories, 'kcal')}
                {NBSP}kcal
              </Text>
            )}
            {protein === null ? (
              <Text variant="supporting" color="secondary">
                Protein not available
              </Text>
            ) : (
              <Text variant="metric-inline" numeric color="primary">
                {formatQuantity(protein, 'g')}
                {NBSP}g protein
              </Text>
            )}
          </p>
          <Text as="p" variant="supporting" color="secondary" wrap>
            {servingBasis}
          </Text>
          {hasTime || hasDietary ? (
            <div className={styles.meta}>
              {hasTime ? (
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
          {children}
        </div>
      </div>
    </article>
  );
}
