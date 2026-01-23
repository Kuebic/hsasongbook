/**
 * GroupSettingsForm Component
 * Phase 2: Groups - Form for editing group settings (owner only)
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, Globe, Lock, Trash2 } from 'lucide-react';
import {
  updateGroupSchema,
  type UpdateGroupFormData,
} from '../validation/groupSchemas';
import type { GroupData } from '../hooks/useGroupData';
import type { Id } from '../../../../convex/_generated/dataModel';

interface GroupSettingsFormProps {
  group: GroupData;
}

export default function GroupSettingsForm({ group }: GroupSettingsFormProps) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateGroup = useMutation(api.groups.update);
  const deleteGroupMutation = useMutation(api.groups.deleteGroup);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<UpdateGroupFormData>({
    resolver: zodResolver(updateGroupSchema),
    defaultValues: {
      name: group.name,
      description: group.description ?? '',
      joinPolicy: group.joinPolicy,
    },
    mode: 'onBlur',
  });

  const joinPolicy = watch('joinPolicy');

  const onSubmit = async (data: UpdateGroupFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await updateGroup({
        id: group._id as Id<'groups'>,
        name: data.name,
        description: data.description || undefined,
        joinPolicy: data.joinPolicy,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteGroupMutation({ id: group._id as Id<'groups'> });
      navigate('/groups');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete group');
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Cannot edit system groups
  if (group.isSystemGroup) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <p>System groups cannot be edited.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>Group Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Group Name */}
            <div>
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                disabled={isSubmitting}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                rows={3}
                disabled={isSubmitting}
                {...register('description')}
              />
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
                  onClick={() => setValue('joinPolicy', 'open', { shouldDirty: true })}
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
                  onClick={() => setValue('joinPolicy', 'approval', { shouldDirty: true })}
                  disabled={isSubmitting}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Approval
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {joinPolicy === 'open'
                  ? 'Anyone can join instantly.'
                  : 'New members need admin approval.'}
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete this group</p>
              <p className="text-sm text-muted-foreground">
                Once you delete a group, there is no going back.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Group
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {group.name}?</DialogTitle>
            <DialogDescription>
              This will permanently delete the group and remove all members.
              Content owned by this group will need to be reassigned. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
