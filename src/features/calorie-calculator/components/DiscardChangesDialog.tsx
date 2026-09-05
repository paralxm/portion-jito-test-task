import { ConfirmDialog } from '../../../design-system/patterns/ConfirmDialog/ConfirmDialog';

export interface DiscardChangesDialogProps {
  open: boolean;
  /** Keep editing, Escape and backdrop: the draft is preserved and focus returns to the caller's control. */
  onKeepEditing: () => void;
  /** Only this clears the draft and returns to the recorded task origin. */
  onDiscard: () => void;
  /** The consequence in words for this task; defaults to the food task's copy. */
  body?: string;
}

/** The shared copy of the exit confirmation (ledger §12 D3). */
export const DISCARD_CHANGES_COPY = {
  title: 'Discard changes?',
  body: 'Your unsaved food details and portion changes will be lost. Nothing already logged will be changed.',
  keep: 'Keep editing',
  discard: 'Discard changes',
} as const;

/**
 * One exit confirmation for every food task — manual entry (both steps), barcode review
 * and photo review — over the shared `ConfirmDialog`: Keep editing receives initial
 * focus; Escape and any permitted dismissal only close the confirmation; the destructive
 * action carries the system's error tokens and says what it does in words, so colour is
 * never the only cue.
 */
export function DiscardChangesDialog({ open, onKeepEditing, onDiscard, body = DISCARD_CHANGES_COPY.body }: DiscardChangesDialogProps) {
  return (
    <ConfirmDialog open={open} title={DISCARD_CHANGES_COPY.title} confirmLabel={DISCARD_CHANGES_COPY.discard} cancelLabel={DISCARD_CHANGES_COPY.keep} destructive onConfirm={onDiscard} onCancel={onKeepEditing}>
      {body}
    </ConfirmDialog>
  );
}
