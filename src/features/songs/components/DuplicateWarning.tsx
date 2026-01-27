/**
 * DuplicateWarning Component
 *
 * Yellow alert showing potential duplicate songs when adding a new song.
 * Non-blocking - just a warning to help users avoid accidental duplicates.
 */

import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import type { PotentialDuplicate } from '../hooks/useDuplicateDetection';

interface DuplicateWarningProps {
  duplicates: PotentialDuplicate[];
  isChecking: boolean;
}

export function DuplicateWarning({ duplicates, isChecking }: DuplicateWarningProps) {
  // Don't show anything while checking with no results
  if (isChecking && duplicates.length === 0) {
    return null;
  }

  if (duplicates.length === 0) {
    return null;
  }

  return (
    <div
      className="flex flex-col gap-2 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
      role="alert"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-yellow-600 dark:text-yellow-500" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Similar songs already exist
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
            Is this a different song or a cover? Covers should be added as arrangements.
          </p>
        </div>
      </div>

      <ul className="ml-7 space-y-1">
        {duplicates.map((dup) => (
          <li key={dup.id} className="text-sm">
            <Link
              to={`/song/${dup.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-700 dark:text-yellow-300 hover:underline font-medium"
            >
              {dup.title}
            </Link>
            <span className="text-yellow-600 dark:text-yellow-400 ml-1">
              by {dup.artist}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DuplicateWarning;
