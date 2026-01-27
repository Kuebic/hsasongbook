# Phase 6: Main UI Updates (Index, Form, Card)

## Goal
Update main setlist UI components to support privacy, sharing, and favorites.

## Prerequisites
✅ Phase 5 completed (types and reusable components exist)

## Changes Required

### 1. Update SetlistCard Component

**File: [src/features/setlists/components/SetlistCard.tsx](src/features/setlists/components/SetlistCard.tsx)**

Add these features:
- Privacy badge
- Favorite button
- Tags display
- Shared badge (if not owner)
- Attribution display (if duplicated)

```tsx
import {
  SetlistPrivacyBadge,
  SetlistFavoriteButton,
  SetlistAttribution,
  SetlistSharedBadge,
} from '@/features/setlists/components';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Update the existing SetlistCard component:
export function SetlistCard({ setlist, onDelete }: Props) {
  const { user } = useAuth();
  const isOwner = user?.id === setlist.userId;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Link to={`/setlists/${setlist.id}`}>
                {setlist.name}
              </Link>
            </CardTitle>

            {/* Privacy & Sharing Badges */}
            <div className="flex items-center gap-2 mt-2">
              <SetlistPrivacyBadge
                privacyLevel={setlist.privacyLevel}
                variant="sm"
              />
              <SetlistSharedBadge
                isOwner={isOwner}
                canEdit={setlist.sharedWith?.some(
                  s => s.userId === user?.id && s.canEdit
                ) ?? false}
              />
            </div>
          </div>

          {/* Favorite Button */}
          <SetlistFavoriteButton
            setlistId={setlist.id}
            favoriteCount={setlist.favorites ?? 0}
            variant="ghost"
            size="sm"
          />
        </div>
      </CardHeader>

      <CardContent>
        {setlist.description && (
          <p className="text-sm text-muted-foreground mb-3">
            {setlist.description}
          </p>
        )}

        {/* Tags */}
        {setlist.tags && setlist.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {setlist.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span>{setlist.songs.length} songs</span>
          {setlist.estimatedDuration && (
            <span>{setlist.estimatedDuration} min</span>
          )}
          {setlist.difficulty && (
            <span className="capitalize">{setlist.difficulty}</span>
          )}
          {setlist.performanceDate && (
            <span>{new Date(setlist.performanceDate).toLocaleDateString()}</span>
          )}
        </div>

        {/* Attribution */}
        {setlist.showAttribution && (
          <div className="mt-3">
            <SetlistAttribution
              setlistId={setlist.id}
              showAttribution={setlist.showAttribution}
              isOwner={isOwner}
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Link to={`/setlists/${setlist.id}`}>
          <Button variant="outline">View</Button>
        </Link>
        {isOwner && (
          <Button variant="destructive" onClick={() => onDelete(setlist.id)}>
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
```

---

### 2. Update SetlistForm Component

**File: [src/features/setlists/components/SetlistForm.tsx](src/features/setlists/components/SetlistForm.tsx)**

Add fields for:
- Tags (multi-input)
- Estimated duration
- Difficulty selector

```tsx
import { SetlistPrivacySelector } from './SetlistPrivacySelector';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

// Add to form schema:
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  performanceDate: z.string().optional(),
  // NEW FIELDS
  privacyLevel: z.enum(['private', 'unlisted', 'public']).default('private'),
  tags: z.array(z.string()).optional(),
  estimatedDuration: z.number().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

// In the form component, add state for tags:
const [tagInput, setTagInput] = useState('');
const currentTags = watch('tags') ?? [];

const handleAddTag = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && tagInput.trim()) {
    e.preventDefault();
    const newTag = tagInput.trim().toLowerCase();
    if (!currentTags.includes(newTag)) {
      setValue('tags', [...currentTags, newTag]);
    }
    setTagInput('');
  }
};

const handleRemoveTag = (tagToRemove: string) => {
  setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
};

// Add to form JSX:
<FormField
  control={control}
  name="privacyLevel"
  render={({ field }) => (
    <FormItem>
      <SetlistPrivacySelector
        value={field.value}
        onChange={field.onChange}
      />
    </FormItem>
  )}
/>

<FormField
  control={control}
  name="tags"
  render={() => (
    <FormItem>
      <FormLabel>Tags</FormLabel>
      <div className="space-y-2">
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Add tags (press Enter)"
        />
        {currentTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {currentTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </FormItem>
  )}
/>

<FormField
  control={control}
  name="estimatedDuration"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Estimated Duration (minutes)</FormLabel>
      <Input
        type="number"
        {...field}
        onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
      />
    </FormItem>
  )}
/>

<FormField
  control={control}
  name="difficulty"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Difficulty</FormLabel>
      <Select value={field.value} onValueChange={field.onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select difficulty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="beginner">Beginner</SelectItem>
          <SelectItem value="intermediate">Intermediate</SelectItem>
          <SelectItem value="advanced">Advanced</SelectItem>
        </SelectContent>
      </Select>
    </FormItem>
  )}
/>
```

