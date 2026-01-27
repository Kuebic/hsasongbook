import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import SetlistCard from '../components/SetlistCard';
import { AnonymousFavoritesWarning } from '@/features/favorites';
import { Search, SlidersHorizontal, X, ListMusic } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Setlist } from '@/types';

type SortOption = 'popular' | 'recent' | 'name';

export function SetlistsBrowsePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [showFilters, setShowFilters] = useState(false);

  const setlistsData = useQuery(api.setlists.browse, {
    searchTerm: searchTerm || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    sortBy,
  });

  const availableTags = useQuery(api.setlists.getDistinctTags);
  const stats = useQuery(api.setlists.getBrowseStats);

  // Map Convex data to frontend Setlist type
  const setlists: Setlist[] | undefined = setlistsData?.map((s) => ({
    id: s._id,
    name: s.name,
    description: s.description ?? undefined,
    performanceDate: s.performanceDate ?? undefined,
    songs: s.songs ?? [],
    createdAt: new Date(s._creationTime).toISOString(),
    updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date(s._creationTime).toISOString(),
    userId: s.userId,
    privacyLevel: s.privacyLevel ?? 'private',
    tags: s.tags ?? undefined,
    estimatedDuration: s.estimatedDuration ?? undefined,
    difficulty: s.difficulty ?? undefined,
    duplicatedFrom: s.duplicatedFrom ?? undefined,
    duplicatedFromName: s.duplicatedFromName ?? undefined,
    showAttribution: s.showAttribution ?? undefined,
    favorites: s.favorites ?? 0,
  }));

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const isLoading = setlistsData === undefined;

  return (
    <div className="container py-8 px-4 md:px-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Browse Setlists</h1>
        {stats && (
          <p className="text-muted-foreground">
            {stats.totalPublicSetlists} public setlists
            {stats.totalSongs > 0 && <> &bull; {stats.totalSongs} total songs</>}
            {stats.totalFavorites > 0 && <> &bull; {stats.totalFavorites} favorites</>}
          </p>
        )}
      </div>

      {/* Anonymous warning */}
      <AnonymousFavoritesWarning />

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search setlists by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-3">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="name">A-Z</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-accent' : ''}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Tags</Label>
              {availableTags && availableTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleToggleTag(tag)}
                    >
                      {tag}
                      {selectedTags.includes(tag) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tags available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters */}
      {selectedTags.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                onClick={() => handleToggleTag(tag)}
                className="hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTags([])}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : setlists && setlists.length === 0 ? (
        <div className="text-center py-12">
          <ListMusic className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No setlists found.</p>
          {(searchTerm || selectedTags.length > 0) && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchTerm('');
                setSelectedTags([]);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {setlists?.map((setlist) => (
            <SetlistCard
              key={setlist.id}
              setlist={setlist}
              isOwner={false}
              showPrivacyBadge={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
