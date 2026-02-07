/**
 * EditModeAccordion Component
 *
 * Accordion-based layout for arrangement edit mode.
 * Combines Arrangement Settings and Audio References into collapsible panels
 * to save vertical space and keep ChordPro viewer closer to top.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Settings2, Headphones, Paperclip } from "lucide-react";
import { ArrangementMetadataContent } from "./ArrangementMetadataForm";
import { AudioReferencesContent } from "./AudioReferencesForm";
import { AttachmentsSection } from "./attachments";
import InstrumentSelector from "./InstrumentSelector";
import EnergySelector from "./EnergySelector";
import StyleSelector from "./StyleSelector";
import ChipInput from "@/features/shared/components/ChipInput";
import { SETTING_OPTIONS, TAG_SUGGESTIONS } from "@/features/shared/utils/tagConstants";
import type { ArrangementMetadata } from "@/types/Arrangement.types";

interface EditModeAccordionProps {
  /** Current arrangement metadata */
  metadata: ArrangementMetadata;
  /** Callback when metadata changes */
  onMetadataChange: (metadata: ArrangementMetadata) => void;
  /** Arrangement ID for audio references and attachments */
  arrangementId: string;
  /** Current YouTube URL */
  youtubeUrl?: string;
  /** Whether arrangement has an audio file */
  hasAudio?: boolean;
  /** Number of attachments (for badge) */
  attachmentCount?: number;
  /** Whether the form is disabled */
  disabled?: boolean;
  /** Current notes value */
  notes?: string;
  /** Callback when notes change */
  onNotesChange?: (notes: string) => void;
  /** Current categorization values */
  instrument?: 'guitar' | 'piano';
  energy?: 'high' | 'medium' | 'reflective';
  style?: string;
  settings?: string[];
  tags?: string[];
  /** Callback when categorization fields change */
  onCategorizationChange?: (fields: Partial<{
    instrument: 'guitar' | 'piano';
    energy: 'high' | 'medium' | 'reflective';
    style: string;
    settings: string[];
    tags: string[];
  }>) => void;
}

export function EditModeAccordion({
  metadata,
  onMetadataChange,
  arrangementId,
  youtubeUrl,
  hasAudio,
  attachmentCount = 0,
  disabled = false,
  notes,
  onNotesChange,
  instrument,
  energy,
  style,
  settings,
  tags,
  onCategorizationChange,
}: EditModeAccordionProps) {
  // Local notes state with debounced save
  const [localNotes, setLocalNotes] = useState(notes ?? '');
  const notesTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocalNotes(notes ?? '');
  }, [notes]);

  const handleNotesChange = useCallback((value: string) => {
    setLocalNotes(value);
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(() => {
      onNotesChange?.(value);
    }, 1000);
  }, [onNotesChange]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    };
  }, []);

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

          {/* Categorization fields */}
          {onCategorizationChange && (
            <div className="space-y-4 mt-6 pt-4 border-t border-border">
              {/* Instrument and Energy row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Instrument</Label>
                  <InstrumentSelector
                    value={instrument}
                    onChange={(val) => onCategorizationChange({ instrument: val })}
                    disabled={disabled}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label>Energy</Label>
                  <EnergySelector
                    value={energy}
                    onChange={(val) => onCategorizationChange({ energy: val })}
                    disabled={disabled}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Style */}
              <div>
                <Label>Style</Label>
                <StyleSelector
                  value={style}
                  onChange={(val) => onCategorizationChange({ style: val })}
                  disabled={disabled}
                  className="w-full"
                />
              </div>

              {/* Settings */}
              <ChipInput
                label="Settings"
                value={settings ?? []}
                onChange={(val) => onCategorizationChange({ settings: val })}
                suggestions={SETTING_OPTIONS.map((opt) => opt.value)}
                allowCustom={false}
                placeholder="Select settings..."
                helperText="Where/how this arrangement is intended to be used"
                disabled={disabled}
                chipVariant="setting"
              />

              {/* Tags */}
              <ChipInput
                label="Tags"
                value={tags ?? []}
                onChange={(val) => onCategorizationChange({ tags: val })}
                suggestions={[...TAG_SUGGESTIONS]}
                allowCustom={true}
                placeholder="Add tags..."
                helperText="Additional labels for categorization"
                disabled={disabled}
                chipVariant="tag"
              />
            </div>
          )}

          {/* Notes */}
          {onNotesChange && (
            <div className="mt-6 pt-4 border-t border-border">
              <Label htmlFor="arrangement-notes">Notes</Label>
              <textarea
                id="arrangement-notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                placeholder="e.g., Source: tparents resource, Based on Hillsong version"
                disabled={disabled}
                value={localNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Public notes visible on the arrangement page
              </p>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* Audio References */}
      <AccordionItem value="audio">
        <AccordionTrigger className="text-base font-semibold hover:no-underline">
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-primary" />
            <span>Audio Reference</span>
            {hasAudio || youtubeUrl ? (
              <span className="text-sm font-normal text-muted-foreground">
                ({[hasAudio && 'MP3', youtubeUrl && 'YouTube'].filter(Boolean).join(', ')})
              </span>
            ) : (
              <span className="text-sm font-normal text-muted-foreground italic">
                Add audio
              </span>
            )}
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

      {/* File Attachments */}
      <AccordionItem value="attachments">
        <AccordionTrigger className="text-base font-semibold hover:no-underline">
          <div className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-primary" />
            <span>Attachments</span>
            {attachmentCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({attachmentCount})
              </span>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <AttachmentsSection
            arrangementId={arrangementId}
            disabled={disabled}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
