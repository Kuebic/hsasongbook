# Phase 5: Frontend Types & Core Components

## Goal
Update frontend types and create reusable UI components for privacy and sharing.

## Prerequisites
✅ Phases 1-4 completed (backend fully functional)

## Changes Required

### 1. Update Frontend Types in [src/types/Database.types.ts](src/types/Database.types.ts)

**Find the `Setlist` interface and add these fields:**

**NOTE:** In practice, Convex generates types automatically. You may not need to maintain manual types. Check if `Doc<"setlists">` from Convex is preferred in this codebase.

```typescript
export interface Setlist {
  _id: string;  // Convex uses _id, not id
  name: string;
  description?: string;
  performanceDate?: string;
  songs: SetlistSong[];
  createdAt?: number;  // Optional for backward compatibility (timestamp, not string)
  updatedAt?: number;
  userId: string;

  // PRIVACY FIELDS (optional for backward compatibility)
  privacyLevel?: 'private' | 'unlisted' | 'public';  // undefined = "private"

  // METADATA FIELDS
  tags?: string[];
  estimatedDuration?: number;  // minutes
  difficulty?: 'beginner' | 'intermediate' | 'advanced';

  // ATTRIBUTION FIELDS
  duplicatedFrom?: string;
  duplicatedFromName?: string;
  showAttribution?: boolean;

  // SOCIAL FIELD
  favorites?: number;  // Optional, defaults to 0
}

// Note: sharedWith is now in a separate setlistShares table, not embedded
```

---

### 2. Create Privacy Selector Component

**Create [src/features/setlists/components/SetlistPrivacySelector.tsx](src/features/setlists/components/SetlistPrivacySelector.tsx):**

```tsx
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Lock, Link2, Globe } from "lucide-react";

interface Props {
  value: 'private' | 'unlisted' | 'public';
  onChange: (value: 'private' | 'unlisted' | 'public') => void;
  disabled?: boolean;
}

export function SetlistPrivacySelector({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-3">
      <Label>Privacy</Label>
      <RadioGroup value={value} onValueChange={onChange} disabled={disabled}>
        <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
          <RadioGroupItem value="private" id="private" className="mt-1" />
          <Label htmlFor="private" className="flex-1 cursor-pointer font-normal">
            <div className="flex items-center gap-2 font-medium">
              <Lock className="h-4 w-4" />
              Private
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Only you can see this setlist
            </div>
          </Label>
        </div>

        <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
          <RadioGroupItem value="unlisted" id="unlisted" className="mt-1" />
          <Label htmlFor="unlisted" className="flex-1 cursor-pointer font-normal">
            <div className="flex items-center gap-2 font-medium">
              <Link2 className="h-4 w-4" />
              Unlisted
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Anyone with the link can view
            </div>
          </Label>
        </div>

        <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
          <RadioGroupItem value="public" id="public" className="mt-1" />
          <Label htmlFor="public" className="flex-1 cursor-pointer font-normal">
            <div className="flex items-center gap-2 font-medium">
              <Globe className="h-4 w-4" />
              Public
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Discoverable in browse and search
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
```

---

### 3. Create Privacy Badge Component

**Create [src/features/setlists/components/SetlistPrivacyBadge.tsx](src/features/setlists/components/SetlistPrivacyBadge.tsx):**

```tsx
import { Badge } from "@/components/ui/badge";
import { Lock, Link2, Globe } from "lucide-react";

interface Props {
  privacyLevel: 'private' | 'unlisted' | 'public';
  variant?: 'default' | 'sm';
}

export function SetlistPrivacyBadge({ privacyLevel, variant = 'default' }: Props) {
  const iconSize = variant === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  if (privacyLevel === 'private') {
    return (
      <Badge variant="secondary" className="gap-1">
        <Lock className={iconSize} />
        <span>Private</span>
      </Badge>
    );
  }

  if (privacyLevel === 'unlisted') {
    return (
      <Badge variant="outline" className="gap-1">
        <Link2 className={iconSize} />
        <span>Unlisted</span>
      </Badge>
    );
  }

  return (
    <Badge variant="default" className="gap-1">
      <Globe className={iconSize} />
      <span>Public</span>
    </Badge>
  );
}
```

---

### 4. Create Favorite Button Component

**Create [src/features/setlists/components/SetlistFavoriteButton.tsx](src/features/setlists/components/SetlistFavoriteButton.tsx):**

