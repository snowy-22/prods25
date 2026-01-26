'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  Settings,
  Eye,
  EyeOff,
  Check,
  X,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Crown,
  Star,
  User,
  UserCog
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { createClient } from '@/lib/supabase/client';
import { ROLE_PERMISSIONS, type UserRole } from '@/lib/security/rbac';

// Types
interface UserWithRole {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  last_sign_in?: string;
}

interface RoleStats {
  role: UserRole;
  count: number;
}

// Role config
const roleConfig: Record<UserRole, { icon: React.ReactNode; color: string; label: string }> = {
  'user': { 
    icon: <User className="w-4 h-4" />, 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    label: 'Kullanıcı'
  },
  'moderator': { 
    icon: <UserCog className="w-4 h-4" />, 
    color: 'bg-green-100 text-green-700 border-green-200',
    label: 'Moderatör'
  },
  'admin': { 
    icon: <Star className="w-4 h-4" />, 
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    label: 'Admin'
  },
  'super_admin': { 
    icon: <Crown className="w-4 h-4" />, 
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    label: 'Süper Admin'
  }
};

// Permission groups for display
const permissionGroups = [
  {
    name: 'İçerik Yönetimi',
    icon: <Settings className="w-4 h-4" />,
    permissions: [
      { key: 'item:create', label: 'İçerik Oluşturma', description: 'Yeni içerik ekleyebilir' },
      { key: 'item:read', label: 'İçerik Görüntüleme', description: 'İçerikleri görüntüleyebilir' },
      { key: 'item:update', label: 'İçerik Düzenleme', description: 'İçerikleri düzenleyebilir' },
      { key: 'item:delete', label: 'İçerik Silme', description: 'İçerikleri silebilir' },
    ]
  },
  {
    name: 'Kullanıcı Yönetimi',
    icon: <Users className="w-4 h-4" />,
    permissions: [
      { key: 'user:read', label: 'Kullanıcı Listesi', description: 'Kullanıcıları görüntüleyebilir' },
      { key: 'user:update', label: 'Kullanıcı Düzenleme', description: 'Kullanıcı bilgilerini düzenleyebilir' },
      { key: 'user:delete', label: 'Kullanıcı Silme', description: 'Kullanıcıları silebilir' },
      { key: 'user:role', label: 'Rol Değiştirme', description: 'Kullanıcı rollerini değiştirebilir' },
    ]
  },
  {
    name: 'Admin Paneli',
    icon: <Shield className="w-4 h-4" />,
    permissions: [
      { key: 'admin:access', label: 'Admin Paneli Erişimi', description: 'Admin paneline erişebilir' },
      { key: 'admin:analytics', label: 'Analitik Görüntüleme', description: 'Sistem analitiğini görüntüleyebilir' },
      { key: 'admin:settings', label: 'Ayar Yönetimi', description: 'Sistem ayarlarını değiştirebilir' },
      { key: 'admin:logs', label: 'Log Görüntüleme', description: 'Sistem loglarını görüntüleyebilir' },
    ]
  }
];

// Check if role has permission
function roleHasPermission(role: UserRole, permissionKey: string): boolean {
  const [action, resource] = permissionKey.split(':');
  const roleConfig = ROLE_PERMISSIONS[role];
  
  if (!roleConfig) return false;
  
  // Check direct permissions
  const hasDirectPermission = roleConfig.permissions.some(
    p => p.action === action && p.resource === resource && p.effect === 'allow'
  );
  
  // Also check legacy flags
  if (action === 'admin') {
    if (resource === 'access') return role === 'admin' || role === 'super_admin';
    if (resource === 'analytics') return roleConfig.canViewAnalytics;
    if (resource === 'settings') return roleConfig.canManageSettings;
  }
  
  if (action === 'user') {
    if (resource === 'role' || resource === 'delete') return roleConfig.canManageUsers;
  }
  
  if (action === 'item' && resource === 'delete') {
    return roleConfig.canDeleteContent;
  }
  
  return hasDirectPermission;
}

