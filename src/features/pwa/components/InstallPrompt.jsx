// Install prompt component for PWA installation
import { useInstallPrompt } from '../hooks/usePWA.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

/**
 * InstallPrompt component that shows PWA installation UI
 * @param {Object} props - Component props
 * @param {Function} props.onInstall - Callback when installation is triggered
 * @param {Function} props.onDismiss - Callback when prompt is dismissed
 * @param {string} props.position - Position of the prompt ('top', 'bottom', 'center')
 * @param {boolean} props.persistent - Whether prompt stays visible until dismissed
 * @returns {JSX.Element|null} InstallPrompt component or null
 */
export function InstallPrompt({
  onInstall,
  onDismiss,
  position = 'bottom',
  persistent = false
}) {
  const { showInstallPrompt, canInstall, promptInstall, dismissInstallPrompt } = useInstallPrompt();

  // Don't show if install prompt is not available
  if (!showInstallPrompt && !canInstall) {
    return null;
  }

  const handleInstall = async () => {
    try {
      await promptInstall();
      onInstall?.();
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  const handleDismiss = () => {
    dismissInstallPrompt();
    onDismiss?.();
  };

  const positionClasses = {
    top: 'fixed top-4 left-4 right-4 z-50',
    bottom: 'fixed bottom-4 left-4 right-4 z-50',
    center: 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-96'
  };

  const animationClasses = position === 'bottom'
    ? 'animate-in slide-in-from-bottom-2'
    : position === 'top'
    ? 'animate-in slide-in-from-top-2'
    : 'animate-in fade-in-0 zoom-in-95';

  return (
    <div className={`${positionClasses[position]} ${animationClasses}`}>
      <Card className="shadow-lg border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-900">Install HSA Songbook</CardTitle>
            </div>
            {!persistent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CardDescription className="text-blue-700">
            Install the app for quick access and offline functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col space-y-3">
            <div className="text-sm text-gray-600">
              <ul className="space-y-1">
                <li>• Access your songbook offline</li>
                <li>• Faster loading times</li>
                <li>• Native app experience</li>
              </ul>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleInstall}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
              {persistent && (
                <Button
                  variant="outline"
                  onClick={handleDismiss}
                  className="border-gray-300"
                >
                  Not Now
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Minimal install button for use in navigation or other components
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant
 * @param {string} props.size - Button size
 * @param {boolean} props.showText - Whether to show text or just icon
 * @returns {JSX.Element|null} Install button or null
 */
export function InstallButton({
  variant = 'outline',
  size = 'default',
  showText = true
}) {
  const { showInstallPrompt, canInstall, promptInstall } = useInstallPrompt();

  if (!showInstallPrompt && !canInstall) {
    return null;
  }

  const handleInstall = async () => {
    try {
      await promptInstall();
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  return (
    <Button
      onClick={handleInstall}
      variant={variant}
      size={size}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {showText && 'Install App'}
    </Button>
  );
}

/**
 * Platform-specific installation instructions
 * @param {Object} props - Component props
 * @param {string} props.platform - Platform type ('ios', 'android', 'desktop')
 * @returns {JSX.Element} Installation instructions
 */
export function InstallationInstructions({ platform }) {
  const instructions = {
    ios: {
      title: 'Install on iOS',
      steps: [
        'Tap the Share button in Safari',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" to install the app'
      ]
    },
    android: {
      title: 'Install on Android',
      steps: [
        'Tap the menu button in your browser',
        'Select "Add to Home screen" or "Install app"',
        'Tap "Add" or "Install" to confirm'
      ]
    },
    desktop: {
      title: 'Install on Desktop',
      steps: [
        'Click the install icon in your browser\'s address bar',
        'Or click the "Install" button when prompted',
        'Follow your browser\'s installation prompts'
      ]
    }
  };

  const instruction = instructions[platform] || instructions.desktop;

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">{instruction.title}</CardTitle>
        <CardDescription>
          Follow these steps to install HSA Songbook as an app
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2 text-sm">
          {instruction.steps.map((step, index) => (
            <li key={index} className="flex">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                {index + 1}
              </span>
              <span className="text-gray-700">{step}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

/**
 * Installation success message component
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Callback when success message is closed
 * @returns {JSX.Element} Success message
 */
export function InstallationSuccess({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md animate-in fade-in-0 zoom-in-95">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Download className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-xl text-green-800">App Installed!</CardTitle>
          <CardDescription>
            HSA Songbook has been successfully installed and is ready to use offline.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={onClose} className="w-full">
            Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}