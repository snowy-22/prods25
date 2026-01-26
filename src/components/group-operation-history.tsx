'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  History,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Move,
  UserPlus,
  UserMinus,
  Settings,
  Eye,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  User,
  Building2,
  Calendar,
  Bot,
  Terminal,
  RefreshCw,
  Folder,
  Undo2,
  Redo2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';

// Types
interface GroupOperation {
  id: string;
  group_id?: string;
  organization_id?: string;
  folder_id?: string;
  operation_id: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  operation_type: string;
  entity_type: string;
  entity_id: string;
  entity_name?: string;
  summary: string;
  visibility: 'all_members' | 'admins_only' | 'owner_only';
  producer_type?: 'user' | 'admin' | 'system' | 'ai' | 'api' | 'sync';
  is_undone?: boolean;
  created_at: string;
}

// Producer type config
const producerConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  'user': { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Kullanıcı', icon: <User className="w-3 h-3" /> },
  'admin': { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Yönetici', icon: <Settings className="w-3 h-3" /> },
  'system': { color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Sistem', icon: <Terminal className="w-3 h-3" /> },
  'ai': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'AI', icon: <Bot className="w-3 h-3" /> },
  'api': { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'API', icon: <RefreshCw className="w-3 h-3" /> },
  'sync': { color: 'bg-cyan-100 text-cyan-700 border-cyan-200', label: 'Senkron', icon: <RefreshCw className="w-3 h-3" /> },
};

// Operation type icons
const operationIcons: Record<string, React.ReactNode> = {
  'create': <Plus className="w-4 h-4 text-green-500" />,
  'item_create': <Plus className="w-4 h-4 text-green-500" />,
  'update': <Pencil className="w-4 h-4 text-blue-500" />,
  'item_update': <Pencil className="w-4 h-4 text-blue-500" />,
  'style_change': <Pencil className="w-4 h-4 text-purple-500" />,
  'delete': <Trash2 className="w-4 h-4 text-red-500" />,
  'item_delete': <Trash2 className="w-4 h-4 text-red-500" />,
  'move': <Move className="w-4 h-4 text-orange-500" />,
  'item_move': <Move className="w-4 h-4 text-orange-500" />,
  'reorder': <Move className="w-4 h-4 text-orange-300" />,
  'resize': <Move className="w-4 h-4 text-yellow-500" />,
  'member_add': <UserPlus className="w-4 h-4 text-green-500" />,
  'member_remove': <UserMinus className="w-4 h-4 text-red-500" />,
  'settings_update': <Settings className="w-4 h-4 text-purple-500" />,
  'permission_change': <Eye className="w-4 h-4 text-cyan-500" />,
  'undo': <Undo2 className="w-4 h-4 text-amber-500" />,
  'redo': <Redo2 className="w-4 h-4 text-amber-500" />,
  'restore': <RefreshCw className="w-4 h-4 text-green-500" />,
  'batch_update': <Settings className="w-4 h-4 text-indigo-500" />,
};

// Format time
function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Şimdi';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} dk önce`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} saat önce`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} gün önce`;
  return date.toLocaleDateString('tr-TR');
}

// Generate summary from operation_history data
function generateSummary(operationType: string, targetTable: string, targetTitle?: string): string {
  const entityLabel = targetTitle || targetTable || 'öğe';
  
  switch (operationType) {
    case 'create':
      return `${entityLabel} oluşturuldu`;
    case 'update':
    case 'style_change':
      return `${entityLabel} güncellendi`;
    case 'delete':
      return `${entityLabel} silindi`;
    case 'move':
    case 'reorder':
      return `${entityLabel} taşındı`;
    case 'resize':
      return `${entityLabel} yeniden boyutlandırıldı`;
    case 'undo':
      return `${entityLabel} geri alındı`;
    case 'redo':
      return `${entityLabel} yinelendi`;
    case 'restore':
      return `${entityLabel} geri yüklendi`;
    default:
      return `${entityLabel} üzerinde işlem yapıldı`;
  }
}

