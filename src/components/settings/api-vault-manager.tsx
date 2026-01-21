'use client';

/**
 * API Vault Manager UI Component
 * Kullanıcının API key'lerini yönettiği ana bileşen
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, Lock, Unlock, Plus, Trash2, Eye, EyeOff, Copy, Check, 
  Shield, Activity, Settings, AlertTriangle, RefreshCw, Download,
  Upload, TestTube, ChevronDown, ChevronRight, Search, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { 
  apiVaultManager, 
  API_PROVIDER_CONFIGS, 
  PROVIDER_CATEGORIES,
  ApiProvider,
  StoredApiKey,
  VaultStats 
} from '@/lib/api-vault';

interface ApiVaultManagerProps {
  onClose?: () => void;
}

export function ApiVaultManager({ onClose }: ApiVaultManagerProps) {
  const { user } = useAppStore();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keys, setKeys] = useState<Omit<StoredApiKey, 'encryptedData' | 'iv'>[]>([]);
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ApiProvider | null>(null);
  const [newKeyForm, setNewKeyForm] = useState<Record<string, string>>({});
  const [newKeyName, setNewKeyName] = useState('');
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Unlock vault
  const handleUnlock = async () => {
    if (!user || !masterPassword) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await apiVaultManager.initializeVault(user.id, masterPassword);
      setIsUnlocked(true);
      await loadKeys();
      await loadStats();
    } catch (err: any) {
      setError(err.message || 'Failed to unlock vault');
    } finally {
      setIsLoading(false);
    }
  };

  // Lock vault
  const handleLock = () => {
    apiVaultManager.lockVault();
    setIsUnlocked(false);
    setMasterPassword('');
    setKeys([]);
    setStats(null);
  };

  // Load keys
  const loadKeys = useCallback(async () => {
    if (!user) return;
    try {
      const fetchedKeys = await apiVaultManager.listApiKeys(user.id);
      setKeys(fetchedKeys);
    } catch (err) {
      console.error('Failed to load keys:', err);
    }
  }, [user]);

  // Load stats
  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      const fetchedStats = await apiVaultManager.getVaultStats(user.id);
      setStats(fetchedStats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, [user]);

  // Add new key
  const handleAddKey = async () => {
    if (!user || !selectedProvider || !newKeyName) return;
    
    setIsLoading(true);
    try {
      await apiVaultManager.storeApiKey(user.id, selectedProvider, newKeyName, newKeyForm);
      await loadKeys();
      await loadStats();
      setShowAddDialog(false);
      setSelectedProvider(null);
      setNewKeyForm({});
      setNewKeyName('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete key
  const handleDeleteKey = async (keyId: string) => {
    if (!user || !confirm('Bu API key\'i silmek istediğinizden emin misiniz?')) return;
    
    try {
      await apiVaultManager.deleteApiKey(user.id, keyId);
      await loadKeys();
      await loadStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Toggle key enabled state
  const handleToggleKey = async (keyId: string, isEnabled: boolean) => {
    if (!user) return;
    
    try {
      await apiVaultManager.updateApiKey(user.id, keyId, { isEnabled: !isEnabled });
      await loadKeys();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Test key connection
  const handleTestKey = async (keyId: string) => {
    if (!user) return;
    
    setTestingKey(keyId);
    setTestResult(null);
    
    try {
      const result = await apiVaultManager.testApiKey(user.id, keyId);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTestingKey(null);
    }
  };

  // Copy to clipboard
  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Export keys
  const handleExport = async () => {
    if (!user) return;
    
    try {
      const backup = await apiVaultManager.exportKeys(user.id);
      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `canvasflow-api-vault-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Import keys
  const handleImport = async (file: File) => {
    if (!user) return;
    
    try {
      const text = await file.text();
      const imported = await apiVaultManager.importKeys(user.id, text);
      await loadKeys();
      await loadStats();
      alert(`${imported} anahtar başarıyla içe aktarıldı`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Filter keys
  const filteredKeys = keys.filter(key => {
    const matchesSearch = key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         key.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           API_PROVIDER_CONFIGS[key.provider]?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group keys by category
  const groupedKeys = filteredKeys.reduce((acc, key) => {
    const category = API_PROVIDER_CONFIGS[key.provider]?.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(key);
    return acc;
  }, {} as Record<string, typeof filteredKeys>);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Lock className="mr-2 h-5 w-5" />
        Giriş yapmanız gerekiyor
      </div>
    );
  }

  // Locked state
  if (!isUnlocked) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>API Kasası</CardTitle>
          <CardDescription>
            API anahtarlarınıza erişmek için ana şifrenizi girin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="masterPassword">Ana Şifre</Label>
            <div className="relative">
              <Input
                id="masterPassword"
                type={showPassword['master'] ? 'text' : 'password'}
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                placeholder="••••••••••••"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowPassword(p => ({ ...p, master: !p.master }))}
              >
                {showPassword['master'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          
          <Button 
            className="w-full" 
            onClick={handleUnlock}
            disabled={isLoading || !masterPassword}
          >
            {isLoading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Unlock className="mr-2 h-4 w-4" />
            )}
            Kasayı Aç
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            İlk kullanımda bu şifre ile kasanız oluşturulacaktır
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <Key className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">API Kasası</h2>
            <p className="text-sm text-muted-foreground">
              {keys.length} anahtar kayıtlı
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Yedekle</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <label>
                  <Button variant="outline" size="icon" asChild>
                    <span><Upload className="h-4 w-4" /></span>
                  </Button>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
                  />
                </label>
              </TooltipTrigger>
              <TooltipContent>İçe Aktar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button variant="outline" size="icon" onClick={handleLock}>
            <Lock className="h-4 w-4" />
          </Button>
          
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Anahtar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.totalKeys}</div>
              <p className="text-xs text-muted-foreground">Toplam Anahtar</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-500">{stats.activeKeys}</div>
              <p className="text-xs text-muted-foreground">Aktif</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.totalUsage}</div>
              <p className="text-xs text-muted-foreground">Toplam Kullanım</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-primary">
                {Object.keys(stats.usageByProvider).length}
              </div>
              <p className="text-xs text-muted-foreground">Entegrasyon</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Anahtar ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {Object.entries(PROVIDER_CATEGORIES).map(([key, cat]) => (
              <SelectItem key={key} value={key}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Keys List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {Object.entries(groupedKeys).map(([category, categoryKeys]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-2 sticky top-0 bg-background/95 backdrop-blur py-1">
                <span className="text-lg">{PROVIDER_CATEGORIES[category as keyof typeof PROVIDER_CATEGORIES]?.icon}</span>
                <span className="text-sm font-medium text-muted-foreground">
                  {PROVIDER_CATEGORIES[category as keyof typeof PROVIDER_CATEGORIES]?.name}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {categoryKeys.length}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {categoryKeys.map((key) => {
                  const config = API_PROVIDER_CONFIGS[key.provider];
                  
                  return (
                    <Card key={key.id} className={cn(!key.isEnabled && 'opacity-50')}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{config?.icon || '🔑'}</span>
                            <div>
                              <div className="font-medium">{key.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {config?.name || key.provider}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant={key.isEnabled ? 'default' : 'secondary'}>
                              {key.usageCount} kullanım
                            </Badge>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleTestKey(key.id)}
                                    disabled={testingKey === key.id}
                                  >
                                    {testingKey === key.id ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <TestTube className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Bağlantıyı Test Et</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <Switch
                              checked={key.isEnabled}
                              onCheckedChange={() => handleToggleKey(key.id, key.isEnabled)}
                            />
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteKey(key.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {key.lastUsedAt && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Son kullanım: {new Date(key.lastUsedAt).toLocaleString('tr-TR')}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
          
          {filteredKeys.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Key className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Henüz API anahtarı eklenmemiş</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                İlk Anahtarını Ekle
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Add Key Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni API Anahtarı Ekle</DialogTitle>
            <DialogDescription>
              Entegrasyon için kullanılacak API anahtarınızı güvenli bir şekilde saklayın
            </DialogDescription>
          </DialogHeader>
          
          {!selectedProvider ? (
            <div className="space-y-4">
              <Input
                placeholder="Servis ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {Object.entries(PROVIDER_CATEGORIES).map(([categoryKey, category]) => {
                    const providers = Object.entries(API_PROVIDER_CONFIGS)
                      .filter(([_, config]) => 
                        config.category === categoryKey &&
                        (config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         config.provider.toLowerCase().includes(searchQuery.toLowerCase()))
                      );
                    
                    if (providers.length === 0) return null;
                    
                    return (
                      <div key={categoryKey}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{category.icon}</span>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {providers.map(([providerKey, config]) => (
                            <Button
                              key={providerKey}
                              variant="outline"
                              className="justify-start h-auto py-3"
                              onClick={() => setSelectedProvider(providerKey as ApiProvider)}
                            >
                              <span className="text-xl mr-3">{config.icon}</span>
                              <div className="text-left">
                                <div className="font-medium">{config.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {config.description}
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedProvider(null);
                  setNewKeyForm({});
                  setNewKeyName('');
                }}
              >
                ← Geri
              </Button>
              
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <span className="text-3xl">{API_PROVIDER_CONFIGS[selectedProvider].icon}</span>
                <div>
                  <div className="font-semibold">{API_PROVIDER_CONFIGS[selectedProvider].name}</div>
                  <div className="text-sm text-muted-foreground">
                    {API_PROVIDER_CONFIGS[selectedProvider].description}
                  </div>
                  {API_PROVIDER_CONFIGS[selectedProvider].docsUrl && (
                    <a
                      href={API_PROVIDER_CONFIGS[selectedProvider].docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Dokümantasyon →
                    </a>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName">Anahtar Adı *</Label>
                  <Input
                    id="keyName"
                    placeholder="Örn: Ana Hesabım"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                
                {API_PROVIDER_CONFIGS[selectedProvider].fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>
                      {field.label}
                      {field.required && ' *'}
                    </Label>
                    {field.type === 'select' ? (
                      <Select
                        value={newKeyForm[field.key] || ''}
                        onValueChange={(value) => setNewKeyForm(f => ({ ...f, [field.key]: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="relative">
                        <Input
                          id={field.key}
                          type={field.type === 'password' && !showPassword[field.key] ? 'password' : 'text'}
                          placeholder={field.placeholder}
                          value={newKeyForm[field.key] || ''}
                          onChange={(e) => setNewKeyForm(f => ({ ...f, [field.key]: e.target.value }))}
                        />
                        {field.type === 'password' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowPassword(p => ({ ...p, [field.key]: !p[field.key] }))}
                          >
                            {showPassword[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    )}
                    {field.helpText && (
                      <p className="text-xs text-muted-foreground">{field.helpText}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {selectedProvider && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                İptal
              </Button>
              <Button onClick={handleAddKey} disabled={isLoading || !newKeyName}>
                {isLoading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Key className="mr-2 h-4 w-4" />
                )}
                Anahtarı Kaydet
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
