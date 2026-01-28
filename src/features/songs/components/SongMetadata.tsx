import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Hash, Music2, Copyright, Users, Globe, Bookmark, BookOpen, Quote as QuoteIcon, ChevronDown, ChevronUp } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import { getDisplayName } from '../../shared/utils/userDisplay';
import { Id } from '../../../../convex/_generated/dataModel';
import type { Song, OwnerInfo } from '@/types';
import { getOriginLabel, QUOTE_SOURCES } from '../validation/songSchemas';

interface SongMetadataProps {
  song: Song | null;
  owner?: OwnerInfo | null;
}

export default function SongMetadata({ song, owner }: SongMetadataProps) {
  const [lyricsExpanded, setLyricsExpanded] = useState(false);
  const [versesExpanded, setVersesExpanded] = useState(false);
  const [quotesExpanded, setQuotesExpanded] = useState(false);

  if (!song) return null;

  const hasLyrics = song.lyrics?.en || song.lyrics;
  const lyricsText = typeof song.lyrics === 'object' ? song.lyrics.en : song.lyrics;

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
        <UserAvatar
          userId={owner.id as Id<'users'>}
          displayName={owner.displayName}
          size="sm"
        />
        Added by {getDisplayName(owner)}
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

        {/* Origin badge if available */}
        {song.origin && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-sm">
              <Bookmark className="h-3 w-3 mr-1" />
              {getOriginLabel(song.origin)}
            </Badge>
          </div>
        )}

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
              <p className={`text-sm whitespace-pre-line ${!lyricsExpanded ? 'line-clamp-4' : ''}`}>
                {lyricsText}
              </p>
              {lyricsText && lyricsText.split('\n').length > 4 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setLyricsExpanded(!lyricsExpanded)}
                >
                  {lyricsExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show more
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Spiritual Context section */}
        {(song.notes || song.bibleVerses?.length || song.quotes?.length) && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-lg font-semibold mb-4">Spiritual Context</h3>

            {/* Notes */}
            {song.notes && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Notes
                </h4>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm whitespace-pre-line">{song.notes}</p>
                </div>
              </div>
            )}

            {/* Bible Verses */}
            {song.bibleVerses && song.bibleVerses.length > 0 && (
              <div className="mb-4">
                <Button
                  variant="ghost"
                  className="w-full justify-between px-3 py-2 h-auto text-sm font-medium bg-muted/50 hover:bg-muted rounded-lg"
                  onClick={() => setVersesExpanded(!versesExpanded)}
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Related Bible Verses ({song.bibleVerses.length})
                  </span>
                  {versesExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                {versesExpanded && (
                  <div className="space-y-2 mt-2">
                    {song.bibleVerses.map((verse, idx) => (
                      <div key={idx} className="bg-muted rounded-lg p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-semibold text-sm">{verse.reference}</span>
                          {verse.version && (
                            <Badge variant="outline" className="text-xs">
                              {verse.version}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm italic">{verse.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quotes */}
            {song.quotes && song.quotes.length > 0 && (
              <div>
                <Button
                  variant="ghost"
                  className="w-full justify-between px-3 py-2 h-auto text-sm font-medium bg-muted/50 hover:bg-muted rounded-lg"
                  onClick={() => setQuotesExpanded(!quotesExpanded)}
                >
                  <span className="flex items-center gap-2">
                    <QuoteIcon className="h-4 w-4 text-primary" />
                    Related Quotes ({song.quotes.length})
                  </span>
                  {quotesExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                {quotesExpanded && (
                  <div className="space-y-2 mt-2">
                    {song.quotes.map((quote, idx) => (
                      <div key={idx} className="bg-muted rounded-lg p-4">
                        <p className="text-sm italic mb-2">"{quote.text}"</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">
                            {QUOTE_SOURCES.find(s => s.value === quote.source)?.label || quote.source}
                          </Badge>
                          <span>—</span>
                          <span>{quote.reference}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