// Group date operations
function groupByDate(operations: GroupOperation[]): Map<string, GroupOperation[]> {
  const groups = new Map<string, GroupOperation[]>();
  
  for (const op of operations) {
    const date = new Date(op.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = 'Bugün';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Dün';
    } else {
      key = date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(op);
  }
  
  return groups;
}

// Single Operation Item
interface OperationItemProps {
  operation: GroupOperation;
}

function GroupOperationItem({ operation }: OperationItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 py-3 border-b last:border-0"
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={operation.user_avatar} />
        <AvatarFallback>
          {operation.user_name?.charAt(0) || 'U'}
        </AvatarFallback>
      </Avatar>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          {/* Icon */}
          <div className="mt-0.5">
            {operationIcons[operation.operation_type] || <History className="w-4 h-4" />}
          </div>
          
          {/* Text */}
          <div className="flex-1">
            <p className="text-sm">
              <span className="font-medium">{operation.user_name || 'Kullanıcı'}</span>
              {' '}
              <span className="text-muted-foreground">{operation.summary}</span>
            </p>
            
            {operation.entity_name && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {operation.entity_name}
              </p>
            )}
            
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatTime(new Date(operation.created_at))}</span>
              
              {/* Producer Badge */}
              {operation.producer_type && producerConfig[operation.producer_type] && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[10px] px-1.5 py-0 inline-flex items-center gap-1 border",
                    producerConfig[operation.producer_type].color
                  )}
                >
                  {producerConfig[operation.producer_type].icon}
                  {producerConfig[operation.producer_type].label}
                </Badge>
              )}
              
              {/* Undo indicator */}
              {operation.is_undone && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-amber-100 text-amber-700">
                  <Undo2 className="w-2.5 h-2.5 mr-0.5" />
                  Geri Alındı
                </Badge>
              )}
              
              {operation.visibility !== 'all_members' && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  {operation.visibility === 'admins_only' ? 'Yöneticiler' : 'Sahip'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Expand button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 flex-shrink-0"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </Button>
    </motion.div>
  );
}

// Date Section
interface DateSectionProps {
  date: string;
  operations: GroupOperation[];
}

