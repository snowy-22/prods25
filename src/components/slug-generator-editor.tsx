/**
 * Slug Generator & Editor Component
 * 
 * Profil, klasör, grup sluglarını otomatik generate ve manuel edit
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Check, RotateCw, AlertCircle } from 'lucide-react';
import { generateSlug } from '@/lib/advanced-features-store';

interface SlugGeneratorEditorProps {
  title: string;
  description?: string;
  initialTitle: string;
  onSlugChange: (slug: string) => void;
  placeholder?: string;
  maxLength?: number;
  showPreview?: boolean;
  baseUrl?: string;
}

export function SlugGeneratorEditor({
  title,
  description,
  initialTitle,
  onSlugChange,
  placeholder = 'slug-will-be-here',
  maxLength = 50,
  showPreview = true,
  baseUrl = 'https://canvasflow.app',
}: SlugGeneratorEditorProps) {
  const [slug, setSlug] = useState(generateSlug(initialTitle));
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(initialTitle);
  const [slugInput, setSlugInput] = useState(slug);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    const newSlug = generateSlug(titleInput);
    setSlug(newSlug);
    setSlugInput(newSlug);
    onSlugChange(newSlug);
  }, [titleInput]);

  const validateSlug = (value: string): boolean => {
    // Allow lowercase letters, numbers, hyphens
    return /^[a-z0-9\-]*$/.test(value) && value.length > 0 && value.length <= maxLength;
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().slice(0, maxLength);
    setSlugInput(value);
    const valid = validateSlug(value);
    setIsValid(valid);
    if (valid) {
      setSlug(value);
      onSlugChange(value);
    }
  };

  const handleRegenerate = () => {
    const newSlug = generateSlug(titleInput);
    setSlug(newSlug);
    setSlugInput(newSlug);
    onSlugChange(newSlug);
    setIsEditing(false);
  };

  const handleCopyUrl = () => {
    const fullUrl = `${baseUrl}/shared/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </label>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>

      {/* Title Input */}
      <div>
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">
          Başlık
        </label>
        <Input
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          placeholder="Başlık giriniz (slug otomatik oluşturulacak)"
          className="w-full"
        />
      </div>

      {/* Slug Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Slug (URL-safe isim)
          </label>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Düzenle
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={slugInput}
              onChange={handleSlugChange}
              placeholder="slug-format"
              maxLength={maxLength}
              className={`w-full ${!isValid ? 'border-red-500' : ''}`}
            />
            {!isValid && (
              <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                Sadece küçük harfler, sayılar ve tire (-) kullanabilirsiniz
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleRegenerate}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <RotateCw className="w-4 h-4 mr-1" />
                Yeniden Oluştur
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                variant="default"
                size="sm"
                className="flex-1"
              >
                Tamam
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700">
            <code className="text-sm text-gray-700 dark:text-gray-300">{slug}</code>
          </div>
        )}
      </div>

      {/* URL Preview */}
      {showPreview && (
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">
            Paylaşılabilir URL
          </label>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <code className="text-xs text-gray-600 dark:text-gray-400 break-all">
                {baseUrl}/shared/{slug}
              </code>
            </div>
            <Button
              onClick={handleCopyUrl}
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          💡 Slug, URL'de kullanılan benzersiz isimdir. Başlıktan otomatik oluşturulur ama özel olarak düzenlenebilir.
        </p>
      </div>
    </div>
  );
}

/**
 * Folder Slug Editor - Nested folders için
 */

interface FolderSlugEditorProps {
  folderId: string;
  initialName: string;
  parentSlug?: string;
  onSave: (slug: string, name: string, description?: string) => Promise<void>;
}

export function FolderSlugEditor({
  folderId,
  initialName,
  parentSlug,
  onSave,
}: FolderSlugEditorProps) {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(generateSlug(initialName));
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(slug, name, description);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <div>
        <label className="text-sm font-medium block mb-2">Klasör Adı</label>
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSlug(generateSlug(e.target.value));
          }}
          placeholder="Klasör adı"
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-2">Slug</label>
        <Input
          value={slug}
          onChange={(e) => setSlug(generateSlug(e.target.value))}
          placeholder="slug"
        />
        {parentSlug && (
          <p className="text-xs text-gray-500 mt-1">
            Yol: {parentSlug}/{slug}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium block mb-2">Açıklama</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Klasör açıklaması (isteğe bağlı)"
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm"
          rows={3}
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={isLoading || !name.trim()}
        className="w-full"
      >
        {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
      </Button>
    </div>
  );
}
