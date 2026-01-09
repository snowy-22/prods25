/**
 * Social Groups Manager Component
 * 
 * Sosyal grupları oluştur, yönet, üye davet et, post yap
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Users,
  Settings2,
  Trash2,
  Share2,
  Heart,
  MessageCircle,
  Lock,
  Globe,
  CheckCircle,
  Zap,
  Send,
} from 'lucide-react';
import {
  SocialGroup,
  SocialGroupMember,
  SocialGroupPost,
} from '@/lib/advanced-features-types';

interface SocialGroupsManagerProps {
  groups: SocialGroup[];
  currentGroupId?: string;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (
    name: string,
    category: string,
    description?: string,
    isPrivate?: boolean
  ) => Promise<void>;
  onDeleteGroup?: (groupId: string) => Promise<void>;
  onInviteMember?: (groupId: string, inviteeId: string, message?: string) => Promise<void>;
  onRequestJoin?: (groupId: string, message?: string) => Promise<void>;
  onRemoveMember?: (groupId: string, memberId: string) => Promise<void>;
  onPostToGroup?: (groupId: string, content: string, media?: string[]) => Promise<void>;
}

export function SocialGroupsManager({
  groups,
  currentGroupId,
  onSelectGroup,
  onCreateGroup,
  onDeleteGroup,
  onInviteMember,
  onRequestJoin,
  onRemoveMember,
  onPostToGroup,
}: SocialGroupsManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<SocialGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('technology');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupPrivate, setNewGroupPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [inviteeId, setInviteeId] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !newGroupCategory) return;

    setIsLoading(true);
    try {
      await onCreateGroup(newGroupName, newGroupCategory, newGroupDescription, newGroupPrivate);
      setNewGroupName('');
      setNewGroupCategory('technology');
      setNewGroupDescription('');
      setNewGroupPrivate(false);
      setIsCreating(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostToGroup = async () => {
    if (!selectedGroup || !postContent.trim()) return;

    setIsLoading(true);
    try {
      await onPostToGroup?.(selectedGroup.id, postContent);
      setPostContent('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!selectedGroup || !inviteeId.trim()) return;

    setIsLoading(true);
    try {
      await onInviteMember?.(selectedGroup.id, inviteeId, inviteMessage);
      setInviteeId('');
      setInviteMessage('');
      setShowInviteForm(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Bu grubu silmek istediğinize emin misiniz?')) return;

    setIsLoading(true);
    try {
      await onDeleteGroup?.(groupId);
      setSelectedGroup(null);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { value: 'technology', label: '💻 Teknoloji' },
    { value: 'design', label: '🎨 Tasarım' },
    { value: 'business', label: '💼 İş' },
    { value: 'gaming', label: '🎮 Oyunlar' },
    { value: 'lifestyle', label: '👥 Yaşam Tarzı' },
    { value: 'education', label: '📚 Eğitim' },
    { value: 'sports', label: '⚽ Spor' },
    { value: 'creative', label: '🎬 Yaratıcılık' },
  ];

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Sosyal Gruplar
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
              placeholder="Grup adı"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Kategori</label>
            <select
              value={newGroupCategory}
              onChange={(e) => setNewGroupCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded text-sm"
              disabled={isLoading}
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Açıklama</label>
            <textarea
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              placeholder="Grup açıklaması..."
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
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
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
                    {group.is_verified && <CheckCircle className="w-3 h-3 text-blue-600" />}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                    {categories.find((c) => c.value === group.category)?.label}
                  </p>
                </div>
                {group.is_private && <Lock className="w-4 h-4 text-gray-400" />}
              </div>

              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <Users className="w-3 h-3" />
                {group.member_count} üye
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
              onClick={() => handleDeleteGroup(selectedGroup.id)}
              variant="outline"
              size="sm"
              className="text-red-600"
              disabled={isLoading}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          {/* Post Form */}
          <div className="space-y-2">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Gruba bir şeyler yazın..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded text-sm"
              rows={2}
              disabled={isLoading}
            />
            <Button
              onClick={handlePostToGroup}
              disabled={isLoading || !postContent.trim()}
              size="sm"
              className="w-full"
            >
              <Send className="w-3 h-3 mr-1" />
              Gönder
            </Button>
          </div>

          {/* Invite */}
          {!showInviteForm ? (
            <Button
              onClick={() => setShowInviteForm(true)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Plus className="w-3 h-3 mr-1" />
              Üye Davet Et
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                value={inviteeId}
                onChange={(e) => setInviteeId(e.target.value)}
                placeholder="Kullanıcı ID"
                disabled={isLoading}
                size="sm"
                className="text-sm"
              />
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Davet mesajı (isteğe bağlı)"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded text-sm"
                rows={2}
                disabled={isLoading}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteeId('');
                    setInviteMessage('');
                  }}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button
                  onClick={handleInviteMember}
                  disabled={isLoading || !inviteeId.trim()}
                  size="sm"
                  className="flex-1"
                >
                  Davet Et
                </Button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Üyeler:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedGroup.member_count}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Durum:</span>
              <span className="font-medium text-gray-900 dark:text-white capitalize">
                {selectedGroup.is_private ? 'Gizli' : 'Herkese Açık'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