export default function PermissionsPage() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [roleStats, setRoleStats] = useState<RoleStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  
  // Load users
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, avatar_url, role, created_at, last_sign_in_at')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Failed to load users:', error);
        return;
      }
      
      const usersData: UserWithRole[] = (data || []).map(u => ({
        id: u.id,
        email: u.email || '',
        name: u.name || 'İsimsiz',
        avatar_url: u.avatar_url,
        role: (u.role as UserRole) || 'user',
        created_at: u.created_at,
        last_sign_in: u.last_sign_in_at
      }));
      
      setUsers(usersData);
      
      // Calculate role stats
      const stats: RoleStats[] = [
        { role: 'user', count: usersData.filter(u => u.role === 'user').length },
        { role: 'moderator', count: usersData.filter(u => u.role === 'moderator').length },
        { role: 'admin', count: usersData.filter(u => u.role === 'admin').length },
        { role: 'super_admin', count: usersData.filter(u => u.role === 'super_admin').length },
      ];
      setRoleStats(stats);
      
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  
  // Update user role
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) {
        console.error('Failed to update role:', error);
        return;
      }
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      
      // Recalculate stats
      setRoleStats(prev => {
        const oldRole = selectedUser?.role;
        return prev.map(s => {
          if (s.role === oldRole) return { ...s, count: s.count - 1 };
          if (s.role === newRole) return { ...s, count: s.count + 1 };
          return s;
        });
      });
      
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
      setPendingRole(null);
      
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };
  
  // Filter users
  const filteredUsers = users.filter(u => {
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    return true;
  });
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Yetki Yönetimi</h1>
          <p className="text-muted-foreground">Kullanıcı rolleri ve izinlerini yönetin</p>
        </div>
      </div>
      
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Kullanıcılar
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="w-4 h-4" />
            Rol İzinleri
          </TabsTrigger>
        </TabsList>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {roleStats.map(stat => (
              <Card key={stat.role}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      roleConfig[stat.role].color
                    )}>
                      {roleConfig[stat.role].icon}
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.count}</p>
                      <p className="text-sm text-muted-foreground">{roleConfig[stat.role].label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="İsim veya email ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Rol Filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Roller</SelectItem>
                <SelectItem value="user">Kullanıcı</SelectItem>
                <SelectItem value="moderator">Moderatör</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Süper Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadUsers}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Yenile
            </Button>
          </div>
          
          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <p className="text-muted-foreground">Yükleniyor...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Users className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-muted-foreground">Kullanıcı bulunamadı</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                              ) : (
                                <User className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn("gap-1", roleConfig[user.role].color)}
                          >
                            {roleConfig[user.role].icon}
                            {roleConfig[user.role].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setPendingRole(user.role);
                              setIsRoleDialogOpen(true);
                            }}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Rol Değiştir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rol İzin Matrisi</CardTitle>
              <CardDescription>
                Her rolün hangi izinlere sahip olduğunu görüntüleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {permissionGroups.map(group => (
                  <div key={group.name}>
                    <div className="flex items-center gap-2 mb-4">
                      {group.icon}
                      <h3 className="font-semibold">{group.name}</h3>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">İzin</TableHead>
                          {(['user', 'moderator', 'admin', 'super_admin'] as UserRole[]).map(role => (
                            <TableHead key={role} className="text-center">
                              <Badge variant="outline" className={cn("gap-1", roleConfig[role].color)}>
                                {roleConfig[role].icon}
                                {roleConfig[role].label}
                              </Badge>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.permissions.map(perm => (
                          <TableRow key={perm.key}>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="text-left">
                                    <span className="font-medium">{perm.label}</span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{perm.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            {(['user', 'moderator', 'admin', 'super_admin'] as UserRole[]).map(role => (
                              <TableCell key={role} className="text-center">
                                {roleHasPermission(role, perm.key) ? (
                                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-red-400 mx-auto" />
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Role Change Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rol Değiştir</DialogTitle>
            <DialogDescription>
              {selectedUser?.name} kullanıcısının rolünü değiştirin
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                {selectedUser?.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">{selectedUser?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Yeni Rol</label>
              <Select value={pendingRole || undefined} onValueChange={(v) => setPendingRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  {(['user', 'moderator', 'admin', 'super_admin'] as UserRole[]).map(role => (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("gap-1", roleConfig[role].color)}>
                          {roleConfig[role].icon}
                          {roleConfig[role].label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {pendingRole && pendingRole !== selectedUser?.role && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Dikkat</p>
                  <p className="text-amber-700">
                    Bu işlem kullanıcının erişim yetkilerini değiştirecektir.
                    {pendingRole === 'super_admin' && ' Süper Admin rolü en yüksek yetkiye sahiptir.'}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              İptal
            </Button>
            <Button
              disabled={!pendingRole || pendingRole === selectedUser?.role}
              onClick={() => {
                if (selectedUser && pendingRole) {
                  updateUserRole(selectedUser.id, pendingRole);
                }
              }}
            >
              <Check className="w-4 h-4 mr-1" />
              Rolü Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
