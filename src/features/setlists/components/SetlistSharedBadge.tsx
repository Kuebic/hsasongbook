import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface SetlistSharedBadgeProps {
  isOwner: boolean;
  canEdit: boolean;
  className?: string;
}

export default function SetlistSharedBadge({
  isOwner,
  canEdit,
  className,
}: SetlistSharedBadgeProps) {
  // Don't show badge for owners
  if (isOwner) return null;

  return (
    <Badge
      variant={canEdit ? "default" : "secondary"}
      className={cn("gap-1", className)}
    >
      <Users className="h-3 w-3" />
      <span>{canEdit ? "Can Edit" : "View Only"}</span>
    </Badge>
  );
}
