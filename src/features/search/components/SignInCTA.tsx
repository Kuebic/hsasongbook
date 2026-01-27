/**
 * SignInCTA Component
 *
 * Call-to-action section encouraging anonymous users to sign in.
 * Shows the benefits of having an account.
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, ListMusic, Plus, Sparkles } from 'lucide-react';

interface SignInCTAProps {
  className?: string;
}

export function SignInCTA({ className }: SignInCTAProps) {
  return (
    <section className={`py-8 px-6 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 ${className}`}>
      <div className="text-center max-w-md mx-auto">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Get More from HSA Songbook</h3>
        <p className="text-muted-foreground mb-6">
          Sign in to save favorites, create setlists, and contribute arrangements.
        </p>

        {/* Benefits list */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-sm">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Heart className="h-4 w-4 text-primary" />
            <span>Save Favorites</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <ListMusic className="h-4 w-4 text-primary" />
            <span>Build Setlists</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Plus className="h-4 w-4 text-primary" />
            <span>Add Songs</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth/signin">Sign In</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/auth/signup">Create Account</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default SignInCTA;
