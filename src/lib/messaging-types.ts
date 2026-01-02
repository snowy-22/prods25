/**
 * Messaging System Types & Constants
 * Comprehensive messaging infrastructure with groups, permissions, and video calls
 */

// ============================================
// Enums
// ============================================

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
  CALL_INITIATED = 'call_initiated',
  CALL_ENDED = 'call_ended',
  SYSTEM = 'system', // Member joined, left, etc.
}

export enum GroupType {
  PRIVATE_CLOSED = 'private_closed', // Kapalı grup - sadece invite ile
  PRIVATE_OPEN = 'private_open', // Açık grup - request ile katılabilir
  PUBLIC = 'public', // Herkes görebilir ve katılabilir
}

export enum PermissionLevel {
  OWNER = 'owner', // Full control
  ADMIN = 'admin', // Manage members, settings, messages
  MODERATOR = 'moderator', // Manage messages, remove members
  MEMBER = 'member', // Send messages, view content
  GUEST = 'guest', // View only (for public groups)
}

export enum CallType {
  AUDIO = 'audio',
  VIDEO = 'video',
  SCREEN_SHARE = 'screen_share',
}

export enum CallStatus {
  INITIATED = 'initiated',
  RINGING = 'ringing',
  ACCEPTED = 'accepted',
  ACTIVE = 'active',
  ENDED = 'ended',
  MISSED = 'missed',
  DECLINED = 'declined',
}

export enum AccountPrivacy {
  PUBLIC = 'public', // Herkese açık
  PRIVATE = 'private', // Takip request'i gerekli
  FRIENDS_ONLY = 'friends_only', // Sadece arkadaşlar
}

// ============================================
// Message Related Types
// ============================================

export interface Message {
  id: string;
  conversationId: string; // Direct message or group ID
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: MessageType;
  mediaUrl?: string;
  mediaType?: string; // image/png, video/mp4, etc.
  fileName?: string;
  fileSize?: number;
  reactions: Record<string, string[]>; // emoji -> [userId1, userId2, ...]
  mentions: string[]; // @userId references
  replyToId?: string; // Reply to another message
  replyToContent?: string;
  replyToSender?: string;
  isEdited: boolean;
  editedAt?: string;
  readBy: string[]; // Users who read this message
  createdAt: string;
  updatedAt: string;
}

export interface DirectMessage extends Message {
  recipientId: string;
}

export interface GroupMessage extends Message {
  groupId: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  participantIds: string[];
  lastMessage?: Message;
  lastMessageAt?: string;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DirectConversation extends Conversation {
  type: 'direct';
  participantIds: [string, string]; // Exactly 2 users
  displayName?: string;
  avatar?: string;
}

// ============================================
// Group Related Types
// ============================================

export interface GroupMember {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: PermissionLevel;
  joinedAt: string;
  mutedUntil?: string; // Null = not muted
  isActive: boolean;
}

export interface GroupPermissions {
  canSendMessages: boolean;
  canEditMessages: boolean;
  canDeleteMessages: boolean;
  canAddMembers: boolean;
  canRemoveMembers: boolean;
  canEditGroupInfo: boolean;
  canEditPermissions: boolean;
  canDeleteGroup: boolean;
  canChangeGroupType: boolean;
}

export const PermissionMatrix: Record<PermissionLevel, GroupPermissions> = {
  [PermissionLevel.OWNER]: {
    canSendMessages: true,
    canEditMessages: true,
    canDeleteMessages: true,
    canAddMembers: true,
    canRemoveMembers: true,
    canEditGroupInfo: true,
    canEditPermissions: true,
    canDeleteGroup: true,
    canChangeGroupType: true,
  },
  [PermissionLevel.ADMIN]: {
    canSendMessages: true,
    canEditMessages: true,
    canDeleteMessages: true,
    canAddMembers: true,
    canRemoveMembers: true,
    canEditGroupInfo: true,
    canEditPermissions: false,
    canDeleteGroup: false,
    canChangeGroupType: false,
  },
  [PermissionLevel.MODERATOR]: {
    canSendMessages: true,
    canEditMessages: true,
    canDeleteMessages: true,
    canAddMembers: false,
    canRemoveMembers: true,
    canEditGroupInfo: false,
    canEditPermissions: false,
    canDeleteGroup: false,
    canChangeGroupType: false,
  },
  [PermissionLevel.MEMBER]: {
    canSendMessages: true,
    canEditMessages: true,
    canDeleteMessages: false,
    canAddMembers: false,
    canRemoveMembers: false,
    canEditGroupInfo: false,
    canEditPermissions: false,
    canDeleteGroup: false,
    canChangeGroupType: false,
  },
  [PermissionLevel.GUEST]: {
    canSendMessages: false,
    canEditMessages: false,
    canDeleteMessages: false,
    canAddMembers: false,
    canRemoveMembers: false,
    canEditGroupInfo: false,
    canEditPermissions: false,
    canDeleteGroup: false,
    canChangeGroupType: false,
  },
};

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  coverImage?: string;
  type: GroupType;
  isPublic: boolean;
  members: GroupMember[];
  owner: GroupMember;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessageAt?: string;
  settings: {
    allowMemberInvites: boolean;
    requireApprovalForNewMembers: boolean;
    allowMemberToChangeNickname: boolean;
    disableReactions: boolean;
    disableMentions: boolean;
  };
}

