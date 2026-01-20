import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface Mention {
  userName: string;
  userId: string;
  userAvatar?: string;
}

interface MentionRendererProps {
  text: string;
  mentions?: Mention[];
  className?: string;
  onMentionClick?: (userId: string) => void;
}

interface ParsedSegment {
  type: 'text' | 'mention' | 'hashtag';
  content: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
}

// Kullanıcı profil kartı (hover)
export const UserProfileCard: React.FC<{
  userName: string;
  userId: string;
  userAvatar?: string;
  onClose?: () => void;
}> = ({ userName, userId, userAvatar, onClose }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-4 min-w-[250px] border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-3">
        {userAvatar && (
          <img
            src={userAvatar}
            alt={userName}
            className="w-12 h-12 rounded-full"
          />
        )}
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">
            @{userName}
          </div>
          <div className="text-xs text-slate-500">Kullanıcı profili</div>
        </div>
      </div>
      
      <div className="space-y-2 text-sm mb-3">
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span>Takipçiler:</span>
          <span className="font-medium">124</span>
        </div>
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span>Takip Ediliyor:</span>
          <span className="font-medium">89</span>
        </div>
      </div>

      <button className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition">
        Profili Gör
      </button>
    </div>
  );
};

export const MentionRenderer: React.FC<MentionRendererProps> = ({
  text,
  mentions = [],
  className,
  onMentionClick,
}) => {
  const [hoveredMention, setHoveredMention] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  // Parse text for mentions (@username) ve hashtags (#tag)
  const parseText = (): ParsedSegment[] => {
    const segments: ParsedSegment[] = [];
    const regex = /(@[a-zA-Z0-9_]+|#[a-zA-Z0-9_]+)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: text.substring(lastIndex, match.index),
        });
      }

      // Add mention or hashtag
      const matched = match[0];
      if (matched.startsWith('@')) {
        const userName = matched.substring(1);
        const mentionData = mentions.find(
          (m) => m.userName === userName
        );

        segments.push({
          type: 'mention',
          content: matched,
          userId: mentionData?.userId,
          userName: mentionData?.userName,
          userAvatar: mentionData?.userAvatar,
        });
      } else if (matched.startsWith('#')) {
        segments.push({
          type: 'hashtag',
          content: matched,
        });
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex),
      });
    }

    return segments;
  };

  const segments = parseText();

  const handleMentionHover = (
    e: React.MouseEvent<HTMLSpanElement>,
    userId?: string
  ) => {
    if (!userId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredMention(userId);
    setHoverPosition({
      x: rect.left,
      y: rect.bottom + 8,
    });
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <span className="text-slate-900 dark:text-slate-100">
        {segments.map((segment, idx) => {
          if (segment.type === 'text') {
            return <span key={idx}>{segment.content}</span>;
          }

          if (segment.type === 'mention') {
            return (
              <span
                key={idx}
                onMouseEnter={(e) => handleMentionHover(e, segment.userId)}
                onMouseLeave={() => {
                  setHoveredMention(null);
                  setHoverPosition(null);
                }}
                onClick={() => {
                  if (segment.userId) {
                    onMentionClick?.(segment.userId);
                  }
                }}
                className={cn(
                  'font-semibold cursor-pointer transition-all',
                  'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300',
                  'underline hover:underline decoration-blue-400'
                )}
              >
                {segment.content}
              </span>
            );
          }

          if (segment.type === 'hashtag') {
            return (
              <span
                key={idx}
                className={cn(
                  'font-semibold cursor-pointer transition-all',
                  'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300',
                  'underline hover:underline decoration-purple-400'
                )}
              >
                {segment.content}
              </span>
            );
          }
        })}
      </span>

      {/* Hover Profile Card */}
      {hoveredMention && hoverPosition && (
        <div
          className="fixed z-50"
          style={{
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y}px`,
          }}
        >
          <UserProfileCard
            userId={hoveredMention}
            userName={
              segments.find(
                (s) => s.type === 'mention' && s.userId === hoveredMention
              )?.userName || ''
            }
            userAvatar={
              segments.find(
                (s) => s.type === 'mention' && s.userId === hoveredMention
              )?.userAvatar
            }
          />
        </div>
      )}
    </div>
  );
};
