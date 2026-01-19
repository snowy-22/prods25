'use client';

/**
 * Permissions System - Yetki Yönetim Sistemi
 * 
 * Task 8: Klasör, oynatıcı, sosyal içerik yetkileri
 * - Public/Private ayarları
 * - Görünür/Gizli grup seçenekleri
 * - İçerik paylaşım izinleri
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Globe,
  Lock,
  Eye,
  EyeOff,
  Users,
  User,
  Building2,
  Shield,
  ShieldCheck,
  ShieldX,
  UserPlus,
  UserMinus,
  Crown,
  Settings,
  Link,
  Copy,
  Check,
  X,
  Search,
  ChevronRight,
} from 'lucide-react';

// Yetki tipleri
export type PermissionLevel = 'owner' | 'admin' | 'editor' | 'viewer' | 'none';
export type VisibilityLevel = 'public' | 'private' | 'unlisted' | 'group-only';

export interface ContentPermission {
  id: string;
  contentId: string;
  contentType: 'folder' | 'player' | 'post' | 'group' | 'message-group';
  ownerId: string;
  visibility: VisibilityLevel;
  allowComments: boolean;
  allowDownload: boolean;
  allowShare: boolean;
  allowEmbed: boolean;
  requireApproval: boolean;
  passwordProtected: boolean;
  password?: string;
  expiresAt?: string;
  memberPermissions: MemberPermission[];
  groupPermissions: GroupPermission[];
  createdAt: string;
  updatedAt: string;
}

export interface MemberPermission {
  userId: string;
  userName: string;
  userAvatar?: string;
  level: PermissionLevel;
  grantedBy: string;
  grantedAt: string;
}

export interface GroupPermission {
  groupId: string;
  groupName: string;
  groupType: 'personal' | 'organization' | 'social' | 'message';
  level: PermissionLevel;
  grantedBy: string;
  grantedAt: string;
}

interface PermissionManagerProps {
  permission: ContentPermission;
  onUpdate: (updates: Partial<ContentPermission>) => void;
  currentUserId: string;
  isOwner: boolean;
  className?: string;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  permission,
  onUpdate,
  currentUserId,
  isOwner,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/share/${permission.contentId}`;
    await navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const getVisibilityIcon = (visibility: VisibilityLevel) => {
    switch (visibility) {
      case 'public': return <Globe className="h-4 w-4 text-green-500" />;
      case 'private': return <Lock className="h-4 w-4 text-red-500" />;
      case 'unlisted': return <EyeOff className="h-4 w-4 text-amber-500" />;
      case 'group-only': return <Users className="h-4 w-4 text-blue-500" />;
    }
  };

  const getVisibilityLabel = (visibility: VisibilityLevel) => {
    switch (visibility) {
      case 'public': return 'Herkese Açık';
      case 'private': return 'Özel';
      case 'unlisted': return 'Listelenmiyor';
      case 'group-only': return 'Sadece Grup';
    }
  };

  const getPermissionBadge = (level: PermissionLevel) => {
    switch (level) {
      case 'owner':
        return <Badge className="bg-amber-500"><Crown className="h-3 w-3 mr-1" />Sahip</Badge>;
      case 'admin':
        return <Badge className="bg-purple-500"><ShieldCheck className="h-3 w-3 mr-1" />Yönetici</Badge>;
      case 'editor':
        return <Badge className="bg-blue-500"><Settings className="h-3 w-3 mr-1" />Düzenleyici</Badge>;
      case 'viewer':
        return <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" />İzleyici</Badge>;
      default:
        return <Badge variant="outline"><ShieldX className="h-3 w-3 mr-1" />Yok</Badge>;
    }
  };

  return (
    <div className={cn("bg-background border rounded-lg shadow-lg overflow-hidden", className)}>
      <Tabs defaultValue="visibility">
        <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
          <TabsTrigger value="visibility">Görünürlük</TabsTrigger>
          <TabsTrigger value="members">Üyeler</TabsTrigger>
          <TabsTrigger value="settings">Ayarlar</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[400px]">
          {/* Görünürlük Sekmesi */}
          <TabsContent value="visibility" className="p-4 space-y-4 m-0">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Görünürlük Durumu</Label>
              
              <div className="grid gap-2">
                {(['public', 'private', 'unlisted', 'group-only'] as VisibilityLevel[]).map((vis) => (
                  <button
                    key={vis}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      permission.visibility === vis 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-primary/50"
                    )}
                    onClick={() => onUpdate({ visibility: vis })}
                    disabled={!isOwner}
                  >
                    {getVisibilityIcon(vis)}
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{getVisibilityLabel(vis)}</p>
                      <p className="text-xs text-muted-foreground">
                        {vis === 'public' && 'Herkes görebilir ve erişebilir'}
                        {vis === 'private' && 'Sadece davet edilenler erişebilir'}
                        {vis === 'unlisted' && 'Link ile erişilebilir, listede görünmez'}
                        {vis === 'group-only' && 'Sadece grup üyeleri erişebilir'}
                      </p>
                    </div>
                    {permission.visibility === vis && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Paylaşım Linki */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Paylaşım Linki</Label>
              <div className="flex gap-2">
                <Input 
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${permission.contentId}`}
                  readOnly
                  className="flex-1 text-xs"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleCopyLink}
                >
                  {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Üyeler Sekmesi */}
          <TabsContent value="members" className="p-4 space-y-4 m-0">
            {/* Arama ve Davet */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Üye ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {isOwner && (
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-1" />
                      Davet Et
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Üye Davet Et</DialogTitle>
                      <DialogDescription>
                        E-posta veya kullanıcı adı ile davet gönderin
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Input placeholder="E-posta veya kullanıcı adı" />
                      <Select defaultValue="viewer">
                        <SelectTrigger>
                          <SelectValue placeholder="Yetki seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Yönetici</SelectItem>
                          <SelectItem value="editor">Düzenleyici</SelectItem>
                          <SelectItem value="viewer">İzleyici</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                        İptal
                      </Button>
                      <Button>Davet Gönder</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Üye Listesi */}
            <div className="space-y-2">
              {permission.memberPermissions
                .filter(m => 
                  m.userName.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((member) => (
                  <div 
                    key={member.userId}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.userAvatar} />
                      <AvatarFallback>{member.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{member.userName}</p>
                    </div>
                    {getPermissionBadge(member.level)}
                    {isOwner && member.level !== 'owner' && (
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

              {permission.memberPermissions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Henüz üye yok</p>
                </div>
              )}
            </div>

            {/* Grup Yetkileri */}
            {permission.groupPermissions.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Grup Yetkileri</Label>
                  {permission.groupPermissions.map((group) => (
                    <div 
                      key={group.groupId}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <div className="p-2 rounded-full bg-muted">
                        {group.groupType === 'organization' ? (
                          <Building2 className="h-4 w-4" />
                        ) : (
                          <Users className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{group.groupName}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {group.groupType === 'organization' ? 'Organizasyon' : 
                           group.groupType === 'social' ? 'Sosyal Grup' : 
                           group.groupType === 'message' ? 'Mesaj Grubu' : 'Kişisel'}
                        </p>
                      </div>
                      {getPermissionBadge(group.level)}
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Ayarlar Sekmesi */}
          <TabsContent value="settings" className="p-4 space-y-4 m-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Yorumlara İzin Ver</Label>
                  <p className="text-xs text-muted-foreground">
                    İzleyiciler yorum yapabilir
                  </p>
                </div>
                <Switch 
                  checked={permission.allowComments}
                  onCheckedChange={(checked) => onUpdate({ allowComments: checked })}
                  disabled={!isOwner}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">İndirmeye İzin Ver</Label>
                  <p className="text-xs text-muted-foreground">
                    İzleyiciler içeriği indirebilir
                  </p>
                </div>
                <Switch 
                  checked={permission.allowDownload}
                  onCheckedChange={(checked) => onUpdate({ allowDownload: checked })}
                  disabled={!isOwner}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Paylaşıma İzin Ver</Label>
                  <p className="text-xs text-muted-foreground">
                    İzleyiciler içeriği paylaşabilir
                  </p>
                </div>
                <Switch 
                  checked={permission.allowShare}
                  onCheckedChange={(checked) => onUpdate({ allowShare: checked })}
                  disabled={!isOwner}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Embed İzni</Label>
                  <p className="text-xs text-muted-foreground">
                    Diğer sitelerde gösterilebilir
                  </p>
                </div>
                <Switch 
                  checked={permission.allowEmbed}
                  onCheckedChange={(checked) => onUpdate({ allowEmbed: checked })}
                  disabled={!isOwner}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Onay Gerekli</Label>
                  <p className="text-xs text-muted-foreground">
                    Yeni üyeleri onaylayın
                  </p>
                </div>
                <Switch 
                  checked={permission.requireApproval}
                  onCheckedChange={(checked) => onUpdate({ requireApproval: checked })}
                  disabled={!isOwner}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Şifre Koruması</Label>
                  <p className="text-xs text-muted-foreground">
                    Erişim için şifre gerekir
                  </p>
                </div>
                <Switch 
                  checked={permission.passwordProtected}
                  onCheckedChange={(checked) => onUpdate({ passwordProtected: checked })}
                  disabled={!isOwner}
                />
              </div>

              {permission.passwordProtected && (
                <Input 
                  type="password"
                  placeholder="Şifre belirleyin"
                  value={permission.password || ''}
                  onChange={(e) => onUpdate({ password: e.target.value })}
                  disabled={!isOwner}
                />
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

// Basit yetki kontrolü için hook
export function usePermission(
  permission: ContentPermission | undefined,
  userId: string
): {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManage: boolean;
  isOwner: boolean;
  level: PermissionLevel;
} {
  if (!permission) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canManage: false,
      isOwner: false,
      level: 'none',
    };
  }

  const isOwner = permission.ownerId === userId;
  const memberPerm = permission.memberPermissions.find(m => m.userId === userId);
  const level = isOwner ? 'owner' : (memberPerm?.level || 'none');

  return {
    canView: level !== 'none' || permission.visibility === 'public',
    canEdit: level === 'owner' || level === 'admin' || level === 'editor',
    canDelete: level === 'owner' || level === 'admin',
    canManage: level === 'owner' || level === 'admin',
    isOwner,
    level,
  };
}

export default PermissionManager;
