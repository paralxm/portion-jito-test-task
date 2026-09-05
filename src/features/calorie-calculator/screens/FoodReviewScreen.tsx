import { useRef, useState } from 'react';
import { ArrowsClockwise, Camera, MagnifyingGlass, PencilSimple } from '@phosphor-icons/react';

import { InlineMessage } from '../../../design-system/components/InlineMessage/InlineMessage';
import { MediaFrame } from '../../../design-system/components/MediaFrame/MediaFrame';
import { Badge } from '../../../design-system/primitives/Badge/Badge';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Stack } from '../../../design-system/primitives/layout/Stack';
import { Text } from '../../../design-system/primitives/Text/Text';
import { AppHeader } from '../../../design-system/patterns/AppHeader/AppHeader';
import { ConfirmDialog } from '../../../design-system/patterns/ConfirmDialog/ConfirmDialog';
import { FocusedFlowLayout } from '../../../design-system/templates/FocusedFlowLayout/FocusedFlowLayout';
import { useExitGuard } from '../../../app/exit-guard';
import { DiscardChangesDialog } from '../components/DiscardChangesDialog';
import { MealPicker } from '../components/MealPicker';
import { PortionForm } from '../components/PortionForm';
import { usePortionDraft } from '../components/usePortionDraft';
import { describeReferenceBasis, type FoodCandidate, type Portion } from '../domain/calculation';
import { mealPhrase, type MealType } from '../domain/meal';
import styles from './FoodReviewScreen.module.css';

/**
 * `new` reviews a candidate from any entry method and commits it with `Add to {meal}`.
 * `existing` reviews a logged entry from Home: the draft starts from its committed
 * portion and meal, Update entry commits, Remove entry deletes after confirmation.
 */
export type ReviewMode = 'new' | 'existing';

export interface FoodReviewScreenProps {
  candidate: FoodCandidate;
  mode?: ReviewMode;
  /** Portion to start from; defaults to the reference basis (new) or the entry's portion (existing). */
  initialPortion?: Portion;
  /** new: the preselected meal (from the Home row, else the time-of-day suggestion); existing: the entry's meal, `null` for the unassigned guard. */
  initialMeal?: MealType | null;
  mealHint?: string;
  /** new: "yesterday" or "on Thu, Sep 3" when the commit lands on another day. */
  dayPhrase?: string;
  /** Photo source: the captured frame (in this prototype a labelled sample photograph), shown instead of a catalogue photo. */
  capturedImageUrl?: string;
  /** Back returns to the actual preceding step (new) or Home (existing) with its input intact. */
  onBack: () => void;
  /** new: leaves the whole task; a changed draft asks first, then returns to the recorded origin. */
  onCancel?: () => void;
  /** Correction route for a new candidate: Change food (search), Change product (barcode) or Change match (photo). */
  onChangeMatch?: () => void;
  /** photo: takes another photo. */
  onRetake?: () => void;
  /** barcode / photo: edit the record's values as a manual override (ledger §12 E1). */
  onEditValues?: () => void;
  /** new: the one commit — exactly one entry on the bound day. */
  onAdd?: (portion: Portion, meal: MealType) => void;
  /** existing: commits the edited portion and meal to the same entry. */
  onUpdateEntry?: (portion: Portion, meal: MealType) => void;
  /** existing: removes the entry after the confirmation. */
  onRemoveEntry?: () => void;
}

const SOURCE_LABEL: Record<FoodCandidate['source'], string> = {
  search: 'From search',
  barcode: 'Barcode match',
  photo: 'Photo suggestion',
  manual: 'Entered by you',
  recipe: 'From a recipe',
};

function sourceExplanation(candidate: FoodCandidate): string | null {
  switch (candidate.source) {
    case 'barcode':
      return `Matched from barcode ${candidate.barcode ?? ''}`.trim() + '. The values come from the matched record, not from a checked label. If this is not the right product, change it before adding it.';
    case 'photo':
      return 'Suggested from your photo. Check that the match is right and enter the portion yourself; the photo does not measure the amount.';
    case 'manual':
      return candidate.provenance ? `Values you edited from the ${candidate.provenance.from === 'barcode' ? 'barcode match' : 'photo suggestion'}; the original record is unchanged.` : 'Entered by you. The amount below is the portion you are calculating, not the reference basis.';
    case 'recipe':
      return 'From a recipe. One serving is the recipe’s serving; set the number of servings you will eat.';
    default:
      return null;
  }
}

