/**
 * CreateGroupDialog Component
 * Phase 2: Groups - Dialog for creating a new group
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Globe, Lock } from 'lucide-react';
import {
  createGroupSchema,
  type CreateGroupFormData,
} from '../validation/groupSchemas';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateGroupDialog({
  open,
  onOpenChange,
}: CreateGroupDialogProps) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createGroup = useMutation(api.groups.create);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      joinPolicy: 'approval',
    },
    mode: 'onBlur',
  });

  const joinPolicy = watch('joinPolicy');

  const onSubmit = async (data: CreateGroupFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await createGroup({
        name: data.name,
        description: data.description || undefined,
        joinPolicy: data.joinPolicy,
      });

      // Close dialog and navigate to groups list
      onOpenChange(false);
      reset();
      navigate('/groups');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a New Group</DialogTitle>
          <DialogDescription>
            Create a group to collaborate with others on songs and arrangements.
          </DialogDescription>
        </DialogHeader>

        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Group Name */}
          <div>
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              placeholder="e.g., LA Band"
              disabled={isSubmitting}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <textarea
              id="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              placeholder="What is this group for?"
              rows={3}
              disabled={isSubmitting}
              {...register('description')}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Help others understand what your group is about.
            </p>
            {errors.description && (
              <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Join Policy */}
          <div>
            <Label>Join Policy</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant={joinPolicy === 'open' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setValue('joinPolicy', 'open')}
                disabled={isSubmitting}
              >
                <Globe className="h-4 w-4 mr-2" />
                Open
              </Button>
              <Button
                type="button"
                variant={joinPolicy === 'approval' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setValue('joinPolicy', 'approval')}
                disabled={isSubmitting}
              >
                <Lock className="h-4 w-4 mr-2" />
                Approval
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {joinPolicy === 'open'
                ? 'Anyone can join your group instantly.'
                : 'New members need approval from an admin.'}
            </p>
            {errors.joinPolicy && (
              <p className="text-sm text-destructive mt-1">{errors.joinPolicy.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Group
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
