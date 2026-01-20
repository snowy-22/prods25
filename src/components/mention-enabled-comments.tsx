import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { MentionInput } from './mention-input';
import { MentionRenderer } from './mention-renderer';
import { cn } from '@/lib/utils';

interface MentionEnabledCommentProps {
  folderId: string;
  className?: string;
}

/**
 * Comments bileşeni Mention & Hashtag sistemi ile
 * 
 * Features:
 * - @mention yazarken autocomplete
 * - #hashtag yazarken autocomplete
 * - Mentions mavi renkte gösterilir
 * - Hashtags mor renkte gösterilir
 * - Hover'da mini profil kartı
 */
export const MentionEnabledComments: React.FC<MentionEnabledCommentProps> = ({
  folderId,
  className,
}) => {
  const { folderComments, addComment, username, user } = useAppStore();
  const [commentText, setCommentText] = useState('');
  const [mentions, setMentions] = useState<any[]>([]);
  const [hashtags, setHashtags] = useState<any[]>([]);

  const comments = folderComments[folderId] || [];

  const handleSubmit = () => {
    if (!commentText.trim() || !user) return;

    addComment({
      id: `comment-${Date.now()}`,
      folderId,
      userId: user.id,
      userName: username || 'User',
      userAvatar: '',
      content: commentText,
      mentions: mentions,
      hashtags: hashtags,
      likeCount: 0,
      replyCount: 0,
      isPinned: false,
      isResolved: false,
      isEdited: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setCommentText('');
    setMentions([]);
    setHashtags([]);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Input Area */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <div className="mb-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
            Yorum Ekle
          </label>
          <MentionInput
            value={commentText}
            onChange={setCommentText}
            onMentionsChange={setMentions}
            onHashtagsChange={setHashtags}
            placeholder="Yorum yazın... @birini etiketleyin veya #hashtag kullanın"
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="text-xs text-slate-500">
            {mentions.length > 0 && (
              <span>Etiketlenmiş: {mentions.map((m) => m.userName).join(', ')} • </span>
            )}
            {hashtags.length > 0 && (
              <span>Hashtags: {hashtags.map((h) => `#${h.text}`).join(', ')}</span>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!commentText.trim()}
            className={cn(
              'px-4 py-2 rounded font-medium text-sm transition',
              commentText.trim()
                ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
            )}
          >
            Gönder
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex gap-3 mb-2">
              {comment.userAvatar && (
                <img
                  src={comment.userAvatar}
                  alt={comment.userName}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-900 dark:text-white">
                  {comment.userAvatar ? 'Yorum Yapan' : 'Siz'}
                </div>
                <div className="text-xs text-slate-500 mb-2">
                  {new Date(comment.createdAt).toLocaleDateString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>

            {/* Rendered Comment with Mentions/Hashtags */}
            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <MentionRenderer
                text={comment.content}
                mentions={comment.mentions?.map(m => ({
                  userId: m.userId,
                  userName: m.userName
                })) || []}
              />
            </div>

            {/* Comment Actions */}
            <div className="flex gap-2 mt-2 text-xs text-slate-500">
              <button className="hover:text-slate-700 dark:hover:text-slate-300 transition">
                Yanıtla
              </button>
              <button className="hover:text-slate-700 dark:hover:text-slate-300 transition">
                Beğen
              </button>
              {comment.isPinned && (
                <span className="ml-auto text-yellow-600 dark:text-yellow-400">
                  📌 Sabitlenmiş
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
