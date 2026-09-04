import { useId, type ReactNode } from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';

import { NutrientRow } from '../../components/NutrientRow/NutrientRow';
import { NutritionMacros } from '../../components/NutritionMacros/NutritionMacros';
import { NutritionValue, type NutritionValueStatus } from '../../components/NutritionValue/NutritionValue';
import { Button } from '../../primitives/Button/Button';
import type { NutrientUnit } from '../../nutrition/nutrition';
import styles from './NutritionSummary.module.css';

export interface NamedNutrient {
  id: string;
  name: string;
  value: number | null;
  unit: NutrientUnit;
}

export interface AdditionalNutrition {
  /** Fibre is part of the carbohydrate value for the fixtures in scope; it is shown as "of which fibre", never added again. */
  fibre?: number | null;
  vitamins?: readonly NamedNutrient[];
  minerals?: readonly NamedNutrient[];
}

export interface NutritionSummaryProps {
  energy: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
  /** The basis every value belongs to, e.g. "For 250 g" or "Per serving (300 g)". */
  basis: ReactNode;
  /** `stale` when the draft amount is invalid: no value is presented as current. */
  status?: NutritionValueStatus;
  /** Secondary nutrition behind one disclosure. Omit when nothing is available. */
  additional?: AdditionalNutrition;
  expanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
  className?: string;
}

/**
 * The single nutrition presentation used by the calculator result and recipe details:
 * one main calorie value bound to its basis, the three macronutrients one clear step
 * below it, and an optional expanded list behind one disclosure. Unknown values are
 * named, never zero.
 */
export function NutritionSummary({ energy, protein, carbohydrates, fat, basis, status = 'known', additional, expanded = false, onToggleExpanded, className }: NutritionSummaryProps) {
  const id = useId();
  const regionId = `nutrition-more-${id}`;
  const hasAdditional = Boolean(
    additional && (additional.fibre !== undefined || (additional.vitamins && additional.vitamins.length > 0) || (additional.minerals && additional.minerals.length > 0)),
  );

  return (
    <section className={[styles.summary, className].filter(Boolean).join(' ')} aria-label="Nutrition">
      <NutritionValue size="main" value={energy} unit="kcal" basis={basis} status={status} label="Calories" />
      <NutritionMacros size="secondary" protein={{ value: protein }} carbohydrates={{ value: carbohydrates }} fat={{ value: fat }} status={status} />
      {hasAdditional && status === 'known' ? (
        <div className={styles.more}>
          <Button variant="text" size="small" icon={expanded ? CaretUp : CaretDown} aria-expanded={expanded} aria-controls={regionId} onClick={() => onToggleExpanded?.(!expanded)}>
            {expanded ? 'Show less nutrition' : 'Show all nutrition'}
          </Button>
          <div id={regionId} className={styles.list} hidden={!expanded} role="list" aria-label="Additional nutrition">
            {additional?.fibre !== undefined ? <NutrientRow name="of which fibre" value={additional.fibre} unit="g" category="fibre" nested /> : null}
            {additional?.vitamins && additional.vitamins.length > 0 ? (
              <>
                <NutrientRow name="Vitamins" value={null} unit="mg" category="vitamins" heading />
                {additional.vitamins.map((n) => (
                  <NutrientRow key={n.id} name={n.name} value={n.value} unit={n.unit} nested />
                ))}
              </>
            ) : null}
            {additional?.minerals && additional.minerals.length > 0 ? (
              <>
                <NutrientRow name="Minerals" value={null} unit="mg" category="minerals" heading />
                {additional.minerals.map((n) => (
                  <NutrientRow key={n.id} name={n.name} value={n.value} unit={n.unit} nested />
                ))}
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
