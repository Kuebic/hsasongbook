import React from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAnonymousFavorites } from "@/features/favorites";
import { cn } from "@/lib/utils";

interface SetlistFavoriteButtonProps {
  setlistId: string;
  favoriteCount: number;
  variant?: 'default' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
  showCount?: boolean;
}

export default function SetlistFavoriteButton({
  setlistId,
  favoriteCount,
  variant = 'ghost',
  size = 'default',
  showCount = true,
}: SetlistFavoriteButtonProps) {
  const { user } = useAuth();
  const isAuthenticated = user && !user.isAnonymous;

  const {
    toggleFavorite: toggleAnonymousFavorite,
    isFavorited: isAnonymousFavorited
  } = useAnonymousFavorites();

  // Query for authenticated users only
  const isFavoritedAuth = useQuery(
    api.favorites.isFavorited,
    isAuthenticated
      ? { targetType: "setlist" as const, targetId: setlistId }
      : "skip"
  );

  const toggleFavorite = useMutation(api.favorites.toggle);

  // Determine favorite status based on auth state
  const isFavorited = isAuthenticated
    ? isFavoritedAuth
    : isAnonymousFavorited(setlistId, 'setlist');

  // Format large numbers
  const formatCount = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;

    if (isAuthenticated) {
      // Authenticated user: use Convex mutation
      try {
        await toggleFavorite({
          targetType: "setlist",
          targetId: setlistId,
        });
      } catch (error) {
        console.error("Failed to toggle favorite:", error);
      }
    } else {
      // Anonymous user: use localStorage
      toggleAnonymousFavorite(setlistId, 'setlist');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      className="gap-2"
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          isFavorited
            ? "fill-red-500 text-red-500"
            : "text-muted-foreground"
        )}
      />
      {showCount && (
        <span className="text-muted-foreground">{formatCount(favoriteCount)}</span>
      )}
    </Button>
  );
}
