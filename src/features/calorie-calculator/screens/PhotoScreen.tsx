import { useEffect, useId, useRef, useState } from 'react';

import { EmptyState } from '../../../design-system/components/EmptyState/EmptyState';
import { InlineMessage } from '../../../design-system/components/InlineMessage/InlineMessage';
import { LoadingState } from '../../../design-system/components/LoadingState/LoadingState';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Radio } from '../../../design-system/primitives/Choice/Radio';
import { Text } from '../../../design-system/primitives/Text/Text';
import { AppHeader } from '../../../design-system/patterns/AppHeader/AppHeader';
import { FocusedFlowLayout } from '../../../design-system/templates/FocusedFlowLayout/FocusedFlowLayout';
import { formatWithUnit } from '../../../design-system/nutrition/nutrition';
import { describeReferenceBasis, type FoodCandidate } from '../domain/calculation';
import styles from './Acquisition.module.css';

export type PhotoAnalysisResult = { kind: 'suggestions'; candidates: FoodCandidate[] } | { kind: 'failed' };

/**
 * The photo step's phases. `permission-pending` is the app-side state while the system
 * camera prompt (P01) is showing: capture is paused and the other methods stay reachable.
 * The prototype has no camera, so that phase is reached only through `initialPhase`.
 */
export type PhotoPhase =
  | { kind: 'permission-pending' }
  | { kind: 'capture' }
  | { kind: 'preview'; imageId: string }
  | { kind: 'analysing'; imageId: string }
  | { kind: 'suggestions'; imageId: string; candidates: FoodCandidate[] }
  | { kind: 'failed'; imageId: string }
  | { kind: 'denied' };

export interface PhotoScreenProps {
  /** Analysis for a captured image. Responses after Cancel, Retake or Back are ignored. */
  analyse: (imageId: string, options: { simulateFailure: boolean }) => Promise<PhotoAnalysisResult>;
  /** The image the simulated capture produces. */
  sampleImageUrl: string;
  /** The suggestion the user selected and asked to review goes to S07 as a photo-sourced candidate. */
  onSuggestionChosen: (candidate: FoodCandidate) => void;
  onBack: () => void;
  onSearchInstead: () => void;
  onEnterManually: () => void;
  /** Deterministic starting phase for stories and tests; the runtime always starts at capture. */
  initialPhase?: PhotoPhase;
}

/**
 * S05 — Photo. Capture → preview with retake → analysis → suggestions with an explicit
 * selection, reviewed only when the user asks. A suggestion is never a measurement; the
 * amount is set on review. Failure keeps the image so the same analysis can be retried.
 */