function DateSection({ date, operations }: DateSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <div className="mb-4">
      <button
        className="flex items-center gap-2 w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <Calendar className="w-4 h-4" />
        <span>{date}</span>
        <Badge variant="secondary" className="ml-auto">
          {operations.length}
        </Badge>
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronUp className="w-4 h-4" />
        )}
      </button>
      
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pl-6 border-l-2 border-muted ml-2">
              {operations.map(op => (
                <GroupOperationItem key={op.id} operation={op} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main Component
interface GroupOperationHistoryProps {
  groupId?: string;
  organizationId?: string;
  folderId?: string; // For canvas folder-scoped history
  source?: 'group' | 'folder' | 'both'; // Which table(s) to query
  className?: string;
}

export function GroupOperationHistory({ 
  groupId, 
  organizationId,
  folderId,
  source = 'group',
  className 
}: GroupOperationHistoryProps) {
  const [operations, setOperations] = useState<GroupOperation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [filterProducer, setFilterProducer] = useState('all');
  
  const user = useAppStore(state => state.user);
  const groups = useAppStore(state => state.groups);
  
  // Load operations
  const loadOperations = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const supabase = createClient();
      let allOperations: GroupOperation[] = [];
      
      // Load from group_operation_history if needed
      if (source === 'group' || source === 'both') {
        let query = supabase
          .from('group_operation_history')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (groupId) {
          query = query.eq('group_id', groupId);
        }
        
        if (organizationId) {
          query = query.eq('organization_id', organizationId);
        }
        
        const { data, error } = await query;
        
        if (!error && data) {
          allOperations = [...allOperations, ...data];
        }
      }
      
      // Load from operation_history if folderId provided or source is 'folder'/'both'
      if ((source === 'folder' || source === 'both') && folderId) {
        const { data, error } = await supabase
          .from('operation_history')
          .select('*')
          .eq('folder_id', folderId)
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (!error && data) {
          // Transform operation_history to GroupOperation format
          const transformed: GroupOperation[] = data.map(op => ({
            id: op.id,
            folder_id: op.folder_id,
            operation_id: op.id,
            user_id: op.user_id,
            user_name: op.user_name || 'Kullanıcı',
            user_avatar: op.user_avatar,
            operation_type: op.operation_type,
            entity_type: op.target_table,
            entity_id: op.target_id,
            entity_name: op.target_title,
            summary: generateSummary(op.operation_type, op.target_table, op.target_title),
            visibility: 'all_members',
            producer_type: op.producer_type,
            is_undone: op.is_undone,
            created_at: op.created_at
          }));
          allOperations = [...allOperations, ...transformed];
        }
      }
      
      // Sort by date descending
      allOperations.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setOperations(allOperations.slice(0, 100));
    } catch (error) {
      console.error('Failed to load group operations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, groupId, organizationId, folderId, source]);
  
  // Subscribe to changes
  useEffect(() => {
    loadOperations();
    
    if (user) {
      const supabase = createClient();
      const channel = supabase
        .channel('group-operations')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'group_operation_history',
            filter: groupId ? `group_id=eq.${groupId}` : undefined
          },
          (payload) => {
            setOperations(prev => [payload.new as GroupOperation, ...prev]);
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, groupId, loadOperations]);
  
  // Filter operations
  const filteredOperations = operations.filter(op => {
    // Type filter
    if (filterType !== 'all' && op.operation_type !== filterType) return false;
    
    // User filter
    if (filterUser !== 'all' && op.user_id !== filterUser) return false;
    
    // Producer filter
    if (filterProducer !== 'all' && op.producer_type !== filterProducer) return false;
    
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        op.summary.toLowerCase().includes(q) ||
        op.user_name?.toLowerCase().includes(q) ||
        op.entity_name?.toLowerCase().includes(q)
      );
    }
    
    return true;
  });
  
  // Group by date
  const groupedOperations = groupByDate(filteredOperations);
  
  // Get unique users
  const uniqueUsers = Array.from(
    new Map(operations.map(op => [op.user_id, { id: op.user_id, name: op.user_name }])).values()
  );
  
  const currentGroup = groups.find(g => g.id === groupId);
  
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          {folderId ? (
            <Folder className="w-5 h-5" />
          ) : groupId ? (
            <Users className="w-5 h-5" />
          ) : (
            <Building2 className="w-5 h-5" />
          )}
          <h3 className="font-semibold">
            {folderId ? 'Klasör' : currentGroup?.name || 'Grup'} İşlem Geçmişi
          </h3>
          <Badge variant="outline" className="ml-auto text-xs">
            {filteredOperations.length} işlem
          </Badge>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[150px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[130px] h-9">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Tür" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="create">Oluşturma</SelectItem>
              <SelectItem value="update">Güncelleme</SelectItem>
              <SelectItem value="delete">Silme</SelectItem>
              <SelectItem value="move">Taşıma</SelectItem>
              <SelectItem value="item_create">Öğe Oluşturma</SelectItem>
              <SelectItem value="item_update">Öğe Güncelleme</SelectItem>
              <SelectItem value="item_delete">Öğe Silme</SelectItem>
              <SelectItem value="member_add">Üye Ekleme</SelectItem>
              <SelectItem value="member_remove">Üye Çıkarma</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterProducer} onValueChange={setFilterProducer}>
            <SelectTrigger className="w-[120px] h-9">
              <Bot className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Kaynak" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kaynaklar</SelectItem>
              <SelectItem value="user">Kullanıcı</SelectItem>
              <SelectItem value="admin">Yönetici</SelectItem>
              <SelectItem value="ai">AI</SelectItem>
              <SelectItem value="system">Sistem</SelectItem>
              <SelectItem value="api">API</SelectItem>
              <SelectItem value="sync">Senkron</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-[130px] h-9">
              <User className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Kullanıcı" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Herkes</SelectItem>
              {uniqueUsers.map(u => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name || u.id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredOperations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Henüz işlem yok</p>
              <p className="text-xs mt-1">Grup aktiviteleri burada görünecek</p>
            </div>
          ) : (
            Array.from(groupedOperations.entries()).map(([date, ops]) => (
              <DateSection key={date} date={date} operations={ops} />
            ))
          )}
        </div>
      </ScrollArea>
      
      {/* Footer */}
      {filteredOperations.length > 0 && (
        <div className="p-3 border-t bg-muted/50 text-xs text-muted-foreground flex justify-between">
          <span>{filteredOperations.length} işlem</span>
          <span>{uniqueUsers.length} katılımcı</span>
        </div>
      )}
    </div>
  );
}

export default GroupOperationHistory;
