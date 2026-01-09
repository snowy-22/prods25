/**
 * Message Groups Panel Component
 * 
 * Mesaj gruplarını yönet, oluştur, üye ekle
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Users,
  Settings2,
  Trash2,
  Copy,
  Check,
  Lock,
  Globe,
  MessageCircle,
  UserPlus,
} from 'lucide-react';
import { MessageGroup, GroupMember, MessageGroupSettings } from '@/lib/advanced-features-types';

interface MessageGroupsPanelProps {
  groups: MessageGroup[];
  currentGroupId?: string;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (name: string, description?: string, isPrivate?: boolean) => Promise<void>;
  onDeleteGroup?: (groupId: string) => Promise<void>;
  onAddMember?: (groupId: string, userId: string, role?: string) => Promise<void>;
  onRemoveMember?: (groupId: string, userId: string) => Promise<void>;
  onUpdateSettings?: (groupId: string, settings: Partial<MessageGroupSettings>) => Promise<void>;
}

export function MessageGroupsPanel({
  groups,
  currentGroupId,
  onSelectGroup,
  onCreateGroup,
  onDeleteGroup,
  onAddMember,
  onRemoveMember,
  onUpdateSettings,
}: MessageGroupsPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupPrivate, setNewGroupPrivate] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<MessageGroup | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    setIsLoading(true);
    try {
      await onCreateGroup(newGroupName, newGroupDescription, newGroupPrivate);
      setNewGroupName('');
      setNewGroupDescription('');
      setNewGroupPrivate(false);
      setIsCreating(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Bu grubu silmek istediğinize emin misiniz?')) return;
    
    setIsLoading(true);
    try {
      await onDeleteGroup?.(groupId);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Mesaj Grupları
        </h2>
        <Button
          onClick={() => setIsCreating(!isCreating)}
          variant={isCreating ? 'default' : 'outline'}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Yeni
        </Button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">Grup Adı</label>
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Grup adı (ör: Dev Ekibi)"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Açıklama (İsteğe Bağlı)</label>
            <textarea
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              placeholder="Grup hakkında bilgi..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded text-sm"
              rows={2}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="newGroupPrivate"
              checked={newGroupPrivate}
              onChange={(e) => setNewGroupPrivate(e.target.checked)}
              disabled={isLoading}
              className="rounded"
            />
            <label htmlFor="newGroupPrivate" className="text-sm font-medium cursor-pointer">
              Gizli grup (davetli üyeler)
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setIsCreating(false)}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="flex-1"
            >
              İptal
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={isLoading || !newGroupName.trim()}
              size="sm"
              className="flex-1"
            >
              {isLoading ? 'Oluşturuluyor...' : 'Oluştur'}
            </Button>
          </div>
        </div>
      )}

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {groups.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Henüz grup yok</p>
          </div>
        ) : (
          groups.map((group) => (
            <button
              key={group.id}
              onClick={() => {
                onSelectGroup(group.id);
                setSelectedGroup(group);
              }}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                currentGroupId === group.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    {group.name}
                    {group.is_private && <Lock className="w-3 h-3" />}
                  </h3>
                  {group.settings?.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                      {group.settings.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <Users className="w-3 h-3" />
                {group.members?.length || 0} üye
              </div>
            </button>
          ))
        )}
      </div>

      {/* Group Details */}
      {selectedGroup && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              Grup Detayları
            </h3>
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              size="sm"
            >
              <Settings2 className="w-3 h-3" />
            </Button>
          </div>

          {/* Members */}
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Üyeler ({selectedGroup.members?.length || 0})
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {selectedGroup.members?.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {member.user_id}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 capitalize">
                      {member.role || 'member'}
                    </p>
                  </div>
                  {member.role !== 'admin' && (
                    <Button
                      onClick={() => onRemoveMember?.(selectedGroup.id, member.user_id)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      disabled={isLoading}
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              onClick={() => {
                const userId = prompt('Kullanıcı ID giriniz:');
                if (userId) {
                  onAddMember?.(selectedGroup.id, userId, 'member');
                }
              }}
              variant="outline"
              size="sm"
              className="w-full mt-2"
              disabled={isLoading}
            >
              <UserPlus className="w-3 h-3 mr-1" />
              Üye Ekle
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => handleDeleteGroup(selectedGroup.id)}
              variant="outline"
              size="sm"
              className="flex-1 text-red-600 hover:text-red-700 dark:text-red-400"
              disabled={isLoading}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Sil
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Message Group Invite Link Component
 */

interface MessageGroupInviteLinkProps {
  groupId: string;
  groupName: string;
  onCreateInviteLink: (groupId: string, expiresInDays?: number, maxUses?: number) => Promise<string>;
  baseUrl?: string;
}

export function MessageGroupInviteLink({
  groupId,
  groupName,
  onCreateInviteLink,
  baseUrl = 'https://canvasflow.app',
}: MessageGroupInviteLinkProps) {
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [maxUses, setMaxUses] = useState(10);

  const handleCreateLink = async () => {
    setIsLoading(true);
    try {
      const token = await onCreateInviteLink(groupId, expiresInDays, maxUses);
      setInviteLink(`${baseUrl}/join-group/${token}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-gray-900 dark:text-white">
        "{groupName}" için davet linki
      </h3>

      {!inviteLink ? (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">Bitiş süresi (gün)</label>
            <Input
              type="number"
              min="1"
              max="365"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 7)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Max kullanım</label>
            <Input
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(parseInt(e.target.value) || 10)}
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleCreateLink}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Oluşturuluyor...' : 'Davet Linki Oluştur'}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 break-all">
            <code className="text-xs text-gray-700 dark:text-gray-300">{inviteLink}</code>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="flex-1"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 mr-1 text-green-600" />
                  Kopyalandı
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Kopyala
                </>
              )}
            </Button>

            <Button
              onClick={() => setInviteLink(null)}
              variant="outline"
            >
              Yeni Oluştur
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
