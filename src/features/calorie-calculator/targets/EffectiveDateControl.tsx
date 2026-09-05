import { useId, useState } from 'react';

import { TextField } from '../../../design-system/components/TextField/TextField';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Text } from '../../../design-system/primitives/Text/Text';
import { compareDayKeys, describeDay, isDayKey } from '../domain/day-keys';
import type { GoalPeriod } from '../domain/goal-history';
import { describeStart } from './targets-draft';
import styles from './EffectiveDateControl.module.css';

export interface EffectiveDateControlProps {
  /** `null` is "today, resolved at save". */
  startDayKey: string | null;
  onChange: (startDayKey: string | null) => void;
  todayKey: string;
  hasCurrent: boolean;
  pending: GoalPeriod | null;
  /** A date the save refused (it passed while the task was open). */
  error?: string;
}

/**
 * When the targets start (ledger §14): "Starts Today" with a Change action that reveals
 * the native date input (today or later), a "Use today" way back, and one truthful
 * sentence about what the choice means for the current targets and any scheduled
 * change. The start date is when targets begin, never a deadline.
 */
export function EffectiveDateControl({ startDayKey, onChange, todayKey, hasCurrent, pending, error }: EffectiveDateControlProps) {
  const [editing, setEditing] = useState(startDayKey !== null);
  const id = useId();
  const label = startDayKey === null || startDayKey === todayKey ? 'Today' : describeDay(startDayKey).long;
  return (
    <div className={styles.control}>
      <div className={styles.row}>
        <Text as="p" variant="body" color="primary" className={styles.starts}>
          <Text as="span" variant="label" color="secondary">
            Starts{' '}
          </Text>
          <Text as="span" variant="action-md" color="primary">
            {label}
          </Text>
        </Text>
        {!editing ? (
          <Button variant="text" size="small" onClick={() => setEditing(true)} aria-describedby={`${id}-note`}>
            Change
          </Button>
        ) : (
          <Button
            variant="text"
            size="small"
            onClick={() => {
              onChange(null);
              setEditing(false);
            }}
          >
            Use today
          </Button>
        )}
      </div>
      {editing ? (
        <TextField
          label="Start date"
          type="date"
          min={todayKey}
          value={startDayKey ?? todayKey}
          onChange={(event) => {
            const value = event.target.value;
            if (isDayKey(value)) onChange(compareDayKeys(value, todayKey) === 0 ? null : value);
          }}
          error={error}
          helper={error ? undefined : 'A day from today on. This is when the targets begin, not a deadline.'}
        />
      ) : null}
      <Text as="p" id={`${id}-note`} variant="supporting" color="secondary" wrap>
        {describeStart(startDayKey, todayKey, hasCurrent, pending)}
      </Text>
    </div>
  );
}
