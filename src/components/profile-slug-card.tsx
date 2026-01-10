/**
 * Profile Slug Card Component
 * 
 * Profil slug'larını göster, yönet, paylaş
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Copy,
  Check,
  Share2,
  Settings2,
  Trash2,
  Star,
  Lock,
  Globe,
} from 'lucide-react';
import { ProfileSlug, ProfileSlugReference } from '@/lib/advanced-features-types';

interface ProfileSlugCardProps {
  slug: ProfileSlug;
  isPrimary?: boolean;
  references?: ProfileSlugReference[];
  onDelete?: (slugId: string) => Promise<void>;
  onSetPrimary?: (slugId: string) => Promise<void>;
  onShare?: (slug: string) => void;
  onEdit?: (slug: ProfileSlug) => void;
  isLoading?: boolean;
}

export function ProfileSlugCard({
  slug,
  isPrimary,
  references,
  onDelete,
  onSetPrimary,
  onShare,
  onEdit,
  isLoading,
}: ProfileSlugCardProps) {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopySlug = () => {
    navigator.clipboard.writeText(slug.slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm("Bu slug'u silmek istediğinize emin misiniz?")) return;
    
    setIsDeleting(true);
    try {
      await onDelete?.(slug.id);
    } finally {
      setIsDeleting(false);
    }
  };

  // Reference type labels
  const referenceTypesCount = {
    follow: references?.filter(r => r.relationship_type === 'follow').length || 0,
    friend: references?.filter(r => r.relationship_type === 'friend').length || 0,
    subscriber: references?.filter(r => r.relationship_type === 'subscriber').length || 0,
    collaborator: references?.filter(r => r.relationship_type === 'collaborator').length || 0,
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              @{slug.slug}
            </h3>
            {isPrimary && (
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" />
                Ana
              </span>
            )}
            {slug.verified && (
              <span className="text-blue-500">✓</span>
            )}
          </div>
          {slug.display_name && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {slug.display_name}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {slug.bio && (
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
          {slug.bio}
        </p>
      )}

      {/* Stats */}
      <div className="flex gap-3 text-xs">
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
          <Globe className="w-3 h-3" />
          {slug.access_count} ziyaret
        </div>
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
          <Lock className="w-3 h-3" />
          {slug.is_public ? 'Herkese açık' : 'Gizli'}
        </div>
      </div>

      {/* References */}
      {references && references.length > 0 && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Bağlantılar ({references.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(referenceTypesCount).map(([type, count]) => (
              count > 0 && (
                <span
                  key={type}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                >
                  {count} {type === 'follow' && 'takip'}
                  {type === 'friend' && 'arkadaş'}
                  {type === 'subscriber' && 'abone'}
                  {type === 'collaborator' && 'işbirlikçi'}
                </span>
              )
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2 flex-wrap">
        <Button
          onClick={handleCopySlug}
          variant="outline"
          size="sm"
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
          onClick={() => onShare?.(slug.slug)}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <Share2 className="w-3 h-3 mr-1" />
          Paylaş
        </Button>

        <Button
          onClick={() => onEdit?.(slug)}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          <Settings2 className="w-3 h-3" />
        </Button>

        {!isPrimary && (
          <Button
            onClick={() => onSetPrimary?.(slug.id)}
            variant="ghost"
            size="sm"
            disabled={isLoading}
          >
            <Star className="w-3 h-3" />
          </Button>
        )}

        <Button
          onClick={handleDelete}
          variant="outline"
          size="sm"
          disabled={isDeleting || isLoading || isPrimary}
          className="text-red-600 hover:text-red-700 dark:text-red-400"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Created Info */}
      <div className="text-xs text-gray-500 dark:text-gray-500 pt-2">
        Oluşturuldu: {new Date(slug.created_at).toLocaleDateString('tr-TR')}
      </div>
    </div>
  );
}

/**
 * Create Profile Slug Dialog
 */

interface CreateProfileSlugDialogProps {
  onCreateSlug: (displayName: string, bio?: string, isPublic?: boolean) => Promise<ProfileSlug>;
  onClose: () => void;
}

export function CreateProfileSlugDialog({
  onCreateSlug,
  onClose,
}: CreateProfileSlugDialogProps) {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!displayName.trim()) {
      setError('Görünen ad gerekli');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onCreateSlug(displayName, bio, isPublic);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-2">Görünen Ad</label>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Adınız veya ekip adı"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-2">Bio (İsteğe Bağlı)</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Kendiniz hakkında bilgi..."
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm"
          rows={3}
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          disabled={isLoading}
          className="rounded"
        />
        <label htmlFor="isPublic" className="text-sm font-medium cursor-pointer">
          Herkese açık profil (herkes görebilir)
        </label>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button
          onClick={onClose}
          variant="outline"
          disabled={isLoading}
        >
          İptal
        </Button>
        <Button
          onClick={handleCreate}
          disabled={isLoading || !displayName.trim()}
        >
          {isLoading ? 'Oluşturuluyor...' : 'Slug Oluştur'}
        </Button>
      </div>
    </div>
  );
}
