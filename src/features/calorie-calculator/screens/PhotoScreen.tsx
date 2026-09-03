import { useEffect, useRef, useState } from 'react';

import { EmptyState } from '../../../design-system/components/EmptyState/EmptyState';
import { FoodResultRow } from '../../../design-system/components/FoodResultRow/FoodResultRow';
import { InlineMessage } from '../../../design-system/components/InlineMessage/InlineMessage';
import { LoadingState } from '../../../design-system/components/LoadingState/LoadingState';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Text } from '../../../design-system/primitives/Text/Text';
import { AppHeader } from '../../../design-system/patterns/AppHeader/AppHeader';
import { FocusedFlowLayout } from '../../../design-system/templates/FocusedFlowLayout/FocusedFlowLayout';
import { describeReferenceBasis, type FoodCandidate } from '../domain/calculation';
import styles from './Acquisition.module.css';

export type PhotoAnalysisResult = { kind: 'suggestions'; candidates: FoodCandidate[] } | { kind: 'failed' };

export interface PhotoScreenProps {
  /** Analysis for a captured image. Responses after Cancel, Retake or Back are ignored. */
  analyse: (imageId: string, options: { simulateFailure: boolean }) => Promise<PhotoAnalysisResult>;
  /** The image the simulated capture produces. */
  sampleImageUrl: string;
  /** A chosen suggestion goes to review as a photo-sourced candidate. */
  onSuggestionChosen: (candidate: FoodCandidate) => void;
  onBack: () => void;
  onSearchInstead: () => void;
  onEnterManually: () => void;
}

type Phase =
  | { kind: 'capture' }
  | { kind: 'preview'; imageId: string }
  | { kind: 'analysing'; imageId: string }
  | { kind: 'suggestions'; imageId: string; candidates: FoodCandidate[] }
  | { kind: 'failed'; imageId: string }
  | { kind: 'denied' };

/**
 * S05 — Photo. Capture → preview with retake → analysis → suggestions the user must
 * review. A suggestion is never a measurement; the amount is set on review. Failure
 * keeps the image so the same analysis can be retried.
 */
export function PhotoScreen({ analyse, sampleImageUrl, onSuggestionChosen, onBack, onSearchInstead, onEnterManually }: PhotoScreenProps) {
  const [phase, setPhase] = useState<Phase>({ kind: 'capture' });
  const request = useRef(0);

  useEffect(() => {
    return () => {
      request.current += 1;
    };
  }, []);

  const run = (imageId: string, simulateFailure: boolean) => {
    const id = ++request.current;
    setPhase({ kind: 'analysing', imageId });
    analyse(imageId, { simulateFailure }).then((result) => {
      if (id !== request.current) return;
      if (result.kind === 'suggestions') setPhase({ kind: 'suggestions', imageId, candidates: result.candidates });
      else setPhase({ kind: 'failed', imageId });
    });
  };

  const retake = () => {
    request.current += 1;
    setPhase({ kind: 'capture' });
  };

  const otherMethods = (
    <>
      <Button variant="secondary" size="compact" onClick={onSearchInstead}>
        Search by name
      </Button>
      <Button variant="secondary" size="compact" onClick={onEnterManually}>
        Enter manually
      </Button>
    </>
  );

  const preview =
    phase.kind !== 'capture' && phase.kind !== 'denied' ? (
      <figure className={styles.preview}>
        <img className={styles.previewImage} src={sampleImageUrl} alt="Sample image standing in for your photo" />
      </figure>
    ) : null;

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
            <Button variant="primary" block onClick={() => setPhase({ kind: 'preview', imageId: 'sample-1' })}>
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
              <Button variant="secondary" size="compact" onClick={() => setPhase({ kind: 'denied' })}>
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
            <Button variant="primary" block onClick={() => run(phase.imageId, false)}>
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
              <Button variant="secondary" size="compact" onClick={() => run(phase.imageId, true)}>
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
        <section className={styles.section} aria-labelledby="photo-suggestions">
          <div>
            <Text as="h2" id="photo-suggestions" variant="section-title" color="primary">
              Suggested foods
            </Text>
            <Text as="p" variant="supporting" color="secondary" wrap>
              Pick the closest match. You set the amount next, and you can change the food at any point.
            </Text>
          </div>
          <ul className={styles.list}>
            {phase.candidates.map((candidate) => (
              <li key={candidate.id}>
                <FoodResultRow
                  name={candidate.name}
                  detail={candidate.detail}
                  calories={candidate.nutrition.energyKcal}
                  basis={describeReferenceBasis(candidate).toLowerCase()}
                  onClick={() => onSuggestionChosen(candidate)}
                />
              </li>
            ))}
          </ul>
          <div className={styles.demoActions}>
            <Button variant="text" size="compact" onClick={retake}>
              Retake photo
            </Button>
            {otherMethods}
          </div>
        </section>
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
              <Button variant="primary" size="compact" onClick={() => run(phase.imageId, false)}>
                Try again
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