export function PhotoScreen({ analyse, sampleImageUrl, onSuggestionChosen, onBack, onSearchInstead, onEnterManually, initialPhase }: PhotoScreenProps) {
  const [phase, setPhase] = useState<PhotoPhase>(initialPhase ?? { kind: 'capture' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noneOpen, setNoneOpen] = useState(false);
  const request = useRef(0);
  const groupId = useId();

  useEffect(() => {
    return () => {
      request.current += 1;
    };
  }, []);

  const run = (imageId: string, simulateFailure: boolean) => {
    const id = ++request.current;
    setSelectedId(null);
    setNoneOpen(false);
    setPhase({ kind: 'analysing', imageId });
    analyse(imageId, { simulateFailure }).then((result) => {
      if (id !== request.current) return;
      if (result.kind === 'suggestions') setPhase({ kind: 'suggestions', imageId, candidates: result.candidates });
      else setPhase({ kind: 'failed', imageId });
    });
  };

  const retake = () => {
    request.current += 1;
    setSelectedId(null);
    setNoneOpen(false);
    setPhase({ kind: 'capture' });
  };

  const otherMethods = (
    <>
      <Button variant="secondary" size="small" onClick={onSearchInstead}>
        Search by name
      </Button>
      <Button variant="secondary" size="small" onClick={onEnterManually}>
        Enter manually
      </Button>
    </>
  );

  const showsImage = phase.kind === 'preview' || phase.kind === 'analysing' || phase.kind === 'suggestions' || phase.kind === 'failed';
  const preview = showsImage ? (
    <figure className={styles.preview}>
      <img className={styles.previewImage} src={sampleImageUrl} alt="Sample image standing in for your photo" />
    </figure>
  ) : null;

  const selected = phase.kind === 'suggestions' ? phase.candidates.find((c) => c.id === selectedId) : undefined;

  return (
    <FocusedFlowLayout header={<AppHeader variant="focused" title="Take a photo" onBack={onBack} />}>
      {phase.kind === 'denied' ? (
        <EmptyState
          kind="failure"
          title="Camera access is needed to take a photo"
          actions={
            <>
              <Button variant="primary" onClick={onSearchInstead}>
                Search by name
              </Button>
              <Button variant="secondary" onClick={onEnterManually}>
                Enter manually
              </Button>
            </>
          }
        >
          Allow camera access in your browser or system settings, or add the food another way.
        </EmptyState>
      ) : null}

      {phase.kind === 'permission-pending' ? (
        <>
          <div className={styles.viewfinder} aria-live="polite">
            <div className={styles.frame} data-paused />
            <Text as="p" variant="body" color="primary">
              Waiting for camera permission
            </Text>
            <Text as="p" variant="supporting" color="secondary" wrap>
              Allow access in the system prompt to continue, or add the food another way.
            </Text>
          </div>
          <div className={styles.demoActions}>{otherMethods}</div>
        </>
      ) : null}

      {phase.kind === 'capture' ? (
        <>
          <div className={styles.viewfinder}>
            <div className={styles.frame} />
            <Text as="p" variant="body" color="primary">
              Frame the food, then take the photo
            </Text>
            <Text as="p" variant="supporting" color="secondary">
              You will see a suggestion to check before anything is calculated.
            </Text>
          </div>
          <div className={styles.actions}>
            <Button variant="primary" size="large" block onClick={() => setPhase({ kind: 'preview', imageId: 'sample-1' })}>
              Take photo
            </Button>
          </div>
          <fieldset className={styles.demo}>
            <legend>
              <Text variant="label" color="secondary">
                Prototype controls
              </Text>
            </legend>
            <Text as="p" variant="supporting" color="secondary" wrap>
              This prototype has no camera or recognition service. Take photo uses a sample image, and analysis returns fixed suggestions.
            </Text>
            <div className={styles.demoActions}>
              <Button variant="secondary" size="small" onClick={() => setPhase({ kind: 'denied' })}>
                Simulate camera denied
              </Button>
            </div>
          </fieldset>
        </>
      ) : null}

      {preview}

      {phase.kind === 'preview' ? (
        <>
          <Text as="p" variant="supporting" color="secondary" wrap>
            Sample image used by this prototype. It is not a photo of your food and it does not measure the portion.
          </Text>
          <div className={styles.actions}>
            <Button variant="primary" size="large" block onClick={() => run(phase.imageId, false)}>
              Analyse photo
            </Button>
            <Button variant="secondary" block onClick={retake}>
              Retake
            </Button>
          </div>
          <fieldset className={styles.demo}>
            <legend>
              <Text variant="label" color="secondary">
                Prototype controls
              </Text>
            </legend>
            <div className={styles.demoActions}>
              <Button variant="secondary" size="small" onClick={() => run(phase.imageId, true)}>
                Analyse with a simulated failure
              </Button>
            </div>
          </fieldset>
        </>
      ) : null}

      {phase.kind === 'analysing' ? (
        <LoadingState
          label="Analysing photo"
          onCancel={() => {
            request.current += 1;
            setPhase({ kind: 'preview', imageId: phase.imageId });
          }}
        >
          Looking for foods in the image. This does not measure the amount.
        </LoadingState>
      ) : null}

      {phase.kind === 'suggestions' && phase.candidates.length > 0 ? (
        <>
          <fieldset className={styles.suggestions} aria-describedby={`${groupId}-hint`}>
            <legend className={styles.suggestionsLegend}>
              <Text as="span" variant="section-title" color="primary">
                Suggested foods
              </Text>
            </legend>
            <Text as="p" id={`${groupId}-hint`} variant="supporting" color="secondary" wrap>
              Pick the closest match. You set the amount next, and you can change the food at any point.
            </Text>
            <div className={styles.suggestionList}>
              {phase.candidates.map((candidate) => (
                <div key={candidate.id} className={styles.suggestion} data-selected={candidate.id === selectedId || undefined}>
                  <Radio
                    id={`${groupId}-${candidate.id}`}
                    name={`${groupId}-suggestion`}
                    value={candidate.id}
                    checked={candidate.id === selectedId}
                    onChange={() => setSelectedId(candidate.id)}
                    label={candidate.name}
                    description={`${candidate.nutrition.energyKcal === null ? 'Calories not available' : `${formatWithUnit(candidate.nutrition.energyKcal, 'kcal')}`} · ${describeReferenceBasis(candidate).toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          </fieldset>
          <div className={styles.actions}>
            <Button variant="primary" size="large" block disabled={!selected} onClick={() => selected && onSuggestionChosen(selected)}>
              Review selected match
            </Button>
            <Button variant="secondary" block aria-expanded={noneOpen} onClick={() => setNoneOpen((open) => !open)}>
              None of these
            </Button>
          </div>
          {noneOpen ? (
            <InlineMessage
              tone="info"
              announce="none"
              actions={
                <>
                  <Button variant="secondary" size="small" onClick={retake}>
                    Retake photo
                  </Button>
                  {otherMethods}
                </>
              }
            >
              Take another photo, search by name or enter the values yourself. Nothing has been calculated from this photo.
            </InlineMessage>
          ) : null}
        </>
      ) : null}

      {phase.kind === 'suggestions' && phase.candidates.length === 0 ? (
        <EmptyState
          kind="no-match"
          title="No food was recognised"
          actions={
            <>
              <Button variant="primary" onClick={retake}>
                Retake photo
              </Button>
              {otherMethods}
            </>
          }
        >
          Try a closer, well-lit photo, or add the food another way.
        </EmptyState>
      ) : null}

      {phase.kind === 'failed' ? (
        <InlineMessage
          tone="error"
          title="Analysis failed"
          actions={
            <>
              <Button variant="primary" size="small" onClick={() => run(phase.imageId, false)}>
                Try again
              </Button>
              <Button variant="secondary" size="small" onClick={retake}>
                Retake photo
              </Button>
              {otherMethods}
            </>
          }
        >
          The recognition service did not respond. Your photo is kept, so you can try again without retaking it.
        </InlineMessage>
      ) : null}
    </FocusedFlowLayout>
  );
}
