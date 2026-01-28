/**
 * ArrangementEditDialog Component
 *
 * Dialog for editing arrangement metadata: settings (key, tempo, etc.),
 * audio references (MP3, YouTube), and attachments.
 * Separate from ChordPro content editing.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditModeAccordion } from './EditModeAccordion';
import { useArrangementData } from '../hooks/useArrangementData';
import { useArrangementAttachments } from '../hooks/useArrangementAttachments';
import logger from '@/lib/logger';
import type { ArrangementMetadata } from '@/types/Arrangement.types';

interface ArrangementEditDialogProps {
  arrangementId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArrangementEditDialog({
  arrangementId,
  open,
  onOpenChange,
}: ArrangementEditDialogProps) {
  const { arrangement, updateArrangement } = useArrangementData();
  const { attachmentCount } = useArrangementAttachments(arrangementId);

  if (!arrangement) return null;

  const handleMetadataChange = async (newMetadata: ArrangementMetadata) => {
    logger.debug('Metadata changed, saving to Convex:', newMetadata);
    const result = await updateArrangement(newMetadata);
    if (result.success) {
      logger.debug('Metadata saved to Convex successfully');
    } else {
      logger.error('Failed to save metadata:', result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Arrangement</DialogTitle>
        </DialogHeader>

        <EditModeAccordion
          metadata={{
            key: arrangement.key,
            tempo: arrangement.tempo,
            timeSignature: arrangement.timeSignature,
            capo: arrangement.capo,
            difficulty: arrangement.difficulty,
          }}
          onMetadataChange={handleMetadataChange}
          arrangementId={arrangementId}
          youtubeUrl={arrangement.youtubeUrl}
          hasAudio={!!arrangement.audioFileKey}
          attachmentCount={attachmentCount}
        />
      </DialogContent>
    </Dialog>
  );
}
