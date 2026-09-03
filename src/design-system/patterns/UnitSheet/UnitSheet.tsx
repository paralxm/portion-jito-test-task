import { useEffect, useId, useState } from 'react';

import { Radio } from '../../primitives/Choice/Radio';
import { Button } from '../../primitives/Button/Button';
import { Inline } from '../../primitives/layout/Inline';
import { Text } from '../../primitives/Text/Text';
import { ModalSheet } from '../ModalSheet/ModalSheet';
import styles from './UnitSheet.module.css';

export interface UnitOption {
  id: string;
  /** Short unit label, e.g. `g`, `ml`, `serving`. */
  label: string;
  /** Optional explanation of what the unit means for this food, e.g. "1 serving = 300 g". */
  description?: string;
}

export interface UnitSheetProps {
  open: boolean;
  /** Units the data actually supports for this food. Unsupported conversions are never offered. */
  options: readonly UnitOption[];
  /** The currently applied unit. The draft starts from it and Cancel restores it. */
  value: string;
  onConfirm: (unitId: string) => void;
  onCancel: () => void;
}

/**
 * O04 — supported unit chooser as a modal draft: mark the choice, Confirm applies it,
 * Cancel (close, backdrop, Escape) keeps the previous unit.
 */
export function UnitSheet({ open, options, value, onConfirm, onCancel }: UnitSheetProps) {
  const [draft, setDraft] = useState(value);
  // Several unit sheets can be mounted at once (Home, Review, Manual entry), so
  // option ids and the radio group name must be unique per instance.
  const id = useId();
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  return (
    <ModalSheet
      open={open}
      onRequestClose={onCancel}
      title="Choose a unit"
      description="Only units this food's data supports are listed."
      footer={
        <Inline gap={8} distribute="fill" align="stretch">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onConfirm(draft)} disabled={draft === value}>
            Confirm
          </Button>
        </Inline>
      }
    >
      <fieldset className={styles.group}>
        <legend>
          <Text variant="label" color="secondary">
            Unit
          </Text>
        </legend>
        {options.map((option) => (
          <Radio
            key={option.id}
            id={`unit-${id}-${option.id}`}
            name={`unit-${id}`}
            value={option.id}
            checked={draft === option.id}
            onChange={() => setDraft(option.id)}
            label={option.label}
            description={option.description}
          />
        ))}
      </fieldset>
    </ModalSheet>
  );
}
