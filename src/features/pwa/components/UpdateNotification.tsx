// Update notification component for PWA updates
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, X, Download } from 'lucide-react';
import { getZIndexClass } from '@/lib/config/zIndex';

type NotificationPosition = 'top' | 'bottom';

interface UpdateNotificationProps {
  show?: boolean;
  onUpdate: () => void;
  onDismiss?: () => void;
  position?: NotificationPosition;
  persistent?: boolean;
}

/**
 * UpdateNotification component that shows when a new app version is available
 */
export function UpdateNotification({
  show = false,
  onUpdate,
  onDismiss,
  position = 'bottom',
  persistent = true
}: UpdateNotificationProps) {
  if (!show) {
    return null;
  }

  const positionClasses: Record<NotificationPosition, string> = {
    top: `fixed top-4 left-4 right-4 ${getZIndexClass('updateNotification')}`,
    bottom: `fixed bottom-4 left-4 right-4 ${getZIndexClass('updateNotification')}`
  };

  const animationClasses = position === 'bottom'
    ? 'animate-in slide-in-from-bottom-2'
    : 'animate-in slide-in-from-top-2';

  return (
    <div className={`${positionClasses[position]} ${animationClasses}`}>
      <Card className="shadow-lg border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg text-green-900">Update Available</CardTitle>
            </div>
            {!persistent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CardDescription className="text-green-700">
            A new version of HSA Songbook is ready to install
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col space-y-3">
            <div className="text-sm text-gray-600">
              Get the latest features and improvements by updating now.
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={onUpdate}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Now
              </Button>
              {!persistent && (
                <Button
                  variant="outline"
                  onClick={onDismiss}
                  className="border-gray-300"
                >
                  Later
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface CompactUpdateNotificationProps {
  show?: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

/**
 * Compact update notification for use in header or navigation
 */
export function CompactUpdateNotification({
  show = false,
  onUpdate,
  onDismiss
}: CompactUpdateNotificationProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="bg-blue-600 text-white px-4 py-2 text-sm flex items-center justify-between animate-in slide-in-from-top-2">
      <div className="flex items-center space-x-2">
        <RefreshCw className="h-4 w-4" />
        <span>New version available</span>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={onUpdate}
          className="h-7 text-xs"
        >
          Update
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDismiss}
          className="h-7 w-7 p-0 text-white hover:bg-blue-700"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

interface UpdateProgressProps {
  show?: boolean;
  progress?: number;
}

/**
 * Update progress indicator for showing update in progress
 */
export function UpdateProgress({ show = false, progress = 0 }: UpdateProgressProps) {
  if (!show) {
    return null;
  }

  return (
    <div className={`fixed top-0 left-0 right-0 ${getZIndexClass('updateNotification')} bg-blue-600 text-white p-4 animate-in slide-in-from-top-2`}>
      <div className="max-w-md mx-auto">
        <div className="flex items-center space-x-3 mb-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="font-medium">Updating HSA Songbook...</span>
        </div>
        <div className="w-full bg-blue-700 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-blue-100 mt-1">
          {progress}% complete
        </div>
      </div>
    </div>
  );
}

interface UpdateSuccessProps {
  show?: boolean;
  onClose: () => void;
}

/**
 * Update success notification
 */
export function UpdateSuccess({ show = false, onClose }: UpdateSuccessProps) {
  if (!show) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${getZIndexClass('updateNotification')} p-4`}>
      <Card className="max-w-md animate-in fade-in-0 zoom-in-95">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Download className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-xl text-green-800">Update Complete!</CardTitle>
          <CardDescription>
            HSA Songbook has been updated to the latest version with new features and improvements.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={onClose} className="w-full">
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface UpdateErrorProps {
  show?: boolean;
  error?: string;
  onRetry: () => void;
  onDismiss: () => void;
}

/**
 * Update error notification
 */
export function UpdateError({
  show = false,
  error = 'Failed to update the app',
  onRetry,
  onDismiss
}: UpdateErrorProps) {
  if (!show) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 right-4 ${getZIndexClass('updateNotification')} animate-in slide-in-from-bottom-2`}>
      <Card className="shadow-lg border-red-200 bg-gradient-to-r from-red-50 to-rose-50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg text-red-900">Update Failed</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-red-700">
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex space-x-2">
            <Button
              onClick={onRetry}
              variant="outline"
              className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={onDismiss}
              className="border-gray-300"
            >
              Dismiss
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