// ============================================
// Call Related Types
// ============================================

export interface Call {
  id: string;
  initiatorId: string;
  initiatorName: string;
  recipientIds: string[]; // For group calls
  type: CallType;
  status: CallStatus;
  conversationId: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number; // In seconds
  participants: CallParticipant[];
}

export interface CallParticipant {
  userId: string;
  userName: string;
  avatar?: string;
  joinedAt?: string;
  leftAt?: string;
  duration?: number;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareActive: boolean;
  mutedUntil?: string;
}

export interface CallInvitation {
  id: string;
  callId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'declined' | 'missed';
  invitedAt: string;
  respondedAt?: string;
}

// ============================================
// Account Privacy Types
// ============================================

export interface PrivateAccount {
  userId: string;
  privacyLevel: AccountPrivacy;
  blockedUsers: string[];
  allowedFollowers: string[];
  followRequests: string[]; // Pending requests
  acceptedFollowers: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Search Related Types
// ============================================

export interface MessageSearchFilter {
  query: string;
  conversationId?: string;
  senderId?: string;
  type?: MessageType;
  startDate?: string;
  endDate?: string;
  hasReactions?: boolean;
  hasAttachments?: boolean;
}

export interface SearchResult {
  messages: Message[];
  groups: Group[];
  users: { id: string; name: string; avatar?: string }[];
  totalCount: number;
}

// ============================================
// Zustand Store Type
// ============================================

export interface MessagingState {
  conversations: Conversation[];
  groups: Group[];
  messages: Record<string, Message[]>; // conversationId -> messages
  calls: Call[];
  activeCall?: Call;
  currentGroupId?: string;
  currentConversationId?: string;
  privateAccounts: Record<string, PrivateAccount>;
  
  // Actions
  createGroup: (group: Omit<Group, 'id' | 'createdAt' | 'updatedAt' | 'messageCount'>) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  addGroupMember: (groupId: string, member: GroupMember) => void;
  removeGroupMember: (groupId: string, userId: string) => void;
  updateMemberRole: (groupId: string, userId: string, role: PermissionLevel) => void;
  
  addMessage: (message: Message) => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  searchMessages: (filter: MessageSearchFilter) => Message[];
  
  startCall: (call: Call) => void;
  endCall: (callId: string) => void;
  addCallParticipant: (callId: string, participant: CallParticipant) => void;
  
  setPrivateAccount: (account: PrivateAccount) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
}
