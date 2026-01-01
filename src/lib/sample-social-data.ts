/**
 * Sample Social Media Data
 * Mock data for testing and demos
 */

export interface SampleProfile {
  id: string;
  username: string;
  displayName: string;
  avatar_url: string;
  bio: string;
  website?: string;
  followerCount: number;
  followingCount: number;
  itemCount: number;
  likeCount: number;
  commentCount: number;
  verified: boolean;
  badge?: string;
}

export interface SampleItem {
  id: string;
  title: string;
  type: 'video' | 'image' | 'article' | 'canvas' | 'collection';
  userId: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  createdAt: string;
  thumbnail?: string;
}

export const SAMPLE_PROFILES: SampleProfile[] = [
  {
    id: 'profile-designer-1',
    username: 'designStudio',
    displayName: '🎨 Design Studio',
    avatar_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=200&h=200&fit=crop',
    bio: 'Digital design & creative ideas | UI/UX Enthusiast | Based in Istanbul',
    website: 'https://designstudio.com',
    followerCount: 2845,
    followingCount: 456,
    itemCount: 127,
    likeCount: 5230,
    commentCount: 892,
    verified: true,
    badge: 'Pro Designer',
  },
  {
    id: 'profile-dev-1',
    username: 'devMaster',
    displayName: '💻 Dev Master',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    bio: 'Full-stack developer | Open source enthusiast | Coffee lover ☕',
    website: 'https://github.com/devmaster',
    followerCount: 3456,
    followingCount: 234,
    itemCount: 89,
    likeCount: 6720,
    commentCount: 1234,
    verified: true,
    badge: 'Senior Dev',
  },
  {
    id: 'profile-creator-1',
    username: 'contentCreator',
    displayName: '🎬 Content Creator',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    bio: 'Creating awesome digital content daily | Video & Animation',
    followerCount: 12500,
    followingCount: 892,
    itemCount: 456,
    likeCount: 89230,
    commentCount: 5670,
    verified: true,
  },
  {
    id: 'profile-artist-1',
    username: 'digitalArtist',
    displayName: '🖌️ Digital Artist',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    bio: 'Digital art | Illustration | Character design | Commissions open',
    followerCount: 4230,
    followingCount: 567,
    itemCount: 234,
    likeCount: 12450,
    commentCount: 2345,
    verified: true,
    badge: 'Artist',
  },
  {
    id: 'profile-photographer-1',
    username: 'photoGraphy',
    displayName: '📸 Photography Pro',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    bio: 'Professional photographer | Travel & nature | Print available',
    website: 'https://photograpyportfolio.com',
    followerCount: 5678,
    followingCount: 456,
    itemCount: 567,
    likeCount: 34560,
    commentCount: 3456,
    verified: true,
  },
  {
    id: 'profile-influencer-1',
    username: 'lifestyle.influencer',
    displayName: '✨ Lifestyle Influencer',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69be16?w=200&h=200&fit=crop',
    bio: 'Sharing lifestyle tips, travel, fashion & wellness | Partnership inquiries',
    followerCount: 18900,
    followingCount: 1234,
    itemCount: 890,
    likeCount: 125670,
    commentCount: 12345,
    verified: true,
    badge: 'Influencer',
  },
  {
    id: 'profile-educator-1',
    username: 'eduMentor',
    displayName: '📚 Edu Mentor',
    avatar_url: 'https://images.unsplash.com/photo-150784272343-583f20270319?w=200&h=200&fit=crop',
    bio: 'Teaching design & development online | Free courses | Community focused',
    followerCount: 7234,
    followingCount: 345,
    itemCount: 178,
    likeCount: 45670,
    commentCount: 8901,
    verified: true,
    badge: 'Educator',
  },
  {
    id: 'profile-startup-1',
    username: 'startupHub',
    displayName: '🚀 Startup Hub',
    avatar_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&h=200&fit=crop',
    bio: 'Helping startups scale | Business tips | Funding announcements',
    website: 'https://startuphub.com',
    followerCount: 9876,
    followingCount: 2341,
    itemCount: 234,
    likeCount: 67890,
    commentCount: 5678,
    verified: true,
  },
  {
    id: 'profile-musician-1',
    username: 'musicProducer',
    displayName: '🎵 Music Producer',
    avatar_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop',
    bio: 'Music production & beats | Collaborations welcome | Spotify available',
    followerCount: 6543,
    followingCount: 876,
    itemCount: 145,
    likeCount: 23450,
    commentCount: 3456,
    verified: false,
  },
  {
    id: 'profile-writer-1',
    username: 'creativeWriter',
    displayName: '✍️ Creative Writer',
    avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop',
    bio: 'Fiction & non-fiction writer | Publishing on Medium | Open to projects',
    followerCount: 3456,
    followingCount: 678,
    itemCount: 98,
    likeCount: 12340,
    commentCount: 2345,
    verified: false,
  },
  {
    id: 'profile-entrepreneur-1',
    username: 'entrepreneurs.daily',
    displayName: '💼 Entrepreneur Daily',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    bio: 'Entrepreneurship tips | Business insights | Daily motivation',
    followerCount: 14560,
    followingCount: 2345,
    itemCount: 567,
    likeCount: 98765,
    commentCount: 12340,
    verified: true,
    badge: 'Business Leader',
  },
  {
    id: 'profile-fitness-1',
    username: 'fitnessCoacH',
    displayName: '💪 Fitness Coach',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
    bio: 'Personal training | Nutrition tips | Transform your body | Online coaching',
    followerCount: 8765,
    followingCount: 567,
    itemCount: 234,
    likeCount: 45670,
    commentCount: 5670,
    verified: true,
    badge: 'Coach',
  },
];

