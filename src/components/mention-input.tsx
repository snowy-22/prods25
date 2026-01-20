import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface Mention {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  index: number;
  length: number;
}

interface Hashtag {
  text: string;
  index: number;
  length: number;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMentionsChange?: (mentions: Mention[]) => void;
  onHashtagsChange?: (hashtags: Hashtag[]) => void;
  placeholder?: string;
  className?: string;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onMentionsChange,
  onHashtagsChange,
  placeholder = 'Birşey yazın... (@mention veya #hashtag kullanabilirsiniz)',
  className,
}) => {
  const { conversations, username } = useAppStore();
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [currentMentionQuery, setCurrentMentionQuery] = useState('');
  const [currentHashtagQuery, setCurrentHashtagQuery] = useState('');
  const [selectionIndex, setSelectionIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Detect mentions (@username)
  useEffect(() => {
    const mentionRegex = /@([a-zA-Z0-9_]*)/g;
    const foundMentions: Mention[] = [];
    let match;

    while ((match = mentionRegex.exec(value)) !== null) {
      foundMentions.push({
        id: `mention-${match.index}`,
        userId: match[1],
        userName: match[1],
        index: match.index,
        length: match[0].length,
      });
    }

    setMentions(foundMentions);
    onMentionsChange?.(foundMentions);
  }, [value]);

  // Detect hashtags (#tag)
  useEffect(() => {
    const hashtagRegex = /#([a-zA-Z0-9_]*)/g;
    const foundHashtags: Hashtag[] = [];
    let match;

    while ((match = hashtagRegex.exec(value)) !== null) {
      foundHashtags.push({
        text: match[1],
        index: match.index,
        length: match[0].length,
      });
    }

    setHashtags(foundHashtags);
    onHashtagsChange?.(foundHashtags);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Check for mention trigger
    const cursorPos = e.currentTarget.selectionStart;
    const beforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = beforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1 && cursorPos - lastAtIndex > 1) {
      const query = beforeCursor.substring(lastAtIndex + 1);
      setCurrentMentionQuery(query);
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
    }

    // Check for hashtag trigger
    const lastHashIndex = beforeCursor.lastIndexOf('#');
    if (lastHashIndex !== -1 && cursorPos - lastHashIndex > 1) {
      const query = beforeCursor.substring(lastHashIndex + 1);
      setCurrentHashtagQuery(query);
      setShowHashtagSuggestions(true);
    } else {
      setShowHashtagSuggestions(false);
    }

    setSelectionIndex(cursorPos);
  };

  // Get mention suggestions
  const getMentionSuggestions = () => {
    if (!currentMentionQuery) return [];

    const allUsers = conversations
      .map((c) => ({
        userId: c.userId,
        userName: c.userName,
        userAvatar: c.userAvatar,
      }))
      .filter((u) => u.userName.toLowerCase().includes(currentMentionQuery.toLowerCase()));

    return allUsers.slice(0, 5); // Limit to 5 suggestions
  };

  const getHashtagSuggestions = () => {
    // Popular hashtags or from database
    const popularHashtags = ['javascript', 'react', 'typescript', 'web', 'development', 'design', 'ui', 'video', 'canvas'];
    return popularHashtags
      .filter((tag) => tag.toLowerCase().includes(currentHashtagQuery.toLowerCase()))
      .slice(0, 5);
  };

  const handleMentionSelect = (user: { userId: string; userName: string }) => {
    const cursorPos = selectionIndex;
    const beforeCursor = value.substring(0, cursorPos);
    const afterCursor = value.substring(cursorPos);
    const lastAtIndex = beforeCursor.lastIndexOf('@');

    const newValue =
      beforeCursor.substring(0, lastAtIndex) + `@${user.userName} ` + afterCursor;

    onChange(newValue);
    setShowMentionSuggestions(false);
    setCurrentMentionQuery('');
  };

  const handleHashtagSelect = (tag: string) => {
    const cursorPos = selectionIndex;
    const beforeCursor = value.substring(0, cursorPos);
    const afterCursor = value.substring(cursorPos);
    const lastHashIndex = beforeCursor.lastIndexOf('#');

    const newValue =
      beforeCursor.substring(0, lastHashIndex) + `#${tag} ` + afterCursor;

    onChange(newValue);
    setShowHashtagSuggestions(false);
    setCurrentHashtagQuery('');
  };

  const mentionSuggestions = getMentionSuggestions();
  const hashtagSuggestions = getHashtagSuggestions();

  return (
    <div className="relative w-full">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={cn(
          'w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500',
          'bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
          className
        )}
        rows={4}
      />

      {/* Mention Suggestions */}
      {showMentionSuggestions && mentionSuggestions.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-800 border rounded-lg shadow-lg z-50 w-64">
          {mentionSuggestions.map((user) => (
            <button
              key={user.userId}
              onClick={() => handleMentionSelect(user)}
              className="w-full px-4 py-2 text-left hover:bg-blue-100 dark:hover:bg-blue-900 flex items-center gap-2 transition"
            >
              {user.userAvatar && (
                <img
                  src={user.userAvatar}
                  alt={user.userName}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-sm font-medium">@{user.userName}</span>
            </button>
          ))}
        </div>
      )}

      {/* Hashtag Suggestions */}
      {showHashtagSuggestions && hashtagSuggestions.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-800 border rounded-lg shadow-lg z-50 w-48">
          {hashtagSuggestions.map((tag) => (
            <button
              key={tag}
              onClick={() => handleHashtagSelect(tag)}
              className="w-full px-4 py-2 text-left hover:bg-purple-100 dark:hover:bg-purple-900 transition text-sm"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
