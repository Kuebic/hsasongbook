/**
 * SetlistsIndexPage
 *
 * Main page for listing all setlists with create/delete operations.
 * Pattern: Follows SearchPage.tsx
 */

import { useState } from 'react';
import { useSetlists } from '../hooks/useSetlists';
import SetlistList from '../components/SetlistList';
import SetlistForm from '../components/SetlistForm';
import Breadcrumbs from '@/features/shared/components/Breadcrumbs';
import { PageSpinner } from '@/features/shared/components/LoadingStates';
import { SimplePageTransition } from '@/features/shared/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import type { SetlistFormData } from '../types';

export function SetlistsIndexPage() {
  const { setlists, loading, error, createSetlist } = useSetlists();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleCreateSetlist = async (data: SetlistFormData): Promise<void> => {
    await createSetlist(data);
    setShowCreateDialog(false);
  };

  if (loading) return <PageSpinner message="Loading setlists..." />;

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <SimplePageTransition>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-6">
            <Breadcrumbs items={[{ label: 'Setlists', path: '/setlists' }]} />
          </div>

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Setlists</h1>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Setlist
            </Button>
          </div>

          <SetlistList setlists={setlists} isLoading={loading} />

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Setlist</DialogTitle>
              </DialogHeader>
              <SetlistForm
                onSubmit={handleCreateSetlist}
                onCancel={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </SimplePageTransition>
  );
}
