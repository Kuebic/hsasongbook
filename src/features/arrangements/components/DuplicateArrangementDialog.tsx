/**
 * DuplicateArrangementDialog Component
 *
 * Allows any authenticated user to duplicate an arrangement.
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Copy, Loader2, AlertCircle } from 'lucide-react';
import type { Id } from '../../../../convex/_generated/dataModel';

const duplicateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
});

type DuplicateFormData = z.infer<typeof duplicateSchema>;

// Only the fields we actually need from the arrangement
interface SourceArrangement {
  id: string;
  name: string;
}

interface DuplicateArrangementDialogProps {
  sourceArrangement: SourceArrangement;
  songSlug: string;
  // Controlled mode props
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean; // Default: true
}

export function DuplicateArrangementDialog({
  sourceArrangement,
  songSlug,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  showTrigger = true,
}: DuplicateArrangementDialogProps) {
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;

  const duplicateArrangement = useMutation(api.arrangements.duplicate);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DuplicateFormData>({
    resolver: zodResolver(duplicateSchema),
    defaultValues: {
      name: `Copy of ${sourceArrangement.name}`,
    },
  });

  const onSubmit = async (data: DuplicateFormData) => {
    setError(null);
    try {
      const result = await duplicateArrangement({
        sourceArrangementId: sourceArrangement.id as Id<'arrangements'>,
        newName: data.name.trim(),
      });
      setOpen(false);
      reset();
      // Navigate to the new arrangement
      navigate(`/song/${songSlug}/${result.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate arrangement');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset form when opening
      reset({ name: `Copy of ${sourceArrangement.name}` });
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Duplicate Arrangement</DialogTitle>
          <DialogDescription>
            Create your own copy of "{sourceArrangement.name}". You'll be the owner
            of the new arrangement and can customize it as you like.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Arrangement Name</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter a name for your copy"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name.message}
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
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
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
