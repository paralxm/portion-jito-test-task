import { NutritionValue, type NutritionValueStatus } from '../NutritionValue/NutritionValue';
import { ProgressBar } from '../../primitives/ProgressBar/ProgressBar';
import { Text } from '../../primitives/Text/Text';
import { formatQuantity, MACRO_ORDER, NUTRIENT_CATEGORIES, type NutrientCategory } from '../../nutrition/nutrition';
import styles from './NutritionMacros.module.css';

export interface MacroValue {
  value: number | null;
  /** The figure is a known subtotal: at least one contributing value was unknown. */
  partial?: boolean;
  /** A user-entered daily target in grams; renders "24 / 120 g" and a compact track. Never derived. */
  target?: number | null;
}

export interface NutritionMacrosProps {
  protein: MacroValue;
  carbohydrates: MacroValue;
  fat: MacroValue;
  /**
   * `secondary` (20/28 values, full category names) is the result-summary row under a
   * main calorie value; `compact` (16/24 values, short names) is the daily-overview row
   * on Home, subordinate to the calorie budget.
   */
  size?: 'secondary' | 'compact';
  /** `stale` when the draft amount is invalid: no value is presented as current. */
  status?: NutritionValueStatus;
  className?: string;
}

/**
 * The three macronutrients in their fixed order, each with its labelled category marker.
 * Missing constituents are handled independently: an unknown value is named, a partial
 * subtotal says so, and neither is ever shown as zero. With a target the value reads
 * "24 / 120 g" over a compact track in the category's accent — a supporting identifier,
 * never the only meaning.
 */
export function NutritionMacros({ protein, carbohydrates, fat, size = 'secondary', status = 'known', className }: NutritionMacrosProps) {
  const values: Record<Exclude<NutrientCategory, 'energy' | 'fibre' | 'vitamins' | 'minerals'>, MacroValue> = { protein, carbohydrates, fat };
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.macros} data-size={size} role="list">
        {MACRO_ORDER.map((key) => {
          const item = values[key as keyof typeof values];
          const meta = NUTRIENT_CATEGORIES[key];
          const hasTarget = status === 'known' && item.value !== null && typeof item.target === 'number' && item.target > 0;
          return (
            <div key={key} role="listitem" className={styles.macro}>
              <NutritionValue
                size={size === 'compact' ? 'compact' : 'secondary'}
                value={item.value}
                unit={meta.unit}
                label={
                  size === 'compact' || !meta.compactLabel ? (
                    meta.compactLabel ?? meta.label
                  ) : (
                    <>
                      <span className={styles.longLabel}>{meta.label}</span>
                      <span className={styles.shortLabel} aria-hidden="true">
                        {meta.compactLabel}
                      </span>
                    </>
                  )
                }
                category={key}
                target={hasTarget ? item.target : undefined}
                status={status}
              />
              {hasTarget ? (
                <ProgressBar
                  value={item.value}
                  max={item.target as number}
                  size="compact"
                  tone={key as 'protein' | 'carbohydrates' | 'fat'}
                  label={`${meta.label} against your target`}
                  valueText={`${formatQuantity(item.value as number, meta.unit)} of ${formatQuantity(item.target as number, meta.unit)} ${meta.unit}`}
                  className={styles.track}
                />
              ) : null}
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
