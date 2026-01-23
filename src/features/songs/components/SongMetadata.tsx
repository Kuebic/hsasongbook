import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Hash, Music2, Copyright, Users, Globe } from 'lucide-react';
import type { Song, OwnerInfo } from '@/types';

interface SongMetadataProps {
  song: Song | null;
  owner?: OwnerInfo | null;
}

export default function SongMetadata({ song, owner }: SongMetadataProps) {
  if (!song) return null;

  const hasLyrics = song.lyrics?.en || song.lyrics;

  // Check if owner is the Community system group
  const isCommunityGroup = owner?.type === 'group' && owner.isSystemGroup === true;

  // Render owner attribution
  const renderOwnerAttribution = () => {
    if (!owner) return null;

    if (owner.type === 'group') {
      if (isCommunityGroup) {
        return (
          <div className="flex items-center gap-2 text-sm mt-2">
            <Globe className="h-3 w-3 text-primary" />
            <span className="text-primary font-medium">Community (Crowdsourced)</span>
          </div>
        );
      }
      return (
        <Link
          to={`/groups/${owner.slug}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors mt-2"
        >
          <Users className="h-3 w-3" />
          By {owner.name}
        </Link>
      );
    }

    // User-owned
    return (
      <Link
        to={`/user/${owner.slug}`}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors mt-2"
      >
        <User className="h-3 w-3" />
        Added by {owner.name}
      </Link>
    );
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-3xl sm:text-4xl flex items-center gap-3">
          <Music2 className="h-8 w-8 text-primary" />
          {song.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 text-lg mt-2">
          <User className="h-4 w-4" />
          {song.artist}
        </CardDescription>

        {/* Copyright info if available */}
        {song.copyright && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Copyright className="h-3 w-3" />
            {song.copyright}
          </div>
        )}

        {/* Owner attribution */}
        {renderOwnerAttribution()}
      </CardHeader>

      <CardContent>
        {/* Themes */}
        {song.themes && song.themes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Themes
            </h3>
            <div className="flex flex-wrap gap-2">
              {song.themes.map((theme, index) => (
                <Badge key={index} variant="secondary" className="capitalize">
                  <Hash className="h-3 w-3 mr-1" />
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Lyrics preview */}
        {hasLyrics && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Lyrics Preview
            </h3>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm whitespace-pre-line line-clamp-4">
                {typeof song.lyrics === 'object' ? song.lyrics.en : song.lyrics}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
