import { NutritionValue, type NutritionValueStatus } from '../NutritionValue/NutritionValue';
import { Text } from '../../primitives/Text/Text';
import { MACRO_ORDER, NUTRIENT_CATEGORIES, type NutrientCategory } from '../../nutrition/nutrition';
import styles from './NutritionMacros.module.css';

export interface MacroValue {
  value: number | null;
  /** The figure is a known subtotal: at least one contributing value was unknown. */
  partial?: boolean;
}

export interface NutritionMacrosProps {
  protein: MacroValue;
  carbohydrates: MacroValue;
  fat: MacroValue;
  /**
   * `secondary` (20/28 values, full category names) is the result-summary row under a
   * main calorie value; `compact` (16/24 values, short names) is the daily-overview row
   * on Home, subordinate to the ring.
   */
  size?: 'secondary' | 'compact';
  /** `stale` when the draft amount is invalid: no value is presented as current. */
  status?: NutritionValueStatus;
  className?: string;
}

/**
 * The three macronutrients in their fixed order, each with its labelled category marker.
 * Missing constituents are handled independently: an unknown value is named, a partial
 * subtotal says so, and neither is ever shown as zero.
 */
export function NutritionMacros({ protein, carbohydrates, fat, size = 'secondary', status = 'known', className }: NutritionMacrosProps) {
  const values: Record<Exclude<NutrientCategory, 'energy' | 'fibre' | 'vitamins' | 'minerals'>, MacroValue> = { protein, carbohydrates, fat };
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.macros} data-size={size} role="list">
      {MACRO_ORDER.map((key) => {
        const item = values[key as keyof typeof values];
        const meta = NUTRIENT_CATEGORIES[key];
        return (
          <div key={key} role="listitem" className={styles.macro}>
            <NutritionValue
              size={size === 'compact' ? 'compact' : 'secondary'}
              value={item.value}
              unit={meta.unit}
              label={size === 'compact' ? (meta.compactLabel ?? meta.label) : meta.label}
              category={key}
              status={status}
            />
            {item.partial && item.value !== null && status === 'known' ? (
              <Text as="p" variant="caption" color="secondary">
                Partial total
              </Text>
            ) : null}
          </div>
        );
      })}
      </div>
    </div>
  );
}
