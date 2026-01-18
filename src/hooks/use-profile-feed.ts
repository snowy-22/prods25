/**
 * Profile Feed Hooks
 * 
 * Profil ve akış için React hook'ları.
 * Supabase realtime entegrasyonu ile canlı güncellemeler.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import {
  profileFeedService,
  ProfileCanvas,
  FeedItem,
  FeedComment,
  FeedRating,
  SocialFollower,
} from '@/lib/profile-feed-service';

// ==================== Profile Canvas Hook ====================

export function useProfileCanvas(userId?: string, slug?: string) {
  const { user } = useAppStore();
  const [profile, setProfile] = useState<ProfileCanvas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        let profileData: ProfileCanvas | null = null;

        if (slug) {
          profileData = await profileFeedService.getProfileBySlug(slug);
        } else if (targetUserId) {
          profileData = await profileFeedService.getProfileCanvas(targetUserId);
        }

        setProfile(profileData);
      } catch (err) {
        setError('Profil yüklenirken hata oluştu');
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [targetUserId, slug]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!profile?.user_id) return;

    const unsubscribe = profileFeedService.subscribeToProfileUpdates(
      profile.user_id,
      (payload) => {
        if (payload.new) {
          setProfile(payload.new as ProfileCanvas);
        }
      }
    );

    return unsubscribe;
  }, [profile?.user_id]);

  const updateProfile = useCallback(
    async (updates: Partial<ProfileCanvas>) => {
      if (!user?.id) return null;

      try {
        const updated = await profileFeedService.updateProfileCanvas(user.id, updates);
        if (updated) {
          setProfile(updated);
        }
        return updated;
      } catch (err) {
        setError('Profil güncellenirken hata oluştu');
        console.error('Error updating profile:', err);
        return null;
      }
    },
    [user?.id]
  );

  const createProfile = useCallback(
    async (displayName: string, profileSlug?: string) => {
      if (!user?.id) return null;

      try {
        const created = await profileFeedService.createProfileCanvas(
          user.id,
          displayName,
          profileSlug
        );
        if (created) {
          setProfile(created);
        }
        return created;
      } catch (err) {
        setError('Profil oluşturulurken hata oluştu');
        console.error('Error creating profile:', err);
        return null;
      }
    },
    [user?.id]
  );

  return {
    profile,
    loading,
    error,
    updateProfile,
    createProfile,
    isOwnProfile: user?.id === profile?.user_id,
  };
}

// ==================== Feed Hook ====================

export type FeedType = 'discover' | 'following' | 'trending' | 'user';
export type SortOption = 'recent' | 'popular' | 'trending' | 'top-rated';

export interface UseFeedOptions {
  feedType: FeedType;
  targetUserId?: string;
  category?: string;
  tags?: string[];
  sortBy?: SortOption;
  limit?: number;
}

export function useFeed(options: UseFeedOptions) {
  const { user } = useAppStore();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const limit = options.limit || 20;

  const loadItems = useCallback(
    async (reset = false) => {
      if (!hasMore && !reset) return;

      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;

      try {
        const newItems = await profileFeedService.getFeedItems({
          feedType: options.feedType,
          userId: user?.id,
          targetUserId: options.targetUserId,
          category: options.category,
          tags: options.tags,
          sortBy: options.sortBy,
          limit,
          offset: currentOffset,
        });

        if (reset) {
          setItems(newItems);
          setOffset(newItems.length);
        } else {
          setItems((prev) => [...prev, ...newItems]);
          setOffset(currentOffset + newItems.length);
        }

        setHasMore(newItems.length >= limit);
      } catch (err) {
        setError('Akış yüklenirken hata oluştu');
        console.error('Error loading feed:', err);
      } finally {
        setLoading(false);
      }
    },
    [user?.id, options, offset, hasMore, limit]
  );

  // Initial load
  useEffect(() => {
    loadItems(true);
  }, [options.feedType, options.targetUserId, options.category, options.sortBy]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = profileFeedService.subscribeToFeed(user.id, (payload) => {
      if (payload.eventType === 'INSERT') {
        setItems((prev) => [payload.new as FeedItem, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setItems((prev) =>
          prev.map((item) =>
            item.id === (payload.new as FeedItem).id ? (payload.new as FeedItem) : item
          )
        );
      } else if (payload.eventType === 'DELETE') {
        setItems((prev) =>
          prev.filter((item) => item.id !== (payload.old as FeedItem)?.id)
        );
      }
    });

    return unsubscribe;
  }, [user?.id]);

  const refresh = useCallback(() => {
    setHasMore(true);
    loadItems(true);
  }, [loadItems]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadItems(false);
    }
  }, [loading, hasMore, loadItems]);

  return {
    items,
    loading,
    error,
    hasMore,
    refresh,
    loadMore,
  };
}

// ==================== Feed Item Interactions Hook ====================

export function useFeedInteractions(feedItemId: string) {
  const { user } = useAppStore();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const like = useCallback(async () => {
    if (!user?.id || loading) return;

    setLoading(true);
    try {
      const result = await profileFeedService.likeItem(user.id, feedItemId);
      setIsLiked(result);
      setLikeCount((prev) => (result ? prev + 1 : prev - 1));
    } catch (err) {
      console.error('Error liking item:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, feedItemId, loading]);

  const save = useCallback(async () => {
    if (!user?.id || loading) return;

    setLoading(true);
    try {
      const result = await profileFeedService.saveItem(user.id, feedItemId);
      setIsSaved(result);
    } catch (err) {
      console.error('Error saving item:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, feedItemId, loading]);

  const share = useCallback(async () => {
    if (!user?.id) return;

    try {
      await profileFeedService.shareItem(user.id, feedItemId);
    } catch (err) {
      console.error('Error sharing item:', err);
    }
  }, [user?.id, feedItemId]);

  const view = useCallback(async () => {
    if (!user?.id) return;

    try {
      await profileFeedService.viewItem(user.id, feedItemId);
    } catch (err) {
      console.error('Error recording view:', err);
    }
  }, [user?.id, feedItemId]);

  // Subscribe to interaction updates
  useEffect(() => {
    if (!feedItemId) return;

    const unsubscribe = profileFeedService.subscribeToInteractions(
      feedItemId,
      (payload) => {
        if (payload.new?.interaction_type === 'like') {
          setLikeCount((prev) => prev + 1);
        }
      }
    );

    return unsubscribe;
  }, [feedItemId]);

  return {
    isLiked,
    isSaved,
    likeCount,
    loading,
    like,
    save,
    share,
    view,
  };
}

// ==================== Comments Hook ====================

export function useFeedComments(feedItemId: string) {
  const { user } = useAppStore();
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await profileFeedService.getComments(feedItemId);
      setComments(data);
    } catch (err) {
      setError('Yorumlar yüklenirken hata oluştu');
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  }, [feedItemId]);

  useEffect(() => {
    if (feedItemId) {
      loadComments();
    }
  }, [feedItemId, loadComments]);

  const addComment = useCallback(
    async (content: string, parentCommentId?: string) => {
      if (!user?.id) return null;

      try {
        const newComment = await profileFeedService.addComment(
          user.id,
          feedItemId,
          content,
          parentCommentId
        );

        if (newComment) {
          if (parentCommentId) {
            // Add as reply
            setComments((prev) =>
              prev.map((comment) =>
                comment.id === parentCommentId
                  ? { ...comment, replies: [...(comment.replies || []), newComment] }
                  : comment
              )
            );
          } else {
            // Add as top-level comment
            setComments((prev) => [newComment, ...prev]);
          }
        }

        return newComment;
      } catch (err) {
        console.error('Error adding comment:', err);
        return null;
      }
    },
    [user?.id, feedItemId]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!user?.id) return false;

      try {
        const success = await profileFeedService.deleteComment(user.id, commentId);
        if (success) {
          setComments((prev) =>
            prev.filter((comment) => {
              if (comment.id === commentId) return false;
              if (comment.replies) {
                comment.replies = comment.replies.filter((reply) => reply.id !== commentId);
              }
              return true;
            })
          );
        }
        return success;
      } catch (err) {
        console.error('Error deleting comment:', err);
        return false;
      }
    },
    [user?.id]
  );

  return {
    comments,
    loading,
    error,
    addComment,
    deleteComment,
    refresh: loadComments,
  };
}

// ==================== Ratings Hook ====================

export function useFeedRatings(feedItemId: string) {
  const { user } = useAppStore();
  const [ratings, setRatings] = useState<FeedRating[]>([]);
  const [userRating, setUserRating] = useState<FeedRating | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRatings = async () => {
      setLoading(true);
      try {
        const data = await profileFeedService.getItemRatings(feedItemId);
        setRatings(data);

        // Calculate average
        if (data.length > 0) {
          const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
          setAverageRating(avg);
        }

        // Find user's rating
        if (user?.id) {
          const myRating = data.find((r) => r.user_id === user.id);
          setUserRating(myRating || null);
        }
      } catch (err) {
        console.error('Error loading ratings:', err);
      } finally {
        setLoading(false);
      }
    };

    if (feedItemId) {
      loadRatings();
    }
  }, [feedItemId, user?.id]);

  const rate = useCallback(
    async (rating: number, review?: string) => {
      if (!user?.id) return null;

      try {
        const newRating = await profileFeedService.rateItem(
          user.id,
          feedItemId,
          rating,
          review
        );

        if (newRating) {
          setUserRating(newRating);
          // Update ratings list and average
          setRatings((prev) => {
            const filtered = prev.filter((r) => r.user_id !== user.id);
            return [newRating, ...filtered];
          });
        }

        return newRating;
      } catch (err) {
        console.error('Error rating item:', err);
        return null;
      }
    },
    [user?.id, feedItemId]
  );

  return {
    ratings,
    userRating,
    averageRating,
    loading,
    rate,
  };
}

// ==================== Following Hook ====================

export function useFollowing(targetUserId: string) {
  const { user } = useAppStore();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFollowing = async () => {
      if (!user?.id || !targetUserId || user.id === targetUserId) {
        setLoading(false);
        return;
      }

      try {
        const result = await profileFeedService.isFollowing(user.id, targetUserId);
        setIsFollowing(result);
      } catch (err) {
        console.error('Error checking following status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkFollowing();
  }, [user?.id, targetUserId]);

  const toggleFollow = useCallback(async () => {
    if (!user?.id || !targetUserId || loading) return;

    setLoading(true);
    try {
      const result = await profileFeedService.followUser(user.id, targetUserId);
      setIsFollowing(result);
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, targetUserId, loading]);

  return {
    isFollowing,
    loading,
    toggleFollow,
    canFollow: user?.id !== targetUserId,
  };
}

// ==================== Followers/Following Lists Hook ====================

export function useFollowersList(userId: string, type: 'followers' | 'following') {
  const [list, setList] = useState<SocialFollower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadList = async () => {
      setLoading(true);
      setError(null);

      try {
        const data =
          type === 'followers'
            ? await profileFeedService.getFollowers(userId)
            : await profileFeedService.getFollowing(userId);
        setList(data);
      } catch (err) {
        setError(`${type === 'followers' ? 'Takipçiler' : 'Takip edilenler'} yüklenirken hata oluştu`);
        console.error(`Error loading ${type}:`, err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadList();
    }
  }, [userId, type]);

  return {
    list,
    loading,
    error,
    count: list.length,
  };
}

// ==================== Publish to Feed Hook ====================

export function usePublishToFeed() {
  const { user } = useAppStore();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publish = useCallback(
    async (
      item: any,
      options: {
        title: string;
        description?: string;
        visibility?: 'public' | 'private' | 'followers-only' | 'unlisted';
        category?: string;
        tags?: string[];
      }
    ) => {
      if (!user?.id) {
        setError('Giriş yapmanız gerekiyor');
        return null;
      }

      setPublishing(true);
      setError(null);

      try {
        const feedItem = await profileFeedService.publishToFeed(user.id, item, options);
        return feedItem;
      } catch (err) {
        setError('Paylaşım yapılırken hata oluştu');
        console.error('Error publishing to feed:', err);
        return null;
      } finally {
        setPublishing(false);
      }
    },
    [user?.id]
  );

  return {
    publish,
    publishing,
    error,
  };
}
