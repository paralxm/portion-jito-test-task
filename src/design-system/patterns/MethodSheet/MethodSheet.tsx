import { Barcode, Camera, MagnifyingGlass, PencilSimple } from '@phosphor-icons/react';

import { MethodOption } from '../../components/MethodOption/MethodOption';
import { ModalSheet } from '../ModalSheet/ModalSheet';
import styles from './MethodSheet.module.css';

/** The four entry methods, in the order the low-fidelity contract fixes. */
export type EntryMethod = 'search' | 'barcode' | 'photo' | 'manual';

export interface MethodSheetProps {
  open: boolean;
  /** Dismissal restores the exact invoking surface; nothing is committed. */
  onRequestClose: () => void;
  /** Choosing a method closes the sheet first, then starts that journey. */
  onChoose: (method: EntryMethod) => void;
}

/**
 * O01 — the shared Log food chooser, opened from every root and from recipe details.
 * Four equal method tiles in a 2 × 2 grid (top-left to bottom-right: Search food, Scan
 * barcode, Take a photo, Enter manually) at every supported width. Selecting a tile starts
 * identification only; it never commits food data. The grid is a named container: only
 * below 17 rem of available width — enlarged text — do the tiles become rows (see MethodOption).
 */
export function MethodSheet({ open, onRequestClose, onChoose }: MethodSheetProps) {
  return (
    <ModalSheet open={open} onRequestClose={onRequestClose} title="Log food" description="Choose how to identify the food. You review it before anything is added to today.">
      <div className={styles.frame}>
        <div className={styles.grid}>
          <MethodOption icon={MagnifyingGlass} title="Search food" description="Find a product or dish" onClick={() => onChoose('search')} />
          <MethodOption icon={Barcode} title="Scan barcode" description="For packaged food" onClick={() => onChoose('barcode')} />
          <MethodOption icon={Camera} title="Take a photo" description="Review suggested matches" onClick={() => onChoose('photo')} />
          <MethodOption icon={PencilSimple} title="Enter manually" description="Use known label values" onClick={() => onChoose('manual')} />
        </div>
      </div>
    </ModalSheet>
  );
}
