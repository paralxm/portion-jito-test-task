import { useEffect, useState } from 'react';
import { ImageSquare } from '@phosphor-icons/react';

import { Icon } from '../../icons/Icon';
import { Text } from '../../primitives/Text/Text';
import { VisuallyHidden } from '../../primitives/VisuallyHidden/VisuallyHidden';
import styles from './MediaFrame.module.css';

export interface MediaFrameProps {
  /** Recipe images are 4:3 on cards and 16:9 in details; the two supported aspects. */
  aspect: '4:3' | '16:9';
  imageUrl?: string;
  /** Alt text; empty when the image is decorative alongside a nearby title. */
  imageAlt?: string;
  /** The details hero loads eagerly (it is the primary content); card thumbnails lazy-load by default. */
  eager?: boolean;
  /**
   * Thumbnail fallback: the glyph alone, with "No photo" kept for assistive technology.
   * The default fallback shows the words as well and belongs to wide frames.
   */
  compact?: boolean;
  className?: string;
}

/**
 * A fixed-aspect media region shared by RecipeCard and recipe details. A missing photo
 * — absent, or present but failed to load — is usable loaded content: a quiet neutral
 * fill with an image glyph and the words "No photo", never a skeleton or the browser's
 * broken-image icon. Nutrition and copy stay outside this component.
 */
export function MediaFrame({ aspect, imageUrl, imageAlt = '', eager = false, compact = false, className }: MediaFrameProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  useEffect(() => {
    setFailedUrl(null);
  }, [imageUrl]);
  const showImage = Boolean(imageUrl) && failedUrl !== imageUrl;

  return (
    <div className={[styles.frame, className].filter(Boolean).join(' ')} data-aspect={aspect} data-fallback={showImage ? undefined : 'true'}>
      {showImage ? (
        <img className={styles.image} src={imageUrl} alt={imageAlt} loading={eager ? 'eager' : 'lazy'} onError={() => setFailedUrl(imageUrl ?? null)} />
      ) : (
        <div className={styles.noPhoto}>
          <Icon icon={ImageSquare} size={compact ? 'default' : 'emphasis'} />
          {compact ? (
            <VisuallyHidden>No photo</VisuallyHidden>
          ) : (
            <Text variant="supporting" color="secondary">
              No photo
            </Text>
          )}
        </div>
      )}
    </div>
  );
}