/**
 * S07 — Food review and portion (ledger §12 E1–E3, after R5). One hierarchy for every
 * source: identity (image, name, brand and code when the record supplies them, basis,
 * the source stated plainly, the correction actions the source supports) → the shared
 * portion form (amount with steps and presets, the live result) → meal and target day →
 * one final `Add to {meal}`. Only the wording and the correction actions differ by
 * source; nothing is presented as verified. Existing entries reuse the same form with
 * Update entry and Remove entry.
 */
export function FoodReviewScreen({ candidate, mode = 'new', initialPortion, initialMeal = null, mealHint, dayPhrase, capturedImageUrl, onBack, onCancel, onChangeMatch, onRetake, onEditValues, onAdd, onUpdateEntry, onRemoveEntry }: FoodReviewScreenProps) {
  const startPortion: Portion = initialPortion ?? { quantity: candidate.reference.quantity, unitId: candidate.reference.unitId };
  const draft = usePortionDraft(candidate, startPortion);
  const [meal, setMeal] = useState<MealType | null>(initialMeal);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const submitted = useRef(false);

  const partial = [candidate.nutrition.proteinG, candidate.nutrition.carbohydratesG, candidate.nutrition.fatG].some((v) => v === null);
  const dirty = draft.changed || meal !== initialMeal;
  // The commit needs a valid portion with a calculable result and a chosen meal (the
  // unassigned guard of an existing entry is resolved here, never silently).
  const committable = draft.committable && meal !== null;

  const commit = (handler: ((portion: Portion, meal: MealType) => void) | undefined) => {
    draft.markTouched();
    if (submitted.current || !handler || !committable || !draft.portion || !meal) return;
    submitted.current = true;
    handler(draft.portion, meal);
  };

  // Leaving: Back keeps the preceding step; Cancel (new) leaves the task; both ask when something changed.
  const guarded = (leave: () => void) => () => {
    if (dirty) setDiscardOpen(true);
    else leave();
  };
  const leaveTarget = useRef<() => void>(onBack);
  const requestBack = () => {
    leaveTarget.current = onBack;
    guarded(onBack)();
  };
  const requestCancel = () => {
    leaveTarget.current = onCancel ?? onBack;
    guarded(onCancel ?? onBack)();
  };
  useExitGuard(() => {
    if (!dirty) return false;
    leaveTarget.current = onBack;
    setDiscardOpen(true);
    return true;
  }, dirty);

  const image = candidate.source === 'photo' ? capturedImageUrl : candidate.imageUrl;
  const explanation = mode === 'new' ? sourceExplanation(candidate) : null;
  const corrections =
    mode !== 'new'
      ? null
      : candidate.source === 'barcode'
        ? [
            onChangeMatch ? { key: 'change', label: 'Change product', icon: MagnifyingGlass, onClick: onChangeMatch } : null,
            onEditValues ? { key: 'edit', label: 'Edit label values', icon: PencilSimple, onClick: onEditValues } : null,
          ]
        : candidate.source === 'photo'
          ? [
              onChangeMatch ? { key: 'change', label: 'Change match', icon: ArrowsClockwise, onClick: onChangeMatch } : null,
              onRetake ? { key: 'retake', label: 'Retake photo', icon: Camera, onClick: onRetake } : null,
              onEditValues ? { key: 'edit', label: 'Edit nutrition values', icon: PencilSimple, onClick: onEditValues } : null,
            ]
          : onChangeMatch
            ? [{ key: 'change', label: candidate.source === 'manual' ? 'Edit food details' : 'Change food', icon: PencilSimple, onClick: onChangeMatch }]
            : [];
  const correctionActions = (corrections ?? []).filter((c): c is NonNullable<typeof c> => c !== null);

  const footer =
    mode === 'existing' ? (
      <Stack gap={8}>
        <Button variant="primary" size="large" block onClick={() => commit(onUpdateEntry)} disabled={!committable}>
          Update entry
        </Button>
        <Button variant="destructive" block onClick={() => setRemoveOpen(true)}>
          Remove entry
        </Button>
      </Stack>
    ) : (
      <Stack gap={8}>
        <Button variant="primary" size="large" block onClick={() => commit(onAdd)} disabled={!committable}>
          {meal ? `Add to ${mealPhrase(meal)}` : 'Add to meal'}
        </Button>
        <Button variant="text" block onClick={requestCancel}>
          Cancel
        </Button>
      </Stack>
    );

  return (
    <FocusedFlowLayout header={<AppHeader variant="focused" title={mode === 'existing' ? 'Edit entry' : 'Review food'} onBack={requestBack} />} footer={footer}>
      <section className={styles.identity} aria-labelledby="review-food-name">
        <div className={styles.summary}>
          {image || candidate.source === 'photo' ? (
            <div className={styles.media}>
              <MediaFrame aspect="4:3" imageUrl={image} imageAlt={candidate.source === 'photo' ? 'Sample photograph standing in for your photo' : ''} compact eager />
              {candidate.source === 'photo' ? (
                <Badge kind="label" className={styles.mediaLabel}>
                  Sample photo
                </Badge>
              ) : null}
            </div>
          ) : null}
          <div className={styles.text}>
            {mode === 'new' ? (
              <Badge kind="label" className={styles.source}>
                {SOURCE_LABEL[candidate.source]}
              </Badge>
            ) : null}
            <Text as="h2" id="review-food-name" variant="detail-heading" color="primary" wrap>
              {candidate.name}
            </Text>
            {candidate.brand ? (
              <Text as="p" variant="supporting" color="secondary" wrap>
                {candidate.brand}
              </Text>
            ) : null}
            {candidate.detail && candidate.detail !== candidate.brand ? (
              <Text as="p" variant="supporting" color="secondary" wrap>
                {candidate.detail}
              </Text>
            ) : null}
            <Text as="p" variant="supporting" color="secondary" wrap>
              Nutrition basis: {describeReferenceBasis(candidate).toLowerCase()}
              {candidate.barcode ? ` · Barcode ${candidate.barcode}` : ''}
            </Text>
          </div>
        </div>
        {correctionActions.length > 0 ? (
          <div className={styles.corrections}>
            {correctionActions.map((action) => (
              <Button key={action.key} variant="secondary" size="small" icon={action.icon} onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </section>

      {explanation ? (
        <InlineMessage tone="info" announce="none">
          {explanation}
        </InlineMessage>
      ) : null}

      {mode === 'existing' ? <MealPicker value={meal} onChange={setMeal} hint={meal === null ? 'This entry has no meal yet. Choose one to keep it in the day’s meals.' : undefined} /> : null}

      {!draft.energyAvailable ? (
        <InlineMessage
          tone="error"
          title="Calories are not available for this food"
          announce="none"
          actions={
            onChangeMatch ? (
              <Button variant="secondary" size="small" onClick={onChangeMatch}>
                Choose a different food
              </Button>
            ) : undefined
          }
        >
          Nutrition information is unavailable for this ingredient, so a portion cannot be calculated or added. Choose another match or enter the values manually.
        </InlineMessage>
      ) : null}

      <PortionForm candidate={candidate} draft={draft} meal={mode === 'new' ? meal : undefined} onMealChange={mode === 'new' ? setMeal : undefined} mealHint={mealHint} dayPhrase={dayPhrase}>
        {partial && draft.energyAvailable ? (
          <InlineMessage tone="info" announce="none">
            Some nutrition values are not available for this food. They are shown as not available, not as zero.
          </InlineMessage>
        ) : null}
      </PortionForm>

      <ConfirmDialog
        open={removeOpen}
        title={`Remove ${candidate.name} from this day?`}
        confirmLabel="Remove"
        cancelLabel="Keep entry"
        destructive
        onConfirm={() => {
          setRemoveOpen(false);
          onRemoveEntry?.();
        }}
        onCancel={() => setRemoveOpen(false)}
      >
        It leaves the day&rsquo;s food and totals. Nothing else changes.
      </ConfirmDialog>

      {mode === 'existing' ? (
        <ConfirmDialog
          open={discardOpen}
          title="Discard the changed amount?"
          confirmLabel="Discard"
          cancelLabel="Keep editing"
          destructive
          onConfirm={() => {
            setDiscardOpen(false);
            leaveTarget.current();
          }}
          onCancel={() => setDiscardOpen(false)}
        >
          The entry keeps its logged amount and meal. Nothing is removed.
        </ConfirmDialog>
      ) : (
        <DiscardChangesDialog
          open={discardOpen}
          onKeepEditing={() => setDiscardOpen(false)}
          onDiscard={() => {
            setDiscardOpen(false);
            leaveTarget.current();
          }}
        />
      )}
    </FocusedFlowLayout>
  );
}
