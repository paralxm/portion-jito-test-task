import { PencilSimple } from '@phosphor-icons/react';

import { Button } from '../../../design-system/primitives/Button/Button';
import { Stack } from '../../../design-system/primitives/layout/Stack';
import { Text } from '../../../design-system/primitives/Text/Text';
import { describeReferenceBasis, type FoodCandidate } from '../domain/calculation';
import styles from './FoodIdentityHeader.module.css';

export interface FoodIdentityHeaderProps {
  candidate: FoodCandidate;
  /** Opens the shared method chooser (Home) or the correction route (Review). */
  onChangeFood: () => void;
  changeFoodLabel?: string;
  /** Id placed on the name heading; the caller's section points its `aria-labelledby` at it. */
  headingId: string;
}

/**
 * Name, optional detail, reference basis and a "Change food" action — the identity
 * block shared by Home's current-calculation module and Food review's candidate. Both
 * screens describe the same food the same way; only what surrounds this block differs.
 */
export function FoodIdentityHeader({ candidate, onChangeFood, changeFoodLabel = 'Change food', headingId }: FoodIdentityHeaderProps) {
  return (
    <section className={styles.identity} aria-labelledby={headingId}>
      <Stack gap={4}>
        <Text as="h2" id={headingId} variant="detail-heading" color="primary" wrap>
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
      <Button variant="secondary" icon={PencilSimple} onClick={onChangeFood}>
        {changeFoodLabel}
      </Button>
    </section>
  );
}
