import { Barcode, Camera, MagnifyingGlass, PencilSimple } from '@phosphor-icons/react';

import { MethodRow } from '../../components/MethodRow/MethodRow';
import { Stack } from '../../primitives/layout/Stack';
import { ModalSheet } from '../ModalSheet/ModalSheet';

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
 * O01 — the shared Add food chooser, opened from every root and from recipe details.
 * Selecting a method starts identification only; it never commits food data.
 */
export function MethodSheet({ open, onRequestClose, onChoose }: MethodSheetProps) {
  return (
    <ModalSheet open={open} onRequestClose={onRequestClose} title="How would you like to add food?" description="Choose a method to identify your food. You can review it before anything changes.">
      <Stack gap={8}>
        <MethodRow icon={MagnifyingGlass} title="Search food" description="Type a name and pick from the results" onClick={() => onChoose('search')} />
        <MethodRow icon={Barcode} title="Scan barcode" description="Point the camera at a product code" onClick={() => onChoose('barcode')} />
        <MethodRow icon={Camera} title="Take a photo" description="Get a suggestion you can correct" onClick={() => onChoose('photo')} />
        <MethodRow icon={PencilSimple} title="Enter manually" description="Type the nutrition you already know" onClick={() => onChoose('manual')} />
      </Stack>
    </ModalSheet>
  );
}
