import { useId } from 'react';
import { Barcode, Camera, MagnifyingGlass, PencilSimple } from '@phosphor-icons/react';

import { MethodOption } from '../../components/MethodOption/MethodOption';
import { Separator } from '../../primitives/Separator/Separator';
import { Text } from '../../primitives/Text/Text';
import { ModalSheet } from '../ModalSheet/ModalSheet';
import styles from './MethodSheet.module.css';

/** The four entry methods, in the order the contract fixes. */
export type EntryMethod = 'search' | 'barcode' | 'photo' | 'manual';

export interface MethodSheetProps {
  open: boolean;
  /** Dismissal restores the exact invoking surface; nothing is committed. */
  onRequestClose: () => void;
  /** Choosing a method closes the sheet first, then starts that journey. */
  onChoose: (method: EntryMethod) => void;
}

/**
 * O01 — the shared Log food chooser (after R6), opened from every root and from recipe
 * details. In this order and hierarchy: one prominent full-width Search food row; a
 * restrained caption over the two camera methods as equal cards side by side (Scan
 * barcode left, Take a photo right); a separator; a quieter full-width Enter manually
 * row. Selecting a method starts identification only; it never commits food data.
 * Under 20 rem of body width (enlarged text on every supported viewport) the camera pair
 * stacks, keeping the order Search → Barcode → Photo → Manual.
 */
export function MethodSheet({ open, onRequestClose, onChoose }: MethodSheetProps) {
  const id = useId();
  return (
    <ModalSheet open={open} onRequestClose={onRequestClose} title="Log food" description="Choose how to identify the food. You review it before anything is saved.">
      <div className={styles.frame}>
        <div className={styles.methods}>
          <MethodOption icon={MagnifyingGlass} title="Search food" description="Find a product, brand or dish" onClick={() => onChoose('search')} />
          <div className={styles.camera} role="group" aria-labelledby={`${id}-camera`}>
            <Text as="p" id={`${id}-camera`} variant="caption" color="secondary" className={styles.caption}>
              With the camera
            </Text>
            <div className={styles.pair}>
              <MethodOption presentation="card" icon={Barcode} title="Scan barcode" description="For packaged food" onClick={() => onChoose('barcode')} />
              <MethodOption presentation="card" icon={Camera} title="Take a photo" description="Meals and plated dishes" onClick={() => onChoose('photo')} />
            </div>
          </div>
          <Separator />
          <MethodOption tone="quiet" icon={PencilSimple} title="Enter manually" description="Use known label values or your own" onClick={() => onChoose('manual')} />
        </div>
      </div>
    </ModalSheet>
  );
}
