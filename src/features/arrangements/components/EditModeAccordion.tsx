/**
 * EditModeAccordion Component
 *
 * Accordion-based layout for arrangement edit mode.
 * Combines Arrangement Settings and Audio References into collapsible panels
 * to save vertical space and keep ChordPro viewer closer to top.
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Settings2, Headphones } from "lucide-react";
import { ArrangementMetadataContent } from "./ArrangementMetadataForm";
import { AudioReferencesContent } from "./AudioReferencesForm";
import type { ArrangementMetadata } from "@/types/Arrangement.types";

interface EditModeAccordionProps {
  /** Current arrangement metadata */
  metadata: ArrangementMetadata;
  /** Callback when metadata changes */
  onMetadataChange: (metadata: ArrangementMetadata) => void;
  /** Arrangement ID for audio references */
  arrangementId: string;
  /** Current YouTube URL */
  youtubeUrl?: string;
  /** Whether arrangement has an audio file */
  hasAudio?: boolean;
  /** Whether the form is disabled */
  disabled?: boolean;
}

export function EditModeAccordion({
  metadata,
  onMetadataChange,
  arrangementId,
  youtubeUrl,
  hasAudio,
  disabled = false,
}: EditModeAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
    >
      {/* Arrangement Settings */}
      <AccordionItem value="settings">
        <AccordionTrigger className="text-base font-semibold hover:no-underline">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <span>Arrangement Settings</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <ArrangementMetadataContent
            metadata={metadata}
            onChange={onMetadataChange}
            disabled={disabled}
          />
        </AccordionContent>
      </AccordionItem>

      {/* Audio References */}
      <AccordionItem value="audio">
        <AccordionTrigger className="text-base font-semibold hover:no-underline">
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-primary" />
            <span>Audio Reference</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <AudioReferencesContent
            arrangementId={arrangementId}
            youtubeUrl={youtubeUrl}
            hasAudio={hasAudio}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
