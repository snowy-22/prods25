'use client';

/**
 * Collaborator Avatars
 * Displays mini profile photos of folder collaborators in header
 * - Shows max 4 avatars, then "+N" for overflow
 * - Green ring around online users
 * - Ordered by action/login time
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Eye, Edit, Crown, UserCheck, Plus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  FolderCollaborator,
  PresenceUser,
  PresenceState,
  FolderPermissionLevel,
  getPermissionColor,
  getPermissionLabel,
  generateUserColor,
} from '@/lib/collaboration-types';
import { presenceManager, getFolderCollaborators } from '@/lib/collaboration-manager';
import { useAppStore } from '@/lib/store';

interface CollaboratorAvatarsProps {
  folderId: string;
  maxVisible?: number;
  showOnlineOnly?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onInvite?: () => void;
  interactive?: boolean;
}

interface DisplayUser {
  id: string;
  name: string;
  avatar?: string;
  permission: FolderPermissionLevel;
  isOnline: boolean;
  color: string;
  lastActiveAt?: string;
  cursorPosition?: { x: number; y: number };
  device?: string;
}

export function CollaboratorAvatars({
  folderId,
  maxVisible = 4,
  showOnlineOnly = false,
  className,
  size = 'md',
  onInvite,
  interactive = true,
}: CollaboratorAvatarsProps) {
  const { user } = useAppStore();
  const [collaborators, setCollaborators] = useState<FolderCollaborator[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Load collaborators
  useEffect(() => {
    loadCollaborators();
  }, [folderId]);

  // Subscribe to online presence
  useEffect(() => {
    if (!user || !folderId) return;

    const handlePresenceSync = (state: PresenceState) => {
      setOnlineUsers(state.users);
    };

    const handleUserLeft = (leftUser: PresenceUser) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== leftUser.userId));
    };

    presenceManager.joinFolder(
      folderId,
      user.id,
      {
        displayName: user.email?.split('@')[0] || 'User',
        avatarUrl: undefined,
        permissionLevel: 'viewer',
      },
      {
        onPresenceSync: handlePresenceSync,
        onUserLeft: handleUserLeft,
      }
    );

    return () => {
      presenceManager.leaveFolder(folderId);
    };
  }, [folderId, user]);

  const loadCollaborators = async () => {
    const data = await getFolderCollaborators(folderId);
    setCollaborators(data);
  };

  // Merge collaborators with online status
  const displayUsers = useMemo<DisplayUser[]>(() => {
    const onlineUserIds = new Set(onlineUsers.map(u => u.userId));
    
    const merged: DisplayUser[] = collaborators.map(collab => {
      const online = onlineUsers.find(u => u.userId === collab.userId);
      return {
        id: collab.userId,
        name: collab.displayName,
        avatar: collab.avatarUrl,
        permission: collab.permissionLevel,
        isOnline: onlineUserIds.has(collab.userId),
        color: online?.color || generateUserColor(collab.userId),
        lastActiveAt: online?.lastSeenAt || collab.lastAccessedAt,
        cursorPosition: online?.cursorPosition,
        device: online?.deviceInfo?.deviceType,
      };
    });

    // Add online users who might not be in collaborators list (viewers via link)
    onlineUsers.forEach(online => {
      if (!merged.find(m => m.id === online.userId)) {
        merged.push({
          id: online.userId,
          name: online.displayName,
          avatar: online.avatarUrl,
          permission: 'viewer',
          isOnline: true,
          color: online.color,
          lastActiveAt: online.lastSeenAt,
          cursorPosition: online.cursorPosition,
          device: online.deviceInfo?.deviceType,
        });
      }
    });

    // Sort: online first, then by last active
    merged.sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      if (!a.lastActiveAt) return 1;
      if (!b.lastActiveAt) return -1;
      return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
    });

    if (showOnlineOnly) {
      return merged.filter(u => u.isOnline);
    }

    return merged;
  }, [collaborators, onlineUsers, showOnlineOnly]);

  const visibleUsers = displayUsers.slice(0, maxVisible);
  const overflowCount = Math.max(0, displayUsers.length - maxVisible);
  const onlineCount = displayUsers.filter(u => u.isOnline).length;

  // Size classes
  const sizeClasses = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm',
  };

  const ringSize = {
    sm: 'ring-[1.5px]',
    md: 'ring-2',
    lg: 'ring-[2.5px]',
  };

  const getPermissionIcon = (permission: FolderPermissionLevel) => {
    switch (permission) {
      case 'owner':
        return <Crown className="h-3 w-3" />;
      case 'admin':
        return <UserCheck className="h-3 w-3" />;
      case 'editor':
        return <Edit className="h-3 w-3" />;
      default:
        return <Eye className="h-3 w-3" />;
    }
  };

  if (displayUsers.length === 0 && !onInvite) {
    return null;
  }

  return (
    <div className={cn('flex items-center', className)}>
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center -space-x-2">
          {visibleUsers.map((displayUser, index) => (
            <Tooltip key={displayUser.id}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                  style={{ zIndex: maxVisible - index }}
                >
                  <Avatar
                    className={cn(
                      sizeClasses[size],
                      'border-2 border-background cursor-pointer transition-transform hover:scale-110 hover:z-50',
                      displayUser.isOnline && [
                        ringSize[size],
                        'ring-green-500 ring-offset-1 ring-offset-background',
                      ]
                    )}
                  >
                    <AvatarImage src={displayUser.avatar} alt={displayUser.name} />
                    <AvatarFallback
                      className="font-medium"
                      style={{
                        backgroundColor: displayUser.color + '40',
                        color: displayUser.color,
                      }}
                    >
                      {displayUser.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Online indicator dot (backup if ring not visible) */}
                  {displayUser.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                  )}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{displayUser.name}</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] h-4 px-1"
                    style={{
                      borderColor: getPermissionColor(displayUser.permission),
                      color: getPermissionColor(displayUser.permission),
                    }}
                  >
                    {getPermissionIcon(displayUser.permission)}
                    <span className="ml-1">{getPermissionLabel(displayUser.permission)}</span>
                  </Badge>
                </div>
                {displayUser.isOnline && displayUser.device && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {displayUser.device} cihazından aktif
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Overflow indicator */}
          {overflowCount > 0 && (
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: maxVisible * 0.05 }}
                  className={cn(
                    sizeClasses[size],
                    'rounded-full bg-muted border-2 border-background flex items-center justify-center font-medium text-muted-foreground hover:bg-accent transition-colors',
                    interactive && 'cursor-pointer hover:scale-110'
                  )}
                  style={{ zIndex: 0 }}
                >
                  +{overflowCount}
                </motion.button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <div className="p-3 border-b">
                  <h4 className="font-medium text-sm">Katılımcılar</h4>
                  <p className="text-xs text-muted-foreground">
                    {onlineCount} kişi çevrimiçi
                  </p>
                </div>
                <ScrollArea className="max-h-64">
                  <div className="p-2 space-y-1">
                    {displayUsers.map(displayUser => (
                      <div
                        key={displayUser.id}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={displayUser.avatar} />
                            <AvatarFallback
                              style={{
                                backgroundColor: displayUser.color + '40',
                                color: displayUser.color,
                              }}
                            >
                              {displayUser.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {displayUser.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {displayUser.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getPermissionLabel(displayUser.permission)}
                          </p>
                        </div>
                        {displayUser.isOnline && (
                          <span className="text-xs text-green-600 font-medium">
                            Aktif
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}

          {/* Invite button */}
          {onInvite && interactive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={onInvite}
                  className={cn(
                    sizeClasses[size],
                    'rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors ml-2'
                  )}
                >
                  <Plus className="h-4 w-4" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Kişi Davet Et</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>

      {/* Online count indicator */}
      {onlineCount > 0 && !showOnlineOnly && (
        <div className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span>{onlineCount} aktif</span>
        </div>
      )}
    </div>
  );
}

export default CollaboratorAvatars;
