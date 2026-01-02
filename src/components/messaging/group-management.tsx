'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Group, GroupMember, PermissionLevel, GroupType, PermissionMatrix } from '@/lib/messaging-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Settings2,
  Trash2,
  Crown,
  Shield,
  Zap,
  Users,
  Lock,
  Globe,
  MoreVertical,
  ChevronDown,
  Search,
} from 'lucide-react';

interface GroupManagementProps {
  groups: Group[];
  currentUserId: string;
  onCreateGroup: (group: Omit<Group, 'id' | 'createdAt' | 'updatedAt' | 'messageCount'>) => void;
  onUpdateGroup: (groupId: string, updates: Partial<Group>) => void;
  onRemoveGroupMember: (groupId: string, userId: string) => void;
  onUpdateMemberRole: (groupId: string, userId: string, role: PermissionLevel) => void;
}

export function GroupManagement({
  groups,
  currentUserId,
  onCreateGroup,
  onUpdateGroup,
  onRemoveGroupMember,
  onUpdateMemberRole,
}: GroupManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState<GroupType>('private_closed');

  const filteredGroups = useMemo(() => {
    return groups.filter((g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [groups, searchQuery]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId),
    [groups, selectedGroupId]
  );

  const isOwner = selectedGroup?.owner.userId === currentUserId;
  const currentUserRole = selectedGroup?.members.find((m) => m.userId === currentUserId)?.role;
  const permissions = currentUserRole ? PermissionMatrix[currentUserRole] : null;

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup: Omit<Group, 'id' | 'createdAt' | 'updatedAt' | 'messageCount'> = {
      name: newGroupName,
      type: newGroupType,
      isPublic: newGroupType === 'public',
      members: [
        {
          userId: currentUserId,
          userName: 'You',
          role: PermissionLevel.OWNER,
          joinedAt: new Date().toISOString(),
          isActive: true,
        },
      ],
      owner: {
        userId: currentUserId,
        userName: 'You',
        role: PermissionLevel.OWNER,
        joinedAt: new Date().toISOString(),
        isActive: true,
      },
      createdBy: currentUserId,
      description: '',
      settings: {
        allowMemberInvites: true,
        requireApprovalForNewMembers: newGroupType !== 'public',
        allowMemberToChangeNickname: true,
        disableReactions: false,
        disableMentions: false,
      },
    };

    onCreateGroup(newGroup);
    setNewGroupName('');
    setNewGroupType('private_closed');
    setShowCreateDialog(false);
  };

  const getRoleIcon = (role: PermissionLevel) => {
    switch (role) {
      case PermissionLevel.OWNER:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case PermissionLevel.ADMIN:
        return <Shield className="h-4 w-4 text-blue-500" />;
      case PermissionLevel.MODERATOR:
        return <Zap className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: GroupType) => {
    if (type === 'public') {
      return <Globe className="h-4 w-4" />;
    }
    return <Lock className="h-4 w-4" />;
  };

  const getTypeLabel = (type: GroupType) => {
    switch (type) {
      case 'public':
        return 'Herkesin Erişimi Var';
      case 'private_open':
        return 'Request ile Katılabilir';
      case 'private_closed':
        return 'Invite ile Katılabilir';
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4 bg-card/50">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Grup ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Yeni Grup
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Grup Oluştur</DialogTitle>
              <DialogDescription>
                Yeni bir grup oluşturun ve takımınızla işbirliği yapın.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Grup Adı</label>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="örn. Proje Yönetimi"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Grup Türü</label>
                <div className="space-y-2 mt-2">
                  {(['private_closed', 'private_open', 'public'] as GroupType[]).map(
                    (type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="groupType"
                          value={type}
                          checked={newGroupType === type}
                          onChange={(e) => setNewGroupType(e.target.value as GroupType)}
                          className="h-4 w-4"
                        />
                        <div className="flex items-center gap-2">
                          {getTypeIcon(type)}
                          <span className="text-sm">{getTypeLabel(type)}</span>
                        </div>
                      </label>
                    )
                  )}
                </div>
              </div>
              <Button onClick={handleCreateGroup} className="w-full">
                Grup Oluştur
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups List / Details */}
      <div className="flex-1 min-h-0 flex gap-4">
        {/* Groups List */}
        <div className="w-full md:w-1/3 border-r pr-4 overflow-y-auto">
          <div className="space-y-2">
            {filteredGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Grup bulunamadı
              </p>
            ) : (
              filteredGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border transition-colors',
                    selectedGroupId === group.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm truncate">{group.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {group.members.length} üye
                      </p>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0 gap-1">
                      {getTypeIcon(group.type)}
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Group Details */}
        {selectedGroup ? (
          <div className="hidden md:flex md:w-2/3 flex-col gap-4 overflow-y-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedGroup.name}
                      <Badge className="gap-1">
                        {getTypeIcon(selectedGroup.type)}
                        {getTypeLabel(selectedGroup.type)}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {selectedGroup.members.length} üye • Oluşturan:{' '}
                      {selectedGroup.owner.userName}
                    </CardDescription>
                  </div>
                  {(isOwner || permissions?.canEditGroupInfo) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Grup Seçenekleri</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {(isOwner || permissions?.canEditGroupInfo) && (
                          <DropdownMenuItem onClick={() => {}}>
                            <Settings2 className="h-4 w-4 mr-2" /> Ayarlar
                          </DropdownMenuItem>
                        )}
                        {isOwner && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setGroupToDelete(selectedGroup.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Grubu Sil
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              {selectedGroup.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {selectedGroup.description}
                  </p>
                </CardContent>
              )}
            </Card>

            {/* Members Tab */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" /> Üyeler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedGroup.members.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 group"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {getRoleIcon(member.role)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {member.userName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.role === PermissionLevel.OWNER ? 'Sahip' : member.role}
                          </p>
                        </div>
                      </div>

                      {(isOwner || permissions?.canRemoveMembers) &&
                        member.userId !== selectedGroup.owner.userId && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {isOwner && (
                                <>
                                  <DropdownMenuLabel>Rol Değiştir</DropdownMenuLabel>
                                  {Object.values(PermissionLevel)
                                    .filter((r) => r !== PermissionLevel.OWNER)
                                    .map((role) => (
                                      <DropdownMenuItem
                                        key={role}
                                        onClick={() =>
                                          onUpdateMemberRole(
                                            selectedGroup.id,
                                            member.userId,
                                            role
                                          )
                                        }
                                      >
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                      </DropdownMenuItem>
                                    ))}
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              {(permissions?.canRemoveMembers ||
                                member.userId === currentUserId) && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    onRemoveGroupMember(selectedGroup.id, member.userId)
                                  }
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />{' '}
                                  {member.userId === currentUserId
                                    ? 'Gruptan Ayrıl'
                                    : 'Çıkar'}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Permissions */}
            {currentUserRole && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-4 w-4" /> İzinleriniz
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(permissions).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <div
                          className={cn(
                            'h-2 w-2 rounded-full',
                            value ? 'bg-green-500' : 'bg-muted'
                          )}
                        />
                        <span className="text-muted-foreground">
                          {key
                            .replace(/^can/, '')
                            .replace(/([A-Z])/g, ' $1')
                            .toLowerCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="hidden md:flex md:w-2/3 items-center justify-center text-muted-foreground">
            Grup seçin
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!groupToDelete} onOpenChange={() => setGroupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Grubu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu grup kalıcı olarak silinecektir. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (groupToDelete) {
                  onUpdateGroup(groupToDelete, { isPublic: false } as any);
                }
                setGroupToDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
