import { useCallback } from 'react';
import { useAppStore } from '@/lib/store';

export interface MentionableEntity {
  id: string;
  content: string;
  mentions: string[]; // user IDs
  mentions_data?: Array<{
    userId: string;
    userName: string;
    userAvatar?: string;
  }>;
  hashtags?: string[];
}

/**
 * Mention ve Hashtag sistemini yönetmek için custom hook
 */
export const useMentionSystem = () => {
  const store = useAppStore();

  /**
   * Mention bildirimlerini gönder
   * @param mentionedUserIds - Etiketlenen kullanıcı IDs'leri
   * @param entityType - Comment, Message, Post, vb.
   * @param entityId - Entity ID
   * @param content - İçerik
   */
  const notifyMentions = useCallback(
    async (
      mentionedUserIds: string[],
      entityType: 'comment' | 'message' | 'post',
      entityId: string,
      content: string
    ) => {
      if (!store.user) return;

      // Mention bildirimleri gönder
      for (const userId of mentionedUserIds) {
        if (userId !== store.user.id) {
          try {
            // TODO: Implement notification system
            console.log(`Notification sent to @${userId}: mentioned in ${entityType}`);
          } catch (error) {
            console.error('Failed to send mention notification:', error);
          }
        }
      }
    },
    [store.user]
  );

  /**
   * Hashtag'leri index'le (search için)
   */
  const indexHashtags = useCallback(
    async (hashtags: string[], entityType: string, entityId: string) => {
      if (hashtags.length === 0) return;

      try {
        // TODO: Implement hashtag indexing
        console.log(`Indexed ${hashtags.length} hashtags for ${entityType}:${entityId}`);
      } catch (error) {
        console.error('Failed to index hashtags:', error);
      }
    },
    []
  );

  /**
   * Hashtag'lere göre ara
   */
  const searchByHashtag = useCallback((hashtag: string) => {
    // TODO: Implement hashtag search
    console.log(`Searching for #${hashtag}`);
    return [];
  }, []);

  /**
   * @mention'ları kullanıcıya ara
   */
  const searchUsersByName = useCallback(
    (query: string) => {
      if (!query) return [];

      const { conversations } = store;
      return conversations
        .filter(
          (c) =>
            c.userName.toLowerCase().includes(query.toLowerCase()) &&
            c.userId !== store.user?.id
        )
        .map((c) => ({
          userId: c.userId,
          userName: c.userName,
          userAvatar: c.userAvatar,
          isOnline: c.isOnline,
        }))
        .slice(0, 8);
    },
    [store]
  );

  /**
   * Mention'ların profile link'ini oluştur
   */
  const getMentionLink = useCallback((userId: string) => {
    return `/profile/${userId}`;
  }, []);

  /**
   * Hashtag'ın search link'ini oluştur
   */
  const getHashtagLink = useCallback((hashtag: string) => {
    return `/search?q=%23${hashtag}`;
  }, []);

  /**
   * Content'ten mentions'ları extract et
   */
  const extractMentions = useCallback((content: string) => {
    const regex = /@([a-zA-Z0-9_]+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return [...new Set(mentions)]; // Remove duplicates
  }, []);

  /**
   * Content'ten hashtag'ları extract et
   */
  const extractHashtags = useCallback((content: string) => {
    const regex = /#([a-zA-Z0-9_]+)/g;
    const hashtags: string[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      hashtags.push(match[1]);
    }

    return [...new Set(hashtags)]; // Remove duplicates
  }, []);

  /**
   * Mention'lar with data'sını populate et
   */
  const populateMentionsData = useCallback(
    (mentionNames: string[]) => {
      const { conversations } = store;
      return mentionNames
        .map((name) => {
          const conversation = conversations.find(
            (c) => c.userName === name
          );
          return conversation
            ? {
                userId: conversation.userId,
                userName: conversation.userName,
                userAvatar: conversation.userAvatar,
              }
            : null;
        })
        .filter((m) => m !== null);
    },
    [store]
  );

  /**
   * Mention notification badge sayısını getir
   */
  const getMentionNotificationCount = useCallback(() => {
    const { analyticsEvents, user } = store;
    if (!user) return 0;

    return analyticsEvents.filter(
      (e) =>
        e.userId === user.id &&
        (e.eventType as any) === 'mentioned'
    ).length;
  }, [store]);

  return {
    // Notification
    notifyMentions,

    // Hashtag management
    indexHashtags,
    searchByHashtag,

    // Search
    searchUsersByName,

    // Links
    getMentionLink,
    getHashtagLink,

    // Extract
    extractMentions,
    extractHashtags,
    populateMentionsData,

    // Stats
    getMentionNotificationCount,
  };
};
