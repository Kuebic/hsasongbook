/**
 * VersionHistoryPanel Component
 * Collapsible panel for viewing version history of Community-owned content.
 * Visible to Community group moderators (admin/owner) OR original content creators.
 */

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ChevronDown, ChevronUp, History, Loader2 } from 'lucide-react';
import { useVersionHistory } from '../hooks/useVersionHistory';
import { useCanAccessVersionHistory } from '../hooks/useIsCommunityGroupModerator';
import VersionHistoryList from './VersionHistoryList';
import RollbackConfirmDialog from './RollbackConfirmDialog';
import { getDisplayName } from '@/features/shared/utils/userDisplay';

type ContentType = 'song' | 'arrangement';

interface VersionHistoryPanelProps {
  contentType: ContentType;
  contentId: string;
  ownerType?: 'user' | 'group';
}

export default function VersionHistoryPanel({
  contentType,
  contentId,
  ownerType,
}: VersionHistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<{
    version: number;
    changedAt: number;
    changedByUser: string;
  } | null>(null);

  const { canAccess, loading: accessLoading } = useCanAccessVersionHistory(contentType, contentId);
  const {
    versions,
    loading: versionsLoading,
    rollback,
    isRollingBack,
    rollbackError,
    clearRollbackError,
  } = useVersionHistory(contentType, contentId);

  // Don't render if:
  // 1. Not a group-owned content
  // 2. User cannot access version history (not moderator AND not original creator)
  // 3. Still loading access status
  if (ownerType !== 'group') {
    return null;
  }

  if (accessLoading) {
    return null;
  }

  if (!canAccess) {
    return null;
  }

  const handleRollbackClick = (version: number) => {
    const targetVersion = versions.find((v) => v.version === version);
    if (targetVersion) {
      setRollbackTarget({
        version: targetVersion.version,
        changedAt: targetVersion.changedAt,
        changedByUser: getDisplayName(targetVersion.changedByUser, { prefixUsername: false }),
      });
    }
  };

  const handleRollbackConfirm = async () => {
    if (!rollbackTarget) return;

    try {
      await rollback(rollbackTarget.version);
      setRollbackTarget(null);
    } catch {
      // Error is handled in the hook
    }
  };

  return (
    <>
      <Card className="mt-6 no-print">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="py-3">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
              >
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-4 w-4" />
                  Version History
                  {versions.length > 0 && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {versions.length}
                    </span>
                  )}
                </CardTitle>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0">
              {/* Error display */}
              {rollbackError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-3">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{rollbackError}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRollbackError}
                    className="ml-auto"
                  >
                    Dismiss
                  </Button>
                </div>
              )}

              {/* Loading state */}
              {versionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <VersionHistoryList
                  versions={versions}
                  onRollback={handleRollbackClick}
                />
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Rollback confirmation dialog */}
      {rollbackTarget && (
        <RollbackConfirmDialog
          open={true}
          onOpenChange={(open) => !open && setRollbackTarget(null)}
          versionNumber={rollbackTarget.version}
          versionDate={format(new Date(rollbackTarget.changedAt), 'PPp')}
          changedByUser={rollbackTarget.changedByUser}
          onConfirm={handleRollbackConfirm}
          isLoading={isRollingBack}
        />
      )}
    </>
  );
}
