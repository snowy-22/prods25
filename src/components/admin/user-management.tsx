import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Checkbox,
} from '@/components/ui/checkbox';
import {
  Users,
  Mail,
  Calendar,
  Shield,
  Edit2,
  Ban,
  Trash2,
  Eye,
} from 'lucide-react';
import { AdminNav } from './admin-layout';

type UserRole = 'user' | 'moderator' | 'admin';

interface AdminUser {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
  created_at: string;
  last_sign_in_at?: string;
  role?: UserRole;
  is_banned?: boolean;
  banned_reason?: string;
}

const ROLE_HIERARCHY = {
  user: 0,
  moderator: 1,
  admin: 2,
};

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  user: ['view_own_data', 'create_content'],
  moderator: ['view_own_data', 'create_content', 'moderate_content', 'review_reports'],
  admin: [
    'view_own_data',
    'create_content',
    'moderate_content',
    'review_reports',
    'manage_users',
    'manage_admin_panel',
    'view_analytics',
  ],
};

export function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [banReason, setBanReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch users from auth
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        // Get all users from auth.users (requires admin access)
        // For demo, we'll fetch from a custom view or endpoint
        const { data: authUsers, error } = await supabase.auth.admin?.listUsers();

        if (error) {
          console.error('Failed to fetch users:', error);
          // Fallback: fetch from custom endpoint
          const response = await fetch('/api/admin/users');
          const users = await response.json();
          setUsers(users);
        } else {
          const transformedUsers: AdminUser[] = (authUsers?.users || []).map(
            (user) => ({
              id: user.id,
              email: user.email || '',
              user_metadata: user.user_metadata as any,
              created_at: user.created_at,
              last_sign_in_at: user.last_sign_in_at,
              role: 'user' as UserRole,
              is_banned: false,
            })
          );
          setUsers(transformedUsers);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.user_metadata?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter((u) => u.role === filterRole);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterRole]);

  const handleUpdateRole = async (user: AdminUser, role: UserRole) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/user-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          newRole: role,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      // Update local state
      setUsers(
        users.map((u) =>
          u.id === user.id ? { ...u, role } : u
        )
      );

      setShowEditDialog(false);
    } catch (error) {
      console.error('Role update error:', error);
      alert('Failed to update user role');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBanUser = async (user: AdminUser) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/user-ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          reason: banReason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to ban user');
      }

      // Update local state
      setUsers(
        users.map((u) =>
          u.id === user.id
            ? { ...u, is_banned: true, banned_reason: banReason }
            : u
        )
      );

      setShowBanDialog(false);
      setBanReason('');
    } catch (error) {
      console.error('Ban error:', error);
      alert('Failed to ban user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnbanUser = async (user: AdminUser) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/user-ban', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to unban user');
      }

      // Update local state
      setUsers(
        users.map((u) =>
          u.id === user.id
            ? { ...u, is_banned: false, banned_reason: undefined }
            : u
        )
      );
    } catch (error) {
      console.error('Unban error:', error);
      alert('Failed to unban user');
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleColor = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <AdminNav />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="moderator">Moderators</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">Total Users</p>
          <p className="text-2xl font-bold text-blue-900">{users.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-700 font-medium">Admins</p>
          <p className="text-2xl font-bold text-green-900">
            {users.filter((u) => u.role === 'admin').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-700 font-medium">Moderators</p>
          <p className="text-2xl font-bold text-purple-900">
            {users.filter((u) => u.role === 'moderator').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
          <p className="text-sm text-red-700 font-medium">Banned</p>
          <p className="text-2xl font-bold text-red-900">
            {users.filter((u) => u.is_banned).length}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-700">
                User
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">
                Role
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">
                Joined
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">
                Last Active
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {user.user_metadata?.name || 'Unnamed User'}
                        </p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={getRoleColor(user.role)}>
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role || 'user'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.is_banned ? (
                      <Badge variant="destructive" className="bg-red-100 text-red-800">
                        <Ban className="w-3 h-3 mr-1" />
                        Banned
                      </Badge>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setNewRole(user.role || 'user');
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    {!user.is_banned ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowBanDialog(true);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Ban className="w-3 h-3" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnbanUser(user)}
                        disabled={isUpdating}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
            <DialogDescription>
              Change role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Role */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-slate-600 uppercase mb-2">
                Current Role
              </p>
              <Badge className={getRoleColor(selectedUser?.role)}>
                {selectedUser?.role || 'user'}
              </Badge>
            </div>

            {/* Role Selection */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                New Role
              </label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Permissions Preview */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                Permissions
              </p>
              <div className="space-y-1">
                {ROLE_PERMISSIONS[newRole].map((perm) => (
                  <div key={perm} className="flex items-center gap-2 text-sm text-slate-600">
                    <Checkbox checked disabled />
                    {perm.replace(/_/g, ' ')}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleUpdateRole(selectedUser!, newRole)}
              disabled={isUpdating || newRole === selectedUser?.role}
            >
              {isUpdating ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Ban {selectedUser?.email} from the platform
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-red-900">
                This action will prevent the user from accessing the platform.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Reason for Ban
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter reason for banning this user..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBanDialog(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleBanUser(selectedUser!)}
              disabled={isUpdating}
            >
              {isUpdating ? 'Banning...' : 'Ban User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
