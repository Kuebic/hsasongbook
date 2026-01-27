import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAnonymousFavorites } from '../hooks/useAnonymousFavorites';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function AnonymousFavoritesWarning() {
  const { user } = useAuth();
  const { favorites } = useAnonymousFavorites();

  // Only show for anonymous users with favorites
  if (!user?.isAnonymous || favorites.length === 0) return null;

  return (
    <Alert variant="warning" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Your favorites are stored locally and won't sync across devices or
        persist if you clear your browser cache.{' '}
        <Link to="/auth/signup" className="font-medium underline">
          Sign up to save them permanently.
        </Link>
      </AlertDescription>
    </Alert>
  );
}
