import { Badge } from "@/components/ui/badge";
import { Lock, Link2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface SetlistPrivacyBadgeProps {
  privacyLevel: 'private' | 'unlisted' | 'public' | undefined;
  className?: string;
}

export default function SetlistPrivacyBadge({
  privacyLevel,
  className,
}: SetlistPrivacyBadgeProps) {
  // Treat undefined as 'private' (schema default)
  const level = privacyLevel ?? 'private';

  if (level === 'private') {
    return (
      <Badge variant="secondary" className={cn("gap-1", className)}>
        <Lock className="h-3 w-3" />
        <span>Private</span>
      </Badge>
    );
  }

  if (level === 'unlisted') {
    return (
      <Badge variant="outline" className={cn("gap-1", className)}>
        <Link2 className="h-3 w-3" />
        <span>Unlisted</span>
      </Badge>
    );
  }

  return (
    <Badge variant="default" className={cn("gap-1", className)}>
      <Globe className="h-3 w-3" />
      <span>Public</span>
    </Badge>
  );
}
