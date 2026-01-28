/**
 * SetlistEditDialog Component
 *
 * Dialog for editing setlist metadata: name, description, performance date,
 * tags, estimated duration, and difficulty. Owner only.
 */

import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SetlistForm from './SetlistForm';
import type { Id } from '../../../../convex/_generated/dataModel';
import type { SetlistFormData } from '../types';

interface SetlistEditDialogProps {
  setlistId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SetlistEditDialog({
  setlistId,
  open,
  onOpenChange,
}: SetlistEditDialogProps) {
  const setlist = useQuery(api.setlists.get, {
    id: setlistId as Id<'setlists'>,
  });

  const updateSetlist = useMutation(api.setlists.update);
  const updateMetadata = useMutation(api.setlists.updateMetadata);

  const handleSubmit = async (data: SetlistFormData): Promise<void> => {
    try {
      // Update core fields
      await updateSetlist({
        id: setlistId as Id<'setlists'>,
        name: data.name,
        description: data.description,
        performanceDate: data.performanceDate,
      });

      // Update metadata fields separately
      await updateMetadata({
        setlistId: setlistId as Id<'setlists'>,
        tags: data.tags,
        estimatedDuration: data.estimatedDuration,
        difficulty: data.difficulty,
      });

      toast.success('Setlist updated');
      onOpenChange(false);
    } catch {
      toast.error('Failed to update setlist');
    }
  };

  if (!setlist) return null;

  const initialData: Partial<SetlistFormData> = {
    name: setlist.name,
    description: setlist.description ?? '',
    performanceDate: setlist.performanceDate ?? '',
    privacyLevel: setlist.privacyLevel ?? 'private',
    tags: setlist.tags ?? [],
    estimatedDuration: setlist.estimatedDuration,
    difficulty: setlist.difficulty,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Setlist</DialogTitle>
        </DialogHeader>

        <SetlistForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
