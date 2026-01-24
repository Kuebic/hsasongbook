/**
 * useRecentSongs Hook
 *
 * Fetches recently added songs for the homepage.
 */

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Song } from '@/types/Song.types';

function mapConvexSongToFrontend(song: {
  _id: string;
  _creationTime: number;
  slug: string;
  title: string;
  artist?: string;
  themes: string[];
  copyright?: string;
  lyrics?: string;
}): Song {
  return {
    id: song._id,
    slug: song.slug,
    title: song.title,
    artist: song.artist ?? '',
    themes: song.themes,
    copyright: song.copyright,
    lyrics: song.lyrics ? { en: song.lyrics } : undefined,
    createdAt: new Date(song._creationTime).toISOString(),
    updatedAt: new Date(song._creationTime).toISOString(),
  };
}

export function useRecentSongs(limit = 6) {
  const data = useQuery(api.songs.getRecent, { limit });
  const songs = (data ?? []).map(mapConvexSongToFrontend);

  return {
    songs,
    loading: data === undefined,
  };
}

export default useRecentSongs;