export const SAMPLE_ITEMS: SampleItem[] = [
  {
    id: 'item-design-1',
    title: 'Modern UI Design System',
    type: 'image',
    userId: 'profile-designer-1',
    likes: 234,
    comments: 45,
    shares: 12,
    views: 2345,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
  },
  {
    id: 'item-dev-1',
    title: 'React Performance Optimization Guide',
    type: 'article',
    userId: 'profile-dev-1',
    likes: 567,
    comments: 89,
    shares: 34,
    views: 5678,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'item-creator-1',
    title: 'How to Create Viral Content',
    type: 'video',
    userId: 'profile-creator-1',
    likes: 2345,
    comments: 456,
    shares: 234,
    views: 23456,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'item-artist-1',
    title: 'Character Design Process',
    type: 'image',
    userId: 'profile-artist-1',
    likes: 456,
    comments: 78,
    shares: 23,
    views: 4567,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'item-photo-1',
    title: 'Sunset Photography Collection',
    type: 'collection',
    userId: 'profile-photographer-1',
    likes: 890,
    comments: 123,
    shares: 45,
    views: 8901,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'item-lifestyle-1',
    title: 'Minimalist Living Guide',
    type: 'canvas',
    userId: 'profile-influencer-1',
    likes: 1234,
    comments: 234,
    shares: 89,
    views: 12345,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'item-edu-1',
    title: 'Web Design Masterclass',
    type: 'video',
    userId: 'profile-educator-1',
    likes: 678,
    comments: 123,
    shares: 45,
    views: 6789,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'item-startup-1',
    title: 'Scaling Your Startup to 100k Users',
    type: 'article',
    userId: 'profile-startup-1',
    likes: 890,
    comments: 167,
    shares: 67,
    views: 8901,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'item-music-1',
    title: 'Lo-Fi Hip Hop Beat',
    type: 'video',
    userId: 'profile-musician-1',
    likes: 345,
    comments: 56,
    shares: 23,
    views: 3456,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'item-writer-1',
    title: 'Short Story: Lost in Translation',
    type: 'article',
    userId: 'profile-writer-1',
    likes: 234,
    comments: 45,
    shares: 12,
    views: 2345,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const SAMPLE_COMMENTS = [
  {
    id: 'comment-1',
    itemId: 'item-design-1',
    userId: 'profile-dev-1',
    username: 'devMaster',
    content: 'Love this design system! Very clean and well organized.',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'comment-2',
    itemId: 'item-dev-1',
    userId: 'profile-designer-1',
    username: 'designStudio',
    content: 'Great performance tips! Implementing these right away.',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'comment-3',
    itemId: 'item-creator-1',
    userId: 'profile-influencer-1',
    username: 'lifestyle.influencer',
    content: 'This is gold! 💯 Sharing with my audience.',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
];

export const SAMPLE_FOLLOWS = [
  { followerId: 'profile-designer-1', followingId: 'profile-dev-1' },
  { followerId: 'profile-designer-1', followingId: 'profile-artist-1' },
  { followerId: 'profile-dev-1', followingId: 'profile-designer-1' },
  { followerId: 'profile-dev-1', followingId: 'profile-startup-1' },
  { followerId: 'profile-creator-1', followingId: 'profile-influencer-1' },
  { followerId: 'profile-creator-1', followingId: 'profile-educator-1' },
  { followerId: 'profile-artist-1', followingId: 'profile-photographer-1' },
  { followerId: 'profile-photographer-1', followingId: 'profile-designer-1' },
  { followerId: 'profile-influencer-1', followingId: 'profile-lifestyle-1' },
  { followerId: 'profile-startup-1', followingId: 'profile-entrepreneur-1' },
  { followerId: 'profile-educator-1', followingId: 'profile-dev-1' },
  { followerId: 'profile-musician-1', followingId: 'profile-creator-1' },
  { followerId: 'profile-writer-1', followingId: 'profile-educator-1' },
  { followerId: 'profile-fitness-1', followingId: 'profile-influencer-1' },
];

/**
 * Get sample profiles for display
 */
export function getSampleProfiles(limit?: number): SampleProfile[] {
  if (limit) {
    return SAMPLE_PROFILES.slice(0, limit);
  }
  return SAMPLE_PROFILES;
}

/**
 * Get sample items for a user
 */
export function getSampleItemsForUser(userId: string): SampleItem[] {
  return SAMPLE_ITEMS.filter((item) => item.userId === userId);
}

/**
 * Get sample comments for an item
 */
export function getSampleCommentsForItem(itemId: string) {
  return SAMPLE_COMMENTS.filter((comment) => comment.itemId === itemId);
}

/**
 * Get sample followers for a user
 */
export function getSampleFollowersForUser(userId: string) {
  return SAMPLE_FOLLOWS.filter((follow) => follow.followingId === userId).map(
    (follow) => SAMPLE_PROFILES.find((p) => p.id === follow.followerId)
  );
}

/**
 * Get sample following for a user
 */
export function getSampleFollowingForUser(userId: string) {
  return SAMPLE_FOLLOWS.filter((follow) => follow.followerId === userId).map(
    (follow) => SAMPLE_PROFILES.find((p) => p.id === follow.followingId)
  );
}

/**
 * Get random sample profiles
 */
export function getRandomSampleProfiles(count: number = 5): SampleProfile[] {
  const shuffled = [...SAMPLE_PROFILES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
