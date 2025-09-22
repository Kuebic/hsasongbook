// Offline indicator component for showing connection status
import { useOnlineStatus, useBandwidthAware } from '../hooks/useOnlineStatus.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi, Signal, AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * OfflineIndicator component that shows current connection status
 * @param {Object} props - Component props
 * @param {string} props.position - Position of the indicator ('top', 'bottom', 'inline')
 * @param {boolean} props.showDetails - Whether to show detailed connection info
 * @param {boolean} props.persistent - Whether to always show the indicator
 * @returns {JSX.Element|null} OfflineIndicator component or null
 */
export function OfflineIndicator({
  position = 'bottom',
  showDetails = false,
  persistent = false
}) {
  const {
    isOnline,
    checkConnection,
    getConnectionInfo,
    getOfflineDuration
  } = useOnlineStatus();

  const { connectionType, isSlowConnection } = useBandwidthAware();

  // Only show when offline or when persistent mode is enabled
  if (isOnline && !persistent) {
    return null;
  }

  const connectionInfo = getConnectionInfo();
  const offlineDuration = getOfflineDuration();

  const formatDuration = (ms) => {
    if (!ms) return '';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getConnectionIcon = () => {
    if (!isOnline) {
      return <WifiOff className="h-4 w-4" />;
    }

    if (isSlowConnection) {
      return <Signal className="h-4 w-4 text-orange-500" />;
    }

    return <Wifi className="h-4 w-4 text-green-500" />;
  };

  const getConnectionColor = () => {
    if (!isOnline) return 'destructive';
    if (isSlowConnection) return 'warning';
    return 'success';
  };

  const positionClasses = {
    top: 'fixed top-0 left-0 right-0 z-40',
    bottom: 'fixed bottom-0 left-0 right-0 z-40',
    inline: 'relative'
  };

  if (position === 'inline') {
    return (
      <div className="flex items-center space-x-2">
        <Badge variant={getConnectionColor()} className="flex items-center space-x-1">
          {getConnectionIcon()}
          <span>
            {isOnline ? (
              isSlowConnection ? `Slow (${connectionType})` : `Online (${connectionType})`
            ) : (
              'Offline'
            )}
          </span>
        </Badge>
        {showDetails && !isOnline && offlineDuration && (
          <span className="text-xs text-gray-500">
            for {formatDuration(offlineDuration)}
          </span>
        )}
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className={`${positionClasses[position]} animate-in slide-in-from-top-2`}>
        <div className="bg-red-600 text-white px-4 py-2 text-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <WifiOff className="h-4 w-4" />
              <span className="font-medium">You're offline</span>
              {offlineDuration && (
                <span className="text-red-100">
                  • Offline for {formatDuration(offlineDuration)}
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={checkConnection}
              className="h-7 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Check
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show slow connection warning if persistent mode is enabled
  if (persistent && isSlowConnection) {
    return (
      <div className={`${positionClasses[position]} animate-in slide-in-from-top-2`}>
        <div className="bg-orange-500 text-white px-4 py-2 text-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Slow connection detected</span>
              <span className="text-orange-100">
                • {connectionType.toUpperCase()} connection
              </span>
            </div>
            {showDetails && (
              <div className="text-xs text-orange-100">
                {connectionInfo.downlink && (
                  <span>{connectionInfo.downlink.toFixed(1)} Mbps</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Detailed connection status card for settings or debug purposes
 * @param {Object} props - Component props
 * @param {Function} props.onRefresh - Callback when refresh is triggered
 * @returns {JSX.Element} Detailed connection status
 */
export function ConnectionStatus({ onRefresh }) {
  const {
    isOnline,
    lastOnlineTime,
    checkConnection,
    getConnectionInfo,
    getOfflineDuration,
    getTimeSinceLastOnline
  } = useOnlineStatus();

  const { connectionType, isSlowConnection } = useBandwidthAware();
  const connectionInfo = getConnectionInfo();
  const offlineDuration = getOfflineDuration();
  const timeSinceLastOnline = getTimeSinceLastOnline();

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const handleRefresh = async () => {
    await checkConnection();
    onRefresh?.();
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Connection Status</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={isOnline ? 'success' : 'destructive'} className="flex items-center space-x-1">
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </Badge>
          </div>

          {/* Connection Type */}
          {isOnline && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connection:</span>
              <Badge variant={isSlowConnection ? 'warning' : 'default'}>
                {connectionType.toUpperCase()}
              </Badge>
            </div>
          )}

          {/* Speed Information */}
          {isOnline && connectionInfo.downlink && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Speed:</span>
              <span className="text-sm text-gray-600">
                {connectionInfo.downlink.toFixed(1)} Mbps
              </span>
            </div>
          )}

          {/* Latency */}
          {isOnline && connectionInfo.rtt && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Latency:</span>
              <span className="text-sm text-gray-600">
                {connectionInfo.rtt}ms
              </span>
            </div>
          )}

          {/* Data Saver */}
          {isOnline && connectionInfo.saveData && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Data Saver:</span>
              <Badge variant="outline">Enabled</Badge>
            </div>
          )}

          {/* Last Online */}
          {lastOnlineTime && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Online:</span>
              <span className="text-sm text-gray-600">
                {formatTime(lastOnlineTime)}
              </span>
            </div>
          )}

          {/* Offline Duration */}
          {!isOnline && offlineDuration && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Offline For:</span>
              <span className="text-sm text-gray-600">
                {formatDuration(offlineDuration)}
              </span>
            </div>
          )}

          {/* Time Since Last Online */}
          {isOnline && timeSinceLastOnline > 60000 && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connected For:</span>
              <span className="text-sm text-gray-600">
                {formatDuration(timeSinceLastOnline)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Simple connection dot indicator for minimal UI
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the dot ('sm', 'md', 'lg')
 * @returns {JSX.Element} Connection dot indicator
 */
export function ConnectionDot({ size = 'md' }) {
  const { isOnline } = useOnlineStatus();
  const { isSlowConnection } = useBandwidthAware();

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const getColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (isSlowConnection) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className={`${sizeClasses[size]} ${getColor()} rounded-full`}
         title={isOnline ? (isSlowConnection ? 'Slow connection' : 'Online') : 'Offline'} />
  );
}
