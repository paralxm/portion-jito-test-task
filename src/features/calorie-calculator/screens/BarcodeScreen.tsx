import { useEffect, useRef, useState } from 'react';

import { CameraStage } from '../../../design-system/components/CameraStage/CameraStage';
import { EmptyState } from '../../../design-system/components/EmptyState/EmptyState';
import { InlineMessage } from '../../../design-system/components/InlineMessage/InlineMessage';
import { LoadingState } from '../../../design-system/components/LoadingState/LoadingState';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Text } from '../../../design-system/primitives/Text/Text';
import { VisuallyHidden } from '../../../design-system/primitives/VisuallyHidden/VisuallyHidden';
import { AppHeader } from '../../../design-system/patterns/AppHeader/AppHeader';
import { FocusedFlowLayout } from '../../../design-system/templates/FocusedFlowLayout/FocusedFlowLayout';
import type { FoodCandidate } from '../domain/calculation';
import styles from './Acquisition.module.css';

export type BarcodeLookupResult = { kind: 'found'; candidate: FoodCandidate } | { kind: 'not-found' } | { kind: 'failed' };

/**
 * The barcode step's phases. `permission-pending` is the app-side state while the system
 * camera prompt (P01) is showing; the prototype has no camera, so it is reached only
 * through `initialPhase`, as are the not-found, failed, unreadable and denied phases
 * (ledger D-24).
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
  /** The prototype camera: resolves with a code once "read". A read that lands after Back or a rescan is ignored. */
  read: () => Promise<string>;
  /** Product lookup for a read code. The screen ignores responses that arrive after a rescan or Back. */
  lookup: (code: string) => Promise<BarcodeLookupResult>;
  /** A matched product goes to review; the scanner stays paused underneath. */
  onFound: (candidate: FoodCandidate, code: string) => void;
  onBack: () => void;
  onSearchInstead: () => void;
  onEnterManually: () => void;
  /** Deterministic starting phase for stories and tests; the runtime always starts scanning. */
  initialPhase?: BarcodePhase;
}

/** Fixture media on the stage: a drawn sample barcode, named for assistive technology. */
function SampleBarcode() {
  return (
    <div className={styles.sampleBarcode}>
      <VisuallyHidden>Sample barcode</VisuallyHidden>
    </div>
  );
}

/**
 * S04 — Barcode. Capture pauses after one read so a product is looked up once. Each
 * failure names its cause and keeps what is still useful: an unreadable code invites
 * another read, an unknown product keeps the code visible, a failed lookup can be
 * retried for the same code, and camera denial offers the other methods. The stage is
 * the shared dark viewfinder; there are no simulator controls.
 */
