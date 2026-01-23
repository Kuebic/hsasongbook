/**
 * GroupCard Component
 * Phase 2: Groups - Card for displaying group in lists
 */

import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Lock, Globe, Crown, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GroupData } from '../hooks/useGroupData';

interface GroupCardProps {
  group: GroupData;
  className?: string;
}

export default function GroupCard({ group, className }: GroupCardProps) {
  const isPublic = group.isSystemGroup;

  return (
    <Link to={`/groups/${group.slug}`}>
      <Card
        className={cn(
          'hover:bg-muted/50 transition-colors cursor-pointer',
          className
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Group Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{group.name}</h3>
                {isPublic && (
                  <Badge variant="secondary" className="text-xs">
                    System
                  </Badge>
                )}
              </div>

              {group.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {group.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                </span>
                <span className="flex items-center gap-1">
                  {group.joinPolicy === 'open' ? (
                    <>
                      <Globe className="h-3 w-3" />
                      Open
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      Approval required
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Membership Status */}
            {group.isMember && (
              <Badge
                variant={group.role === 'owner' ? 'default' : 'secondary'}
                className="flex items-center gap-1"
              >
                {group.role === 'owner' && <Crown className="h-3 w-3" />}
                {group.role === 'admin' && <Shield className="h-3 w-3" />}
                {group.role === 'owner'
                  ? 'Owner'
                  : group.role === 'admin'
                    ? 'Admin'
                    : 'Member'}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
