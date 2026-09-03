import { Text } from '../../primitives/Text/Text';
import styles from './MediaFrame.module.css';

export interface MediaFrameProps {
  /** Recipe images are 4:3 on cards and 16:9 in details; the two supported aspects. */
  aspect: '4:3' | '16:9';
  imageUrl?: string;
  /** Alt text; empty when the image is decorative alongside a nearby title. */
  imageAlt?: string;
  /** The details hero loads eagerly (it is the primary content); card thumbnails lazy-load by default. */
  eager?: boolean;
  className?: string;
}

/**
 * A fixed-aspect media region shared by RecipeCard and recipe details. A missing photo
 * is usable loaded content — a quiet neutral fill with the words "No photo" — never a
 * skeleton or a broken-image glyph. Nutrition and copy stay outside this component.
 */
export function MediaFrame({ aspect, imageUrl, imageAlt = '', eager = false, className }: MediaFrameProps) {
  return (
    <div className={[styles.frame, className].filter(Boolean).join(' ')} data-aspect={aspect}>
      {imageUrl ? (
        <img className={styles.image} src={imageUrl} alt={imageAlt} loading={eager ? 'eager' : 'lazy'} />
      ) : (
        <div className={styles.noPhoto}>
          <Text variant="supporting" color="secondary">
            No photo
          </Text>
        </div>
      )}
    </div>
  );
}
