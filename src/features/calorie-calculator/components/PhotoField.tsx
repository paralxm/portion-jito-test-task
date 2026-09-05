import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { Camera } from '@phosphor-icons/react';

import { MediaFrame } from '../../../design-system/components/MediaFrame/MediaFrame';
import { Button } from '../../../design-system/primitives/Button/Button';
import { Text } from '../../../design-system/primitives/Text/Text';
import { PHOTO_ACCEPTED_TYPES, PHOTO_ERRORS, validatePhotoFile } from '../../../app/photo-store';
import styles from './PhotoField.module.css';

/** A photo the user attached during a manual entry: the file and a session object URL for the preview. */
export interface PhotoDraft {
  file: File;
  url: string;
  name: string;
}

export function createPhotoDraft(file: File): PhotoDraft {
  return { file, url: URL.createObjectURL(file), name: file.name };
}

/** Releases the preview's object URL; the caller does this when a draft is replaced, removed or the task ends. */
export function releasePhotoDraft(draft: PhotoDraft | null | undefined): void {
  if (draft) URL.revokeObjectURL(draft.url);
}

export interface PhotoFieldProps {
  value: PhotoDraft | null;
  /** The caller owns the draft (it must survive between steps) and releases the previous one. */
  onChange: (next: PhotoDraft | null) => void;
  className?: string;
}

/**
 * The optional photo of a manually entered food (ledger §12 D1, after R3): a local file
 * chosen by the user, validated by type and size, previewed at 4:3, with Change and
 * Remove. The image is the user's own data — it is never uploaded, it does not infer
 * nutrition, and it is kept only as a small bounded preview once the entry is logged.
 */
export function PhotoField({ value, onChange, className }: PhotoFieldProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  // A preview that cannot be decoded is reported and can be replaced or removed.
  useEffect(() => setFailed(false), [value?.url]);

  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const check = validatePhotoFile(file);
    if (!check.ok) {
      setError(PHOTO_ERRORS[check.reason]);
      return;
    }
    setError(undefined);
    onChange(createPhotoDraft(file));
  };

  const remove = () => {
    setError(undefined);
    onChange(null);
    inputRef.current?.focus();
  };

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <Text as="span" id={`${id}-label`} variant="label" color="primary">
        Photo <Text variant="supporting" color="secondary">(optional)</Text>
      </Text>
      <input ref={inputRef} id={`${id}-input`} type="file" accept={PHOTO_ACCEPTED_TYPES.join(',')} className={styles.input} aria-labelledby={`${id}-label`} aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`} onChange={choose} />
      {value ? (
        <div className={styles.preview}>
          <div className={styles.thumbnail}>
            {failed ? <MediaFrame aspect="4:3" compact /> : <img src={value.url} alt={`Your photo, ${value.name}`} className={styles.image} onError={() => setFailed(true)} />}
          </div>
          <div className={styles.previewText}>
            <Text as="p" variant="supporting" color="primary" wrap className={styles.name}>
              {failed ? 'This image could not be shown.' : value.name}
            </Text>
            <div className={styles.actions}>
              <Button variant="text" size="small" onClick={() => inputRef.current?.click()}>
                Change photo
              </Button>
              <Button variant="text" size="small" onClick={remove}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button variant="secondary" icon={Camera} onClick={() => inputRef.current?.click()} className={styles.add}>
          Add a photo
        </Button>
      )}
      <Text as="p" id={`${id}-help`} variant="supporting" color="secondary" wrap>
        Stays on this device as a small preview. It does not calculate anything.
      </Text>
      <div aria-live="polite">
        {error ? (
          <Text as="p" id={`${id}-error`} variant="supporting" color="error" wrap>
            {error}
          </Text>
        ) : null}
      </div>
    </div>
  );
}
