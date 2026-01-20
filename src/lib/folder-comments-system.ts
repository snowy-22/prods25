/**
 * Folder Comments & Descriptions System
 * Handles folder descriptions, comments, replies, and threaded discussions
 */

import { ContentItem } from './initial-content';
import { createClient } from './supabase/client';

export interface FolderDescription {
  id: string;
  folderId: string;
  userId: string;
  title?: string;
  description: string;
  content?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  editedAt?: string;
  editedBy?: string;
  version: number;
}

export interface Comment {
  id: string;
  folderId: string;
  itemId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  html?: string;
  mentions?: Array<{ userId: string; userName: string; index: number; length: number }>; // @username references
  hashtags?: Array<{ text: string; index: number; length: number }>; // #hashtag references
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  editedAt?: string;
  parentCommentId?: string; // For threaded replies
  likeCount: number;
  replyCount: number;
  isEdited: boolean;
  isPinned: boolean;
  isResolved?: boolean; // For issue comments
}

export interface CommentReply extends Comment {
  parentCommentId: string;
  depth: number;
}

export interface CommentThread {
  root: Comment;
  replies: CommentReply[];
  totalReplies: number;
  isCollapsed?: boolean;
}

export interface FolderCommentStats {
  folderId: string;
  totalComments: number;
  totalReplies: number;
  activeUsers: number;
  lastCommentAt: string;
  resolvedCount?: number;
}

export interface CommentFilter {
  folderId?: string;
  userId?: string;
  parentCommentId?: string;
  isResolved?: boolean;
  sortBy?: 'recent' | 'oldest' | 'mostLiked' | 'mostReplies';
  limit?: number;
  offset?: number;
}

/**
 * Folder Comment Manager
 */
export class FolderCommentManager {
  private supabase = createClient();

