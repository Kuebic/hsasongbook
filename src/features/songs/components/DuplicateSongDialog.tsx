/**
 * DuplicateSongDialog Component
 *
 * Allows any authenticated user to duplicate a song.
 * Creates a copy with the user as the new owner.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Id } from '../../../../convex/_generated/dataModel';

const duplicateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
});

type DuplicateFormData = z.infer<typeof duplicateSchema>;

interface SourceSong {
  id: string;
  title: string;
}

interface DuplicateSongDialogProps {
  sourceSong: SourceSong;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DuplicateSongDialog({
  sourceSong,
  open,
  onOpenChange,
}: DuplicateSongDialogProps) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const duplicateSong = useMutation(api.songs.duplicate);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DuplicateFormData>({
    resolver: zodResolver(duplicateSchema),
    defaultValues: {
      title: `Copy of ${sourceSong.title}`,
    },
  });

  const onSubmit = async (data: DuplicateFormData) => {
    setError(null);
    try {
      const result = await duplicateSong({
        sourceSongId: sourceSong.id as Id<'songs'>,
        newTitle: data.title.trim(),
      });
      onOpenChange(false);
      reset();
      // Navigate to the new song
      navigate(`/song/${result.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate song');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (newOpen) {
      // Reset form when opening
      reset({ title: `Copy of ${sourceSong.title}` });
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Duplicate Song</DialogTitle>
          <DialogDescription>
            Create your own copy of "{sourceSong.title}". You'll be the owner
            of the new song and can customize it as you like.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Song Title</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Enter a title for your copy"
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.title.message}
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-h-[44px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Copy'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
