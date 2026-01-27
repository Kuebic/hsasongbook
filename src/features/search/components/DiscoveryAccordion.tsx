/**
 * DiscoveryAccordion Component
 *
 * Accordion-based layout for discovery sections on the search page.
 * Combines Browse by Theme, Recently Added, and Popular Songs into
 * collapsible panels to save vertical space.
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tags, Clock, TrendingUp } from "lucide-react";
import { BrowseByThemeContent } from "./BrowseByTheme";
import { RecentlyAddedContent } from "./RecentlyAddedSection";
import { PopularSongsContent } from "./PopularSongsSection";

interface DiscoveryAccordionProps {
  /** Limit for number of items in each section */
  limit?: number;
}

export function DiscoveryAccordion({ limit = 6 }: DiscoveryAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="themes"
      className="w-full"
    >
      {/* Browse by Theme */}
      <AccordionItem value="themes">
        <AccordionTrigger className="text-base font-semibold hover:no-underline">
          <div className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-primary" />
            <span>Browse by Theme</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <BrowseByThemeContent limit={limit} />
        </AccordionContent>
      </AccordionItem>

      {/* Recently Added */}
      <AccordionItem value="recent">
        <AccordionTrigger className="text-base font-semibold hover:no-underline">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span>Recently Added</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <RecentlyAddedContent limit={limit} />
        </AccordionContent>
      </AccordionItem>

      {/* Popular Songs */}
      <AccordionItem value="popular">
        <AccordionTrigger className="text-base font-semibold hover:no-underline">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>Popular Songs</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <PopularSongsContent limit={limit} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