```tsx
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface Props {
  setlistId: string;
  favoriteCount: number;
  variant?: 'default' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
  showCount?: boolean;
}

export function SetlistFavoriteButton({
  setlistId,
  favoriteCount,
  variant = 'ghost',
  size = 'default',
  showCount = true,
}: Props) {
  const { user } = useAuth();
  const toggleFavorite = useMutation(api.favorites.toggle);

  const isFavorited = useQuery(
    api.favorites.isFavorited,
    user && !user.isAnonymous
      ? { targetType: "setlist", targetId: setlistId }
      : "skip"
  );

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || user.isAnonymous) {
      // TODO: Handle anonymous favorites via localStorage (Phase 6)
      return;
    }

    await toggleFavorite({
      targetType: "setlist",
      targetId: setlistId as Id<"setlists">,
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      className="gap-2"
    >
      <Heart
        className={cn(
          "h-4 w-4",
          isFavorited && "fill-current text-red-500"
        )}
      />
      {showCount && <span>{favoriteCount}</span>}
    </Button>
  );
}
```

---

### 5. Create Attribution Display Component

**Create [src/features/setlists/components/SetlistAttribution.tsx](src/features/setlists/components/SetlistAttribution.tsx):**

```tsx
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Link } from "react-router-dom";
import { Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  setlistId: string;
  showAttribution: boolean;
  isOwner: boolean;
  onToggleAttribution?: () => void;
}

export function SetlistAttribution({
  setlistId,
  showAttribution,
  isOwner,
  onToggleAttribution,
}: Props) {
  const attributionInfo = useQuery(
    api.setlists.getAttributionInfo,
    { setlistId: setlistId as Id<"setlists"> }
  );

  if (!showAttribution || !attributionInfo) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground border-l-2 border-muted pl-3 py-1">
      <Copy className="h-4 w-4" />
      <span>
        Duplicated from{" "}
        {attributionInfo.isAccessible ? (
          <Link
            to={`/setlists/${attributionInfo.id}`}
            className="underline hover:text-foreground"
          >
            {attributionInfo.name}
          </Link>
        ) : (
          <span className="italic">{attributionInfo.name}</span>
        )}
        {attributionInfo.ownerUsername && (
          <> by{" "}
            <Link
              to={`/user/${attributionInfo.ownerUsername}`}
              className="underline hover:text-foreground"
            >
              {attributionInfo.ownerUsername}
            </Link>
          </>
        )}
      </span>
      {isOwner && onToggleAttribution && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleAttribution}
          className="h-6 w-6 ml-auto"
          title="Hide attribution"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
```

---

### 6. Create Shared Badge Component

**Create [src/features/setlists/components/SetlistSharedBadge.tsx](src/features/setlists/components/SetlistSharedBadge.tsx):**

```tsx
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface Props {
  isOwner: boolean;
  canEdit: boolean;
}

export function SetlistSharedBadge({ isOwner, canEdit }: Props) {
  if (isOwner) return null;

  return (
    <Badge variant={canEdit ? "default" : "secondary"} className="gap-1">
      <Users className="h-3 w-3" />
      <span>{canEdit ? "Can Edit" : "View Only"}</span>
    </Badge>
  );
}
```

---

### 7. Update Barrel Export

**Update [src/features/setlists/components/index.ts](src/features/setlists/components/index.ts):**

```typescript
export { SetlistPrivacySelector } from './SetlistPrivacySelector';
export { SetlistPrivacyBadge } from './SetlistPrivacyBadge';
export { SetlistFavoriteButton } from './SetlistFavoriteButton';
export { SetlistAttribution } from './SetlistAttribution';
export { SetlistSharedBadge } from './SetlistSharedBadge';
// ... existing exports
```

---

## Testing Steps

1. **Import and render each component** in isolation to verify:
   - SetlistPrivacySelector changes value on click
   - SetlistPrivacyBadge shows correct icon and text for each level
   - SetlistFavoriteButton increments/decrements count
   - SetlistAttribution shows/hides correctly
   - SetlistSharedBadge displays correct permission level

2. **Type checking:**
   - Run `npm run typecheck`
   - Verify no TypeScript errors with new Setlist interface

3. **Install required shadcn components** (if not already installed):
   ```bash
   npx shadcn@latest add radio-group
   npx shadcn@latest add badge
   ```

---

## Dependencies
- Phases 1-4 (backend complete)

## Next Phase
Phase 6: Anonymous Favorites & Main UI Updates
