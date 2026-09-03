import { Check, Minus } from '@phosphor-icons/react';

import { Icon } from '../../icons/Icon';
import { Text } from '../../primitives/Text/Text';
import styles from './MatchCriteria.module.css';

export interface MatchCriterion {
  id: string;
  /** Plain statement of the comparison, e.g. "450 kcal per serving, under 500". */
  text: string;
  /** `true` when a known value satisfies the criterion. Unknown data never counts as met. */
  met: boolean;
}

export interface MatchCriteriaProps {
  criteria: readonly MatchCriterion[];
  /**
   * `summary` renders one line for lists ("Matches all 3 filters"); `detailed` restates
   * every criterion against its known value for the details screen.
   */
  presentation?: 'summary' | 'detailed';
  className?: string;
}

/**
 * Explains suitability strictly through the criteria the user selected. With no active
 * criteria the caller renders nothing — the component never invents a match claim, a
 * score or a health verdict.
 */
export function MatchCriteria({ criteria, presentation = 'summary', className }: MatchCriteriaProps) {
  if (criteria.length === 0) return null;
  const metCount = criteria.filter((c) => c.met).length;
  const allMet = metCount === criteria.length;

  if (presentation === 'summary') {
    const wording = allMet
      ? `Matches all ${criteria.length} ${criteria.length === 1 ? 'filter' : 'filters'}`
      : `Matches ${metCount} of ${criteria.length} filters`;
    return (
      <p className={[styles.summary, className].filter(Boolean).join(' ')} data-all-met={allMet || undefined}>
        <Icon icon={allMet ? Check : Minus} size="compact" weight="bold" />
        <Text variant="supporting" color="primary">
          {wording}
        </Text>
      </p>
    );
  }

  return (
    <ul className={[styles.list, className].filter(Boolean).join(' ')} aria-label="How this recipe matches your filters">
      {criteria.map((criterion) => (
        <li key={criterion.id} className={styles.item} data-met={criterion.met || undefined}>
          <Icon icon={criterion.met ? Check : Minus} size="compact" weight="bold" label={criterion.met ? 'Met' : 'Not met'} />
          <Text variant="supporting" color="primary" wrap>
            {criterion.text}
          </Text>
        </li>
      ))}
    </ul>
  );
}
