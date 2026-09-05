/**
 * The user-photo store (ledger §12 D1). A photograph attached to a manually entered
 * food is the user's own local data, never a repository asset. Persistence is bounded on
 * purpose: the image is downscaled to a small preview (longest edge 240 px, JPEG) and
 * kept under its own key, separate from the JSON record, with at most PHOTO_LIMIT
 * entries — the oldest are dropped first. The record itself only ever references a
 * candidate id; the preview is resolved from this store on load, after the catalogue.
 * Nothing here infers nutrition from an image.
 */
import type { RecordStorage } from './persistence';

export const PHOTO_STORE_KEY = 'portion.photos';
export const PHOTO_STORE_VERSION = 1;
/** Bounded: enough for a few weeks of manual foods, small enough for storage quotas. */
export const PHOTO_LIMIT = 40;
export const PHOTO_PREVIEW_EDGE_PX = 240;
export const PHOTO_PREVIEW_QUALITY = 0.72;

/** Accepted upload types and size (ledger §12 D1); anything else is refused with a reason. */
export const PHOTO_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'] as const;
export const PHOTO_MAX_BYTES = 8 * 1024 * 1024;

export type PhotoValidation = { ok: true } | { ok: false; reason: 'type' | 'size' };

export function validatePhotoFile(file: { type: string; size: number }): PhotoValidation {
  if (!(PHOTO_ACCEPTED_TYPES as readonly string[]).includes(file.type)) return { ok: false, reason: 'type' };
  if (file.size > PHOTO_MAX_BYTES) return { ok: false, reason: 'size' };
  return { ok: true };
}

export const PHOTO_ERRORS: Record<'type' | 'size' | 'decode', string> = {
  type: 'Choose a JPEG, PNG, WebP or HEIC image.',
  size: 'Choose an image under 8 MB.',
  decode: 'That image could not be read. Try another one.',
};

export interface StoredPhoto {
  dataUrl: string;
  savedAt: number;
}

export interface PhotoStore {
  version: typeof PHOTO_STORE_VERSION;
  photos: Record<string, StoredPhoto>;
}

const EMPTY: PhotoStore = { version: PHOTO_STORE_VERSION, photos: {} };

export function parsePhotoStore(text: string | null): PhotoStore {
  if (!text) return EMPTY;
  try {
    const raw = JSON.parse(text) as unknown;
    if (typeof raw !== 'object' || raw === null || typeof (raw as PhotoStore).photos !== 'object') return EMPTY;
    const photos: Record<string, StoredPhoto> = {};
    for (const [id, value] of Object.entries((raw as PhotoStore).photos ?? {})) {
      if (value && typeof value.dataUrl === 'string' && value.dataUrl.startsWith('data:image/') && Number.isFinite(value.savedAt)) photos[id] = { dataUrl: value.dataUrl, savedAt: value.savedAt };
    }
    return { version: PHOTO_STORE_VERSION, photos };
  } catch {
    return EMPTY;
  }
}

/** Adds a preview under the id, dropping the oldest entries beyond the limit. Pure. */
export function withPhoto(store: PhotoStore, id: string, dataUrl: string, savedAt = Date.now()): PhotoStore {
  const photos = { ...store.photos, [id]: { dataUrl, savedAt } };
  const ids = Object.keys(photos).sort((a, b) => photos[a].savedAt - photos[b].savedAt);
  while (ids.length > PHOTO_LIMIT) delete photos[ids.shift() as string];
  return { version: PHOTO_STORE_VERSION, photos };
}

export function withoutPhoto(store: PhotoStore, id: string): PhotoStore {
  const { [id]: _removed, ...photos } = store.photos;
  return { version: PHOTO_STORE_VERSION, photos };
}

export function loadPhotoStore(storage: RecordStorage | null): PhotoStore {
  if (!storage) return EMPTY;
  try {
    return parsePhotoStore(storage.getItem(PHOTO_STORE_KEY));
  } catch {
    return EMPTY;
  }
}

export function savePhotoStore(storage: RecordStorage | null, store: PhotoStore): void {
  if (!storage) return;
  try {
    storage.setItem(PHOTO_STORE_KEY, JSON.stringify(store));
  } catch {
    // Quota: the session keeps the photo in memory; the record itself is unaffected.
  }
}

/**
 * Downscales an image file to the bounded preview through a canvas. Resolves `null`
 * when the browser cannot decode it (the caller keeps the entry without a photo).
 */
export async function makePhotoPreview(file: Blob, edge = PHOTO_PREVIEW_EDGE_PX, quality = PHOTO_PREVIEW_QUALITY): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return null;
  }
}
