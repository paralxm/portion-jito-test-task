import type { ReactNode } from 'react';

import { Text } from '../../primitives/Text/Text';
import styles from './CameraStage.module.css';

export type CameraStageTone = 'scanning' | 'detected' | 'paused';
export type CameraStageGuide = 'corners' | 'circle' | 'none';

export interface CameraStageProps {
  /** Short status in the chip, e.g. "Scanning", "Code read", "Frame the food". Text, never colour alone. */
  status?: string;
  /** `scanning` (neutral frame, optional line), `detected` (detected treatment: light blue frame and chip), `paused` (dimmed frame). */
  tone?: CameraStageTone;
  /** Focus corners for a barcode, a circular guide for a dish, or none over a captured frame. */
  guide?: CameraStageGuide;
  /** The moving scan line; only while scanning, and never under reduced motion. */
  scanLine?: boolean;
  /** A captured or sample frame filling the stage. */
  imageUrl?: string;
  imageAlt?: string;
  /** `4:3` for the barcode step, `1:1` for the photo step. */
  aspect?: '4:3' | '1:1';
  /** Fixture media or guidance drawn inside the guide, e.g. the sample barcode. */
  children?: ReactNode;
  /** One line under the guide, on the stage. */
  caption?: ReactNode;
  className?: string;
}

/**
 * The shared dark viewfinder of the barcode and photo steps: the stage surface, a text
 * status chip, a framing guide, an optional scan line and the captured frame when one
 * exists. It is the only dark surface in the product and exists to show a viewfinder,
 * never as a theme. The prototype has no camera, so the stage shows fixture media the
 * surrounding copy names as such; it never imitates a live feed.
 */
export function CameraStage({ status, tone = 'scanning', guide = 'corners', scanLine = false, imageUrl, imageAlt = '', aspect = '4:3', children, caption, className }: CameraStageProps) {
  return (
    <div className={[styles.stage, className].filter(Boolean).join(' ')} data-tone={tone} data-aspect={aspect} data-has-image={imageUrl ? 'true' : undefined}>
      {imageUrl ? <img className={styles.image} src={imageUrl} alt={imageAlt} /> : null}
      {status ? (
        <Text as="p" variant="caption-strong" color="inherit" className={styles.chip}>
          {status}
        </Text>
      ) : null}
      <div className={styles.guideArea}>
        {guide === 'corners' ? (
          <div className={styles.corners} aria-hidden="true">
            <span data-corner="tl" />
            <span data-corner="tr" />
            <span data-corner="bl" />
            <span data-corner="br" />
            {scanLine ? <span className={styles.scanLine} /> : null}
          </div>
        ) : null}
        {guide === 'circle' ? <div className={styles.circle} aria-hidden="true" /> : null}
        {children ? <div className={styles.content}>{children}</div> : null}
      </div>
      {caption ? (
        <Text as="p" variant="supporting" color="inherit" align="center" wrap className={styles.caption}>
          {caption}
        </Text>
      ) : null}
    </div>
  );
}
