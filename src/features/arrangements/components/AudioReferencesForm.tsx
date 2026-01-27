/**
 * AudioReferencesForm Component
 *
 * Combined form for managing audio references on an arrangement.
 * Includes MP3 upload and YouTube link input.
 *
 * Exports:
 * - AudioReferencesForm: Full component with Card wrapper (for standalone use)
 * - AudioReferencesContent: Content only (for use in accordion)
 */

import { useMutation } from 'convex/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Headphones } from 'lucide-react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import AudioUpload from './AudioUpload';
import YouTubeInput from './YouTubeInput';
import { useArrangementAudio } from '../hooks/useArrangementAudio';

interface AudioReferencesFormProps {
  /** The arrangement ID */
  arrangementId: string;
  /** Current YouTube URL (from arrangement data) */
  youtubeUrl?: string;
  /** Whether the arrangement has an audio file */
  hasAudio?: boolean;
}

/**
 * AudioReferencesContent - Content without Card wrapper
 * For use in accordion or other container layouts
 */
export function AudioReferencesContent({
  arrangementId,
  youtubeUrl,
  hasAudio = false,
}: AudioReferencesFormProps) {
  // Audio upload/remove functionality
  const { audioUrl, uploadAudio, removeAudio } = useArrangementAudio(arrangementId);

  // YouTube URL mutation
  const updateYoutubeUrl = useMutation(api.arrangements.updateYoutubeUrl);

  const handleYoutubeChange = async (url: string | undefined) => {
    await updateYoutubeUrl({
      id: arrangementId as Id<'arrangements'>,
      youtubeUrl: url,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6">
      {/* MP3 Upload Section */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">MP3 Recording</h4>
        <AudioUpload
          currentAudioUrl={audioUrl}
          hasAudio={hasAudio || !!audioUrl}
          onUpload={uploadAudio}
          onRemove={removeAudio}
        />
      </div>

      {/* Divider - vertical on desktop, horizontal on mobile */}
      <div className="flex items-center justify-center">
        {/* Mobile: horizontal line with "or" */}
        <div className="relative w-full md:hidden">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>
        {/* Desktop: vertical line with "or" */}
        <div className="hidden md:flex flex-col items-center h-full">
          <div className="flex-1 w-px bg-border" />
          <span className="py-2 text-xs uppercase text-muted-foreground">or</span>
          <div className="flex-1 w-px bg-border" />
        </div>
      </div>

      {/* YouTube Link Section */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">YouTube Video</h4>
        <YouTubeInput
          value={youtubeUrl}
          onChange={handleYoutubeChange}
        />
      </div>
    </div>
  );
}

/**
 * AudioReferencesForm - Full component with Card wrapper
 * For standalone use
 */
export default function AudioReferencesForm({
  arrangementId,
  youtubeUrl,
  hasAudio = false,
}: AudioReferencesFormProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Headphones className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Audio Reference</CardTitle>
        </div>
        <CardDescription>
          Add an audio recording or YouTube video to help others hear how this arrangement sounds.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AudioReferencesContent
          arrangementId={arrangementId}
          youtubeUrl={youtubeUrl}
          hasAudio={hasAudio}
        />
      </CardContent>
    </Card>
  );
}
