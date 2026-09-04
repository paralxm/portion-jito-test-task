import { useEffect, useRef, useState } from 'react';

import { EmptyState } from '../../../design-system/components/EmptyState/EmptyState';
import { InlineMessage } from '../../../design-system/components/InlineMessage/InlineMessage';
import { LoadingState } from '../../../design-system/components/LoadingState/LoadingState';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Text } from '../../../design-system/primitives/Text/Text';
import { AppHeader } from '../../../design-system/patterns/AppHeader/AppHeader';
import { FocusedFlowLayout } from '../../../design-system/templates/FocusedFlowLayout/FocusedFlowLayout';
import type { FoodCandidate } from '../domain/calculation';
import styles from './Acquisition.module.css';

export type BarcodeLookupResult = { kind: 'found'; candidate: FoodCandidate } | { kind: 'not-found' } | { kind: 'failed' };

export interface BarcodeDemoCodes {
  /** A code the lookup matches. */
  found: string;
  /** A readable code no product matches. */
  unknown: string;
  /** A code whose lookup fails. */
  failing: string;
}

/**
 * The barcode step's phases. `permission-pending` is the app-side state while the system
 * camera prompt (P01) is showing; the prototype has no camera, so it is reached only
 * through `initialPhase`.
 */
export type BarcodePhase =
  | { kind: 'permission-pending' }
  | { kind: 'scanning' }
  | { kind: 'looking-up'; code: string }
  | { kind: 'paused'; code: string }
  | { kind: 'unreadable' }
  | { kind: 'not-found'; code: string }
  | { kind: 'lookup-failed'; code: string }
  | { kind: 'denied' };

export interface BarcodeScreenProps {
  /** Product lookup for a read code. The screen ignores responses that arrive after a rescan or Back. */
  lookup: (code: string) => Promise<BarcodeLookupResult>;
  demoCodes: BarcodeDemoCodes;
  /** A matched product goes to review; the scanner stays paused underneath. */
  onFound: (candidate: FoodCandidate, code: string) => void;
  onBack: () => void;
  onSearchInstead: () => void;
  onEnterManually: () => void;
  /** Deterministic starting phase for stories and tests; the runtime always starts scanning. */
  initialPhase?: BarcodePhase;
}

type Phase = BarcodePhase;

/**
 * S04 — Barcode. Capture pauses after one read so a product is looked up once. Each
 * failure names its cause and keeps what is still useful: an unreadable code invites
 * another read, an unknown product keeps the code visible, a failed lookup can be
 * retried for the same code, and camera denial offers the other methods.
 */
