/**
 * DraftRecoveryDialog Component
 *
 * Modal dialog for recovering from drafts with preview
 */

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, FileText, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DraftPreview {
  draftPreview: string;
  arrangementPreview: string;
  draftHasMore?: boolean;
  arrangementHasMore?: boolean;
}

interface DraftRecoveryDialogProps {
  isOpen: boolean;
  draftContent: string;
  arrangementContent: string;
  draftTimestamp?: number | string | Date;
  arrangementTimestamp?: number | string | Date;
  onApply: () => void;
  onDiscard: () => void;
  onClose: () => void;
  getPreview?: () => DraftPreview;
}

export default function DraftRecoveryDialog({
  isOpen,
  draftContent,
  arrangementContent,
  draftTimestamp,
  arrangementTimestamp,
  onApply,
  onDiscard,
  onClose,
  getPreview
}: DraftRecoveryDialogProps) {
  if (!isOpen) return null

  const preview = getPreview?.() || {
    draftPreview: draftContent,
    arrangementPreview: arrangementContent
  }

  const formatTimestamp = (timestamp: number | string | Date | undefined): string => {
    if (!timestamp) return 'Unknown'
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Draft Recovery Available
          </CardTitle>
          <CardDescription>
            A newer draft was found. Would you like to restore it?
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto space-y-4">
          {/* Timestamp comparison */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Draft: {formatTimestamp(draftTimestamp)}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Saved: {formatTimestamp(arrangementTimestamp)}</span>
            </div>
          </div>

          {/* Side-by-side preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Draft preview */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-amber-600">Draft Content</h4>
              <pre className={cn(
                "text-xs bg-muted p-3 rounded-md overflow-auto max-h-60",
                "font-mono whitespace-pre-wrap break-words"
              )}>
                {preview.draftPreview}
                {preview.draftHasMore && '\n...'}
              </pre>
            </div>

            {/* Arrangement preview */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Saved Content</h4>
              <pre className={cn(
                "text-xs bg-muted/50 p-3 rounded-md overflow-auto max-h-60",
                "font-mono whitespace-pre-wrap break-words"
              )}>
                {preview.arrangementPreview}
                {preview.arrangementHasMore && '\n...'}
              </pre>
            </div>
          </div>

          {/* Info message */}
          <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
            <p>
              <strong>Restore Draft:</strong> Load the draft content into the editor.
            </p>
            <p>
              <strong>Discard Draft:</strong> Use the last saved version and delete the draft.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onDiscard}
            className="text-destructive hover:text-destructive"
          >
            Discard Draft
          </Button>
          <Button
            onClick={onApply}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Restore Draft
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
