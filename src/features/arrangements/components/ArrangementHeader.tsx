import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Clock, Music, Guitar, Hash, Users, Globe, Pencil, Loader2 } from 'lucide-react'
import { getCreatorDisplayName } from '../../shared/utils/userDisplay'
import type { Arrangement, CreatorInfo, OwnerInfo } from '@/types'

interface ArrangementHeaderProps {
  arrangement: Arrangement;
  songTitle: string;
  artist: string;
  creator?: CreatorInfo | null;
  owner?: OwnerInfo | null;
  transposedKey?: string;      // Current key after transposition
  transpositionOffset?: number; // How many semitones transposed
  isOwner?: boolean;           // Can edit arrangement name
  onNameChange?: (name: string) => Promise<void>;
}

export default function ArrangementHeader({ arrangement, songTitle, artist, creator, owner, transposedKey, transpositionOffset, isOwner, onNameChange }: ArrangementHeaderProps) {
  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(arrangement.name);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset edited name when arrangement changes
  useEffect(() => {
    setEditedName(arrangement.name);
  }, [arrangement.name]);

  const handleStartEditing = () => {
    if (isOwner && onNameChange) {
      setIsEditing(true);
      setEditedName(arrangement.name);
    }
  };

  const handleSave = async () => {
    const trimmedName = editedName.trim();
    if (!trimmedName || trimmedName === arrangement.name) {
      setIsEditing(false);
      setEditedName(arrangement.name);
      return;
    }

    if (onNameChange) {
      setIsSaving(true);
      try {
        await onNameChange(trimmedName);
        setIsEditing(false);
      } catch {
        // Reset on error
        setEditedName(arrangement.name);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName(arrangement.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  // Phase 2: Determine if this is a group-owned or Community arrangement
  const isGroupOwned = owner?.type === 'group';
  const isCommunityGroup = isGroupOwned && owner?.isSystemGroup === true;

  // Check if transposed
  const isTransposed = transpositionOffset !== undefined && transpositionOffset !== 0;
  const displayKey = transposedKey || arrangement.key;

  // Render owner attribution based on ownership type
  const renderOwnerAttribution = () => {
    if (isCommunityGroup) {
      // Community group - show special badge
      return (
        <>
          {' · '}
          <span className="inline-flex items-center gap-1 text-primary font-medium">
            <Globe className="h-4 w-4" />
            Community (Crowdsourced)
          </span>
        </>
      );
    }

    if (isGroupOwned && owner?.slug) {
      // Group-owned - link to group page
      return (
        <>
          {' · By '}
          <Link
            to={`/groups/${owner.slug}`}
            className="inline-flex items-center gap-1 hover:text-foreground hover:underline transition-colors"
          >
            <Users className="h-4 w-4" />
            {owner.name}
          </Link>
        </>
      );
    }

    // User-owned or fallback - show creator
    if (creator?.username) {
      return (
        <>
          {' · Arranged by '}
          <Link
            to={`/user/${creator.username}`}
            className="hover:text-foreground hover:underline transition-colors"
          >
            {getCreatorDisplayName(creator)}
          </Link>
        </>
      );
    }

    return null;
  };

  return (
    <div className="print-header space-y-4">
      {/* Title row with musical properties */}
      <div className="print-title-row">
        <h1 className="print-title text-2xl sm:text-3xl font-bold">
          {songTitle}
          <span className="print-arrangement-name text-muted-foreground font-normal">
            {' '}–{' '}
            {isEditing ? (
              <span className="inline-flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                  disabled={isSaving}
                  className="h-8 w-48 sm:w-64 text-2xl sm:text-3xl font-normal inline-block"
                />
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              </span>
            ) : isOwner && onNameChange ? (
              <button
                onClick={handleStartEditing}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors group"
                title="Click to edit arrangement name"
              >
                {arrangement.name}
                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
              </button>
            ) : (
              arrangement.name
            )}
          </span>
        </h1>

        {/* Musical Properties - inline on print */}
        <div className="print-musical-props flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-sm">
            <Music className="h-3 w-3 mr-1" />
            {isTransposed ? (
              <>Key: {arrangement.key} → {displayKey}</>
            ) : (
              <>Key: {displayKey}</>
            )}
          </Badge>

          {arrangement.tempo && (
            <Badge variant="secondary" className="text-sm">
              <Clock className="h-3 w-3 mr-1" />
              {arrangement.tempo} BPM
            </Badge>
          )}

          {arrangement.timeSignature && (
            <Badge variant="secondary" className="text-sm">
              {arrangement.timeSignature}
            </Badge>
          )}

          {arrangement.capo > 0 && (
            <Badge variant="outline" className="text-sm">
              <Guitar className="h-3 w-3 mr-1" />
              Capo {arrangement.capo}
            </Badge>
          )}
        </div>
      </div>

      {/* Artist attribution */}
      <p className="print-artist text-muted-foreground text-lg mt-1">
        {artist}
        {renderOwnerAttribution()}
      </p>

      {/* Tags - hidden in print */}
      {arrangement.tags && arrangement.tags.length > 0 && (
        <div className="print-tags flex flex-wrap gap-1">
          {arrangement.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs capitalize">
                <Hash className="h-2 w-2 mr-1" />
                {tag}
              </Badge>
            ))}
        </div>
      )}
    </div>
  )
}
