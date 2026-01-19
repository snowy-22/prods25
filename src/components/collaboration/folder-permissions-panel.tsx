'use client';

/**
 * Folder Permissions Panel
 * Manage folder collaborators, permissions, and access settings
 * Displayed in the settings folder
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Crown,
  Edit,
  Eye,
  MessageCircle,
  Shield,
  Trash2,
  Copy,
  Link,
  Settings,
  Lock,
  Globe,
  Users2,
  ChevronDown,
  Search,
  Mail,
  Check,
  X,
  MoreVertical,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
  FolderCollaborator,
  CollaboratorInvite,
  FolderPermissionLevel,
  FolderAccessType,
  FolderCollaborationSettings,
  getPermissionColor,
  getPermissionLabel,
  canUserManagePermissions,
  generateUserColor,
} from '@/lib/collaboration-types';
import {
  inviteCollaborator,
  removeCollaborator,
  updateCollaboratorPermission,
  getFolderCollaborators,
} from '@/lib/collaboration-manager';
import { useAppStore } from '@/lib/store';

interface FolderPermissionsPanelProps {
  folderId: string;
  folderName: string;
  isOwner: boolean;
  currentUserPermission?: FolderPermissionLevel;
  className?: string;
}

export function FolderPermissionsPanel({
  folderId,
  folderName,
  isOwner,
  currentUserPermission = 'viewer',
  className,
}: FolderPermissionsPanelProps) {
  const { user, username } = useAppStore();
  const [collaborators, setCollaborators] = useState<FolderCollaborator[]>([]);
  const [pendingInvites, setPendingInvites] = useState<CollaboratorInvite[]>([]);
  const [settings, setSettings] = useState<FolderCollaborationSettings>({
    folderId,
    ownerId: user?.id || '',
    accessType: 'private',
    allowPublicView: false,
    allowPublicComment: false,
    allowPublicRate: false,
    allowSave: true,
    allowShare: true,
    allowDownload: false,
    allowEmbed: false,
    requireApprovalForJoin: false,
    maxCollaborators: 50,
    watermarkEnabled: false,
    activityLogEnabled: true,
    notifyOnChanges: true,
    notifyOnComments: true,
    notifyOnJoin: true,
    blockedUsers: [],
    blockedDomains: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState<FolderPermissionLevel>('viewer');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const canManage = isOwner || canUserManagePermissions(currentUserPermission);

  useEffect(() => {
    loadData();
  }, [folderId]);

  const loadData = async () => {
    setIsLoading(true);
    const data = await getFolderCollaborators(folderId);
    setCollaborators(data);
    setIsLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !user) return;
    
    setIsLoading(true);
    await inviteCollaborator(
      folderId,
      user.id,
      username || 'User',
      undefined,
      inviteEmail,
      invitePermission
    );
    
    setInviteEmail('');
    setIsInviteDialogOpen(false);
    loadData();
    setIsLoading(false);
  };

  const handleRemove = async (collaboratorId: string) => {
    if (!user) return;
    setIsLoading(true);
    await removeCollaborator(folderId, collaboratorId, user.id);
    loadData();
    setIsLoading(false);
  };

  const handlePermissionChange = async (
    collaboratorId: string,
    newPermission: FolderPermissionLevel
  ) => {
    if (!user) return;
    setIsLoading(true);
    await updateCollaboratorPermission(folderId, collaboratorId, newPermission);
    loadData();
    setIsLoading(false);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/folder/${folderId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredCollaborators = collaborators.filter(
    c => c.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAccessIcon = (type: FolderAccessType) => {
    switch (type) {
      case 'private':
        return <Lock className="h-4 w-4" />;
      case 'link':
        return <Link className="h-4 w-4" />;
      case 'team':
        return <Users2 className="h-4 w-4" />;
      case 'public':
        return <Globe className="h-4 w-4" />;
    }
  };

  const getPermissionIcon = (permission: FolderPermissionLevel) => {
    switch (permission) {
      case 'owner':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'editor':
        return <Edit className="h-4 w-4" />;
      case 'commenter':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Klasör Yetkileri</h2>
          <p className="text-sm text-muted-foreground">
            {folderName} için erişim ve paylaşım ayarları
          </p>
        </div>
        {canManage && (
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Davet Et
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kişi Davet Et</DialogTitle>
                <DialogDescription>
                  E-posta adresi ile yeni bir katılımcı davet edin
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta Adresi</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Yetki Seviyesi</Label>
                  <Select
                    value={invitePermission}
                    onValueChange={(v) => setInvitePermission(v as FolderPermissionLevel)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span>Görüntüleyici</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="commenter">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          <span>Yorumcu</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="editor">
                        <div className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          <span>Editör</span>
                        </div>
                      </SelectItem>
                      {isOwner && (
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <span>Yönetici</span>
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleInvite} disabled={!inviteEmail.trim() || isLoading}>
                  Davet Gönder
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="people" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="people" className="gap-2">
            <Users className="h-4 w-4" />
            Kişiler
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-2">
            <Link className="h-4 w-4" />
            Erişim
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Ayarlar
          </TabsTrigger>
        </TabsList>

        {/* People Tab */}
        <TabsContent value="people" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kişi ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Collaborators List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {/* Owner */}
              {filteredCollaborators
                .filter(c => c.permissionLevel === 'owner')
                .map(collab => (
                  <CollaboratorRow
                    key={collab.id}
                    collaborator={collab}
                    canManage={false}
                    onPermissionChange={() => {}}
                    onRemove={() => {}}
                  />
                ))}

              <Separator className="my-3" />

              {/* Others */}
              {filteredCollaborators
                .filter(c => c.permissionLevel !== 'owner')
                .map(collab => (
                  <CollaboratorRow
                    key={collab.id}
                    collaborator={collab}
                    canManage={canManage}
                    isOwner={isOwner}
                    onPermissionChange={(perm) => handlePermissionChange(collab.id, perm)}
                    onRemove={() => handleRemove(collab.id)}
                  />
                ))}

              {filteredCollaborators.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Henüz katılımcı yok</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Access Tab */}
        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Erişim Türü</CardTitle>
              <CardDescription>
                Klasöre kimler erişebilir?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(['private', 'link', 'team', 'public'] as FolderAccessType[]).map(type => (
                <div
                  key={type}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    settings.accessType === type
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  )}
                  onClick={() => canManage && setSettings(s => ({ ...s, accessType: type }))}
                >
                  <div className={cn(
                    'p-2 rounded-full',
                    settings.accessType === type ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    {getAccessIcon(type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {type === 'private' && 'Özel'}
                      {type === 'link' && 'Bağlantı ile'}
                      {type === 'team' && 'Ekip'}
                      {type === 'public' && 'Herkese Açık'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {type === 'private' && 'Sadece davet edilenler erişebilir'}
                      {type === 'link' && 'Bağlantıya sahip herkes görüntüleyebilir'}
                      {type === 'team' && 'Ekip üyeleri erişebilir'}
                      {type === 'public' && 'Herkes görüntüleyebilir'}
                    </p>
                  </div>
                  {settings.accessType === type && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Share Link */}
          {settings.accessType !== 'private' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Paylaşım Bağlantısı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/folder/${folderId}`}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                  >
                    {copiedLink ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Genel Ayarlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Herkese Açık Görüntüleme</Label>
                  <p className="text-xs text-muted-foreground">
                    Giriş yapmadan görüntülenebilir
                  </p>
                </div>
                <Switch
                  checked={settings.allowPublicView}
                  onCheckedChange={(v) => setSettings(s => ({ ...s, allowPublicView: v }))}
                  disabled={!canManage}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Herkese Açık Yorum</Label>
                  <p className="text-xs text-muted-foreground">
                    Herkes yorum yapabilir
                  </p>
                </div>
                <Switch
                  checked={settings.allowPublicComment}
                  onCheckedChange={(v) => setSettings(s => ({ ...s, allowPublicComment: v }))}
                  disabled={!canManage}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Herkese Açık Puanlama</Label>
                  <p className="text-xs text-muted-foreground">
                    Herkes puanlayabilir
                  </p>
                </div>
                <Switch
                  checked={settings.allowPublicRate}
                  onCheckedChange={(v) => setSettings(s => ({ ...s, allowPublicRate: v }))}
                  disabled={!canManage}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Kaydetmeye İzin Ver</Label>
                  <p className="text-xs text-muted-foreground">
                    Kullanıcılar klasörü kaydedebilir
                  </p>
                </div>
                <Switch
                  checked={settings.allowSave}
                  onCheckedChange={(v) => setSettings(s => ({ ...s, allowSave: v }))}
                  disabled={!canManage}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Paylaşmaya İzin Ver</Label>
                  <p className="text-xs text-muted-foreground">
                    Kullanıcılar klasörü paylaşabilir
                  </p>
                </div>
                <Switch
                  checked={settings.allowShare}
                  onCheckedChange={(v) => setSettings(s => ({ ...s, allowShare: v }))}
                  disabled={!canManage}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Onay Gerekli</Label>
                  <p className="text-xs text-muted-foreground">
                    Katılım onay gerektirir
                  </p>
                </div>
                <Switch
                  checked={settings.requireApprovalForJoin}
                  onCheckedChange={(v) => setSettings(s => ({ ...s, requireApprovalForJoin: v }))}
                  disabled={!canManage}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Collaborator Row Component
interface CollaboratorRowProps {
  collaborator: FolderCollaborator;
  canManage: boolean;
  isOwner?: boolean;
  onPermissionChange: (permission: FolderPermissionLevel) => void;
  onRemove: () => void;
}

function CollaboratorRow({
  collaborator,
  canManage,
  isOwner,
  onPermissionChange,
  onRemove,
}: CollaboratorRowProps) {
  const isCollabOwner = collaborator.permissionLevel === 'owner';

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarImage src={collaborator.avatarUrl} />
        <AvatarFallback
          style={{
            backgroundColor: generateUserColor(collaborator.userId) + '40',
            color: generateUserColor(collaborator.userId),
          }}
        >
          {collaborator.displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{collaborator.displayName}</p>
        <p className="text-xs text-muted-foreground">
          {collaborator.acceptedAt && new Date(collaborator.acceptedAt).toLocaleDateString('tr-TR')} tarihinde eklendi
        </p>
      </div>

      <Badge
        variant="outline"
        className="shrink-0"
        style={{
          borderColor: getPermissionColor(collaborator.permissionLevel),
          color: getPermissionColor(collaborator.permissionLevel),
        }}
      >
        {getPermissionLabel(collaborator.permissionLevel)}
      </Badge>

      {canManage && !isCollabOwner && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPermissionChange('viewer')}>
              <Eye className="h-4 w-4 mr-2" />
              Görüntüleyici Yap
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPermissionChange('commenter')}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Yorumcu Yap
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPermissionChange('editor')}>
              <Edit className="h-4 w-4 mr-2" />
              Editör Yap
            </DropdownMenuItem>
            {isOwner && (
              <DropdownMenuItem onClick={() => onPermissionChange('admin')}>
                <Shield className="h-4 w-4 mr-2" />
                Yönetici Yap
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onRemove}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Kaldır
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export default FolderPermissionsPanel;