---

### 3. Update SetlistsIndexPage - Add "Shared With Me" Section

**File: [src/features/setlists/pages/SetlistsIndexPage.tsx](src/features/setlists/pages/SetlistsIndexPage.tsx)**

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SetlistsIndexPage() {
  const { user } = useAuth();
  const setlists = useQuery(api.setlists.list);

  if (!user || user.isAnonymous) {
    return <SignInPrompt />;
  }

  // Split setlists into owned and shared
  const ownedSetlists = setlists?.filter(s => s.userId === user.id) ?? [];
  const sharedSetlists = setlists?.filter(s => s.userId !== user.id) ?? [];

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Setlists</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          Create Setlist
        </Button>
      </div>

      <Tabs defaultValue="my-setlists">
        <TabsList>
          <TabsTrigger value="my-setlists">
            My Setlists ({ownedSetlists.length})
          </TabsTrigger>
          <TabsTrigger value="shared">
            Shared With Me ({sharedSetlists.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-setlists" className="mt-6">
          {ownedSetlists.length === 0 ? (
            <EmptyState message="You haven't created any setlists yet." />
          ) : (
            <SetlistList setlists={ownedSetlists} onDelete={handleDelete} />
          )}
        </TabsContent>

        <TabsContent value="shared" className="mt-6">
          {sharedSetlists.length === 0 ? (
            <EmptyState message="No setlists have been shared with you yet." />
          ) : (
            <SetlistList setlists={sharedSetlists} onDelete={handleDelete} />
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      {showCreateDialog && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Setlist</DialogTitle>
            </DialogHeader>
            <SetlistForm
              onSuccess={() => setShowCreateDialog(false)}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
```

---

### 4. Update SetlistPage - Add Privacy Controls

**File: [src/features/setlists/pages/SetlistPage.tsx](src/features/setlists/pages/SetlistPage.tsx)**

Add:
- Privacy level display/change
- Share button
- Duplicate button
- Attribution toggle

```tsx
import { SetlistPrivacyBadge, SetlistFavoriteButton } from '@/features/setlists/components';
import { Button } from '@/components/ui/button';
import { Share2, Copy } from 'lucide-react';
import { useMutation } from 'convex/react';

export function SetlistPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const setlist = useQuery(api.setlists.get, { id: id as Id<"setlists"> });
  const sharingInfo = useQuery(api.setlists.getSharingInfo, { setlistId: id as Id<"setlists"> });
  const duplicateSetlist = useMutation(api.setlists.duplicate);
  const toggleAttribution = useMutation(api.setlists.toggleAttribution);

  const handleDuplicate = async () => {
    await duplicateSetlist({ setlistId: id as Id<"setlists"> });
    // Navigate to new setlist
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{setlist.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <SetlistPrivacyBadge privacyLevel={setlist.privacyLevel} />
            {sharingInfo && (
              <SetlistSharedBadge
                isOwner={sharingInfo.isOwner}
                canEdit={sharingInfo.canEdit}
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <SetlistFavoriteButton
            setlistId={setlist.id}
            favoriteCount={setlist.favorites ?? 0}
          />

          {!sharingInfo?.isOwner && (
            <Button variant="outline" onClick={handleDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
          )}

          {sharingInfo?.isOwner && (
            <Button variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
        </div>
      </div>

      {/* Attribution */}
      {setlist.showAttribution && (
        <SetlistAttribution
          setlistId={setlist.id}
          showAttribution={setlist.showAttribution}
          isOwner={sharingInfo?.isOwner ?? false}
          onToggleAttribution={
            sharingInfo?.isOwner
              ? () => toggleAttribution({ setlistId: id as Id<"setlists"> })
              : undefined
          }
        />
      )}

      {/* Rest of component... */}
    </div>
  );
}
```

---

## Testing Steps

1. **SetlistCard:**
   - Create setlist with tags, duration, difficulty
   - Verify all metadata displays correctly
   - Favorite/unfavorite → count updates
   - Privacy badge shows correct level

2. **SetlistForm:**
   - Create new setlist with all fields
   - Add/remove tags
   - Set privacy level
   - Verify form submits correctly

3. **SetlistsIndexPage:**
   - Own setlists in "My Setlists" tab
   - Shared setlists in "Shared With Me" tab
   - Counts accurate in tab labels

4. **SetlistPage:**
   - View public setlist → see duplicate button
   - View own setlist → see share button
   - Favorite button works
   - Attribution toggle works (if duplicated)

---

## Dependencies
- Phase 5 (reusable components)

## Next Phase
Phase 7: Browse Page & Anonymous Favorites