  /**
   * Save folder description
   */
  async setFolderDescription(
    userId: string,
    folderId: string,
    description: string,
    title?: string,
    tags?: string[]
  ): Promise<FolderDescription> {
    const now = new Date().toISOString();
    
    // Check if description exists
    const { data: existing } = await this.supabase
      .from('folder_descriptions')
      .select('id, version')
      .eq('folderId', folderId)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await this.supabase
        .from('folder_descriptions')
        .update({
          description,
          title,
          tags,
          updatedAt: now,
          editedAt: now,
          editedBy: userId,
          version: existing.version + 1
        })
        .eq('folderId', folderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Create new
    const { data, error } = await this.supabase
      .from('folder_descriptions')
      .insert({
        folderId,
        userId,
        description,
        title,
        tags,
        createdAt: now,
        updatedAt: now,
        version: 1
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get folder description
   */
  async getFolderDescription(folderId: string): Promise<FolderDescription | null> {
    const { data, error } = await this.supabase
      .from('folder_descriptions')
      .select('*')
      .eq('folderId', folderId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // No rows
    return data || null;
  }

  /**
   * Add comment to folder
   */
  async addComment(
    userId: string,
    userName: string,
    folderId: string,
    content: string,
    parentCommentId?: string,
    itemId?: string
  ): Promise<Comment> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('comments')
      .insert({
        folderId,
        itemId,
        userId,
        userName,
        content,
        parentCommentId,
        createdAt: now,
        updatedAt: now,
        likeCount: 0,
        replyCount: 0,
        isEdited: false,
        isPinned: false
      })
      .select()
      .single();

    if (error) throw error;

    // Increment reply count on parent if this is a reply
    if (parentCommentId) {
      await this.supabase
        .from('comments')
        .update({ replyCount: { increment: 1 } })
        .eq('id', parentCommentId);
    }

    return data;
  }

  /**
   * Edit comment
   */
  async editComment(
    commentId: string,
    userId: string,
    content: string
  ): Promise<Comment> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('comments')
      .update({
        content,
        editedAt: now,
        updatedAt: now,
        isEdited: true
      })
      .eq('id', commentId)
      .eq('userId', userId) // Only owner can edit
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete comment
   */
  async deleteComment(
    commentId: string,
    userId: string
  ): Promise<void> {
    // Get comment to check if it has replies
    const { data: comment } = await this.supabase
      .from('comments')
      .select('parentCommentId, replyCount')
      .eq('id', commentId)
      .single();

    // Delete the comment
    const { error } = await this.supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('userId', userId);

    if (error) throw error;

    // Decrement parent's reply count if this was a reply
    if (comment?.parentCommentId) {
      await this.supabase
        .from('comments')
        .update({ replyCount: { decrement: 1 } })
        .eq('id', comment.parentCommentId);
    }
  }

  /**
   * Get comments for folder/item
   */
  async getComments(
    filter: CommentFilter
  ): Promise<CommentThread[]> {
    let query = this.supabase
      .from('comments')
      .select('*');

    if (filter.folderId) query = query.eq('folderId', filter.folderId);
    if (filter.userId) query = query.eq('userId', filter.userId);
    if (filter.isResolved !== undefined) query = query.eq('isResolved', filter.isResolved);

    // Only get root comments (no parent)
    query = query.is('parentCommentId', null);

    // Sorting
    switch (filter.sortBy) {
      case 'oldest':
        query = query.order('createdAt', { ascending: true });
        break;
      case 'mostLiked':
        query = query.order('likeCount', { ascending: false });
        break;
      case 'mostReplies':
        query = query.order('replyCount', { ascending: false });
        break;
      case 'recent':
      default:
        query = query.order('createdAt', { ascending: false });
    }

    if (filter.limit) query = query.limit(filter.limit);
    if (filter.offset) query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1);

    const { data: roots, error: rootError } = await query;
    if (rootError) throw rootError;

    // Get replies for each root comment
    const threads: CommentThread[] = [];
    for (const root of roots) {
      const { data: replies, error: repliesError } = await this.supabase
        .from('comments')
        .select('*')
        .eq('parentCommentId', root.id)
        .order('createdAt', { ascending: true });

      if (repliesError) throw repliesError;

      threads.push({
        root,
        replies: replies || [],
        totalReplies: replies?.length || 0
      });
    }

    return threads;
  }

  /**
   * Pin/unpin comment
   */
  async togglePinComment(
    commentId: string,
    pin: boolean
  ): Promise<Comment> {
    const { data, error } = await this.supabase
      .from('comments')
      .update({ isPinned: pin })
      .eq('id', commentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mark comment as resolved
   */
  async markCommentResolved(
    commentId: string,
    resolved: boolean
  ): Promise<Comment> {
    const { data, error } = await this.supabase
      .from('comments')
      .update({ isResolved: resolved })
      .eq('id', commentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get folder comment statistics
   */
  async getCommentStats(folderId: string): Promise<FolderCommentStats> {
    const { data, error } = await this.supabase
      .from('comment_stats')
      .select('*')
      .eq('folderId', folderId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data || {
      folderId,
      totalComments: 0,
      totalReplies: 0,
      activeUsers: 0,
      lastCommentAt: new Date().toISOString(),
    };
  }

  /**
   * Search comments
   */
  async searchComments(
    folderId: string,
    query: string
  ): Promise<Comment[]> {
    const { data, error } = await this.supabase
      .rpc('search_comments', {
        folder_id: folderId,
        search_query: query
      });

    if (error) throw error;
    return data || [];
  }

  /**
   * Subscribe to folder comments
   */
  subscribeToComments(
    folderId: string,
    callback: (comment: Comment) => void
  ) {
    return this.supabase
      .channel(`comments:${folderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `folderId=eq.${folderId}`
        },
        (payload) => {
          callback(payload.new as Comment);
        }
      )
      .subscribe();
  }
}

export const folderCommentManager = new FolderCommentManager();
