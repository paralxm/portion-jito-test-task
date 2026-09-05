import { describe, expect, it } from 'vitest';

import { loadPhotoStore, parsePhotoStore, PHOTO_LIMIT, PHOTO_STORE_KEY, savePhotoStore, validatePhotoFile, withoutPhoto, withPhoto, type PhotoStore } from './photo-store';
import type { RecordStorage } from './persistence';

const fakeStorage = (): RecordStorage & { map: Map<string, string> } => {
  const map = new Map<string, string>();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
};

describe('photo store', () => {
  it('validates type and size before anything is read', () => {
    expect(validatePhotoFile({ type: 'image/jpeg', size: 1000 })).toEqual({ ok: true });
    expect(validatePhotoFile({ type: 'image/gif', size: 1000 })).toEqual({ ok: false, reason: 'type' });
    expect(validatePhotoFile({ type: 'image/png', size: 9 * 1024 * 1024 })).toEqual({ ok: false, reason: 'size' });
  });

  it('is bounded: the oldest previews are dropped beyond the limit', () => {
    let store: PhotoStore = { version: 1, photos: {} };
    for (let i = 0; i < PHOTO_LIMIT + 5; i += 1) store = withPhoto(store, `manual-${i}`, 'data:image/jpeg;base64,AAAA', i);
    expect(Object.keys(store.photos)).toHaveLength(PHOTO_LIMIT);
    expect(store.photos['manual-0']).toBeUndefined();
    expect(store.photos['manual-4']).toBeUndefined();
    expect(store.photos['manual-5']).toBeDefined();
    expect(store.photos[`manual-${PHOTO_LIMIT + 4}`]).toBeDefined();
    expect(Object.keys(withoutPhoto(store, 'manual-5').photos)).toHaveLength(PHOTO_LIMIT - 1);
  });

  it('round-trips through storage, separate from the record, and ignores garbage', () => {
    const storage = fakeStorage();
    savePhotoStore(storage, withPhoto({ version: 1, photos: {} }, 'manual-a', 'data:image/jpeg;base64,AAAA', 1));
    expect(storage.map.has(PHOTO_STORE_KEY)).toBe(true);
    expect(loadPhotoStore(storage).photos['manual-a'].dataUrl).toBe('data:image/jpeg;base64,AAAA');
    expect(parsePhotoStore('{nope').photos).toEqual({});
    expect(parsePhotoStore(JSON.stringify({ version: 1, photos: { bad: { dataUrl: 'http://evil', savedAt: 1 }, ok: { dataUrl: 'data:image/png;base64,BB', savedAt: 2 } } })).photos).toEqual({ ok: { dataUrl: 'data:image/png;base64,BB', savedAt: 2 } });
    expect(loadPhotoStore(null).photos).toEqual({});
  });
});
