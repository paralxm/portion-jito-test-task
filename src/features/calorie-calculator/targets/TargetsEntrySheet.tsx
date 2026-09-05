import { Calculator, Info, PencilSimple } from '@phosphor-icons/react';

import { MethodOption } from '../../../design-system/components/MethodOption/MethodOption';
import { Icon } from '../../../design-system/icons/Icon';
import { Stack } from '../../../design-system/primitives/layout/Stack';
import { Text } from '../../../design-system/primitives/Text/Text';
import { ModalSheet } from '../../../design-system/patterns/ModalSheet/ModalSheet';
import type { TargetsRoute } from './targets-draft';
import styles from './TargetsEntrySheet.module.css';

export interface TargetsEntrySheetProps {
  open: boolean;
  /** Either route closes the sheet and opens the focused task; nothing is saved here. */
  onChoose: (route: TargetsRoute) => void;
  onRequestClose: () => void;
}

/**
 * The one lightweight sheet of the targets task (ledger §14): the choice between the
 * estimate and the manual route. The estimate leads (the prominent row), the manual
 * route stays a real option (the quiet row); a compact note reassures that targets can
 * be changed later from Home. Opening or dismissing it changes nothing.
 */
export function TargetsEntrySheet({ open, onChoose, onRequestClose }: TargetsEntrySheetProps) {
  return (
    <ModalSheet open={open} onRequestClose={onRequestClose} title="Set daily goal" description="Choose how to set your target.">
      <Stack gap={16}>
        <Stack gap={8}>
          <MethodOption icon={Calculator} title="Help me estimate" description="Use your body stats and activity." onClick={() => onChoose('estimate')} />
          <MethodOption icon={PencilSimple} title="I know my goal" description="Enter your daily calories." tone="quiet" onClick={() => onChoose('manual')} />
        </Stack>
        <p className={styles.note}>
          <span className={styles.noteIcon} aria-hidden="true">
            <Icon icon={Info} size="small-action" />
          </span>
          <Text as="span" variant="supporting" color="primary" wrap>
            You can change your targets anytime from Home.
          </Text>
        </p>
      </Stack>
    </ModalSheet>
  );
}
