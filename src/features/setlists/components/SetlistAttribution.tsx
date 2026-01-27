import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Link } from "react-router-dom";
import { Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SetlistAttributionProps {
  setlistId: string;
  showAttribution: boolean;
  isOwner: boolean;
  onToggleAttribution?: () => void;
  className?: string;
}

export default function SetlistAttribution({
  setlistId,
  showAttribution,
  isOwner,
  onToggleAttribution,
  className,
}: SetlistAttributionProps) {
  const attributionInfo = useQuery(
    api.setlists.getAttributionInfo,
    { setlistId: setlistId as Id<"setlists"> }
  );

  // Don't render if attribution is hidden or there's no attribution info
  if (!showAttribution || !attributionInfo) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm text-muted-foreground border-l-2 border-muted pl-3 py-1",
      className
    )}>
      <Copy className="h-4 w-4 flex-shrink-0" />
      <span>
        Duplicated from{" "}
        {attributionInfo.isAccessible && attributionInfo.id ? (
          <Link
            to={`/setlists/${attributionInfo.id}`}
            className="underline hover:text-foreground"
          >
            {attributionInfo.name}
          </Link>
        ) : (
          <span className="italic">{attributionInfo.name}</span>
        )}
        {attributionInfo.ownerUsername && (
          <>
            {" "}by{" "}
            <Link
              to={`/user/${attributionInfo.ownerUsername}`}
              className="underline hover:text-foreground"
            >
              @{attributionInfo.ownerUsername}
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
