import React from 'react';
import { Heart } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  targetType: 'song' | 'arrangement';
  targetId: string;
  count?: number;
  showCount?: boolean;
  size?: 'sm' | 'default';
  className?: string;
}

export default function FavoriteButton({
  targetType,
  targetId,
  count = 0,
  showCount = true,
  size = 'default',
  className,
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const isAuthenticated = user && !user.isAnonymous;

  // Check if user has favorited this item
  const isFavorited = useQuery(
    api.favorites.isFavorited,
    isAuthenticated ? { targetType, targetId } : 'skip'
  );

  const toggleFavorite = useMutation(api.favorites.toggle);

  // Format large numbers
  const formatCount = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Could show a sign-in prompt here
      // For now, just don't do anything
      return;
    }

    try {
      await toggleFavorite({ targetType, targetId });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const textSize = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'sm' : 'default'}
      className={cn(
        'gap-1.5 px-2',
        !isAuthenticated && 'cursor-default opacity-70',
        className
      )}
      onClick={handleClick}
      disabled={!isAuthenticated}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={cn(
          iconSize,
          'transition-colors',
          isFavorited
            ? 'fill-red-500 text-red-500'
            : 'text-muted-foreground'
        )}
      />
      {showCount && (
        <span className={cn(textSize, 'text-muted-foreground')}>
          {formatCount(count)}
        </span>
      )}
    </Button>
  );
}
