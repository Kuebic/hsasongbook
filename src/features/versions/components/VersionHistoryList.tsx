/**
 * VersionHistoryList Component
 * Renders a scrollable list of version items.
 */

import VersionItem from './VersionItem';
import { History } from 'lucide-react';

interface Version {
  _id: string;
  version: number;
  changedAt: number;
  changeDescription?: string;
  changedByUser: {
    _id: string;
    username?: string;
    displayName?: string;
    avatarKey?: string;
  } | null;
}

interface VersionHistoryListProps {
  versions: Version[];
  onRollback: (version: number) => void;
}

export default function VersionHistoryList({
  versions,
  onRollback,
}: VersionHistoryListProps) {
  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <History className="h-8 w-8 mb-2" />
        <p className="text-sm">No version history yet</p>
        <p className="text-xs">Versions will appear here as changes are made</p>
      </div>
    );
  }

  return (
    <div className="max-h-[300px] overflow-y-auto">
      <div className="space-y-1">
        {versions.map((version, index) => (
          <VersionItem
            key={version._id}
            version={version}
            isLatest={index === 0}
            onRollback={onRollback}
          />
        ))}
      </div>
    </div>
  );
}
