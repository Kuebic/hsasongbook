/**
 * SettingsAccordion Component
 *
 * Accordion-based layout for settings page.
 * Organizes Appearance, Chord Display, Account, and About sections
 * into collapsible panels to save vertical space.
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Palette, Music2, User, Info } from "lucide-react";
import { AppearanceSettingsContent } from "@/features/appearance/components/AppearanceSettings";
import { ChordStyleSettingsWrapper } from "@/features/appearance/components/ChordStyleSettingsWrapper";
import { AboutSectionContent } from "./AboutSection";
import { AccountSectionContent } from "./AccountSection";

interface SettingsAccordionProps {
  /** Whether user is authenticated (affects which sections show full content) */
  isAuthenticated: boolean;
}

export function SettingsAccordion({ isAuthenticated }: SettingsAccordionProps) {
  return (
    <Accordion
      type="multiple"
      defaultValue={["appearance"]}
      className="w-full"
    >
      {/* Appearance Section */}
      <AccordionItem value="appearance">
        <AccordionTrigger className="text-base font-semibold hover:no-underline bg-muted/50 px-3 rounded-md -mx-3">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <span>Appearance</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4">
          <AppearanceSettingsContent isAuthenticated={isAuthenticated} />
        </AccordionContent>
      </AccordionItem>

      {/* Chord Display Section - Only for authenticated users */}
      {isAuthenticated && (
        <AccordionItem value="chord-display">
          <AccordionTrigger className="text-base font-semibold hover:no-underline bg-muted/50 px-3 rounded-md -mx-3">
            <div className="flex items-center gap-2">
              <Music2 className="h-5 w-5 text-primary" />
              <span>Chord Display</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <ChordStyleSettingsWrapper />
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Account Section */}
      <AccordionItem value="account">
        <AccordionTrigger className="text-base font-semibold hover:no-underline bg-muted/50 px-3 rounded-md -mx-3">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <span>Account</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4">
          <AccountSectionContent />
        </AccordionContent>
      </AccordionItem>

      {/* About Section */}
      <AccordionItem value="about">
        <AccordionTrigger className="text-base font-semibold hover:no-underline bg-muted/50 px-3 rounded-md -mx-3">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <span>About</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4">
          <AboutSectionContent />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
