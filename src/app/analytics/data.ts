export type AnalyticsUser = {
  id: string;
  name: string;
  role: string;
  email: string;
  contentCount: number;
  lastLogin: string;
};

export const usersData: AnalyticsUser[] = [
  {
    id: 'u-001',
    name: 'Ada Lovelace',
    role: 'Admin',
    email: 'ada@example.com',
    contentCount: 42,
    lastLogin: '2 saat önce',
  },
  {
    id: 'u-002',
    name: 'Alan Turing',
    role: 'Editor',
    email: 'alan@example.com',
    contentCount: 31,
    lastLogin: 'dün',
  },
  {
    id: 'u-003',
    name: 'Grace Hopper',
    role: 'User',
    email: 'grace@example.com',
    contentCount: 18,
    lastLogin: '3 gün önce',
  },
];
