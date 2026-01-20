import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { MentionInput } from './mention-input';
import { MentionRenderer } from './mention-renderer';
import { MessageType } from '@/lib/messaging-types';
import { cn } from '@/lib/utils';

interface MentionEnabledMessagesProps {
  conversationId: string;
  className?: string;
}

/**
 * Messages bileşeni Mention & Hashtag sistemi ile
 * 
 * Features:
 * - Real-time messaging
 * - @mention ve #hashtag support
 * - Reaction emoji picker
 */
export const MentionEnabledMessages: React.FC<MentionEnabledMessagesProps> = ({
  conversationId,
  className,
}) => {
  const {
    messages: allMessages,
    user,
    username,
    addMessage,
    editMessage,
    deleteMessage,
  } = useAppStore();

  const [messageText, setMessageText] = useState('');
  const [mentions, setMentions] = useState<any[]>([]);
  const [hashtags, setHashtags] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = (allMessages[conversationId] || []).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!messageText.trim() || !user) return;

    if (editingId) {
      editMessage(editingId, messageText);
      setEditingId(null);
    } else {
      addMessage({
        id: `msg-${Date.now()}`,
        conversationId,
        senderId: user.id,
        senderName: username || 'Unknown',
        type: MessageType.TEXT,
        content: messageText,
        createdAt: new Date().toISOString(),
        isRead: true,
        reactions: [],
        isEdited: false,
        // Mention system fields
        mentions: mentions,
        hashtags: hashtags,
      });
    }

    setMessageText('');
    setMentions([]);
    setHashtags([]);
  };

  const handleEdit = (messageId: string, content: string) => {
    setEditingId(messageId);
    setMessageText(content);
  };

  const handleCancel = () => {
    setEditingId(null);
    setMessageText('');
    setMentions([]);
    setHashtags([]);
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white dark:bg-slate-900',
        className
      )}
    >
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <div className="text-4xl mb-2">💬</div>
              <p>Henüz mesaj yok. Sohbeti başlatın!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-2',
                msg.senderId === user?.id ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.senderId !== user?.id && msg.senderAvatar && (
                <img
                  src={msg.senderAvatar}
                  alt={msg.senderName}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
              )}

              <div
                className={cn(
                  'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                  msg.senderId === user?.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                )}
              >
                {msg.senderId !== user?.id && (
                  <div className="text-xs font-semibold mb-1 opacity-75">
                    {msg.senderName}
                  </div>
                )}

                {/* Message Content with Mentions */}
                <div className="text-sm leading-relaxed">
                  <MentionRenderer
                    text={msg.content}
                    mentions={
                      msg.mentions?.map(m => ({
                        userId: m.userId,
                        userName: m.userName
                      })) || []
                    }
                  />
                </div>

                {/* Hashtags */}
                {(msg as any).hashtags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(msg as any).hashtags.map((tag: string) => (
                      <span
                        key={tag}
                        className={cn(
                          'text-xs px-2 py-1 rounded',
                          msg.senderId === user?.id
                            ? 'bg-blue-600 text-blue-100'
                            : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200'
                        )}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Time & Actions */}
                <div className="flex justify-between items-center mt-1 text-xs">
                  <span className="opacity-70">
                    {new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {msg.senderId === user?.id && (
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => handleEdit(msg.id, msg.content)}
                        className="hover:opacity-70 transition"
                        title="Düzenle"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteMessage(conversationId, msg.id)}
                        className="hover:opacity-70 transition"
                        title="Sil"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>

                {/* Reactions */}
                {msg.reactions?.length > 0 && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {msg.reactions
                      .reduce<Array<{ emoji: string; count: number }>>(
                        (acc, reaction) => {
                          const existing = acc.find(
                            (r) => r.emoji === reaction.emoji
                          );
                          if (existing) existing.count++;
                          else acc.push({ emoji: reaction.emoji, count: 1 });
                          return acc;
                        },
                        []
                      )
                      .map((r) => (
                        <span
                          key={r.emoji}
                          className={cn(
                            'text-xs px-2 py-1 rounded-full',
                            msg.senderId === user?.id
                              ? 'bg-blue-600'
                              : 'bg-slate-200 dark:bg-slate-700'
                          )}
                        >
                          {r.emoji} {r.count}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-2">
        {editingId && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-3 py-2 rounded text-sm flex justify-between items-center">
            <span>Mesajı düzenliyorsunuz</span>
            <button
              onClick={handleCancel}
              className="hover:opacity-70 transition"
            >
              ✕
            </button>
          </div>
        )}

        <MentionInput
          value={messageText}
          onChange={setMessageText}
          onMentionsChange={setMentions}
          onHashtagsChange={setHashtags}
          placeholder="Mesaj yazın... @mention veya #hashtag kullanabilirsiniz"
          className="rounded border-slate-300 dark:border-slate-600"
        />

        <div className="flex justify-between items-center">
          <div className="text-xs text-slate-500">
            {mentions.length > 0 && (
              <span>👤 {mentions.length} mention • </span>
            )}
            {hashtags.length > 0 && <span>#️⃣ {hashtags.length} hashtag</span>}
          </div>

          <div className="flex gap-2">
            {editingId && (
              <button
                onClick={handleCancel}
                className="px-3 py-2 rounded text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                İptal
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={!messageText.trim()}
              className={cn(
                'px-4 py-2 rounded font-medium text-sm transition flex items-center gap-2',
                messageText.trim()
                  ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
              )}
            >
              📨 {editingId ? 'Güncelle' : 'Gönder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
