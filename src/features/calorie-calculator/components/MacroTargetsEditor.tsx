import { useId } from 'react';

import { AmountField } from '../../../design-system/components/AmountField/AmountField';
import { FilterChip } from '../../../design-system/components/Chip/Chip';
import { InlineMessage } from '../../../design-system/components/InlineMessage/InlineMessage';
import { Inline } from '../../../design-system/primitives/layout/Inline';
import { Stack } from '../../../design-system/primitives/layout/Stack';
import { Text } from '../../../design-system/primitives/Text/Text';
import { formatKcal } from '../domain/daily-log';
import { macroMismatch, PRESET_OPTIONS, PRESET_SHARES, roundMacros, suggestedMacros, type MacroPreset } from '../domain/macro-presets';
import styles from './MacroTargetsEditor.module.css';

export type TargetKey = 'proteinG' | 'carbohydratesG' | 'fatG';

export const TARGET_FIELDS: ReadonlyArray<{ key: TargetKey; label: string; share: 'protein' | 'carbohydrates' | 'fat' }> = [
  { key: 'proteinG', label: 'Protein', share: 'protein' },
  { key: 'carbohydratesG', label: 'Carbohydrates', share: 'carbohydrates' },
  { key: 'fatG', label: 'Fat', share: 'fat' },
];

export type CustomGrams = Record<TargetKey, string>;
export const EMPTY_CUSTOM: CustomGrams = { proteinG: '', carbohydratesG: '', fatG: '' };

export interface MacroTargetsEditorProps {
  /** The parsed calorie target the suggestions derive from; `null` while it is blank or invalid. */
  kcal: number | null;
  preset: MacroPreset;
  onPresetChange: (preset: MacroPreset) => void;
  /** The person's own gram drafts, kept while a preset is selected so switching back loses nothing. */
  custom: CustomGrams;
  onCustomChange: (custom: CustomGrams) => void;
  /** The parsed custom grams for the mismatch note; `null` for any unset or invalid field. */
  customParsed: Record<TargetKey, number | null>;
  errors: Partial<Record<TargetKey, string>>;
}

/**
 * The macro-target part of Set / Edit targets (ledger §13.4): a nutrition preference —
 * Balanced, Higher protein, Lower carb, Custom — and the grams it implies. A preset's
 * grams are *suggested*: derived from the calorie target with documented shares inside
 * the adult AMDR and the Atwater factors, recomputed whenever the calories change, and
 * never presented as personal. Custom exposes three optional gram fields, keeps them when
 * the calories change, allows any of them to stay unset, and states — without changing
 * anything — when the three together do not add up to the calorie target.
 */
export function MacroTargetsEditor({ kcal, preset, onPresetChange, custom, onCustomChange, customParsed, errors }: MacroTargetsEditorProps) {
  const id = useId();
  const suggested = kcal !== null && preset !== 'custom' ? roundMacros(suggestedMacros(kcal, preset)) : null;
  const mismatch = kcal !== null && preset === 'custom' ? macroMismatch(kcal, customParsed) : null;

  return (
    <Stack gap={12}>
      <fieldset className={styles.group} role="radiogroup" aria-labelledby={`${id}-preference`}>
        <Text as="legend" id={`${id}-preference`} variant="label" color="primary" className={styles.legend}>
          Nutrition preference
        </Text>
        <Inline gap={8} wrap block>
          {PRESET_OPTIONS.map((option) => (
            <FilterChip key={option.id} selectionRole="radio" selected={preset === option.id} onClick={() => onPresetChange(option.id)}>
              {option.label}
            </FilterChip>
          ))}
        </Inline>
      </fieldset>

      {preset !== 'custom' ? (
        <div className={styles.suggested} aria-labelledby={`${id}-suggested`}>
          <Text as="h3" id={`${id}-suggested`} variant="label" color="primary">
            Suggested macros
          </Text>
          {suggested ? (
            <dl className={styles.list}>
              {TARGET_FIELDS.map((field) => (
                <div key={field.key} className={styles.row}>
                  <dt>
                    <Text variant="body" color="primary">
                      {field.label}
                    </Text>
                  </dt>
                  <dd className={styles.value}>
                    <Text variant="metric-inline" numeric color="primary">
                      {suggested[field.key]} g
                    </Text>
                    <Text variant="supporting" numeric color="secondary">
                      {Math.round(PRESET_SHARES[preset][field.share] * 100)} % of energy
                    </Text>
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <Text as="p" variant="supporting" color="secondary" wrap>
              Enter a calorie target to see the suggested grams.
            </Text>
          )}
          <Text as="p" variant="caption" color="secondary" wrap>
            A suggestion from the calorie target using the {PRESET_OPTIONS.find((o) => o.id === preset)?.description} split, within the adult Acceptable Macronutrient Distribution Ranges. Not personalised.
          </Text>
        </div>
      ) : (
        <Stack gap={12}>
          {TARGET_FIELDS.map((field) => (
            <AmountField
              key={field.key}
              label={field.label}
              optional
              value={custom[field.key]}
              onChange={(value) => onCustomChange({ ...custom, [field.key]: value })}
              unit="g"
              placeholder="None"
              error={errors[field.key]}
              helper={errors[field.key] ? undefined : 'Leave blank to show the logged grams alone.'}
            />
          ))}
          {mismatch !== null && Math.abs(mismatch.differenceKcal) >= 1 ? (
            <InlineMessage tone="info" announce="none">
              These grams add up to {formatKcal(mismatch.macroKcal)} kcal, {formatKcal(Math.abs(mismatch.differenceKcal))} kcal {mismatch.differenceKcal > 0 ? 'above' : 'below'} your calorie target (4 kcal per gram of protein and carbohydrate, 9 per gram of fat). Both are kept as you entered them.
            </InlineMessage>
          ) : null}
        </Stack>
      )}
    </Stack>
  );
}
