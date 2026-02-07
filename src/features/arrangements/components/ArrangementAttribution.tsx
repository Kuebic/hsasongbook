/**
 * ArrangementAttribution Component
 *
 * Shows "Duplicated from [original]" attribution for arrangements
 * that were created via the duplicate feature.
 * Mirrors SetlistAttribution pattern.
 */

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Link } from "react-router-dom";
import { Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ArrangementAttributionProps {
  arrangementId: string;
  showAttribution: boolean;
  isOwner: boolean;
  onToggleAttribution?: () => void;
  className?: string;
}

export default function ArrangementAttribution({
  arrangementId,
  showAttribution,
  isOwner,
  onToggleAttribution,
  className,
}: ArrangementAttributionProps) {
  const attributionInfo = useQuery(
    api.arrangements.getAttributionInfo,
    { arrangementId: arrangementId as Id<"arrangements"> }
  );

  if (!showAttribution || !attributionInfo) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm text-muted-foreground border-l-2 border-muted pl-3 py-1",
      className
    )}>
      <Copy className="h-4 w-4 flex-shrink-0" />
      <span>
        Duplicated from{" "}
        {attributionInfo.isAccessible && attributionInfo.songSlug && attributionInfo.arrangementSlug ? (
          <Link
            to={`/song/${attributionInfo.songSlug}/${attributionInfo.arrangementSlug}`}
            className="underline hover:text-foreground"
          >
            {attributionInfo.name}
          </Link>
        ) : (
          <span className="italic">{attributionInfo.name}</span>
        )}
        {attributionInfo.creatorUsername && (
          <>
            {" "}by{" "}
            <Link
              to={`/user/${attributionInfo.creatorUsername}`}
              className="underline hover:text-foreground"
            >
              @{attributionInfo.creatorUsername}
            </Link>
          </>
        )}
      </span>
      {isOwner && onToggleAttribution && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleAttribution}
          className="h-6 w-6 ml-auto flex-shrink-0"
          title="Hide attribution"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
