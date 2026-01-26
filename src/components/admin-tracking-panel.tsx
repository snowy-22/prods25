'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Activity,
  Users,
  AlertTriangle,
  Eye,
  Flag,
  FileText,
  Download,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Ban,
  UserCheck,
  Zap,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  adminTrackingService,
  AdminTracking,
  SecurityThreat
} from '@/lib/admin-tracking-service';
import { useAppStore } from '@/lib/store';

// Severity colors
const severityColors = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  info: 'bg-gray-500'
};

// Status icons
const threatStatusIcons = {
  new: <AlertTriangle className="w-4 h-4 text-red-500" />,
  investigating: <Eye className="w-4 h-4 text-yellow-500" />,
  mitigated: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  false_positive: <XCircle className="w-4 h-4 text-gray-500" />,
  escalated: <AlertCircle className="w-4 h-4 text-purple-500" />
};

// Stats Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  description?: string;
}

function StatCard({ title, value, icon, trend, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend !== undefined && (
          <div className={cn(
            "flex items-center text-xs mt-1",
            trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-gray-500"
          )}>
            <TrendingUp className={cn("w-3 h-3 mr-1", trend < 0 && "rotate-180")} />
            {trend > 0 ? '+' : ''}{trend}% son 24 saat
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Producer type colors and labels
const producerConfig: Record<string, { color: string; label: string }> = {
  user: { color: 'bg-blue-100 text-blue-700', label: 'Kullanıcı' },
  admin: { color: 'bg-purple-100 text-purple-700', label: 'Admin' },
  system: { color: 'bg-gray-100 text-gray-700', label: 'Sistem' },
  ai: { color: 'bg-emerald-100 text-emerald-700', label: 'AI' },
  api: { color: 'bg-orange-100 text-orange-700', label: 'API' },
  migration: { color: 'bg-indigo-100 text-indigo-700', label: 'Migration' },
  sync: { color: 'bg-cyan-100 text-cyan-700', label: 'Sync' },
  scheduler: { color: 'bg-amber-100 text-amber-700', label: 'Scheduler' },
  trigger: { color: 'bg-rose-100 text-rose-700', label: 'Trigger' },
};

// Live Operation Item
interface OperationItemProps {
  operation: AdminTracking;
  onFlag: (id: string, notes: string) => void;
}

function AdminOperationItem({ operation, onFlag }: OperationItemProps) {
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [flagNotes, setFlagNotes] = useState('');
  const producer = producerConfig[operation.producer_type || 'user'] || producerConfig.user;
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border transition-colors',
          operation.flagged_for_review 
            ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20' 
            : 'bg-card hover:bg-accent/50'
        )}
      >
        {/* Operation indicator */}
        <div className={cn(
          'w-2 h-2 rounded-full',
          operation.flagged_for_review ? 'bg-yellow-500' : 'bg-green-500',
          'animate-pulse'
        )} />
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">
              {operation.user_display_name || operation.user_id?.slice(0, 8) + '...'}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {operation.operation_type}
            </Badge>
            {/* Producer type badge */}
            <Badge className={cn("text-[10px]", producer.color)}>
              {producer.label}
            </Badge>
            {/* AI session indicator */}
            {operation.ai_session_id && (
              <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-600">
                🤖 {operation.ai_session_id.slice(0, 6)}
              </Badge>
            )}
            {/* Admin action on behalf indicator */}
            {operation.admin_action_on_behalf_of && (
              <Badge variant="outline" className="text-[10px] border-purple-300 text-purple-600">
                👤 adına
              </Badge>
            )}
            {operation.flagged_for_review && (
              <Badge variant="destructive" className="text-[10px]">
                Bayraklı
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <Clock className="w-3 h-3" />
            <span>{new Date(operation.tracked_at).toLocaleString('tr-TR')}</span>
            <span>•</span>
            <span>{operation.ip_address}</span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1">
          {!operation.flagged_for_review && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowFlagDialog(true)}
            >
              <Flag className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      </motion.div>
      
      {/* Flag Dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İşlemi Bayrakla</DialogTitle>
            <DialogDescription>
              Bu işlemi inceleme için işaretleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="İşaretleme nedeni..."
              value={flagNotes}
              onChange={(e) => setFlagNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlagDialog(false)}>
              İptal
            </Button>
            <Button onClick={() => {
              onFlag(operation.id, flagNotes);
              setShowFlagDialog(false);
              setFlagNotes('');
            }}>
              Bayrakla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Security Threat Item
interface ThreatItemProps {
  threat: SecurityThreat;
  onInvestigate: (id: string) => void;
}

function SecurityThreatItem({ threat, onInvestigate }: ThreatItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'border rounded-lg overflow-hidden',
        threat.severity === 'critical' && 'border-red-500',
        threat.severity === 'high' && 'border-orange-500'
      )}
    >
      <div 
        className={cn(
          'flex items-center gap-3 p-3 cursor-pointer',
          threat.severity === 'critical' && 'bg-red-50 dark:bg-red-950/20',
          threat.severity === 'high' && 'bg-orange-50 dark:bg-orange-950/20'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Severity indicator */}
        <div className={cn(
          'w-3 h-3 rounded-full flex-shrink-0',
          severityColors[threat.severity]
        )} />
        
        {/* Status */}
        {threatStatusIcons[threat.status]}
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{threat.threat_type}</span>
            <Badge variant="outline" className="text-[10px]">
              {threat.status}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {threat.threat_description}
          </div>
        </div>
        
        {/* Expand icon */}
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 border-t bg-muted/50 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">User ID:</span>
                  <span className="ml-1 font-mono">{threat.user_id || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">IP:</span>
                  <span className="ml-1 font-mono">{threat.ip_address || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tespit:</span>
                  <span className="ml-1">{new Date(threat.detected_at).toLocaleString('tr-TR')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Kaynak:</span>
                  <span className="ml-1">{threat.source || 'system'}</span>
                </div>
              </div>
              
              {threat.threat_data && (
                <div>
                  <span className="text-xs text-muted-foreground">Detaylar:</span>
                  <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-auto max-h-24">
                    {JSON.stringify(threat.threat_data, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="flex gap-2">
                {threat.status === 'new' && (
                  <Button 
                    size="sm" 
                    onClick={() => onInvestigate(threat.id)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    İncele
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Ban className="w-3 h-3 mr-1" />
                  Kullanıcıyı Engelle
                </Button>
                <Button size="sm" variant="ghost">
                  <UserCheck className="w-3 h-3 mr-1" />
                  Yanlış Alarm
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Main Admin Panel Component
interface AdminTrackingPanelProps {
  className?: string;
}

export function AdminTrackingPanel({ className }: AdminTrackingPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [operations, setOperations] = useState<AdminTracking[]>([]);
  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterProducer, setFilterProducer] = useState('all');
  
  const user = useAppStore(state => state.user);
  
  // Load data
  const loadData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const [ops, threatsList, dashboardStats] = await Promise.all([
        adminTrackingService.loadOperations({ limit: 50 }),
        adminTrackingService.loadThreats({ status: 'new' }),
        adminTrackingService.getDashboardStats()
      ]);
      
      setOperations(ops);
      setThreats(threatsList);
      setStats(dashboardStats);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  // Initial load and subscriptions
  useEffect(() => {
    loadData();
    
    if (user) {
      const unsubOps = adminTrackingService.subscribeToOperations((payload) => {
        if (payload.new) {
          setOperations(prev => [payload.new as AdminTracking, ...prev].slice(0, 50));
        }
      });
      
      const unsubThreats = adminTrackingService.subscribeToThreats((payload) => {
        if (payload.new) {
          setThreats(prev => [payload.new as SecurityThreat, ...prev]);
        }
      });
      
      return () => {
        unsubOps();
        unsubThreats();
      };
    }
  }, [user, loadData]);
  
  // Flag operation
  const handleFlag = async (operationId: string, notes: string) => {
    if (!user) return;
    await adminTrackingService.flagOperation(operationId, user.id, notes);
    loadData();
  };
  
  // Investigate threat
  const handleInvestigate = async (threatId: string) => {
    if (!user) return;
    await adminTrackingService.investigateThreat(threatId, user.id);
    loadData();
  };
  
  // Generate report
  const handleGenerateReport = async () => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
    
    const report = await adminTrackingService.generateReport(
      startDate.toISOString(),
      endDate.toISOString()
    );
    
    // Download as JSON
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };
  
  // Filter operations with producer support
  const filteredOperations = operations.filter(op => {
    // Filter by operation type
    if (filterType !== 'all' && op.operation_type !== filterType) return false;
    
    // Filter by producer type
    if (filterProducer !== 'all' && op.producer_type !== filterProducer) return false;
    
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (op.user_id || '').toLowerCase().includes(q) ||
        (op.user_display_name || '').toLowerCase().includes(q) ||
        (op.operation_type || '').toLowerCase().includes(q) ||
        (op.ip_address || '').toLowerCase().includes(q) ||
        (op.ai_session_id || '').toLowerCase().includes(q) ||
        (op.api_client_id || '').toLowerCase().includes(q)
      );
    }
    return true;
  });
  
  // Producer stats for overview
  const producerStats = {
    user: operations.filter(op => op.producer_type === 'user').length,
    admin: operations.filter(op => op.producer_type === 'admin').length,
    ai: operations.filter(op => op.producer_type === 'ai').length,
    api: operations.filter(op => op.producer_type === 'api').length,
    system: operations.filter(op => op.producer_type === 'system' || op.producer_type === 'sync').length,
  };
  
  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Admin Takip Paneli</h2>
          {threats.filter(t => t.status === 'new').length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {threats.filter(t => t.status === 'new').length} tehdit
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className={cn('w-4 h-4 mr-1', isLoading && 'animate-spin')} />
            Yenile
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerateReport}>
            <Download className="w-4 h-4 mr-1" />
            Rapor
          </Button>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="overview" className="gap-1">
            <Activity className="w-4 h-4" />
            Genel Bakış
          </TabsTrigger>
          <TabsTrigger value="operations" className="gap-1">
            <Zap className="w-4 h-4" />
            İşlemler
          </TabsTrigger>
          <TabsTrigger value="threats" className="gap-1">
            <AlertTriangle className="w-4 h-4" />
            Tehditler
            {threats.filter(t => t.status === 'new').length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                {threats.filter(t => t.status === 'new').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1">
            <Users className="w-4 h-4" />
            Kullanıcılar
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1 p-4 space-y-4 overflow-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Toplam İşlem"
              value={stats?.totalOperations || operations.length}
              icon={<Activity className="w-4 h-4 text-muted-foreground" />}
              trend={12}
            />
            <StatCard
              title="Aktif Kullanıcı"
              value={stats?.activeUsers || new Set(operations.map(o => o.user_id)).size}
              icon={<Users className="w-4 h-4 text-muted-foreground" />}
              trend={5}
            />
            <StatCard
              title="Bayraklı İşlem"
              value={stats?.flaggedOperations || operations.filter(o => o.flagged_for_review).length}
              icon={<Flag className="w-4 h-4 text-muted-foreground" />}
              description="İnceleme bekliyor"
            />
            <StatCard
              title="Aktif Tehdit"
              value={threats.filter(t => t.status === 'new').length}
              icon={<AlertTriangle className="w-4 h-4 text-muted-foreground" />}
              description={threats.filter(t => t.severity === 'critical').length + ' kritik'}
            />
          </div>
          
          {/* Producer Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">İşlem Kaynakları</CardTitle>
              <CardDescription>Son 50 işlemin kaynak dağılımı</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                <div className="flex flex-col items-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <span className="text-lg font-bold text-blue-600">{producerStats.user}</span>
                  <span className="text-xs text-muted-foreground">👤 Kullanıcı</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                  <span className="text-lg font-bold text-purple-600">{producerStats.admin}</span>
                  <span className="text-xs text-muted-foreground">👑 Admin</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                  <span className="text-lg font-bold text-emerald-600">{producerStats.ai}</span>
                  <span className="text-xs text-muted-foreground">🤖 AI</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                  <span className="text-lg font-bold text-orange-600">{producerStats.api}</span>
                  <span className="text-xs text-muted-foreground">🔌 API</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-950/30">
                  <span className="text-lg font-bold text-gray-600">{producerStats.system}</span>
                  <span className="text-xs text-muted-foreground">⚙️ Sistem</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Son Aktivite</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {operations.slice(0, 10).map(op => (
                    <AdminOperationItem
                      key={op.id}
                      operation={op}
                      onFlag={handleFlag}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Operations Tab */}
        <TabsContent value="operations" className="flex-1 flex flex-col p-4">
          {/* Filters */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı, işlem veya IP ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="İşlem Tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm İşlemler</SelectItem>
                <SelectItem value="item_create">Oluşturma</SelectItem>
                <SelectItem value="item_update">Güncelleme</SelectItem>
                <SelectItem value="item_delete">Silme</SelectItem>
                <SelectItem value="item_move">Taşıma</SelectItem>
                <SelectItem value="item_resize">Yeniden Boyutlama</SelectItem>
                <SelectItem value="item_style">Stil Değişikliği</SelectItem>
                <SelectItem value="batch_operation">Toplu İşlem</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterProducer} onValueChange={setFilterProducer}>
              <SelectTrigger className="w-[140px]">
                <Zap className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Kaynak" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kaynaklar</SelectItem>
                <SelectItem value="user">👤 Kullanıcı</SelectItem>
                <SelectItem value="admin">👑 Admin</SelectItem>
                <SelectItem value="ai">🤖 AI</SelectItem>
                <SelectItem value="api">🔌 API</SelectItem>
                <SelectItem value="system">⚙️ Sistem</SelectItem>
                <SelectItem value="sync">🔄 Senkronizasyon</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Operations List */}
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredOperations.map(op => (
                  <AdminOperationItem
                    key={op.id}
                    operation={op}
                    onFlag={handleFlag}
                  />
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </TabsContent>
        
        {/* Threats Tab */}
        <TabsContent value="threats" className="flex-1 flex flex-col p-4">
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {threats.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aktif tehdit yok</p>
                  <p className="text-xs mt-1">Sistem güvenli görünüyor</p>
                </div>
              ) : (
                <AnimatePresence>
                  {threats.map(threat => (
                    <SecurityThreatItem
                      key={threat.id}
                      threat={threat}
                      onInvestigate={handleInvestigate}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users" className="flex-1 p-4">
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Kullanıcı yönetimi yakında</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminTrackingPanel;