export function BarcodeScreen({ lookup, demoCodes, onFound, onBack, onSearchInstead, onEnterManually, initialPhase }: BarcodeScreenProps) {
  const [phase, setPhase] = useState<Phase>(initialPhase ?? { kind: 'scanning' });
  const request = useRef(0);

  useEffect(() => {
    return () => {
      request.current += 1;
    };
  }, []);

  const read = (code: string) => {
    if (phase.kind === 'looking-up') return;
    const id = ++request.current;
    setPhase({ kind: 'looking-up', code });
    lookup(code).then((result) => {
      if (id !== request.current) return;
      if (result.kind === 'found') {
        setPhase({ kind: 'paused', code });
        onFound(result.candidate, code);
      } else if (result.kind === 'not-found') {
        setPhase({ kind: 'not-found', code });
      } else {
        setPhase({ kind: 'lookup-failed', code });
      }
    });
  };

  const rescan = () => {
    request.current += 1;
    setPhase({ kind: 'scanning' });
  };

  const busy = phase.kind === 'looking-up';
  const code = 'code' in phase ? phase.code : null;

  return (
    <FocusedFlowLayout header={<AppHeader variant="focused" title="Scan barcode" onBack={onBack} />}>
      {phase.kind === 'denied' ? (
        <EmptyState
          kind="failure"
          title="Camera access is needed to scan"
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
      ) : phase.kind === 'permission-pending' ? (
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
          <div className={styles.demoActions}>
            <Button variant="secondary" size="small" onClick={onSearchInstead}>
              Search by name
            </Button>
            <Button variant="secondary" size="small" onClick={onEnterManually}>
              Enter manually
            </Button>
          </div>
        </>
      ) : (
        <div className={styles.viewfinder} aria-live="polite">
          <div className={styles.frame} data-paused={phase.kind !== 'scanning' || undefined} />
          {phase.kind === 'scanning' ? (
            <>
              <Text as="p" variant="body" color="primary">
                Point the camera at the product barcode
              </Text>
              <Text as="p" variant="supporting" color="secondary">
                Scanning stops on its own once a code is read.
              </Text>
            </>
          ) : code ? (
            <Text as="p" variant="supporting" color="secondary" numeric>
              Code {code} read. Scanning is paused.
            </Text>
          ) : (
            <Text as="p" variant="supporting" color="secondary">
              Scanning is paused.
            </Text>
          )}
        </div>
      )}

      {phase.kind === 'looking-up' ? <LoadingState label="Looking up product" /> : null}

      {phase.kind === 'paused' ? (
        <div className={styles.actions}>
          <Button variant="secondary" onClick={rescan}>
            Scan again
          </Button>
        </div>
      ) : null}

      {phase.kind === 'unreadable' ? (
        <InlineMessage
          tone="warning"
          title="The barcode could not be read"
          actions={
            <>
              <Button variant="primary" size="small" onClick={rescan}>
                Try again
              </Button>
              <Button variant="secondary" size="small" onClick={onEnterManually}>
                Enter manually
              </Button>
            </>
          }
        >
          Hold the phone steady and keep the whole code inside the frame.
        </InlineMessage>
      ) : null}

      {phase.kind === 'not-found' ? (
        <InlineMessage
          tone="error"
          title="Product not found"
          actions={
            <>
              <Button variant="primary" size="small" onClick={rescan}>
                Scan again
              </Button>
              <Button variant="secondary" size="small" onClick={onSearchInstead}>
                Search by name
              </Button>
              <Button variant="secondary" size="small" onClick={onEnterManually}>
                Enter manually
              </Button>
            </>
          }
        >
          Code {phase.code} was read, but no product matches it. Search by name or enter the values yourself.
        </InlineMessage>
      ) : null}

      {phase.kind === 'lookup-failed' ? (
        <InlineMessage
          tone="error"
          title="Lookup failed"
          actions={
            <>
              <Button variant="primary" size="small" onClick={() => read(phase.code)}>
                Retry lookup
              </Button>
              <Button variant="secondary" size="small" onClick={onEnterManually}>
                Enter manually
              </Button>
            </>
          }
        >
          The product service did not respond for code {phase.code}. The code is kept so you can retry.
        </InlineMessage>
      ) : null}

      {phase.kind === 'scanning' ? (
        <fieldset className={styles.demo} disabled={busy}>
          <legend>
            <Text variant="label" color="secondary">
              Prototype controls
            </Text>
          </legend>
          <Text as="p" variant="supporting" color="secondary" wrap>
            This prototype has no camera or product database. These buttons simulate what a scan would produce.
          </Text>
          <div className={styles.demoActions}>
            <Button variant="secondary" size="small" onClick={() => read(demoCodes.found)}>
              Simulate a matched product
            </Button>
            <Button variant="secondary" size="small" onClick={() => read(demoCodes.unknown)}>
              Simulate an unknown product
            </Button>
            <Button variant="secondary" size="small" onClick={() => read(demoCodes.failing)}>
              Simulate a failed lookup
            </Button>
            <Button variant="secondary" size="small" onClick={() => setPhase({ kind: 'unreadable' })}>
              Simulate an unreadable code
            </Button>
            <Button variant="secondary" size="small" onClick={() => setPhase({ kind: 'denied' })}>
              Simulate camera denied
            </Button>
          </div>
        </fieldset>
      ) : null}
    </FocusedFlowLayout>
  );
}
