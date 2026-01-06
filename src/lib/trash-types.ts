/**
 * Trash/Recycle Bin System Types
 * Silinen öğeleri takip eder ve recovery sağlar
 */

import { ContentItem } from './initial-content';

export type TrashItemType = 'item' | 'folder' | 'list' | 'grid' | 'scene' | 'presentation' | 'layout' | 'frame';

export interface TrashItem {
  id: string;
  user_id: string;
  original_id: string;
  item_type: TrashItemType;
  title: string;
  metadata: {
    originalParentId?: string;
    originalOrder?: number;
    originalPosition?: { x: number; y: number };
    originalSize?: { width: number; height: number };
    originalMetadata?: any;
    deletionReason?: string;
    deletedBy?: string;
  };
  content: ContentItem | any; // Full snapshot of deleted item
  tags: string[];
  deleted_at: string;
  expires_at: string; // 30 days from deletion
  recovered_at?: string;
  permanent_delete_at?: string; // Final permanent delete
  restoration_count: number;
}

export interface TrashBucket {
  id: string;
  user_id: string;
  total_items: number;
  total_size_bytes: number;
  oldest_item_date?: string;
  newest_item_date?: string;
  auto_empty_days: number; // Default 30 days
  permanent_delete_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrashStats {
  total_items: number;
  total_size_kb: number;
  oldest_item_days: number;
  newest_item_days: number;
  items_expiring_soon: number; // Items expiring in next 3 days
}

/**
 * Trash Restoration Metadata
 */
export interface RestoreOption {
  restoreTo?: string; // Parent folder ID to restore to
  newName?: string;
  newPosition?: { x: number; y: number };
  keepMetadata: boolean;
}

/**
 * Trash Recovery
 */
export interface RecoveryLog {
  id: string;
  trash_item_id: string;
  user_id: string;
  action: 'deleted' | 'restored' | 'permanently_deleted' | 'expired';
  reason?: string;
  restored_to?: string; // Parent ID if restored
  metadata?: any;
  timestamp: string;
}