export function BarcodeScreen({ read, lookup, onFound, onBack, onSearchInstead, onEnterManually, initialPhase }: BarcodeScreenProps) {
  const [phase, setPhase] = useState<BarcodePhase>(initialPhase ?? { kind: 'scanning' });
  const request = useRef(0);

  useEffect(() => {
    return () => {
      request.current += 1;
    };
  }, []);

  const lookUp = (code: string) => {
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

  // While scanning, the prototype camera reads the sample code once; a read that arrives
  // after Back or a rescan is dropped by the request id.
  useEffect(() => {
    if (phase.kind !== 'scanning') return;
    const id = ++request.current;
    read().then((code) => {
      if (id !== request.current) return;
      lookUp(code);
    });
    // lookUp reads the latest props through closure; the phase is the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.kind]);

  const rescan = () => {
    request.current += 1;
    setPhase({ kind: 'scanning' });
  };

  const code = 'code' in phase ? phase.code : null;
  const detected = phase.kind === 'looking-up' || phase.kind === 'paused' || phase.kind === 'not-found' || phase.kind === 'lookup-failed';

  return (
    <FocusedFlowLayout header={<AppHeader variant="focused" title="Scan barcode" onBack={onBack} />}>
      {phase.kind === 'denied' ? (
        <EmptyState
          kind="failure"
          title="Camera access is needed to scan"
          actions={
            <>
              <Button variant="primary" onClick={rescan}>
                Try again
              </Button>
              <Button variant="secondary" onClick={onSearchInstead}>
                Search by name
              </Button>
              <Button variant="secondary" onClick={onEnterManually}>
                Enter manually
              </Button>
            </>
          }
        >
          Allow camera access for this site in your browser settings (usually under Site settings or Permissions), then try again — or add the food another way.
        </EmptyState>
      ) : (
        <>
          <CameraStage
            status={
              phase.kind === 'permission-pending'
                ? 'Waiting for permission'
                : phase.kind === 'scanning'
                  ? 'Scanning'
                  : phase.kind === 'unreadable'
                    ? 'Not readable'
                    : phase.kind === 'looking-up'
                      ? 'Code read'
                      : 'Paused'
            }
            tone={detected ? 'detected' : phase.kind === 'scanning' ? 'scanning' : 'paused'}
            scanLine={phase.kind === 'scanning'}
            caption={phase.kind === 'permission-pending' ? 'Allow access in the system prompt to continue.' : undefined}
          >
            {phase.kind === 'permission-pending' ? null : <SampleBarcode />}
          </CameraStage>

          <div className={styles.guidance} aria-live="polite">
            {phase.kind === 'permission-pending' ? (
              <>
                <Text as="p" variant="compact-title" color="primary">
                  Waiting for camera permission
                </Text>
                <Text as="p" variant="supporting" color="secondary" wrap>
                  The browser or system is asking for camera access; that prompt is outside this app. Allow it to continue, or add the food another way.
                </Text>
              </>
            ) : phase.kind === 'scanning' ? (
              <>
                <Text as="p" variant="compact-title" color="primary">
                  Point the camera at the barcode
                </Text>
                <Text as="p" variant="supporting" color="secondary" wrap>
                  Keep the whole code inside the frame. Scanning stops on its own once a code is read.
                </Text>
              </>
            ) : code ? (
              <Text as="p" variant="supporting" color="secondary" numeric wrap>
                Code {code} read. Scanning is paused.
              </Text>
            ) : (
              <Text as="p" variant="supporting" color="secondary">
                Scanning is paused.
              </Text>
            )}
          </div>

          {phase.kind === 'scanning' ? (
            <Text as="p" variant="caption" color="secondary" wrap>
              This prototype has no camera or product database: it reads a sample barcode after a moment.
            </Text>
          ) : null}

          {phase.kind === 'permission-pending' ? (
            <div className={styles.demoActions}>
              <Button variant="secondary" size="small" onClick={onSearchInstead}>
                Search by name
              </Button>
              <Button variant="secondary" size="small" onClick={onEnterManually}>
                Enter manually
              </Button>
            </div>
          ) : null}
        </>
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
              <Button variant="primary" size="small" onClick={onEnterManually}>
                Enter manually
              </Button>
              <Button variant="secondary" size="small" onClick={onSearchInstead}>
                Search by name
              </Button>
              <Button variant="secondary" size="small" onClick={rescan}>
                Scan again
              </Button>
            </>
          }
        >
          The code was read correctly, but no product in the catalogue matches {phase.code}. Enter the values yourself, search by name, or scan another product.
        </InlineMessage>
      ) : null}

      {phase.kind === 'lookup-failed' ? (
        <InlineMessage
          tone="error"
          title="Lookup failed"
          actions={
            <>
              <Button variant="primary" size="small" onClick={() => lookUp(phase.code)}>
                Retry lookup
              </Button>
              <Button variant="secondary" size="small" onClick={onEnterManually}>
                Enter manually
              </Button>
            </>
          }
        >
          The product service did not respond for code {phase.code}. The code is kept, so you can retry without scanning again.
        </InlineMessage>
      ) : null}

      {phase.kind === 'scanning' || phase.kind === 'unreadable' ? (
        <div className={styles.demoActions}>
          <Button variant="text" size="small" onClick={onSearchInstead}>
            Search by name
          </Button>
          {phase.kind === 'scanning' ? (
            <Button variant="text" size="small" onClick={onEnterManually}>
              Enter manually
            </Button>
          ) : null}
        </div>
      ) : null}
    </FocusedFlowLayout>
  );
}
