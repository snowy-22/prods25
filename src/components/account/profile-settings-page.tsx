'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  Shield,
  Bell,
  Eye,
  EyeOff,
  Camera,
  Check,
  X,
  Loader2,
  Save,
  KeyRound,
  Smartphone,
  Globe,
  Link2,
  Unlink,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Profile Schema
const profileSchema = z.object({
  displayName: z.string().min(2, 'En az 2 karakter gerekli').max(50, 'Maksimum 50 karakter'),
  username: z.string().min(3, 'En az 3 karakter').max(30, 'Maksimum 30 karakter').regex(/^[a-zA-Z0-9_]+$/, 'Sadece harf, rakam ve alt çizgi kullanılabilir').optional().or(z.literal('')),
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  bio: z.string().max(160, 'Maksimum 160 karakter').optional(),
});

// Security Schema
const securitySchema = z.object({
  currentPassword: z.string().min(1, 'Mevcut şifre gerekli'),
  newPassword: z.string().min(8, 'En az 8 karakter gerekli'),
  confirmPassword: z.string().min(8, 'Şifre tekrarı gerekli'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});

// PIN Schema
const pinSchema = z.object({
  pin: z.string().length(4, 'PIN 4 haneli olmalıdır').regex(/^\d+$/, 'Sadece rakam kullanılabilir'),
  confirmPin: z.string().length(4, 'PIN 4 haneli olmalıdır'),
}).refine((data) => data.pin === data.confirmPin, {
  message: 'PIN kodları eşleşmiyor',
  path: ['confirmPin'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type SecurityFormData = z.infer<typeof securitySchema>;
type PinFormData = z.infer<typeof pinSchema>;

interface ProfileSettingsPageProps {
  className?: string;
  onClose?: () => void;
}

export function ProfileSettingsPage({ className, onClose }: ProfileSettingsPageProps) {
  const { user, username } = useAppStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Profile Form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: username || user?.email?.split('@')[0] || '',
      username: username || '',
      email: user?.email || '',
      phone: '',
      birthDate: '',
      gender: undefined,
      bio: '',
    },
  });

  // Security Form
  const securityForm = useForm<SecurityFormData>({
    resolver: zodResolver(securitySchema),
  });

  // PIN Form
  const pinForm = useForm<PinFormData>({
    resolver: zodResolver(pinSchema),
  });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false,
    security: true,
    updates: true,
  });

  // Privacy Settings
  const [privacy, setPrivacy] = useState({
    profilePublic: true,
    showActivity: true,
    showOnlineStatus: true,
    allowMessages: true,
    allowTagging: true,
  });

  // Connected Accounts
  const [connectedAccounts, setConnectedAccounts] = useState({
    google: true,
    apple: false,
    github: false,
    twitter: false,
  });

  // Handle Profile Save
  const handleProfileSave = async (data: ProfileFormData) => {
    setIsLoading(true);
    setSaveStatus('saving');
    
    try {
      // TODO: Save to Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update store
      useAppStore.getState().setUsername(data.displayName);
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Profile save failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Change
  const handlePasswordChange = async (data: SecurityFormData) => {
    setIsLoading(true);
    
    try {
      // TODO: Change password via Supabase Auth
      await new Promise(resolve => setTimeout(resolve, 1000));
      securityForm.reset();
      alert('Şifre başarıyla değiştirildi!');
    } catch (error) {
      console.error('Password change failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle PIN Setup
  const handlePinSetup = async (data: PinFormData) => {
    setIsLoading(true);
    
    try {
      // TODO: Save PIN hash to user_accounts table
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPinEnabled(true);
      pinForm.reset();
      alert('PIN kodu başarıyla ayarlandı!');
    } catch (error) {
      console.error('PIN setup failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get avatar URL
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${username || user?.email}`;

  return (
    <div className={cn("min-h-screen bg-slate-950 text-white", className)}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Hesap Ayarları</h1>
            <p className="text-slate-400 mt-1">Profil, güvenlik ve tercihlerinizi yönetin</p>
          </div>
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Profile Header Card */}
        <Card className="mb-6 bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-slate-700">
                  <AvatarImage src={avatarUrl} alt={username || 'Avatar'} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
                    {(username || user?.email?.charAt(0) || 'U').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{username || user?.email?.split('@')[0]}</h2>
                <p className="text-slate-400">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30">
                    Kişisel Hesap
                  </Badge>
                  <Badge className="bg-green-500/20 text-green-300 hover:bg-green-500/30">
                    Doğrulanmış
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700 p-1 w-full justify-start flex-wrap">
            <TabsTrigger value="profile" className="data-[state=active]:bg-slate-700">
              <User className="h-4 w-4 mr-2" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-slate-700">
              <Shield className="h-4 w-4 mr-2" />
              Güvenlik
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-700">
              <Bell className="h-4 w-4 mr-2" />
              Bildirimler
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:bg-slate-700">
              <Eye className="h-4 w-4 mr-2" />
              Gizlilik
            </TabsTrigger>
            <TabsTrigger value="connected" className="data-[state=active]:bg-slate-700">
              <Link2 className="h-4 w-4 mr-2" />
              Bağlı Hesaplar
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Profil Bilgileri</CardTitle>
                <CardDescription className="text-slate-400">
                  Kişisel bilgilerinizi güncelleyin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(handleProfileSave)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Display Name */}
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Görünen Ad</Label>
                      <Input
                        id="displayName"
                        {...profileForm.register('displayName')}
                        className="bg-slate-800 border-slate-700"
                        placeholder="Adınız Soyadınız"
                      />
                      {profileForm.formState.errors.displayName && (
                        <p className="text-red-400 text-sm">{profileForm.formState.errors.displayName.message}</p>
                      )}
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                      <Label htmlFor="username">Kullanıcı Adı (opsiyonel)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">@</span>
                        <Input
                          id="username"
                          {...profileForm.register('username')}
                          className="bg-slate-800 border-slate-700 pl-8"
                          placeholder="kullaniciadi"
                        />
                      </div>
                      {profileForm.formState.errors.username && (
                        <p className="text-red-400 text-sm">{profileForm.formState.errors.username.message}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta Adresi</Label>
                      <Input
                        id="email"
                        type="email"
                        {...profileForm.register('email')}
                        className="bg-slate-800 border-slate-700"
                        placeholder="ornek@email.com"
                      />
                      {profileForm.formState.errors.email && (
                        <p className="text-red-400 text-sm">{profileForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon (opsiyonel)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...profileForm.register('phone')}
                        className="bg-slate-800 border-slate-700"
                        placeholder="+90 5XX XXX XX XX"
                      />
                    </div>

                    {/* Birth Date */}
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Doğum Tarihi</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        {...profileForm.register('birthDate')}
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <Label htmlFor="gender">Cinsiyet</Label>
                      <Select 
                        value={profileForm.watch('gender')} 
                        onValueChange={(value) => profileForm.setValue('gender', value as any)}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700">
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="male">Erkek</SelectItem>
                          <SelectItem value="female">Kadın</SelectItem>
                          <SelectItem value="other">Diğer</SelectItem>
                          <SelectItem value="prefer_not_to_say">Belirtmek istemiyorum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Biyografi (opsiyonel)</Label>
                    <textarea
                      id="bio"
                      {...profileForm.register('bio')}
                      className="w-full bg-slate-800 border border-slate-700 rounded-md p-3 text-white resize-none"
                      rows={3}
                      placeholder="Kendinizi kısaca tanıtın..."
                      maxLength={160}
                    />
                    <p className="text-slate-500 text-xs text-right">
                      {profileForm.watch('bio')?.length || 0}/160
                    </p>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading || !profileForm.formState.isDirty}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {saveStatus === 'saving' ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Kaydediliyor...
                        </>
                      ) : saveStatus === 'saved' ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Kaydedildi
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Kaydet
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            {/* Password Change */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Şifre Değiştir
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Hesap güvenliğiniz için güçlü bir şifre kullanın
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={securityForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        {...securityForm.register('currentPassword')}
                        className="bg-slate-800 border-slate-700 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Yeni Şifre</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        {...securityForm.register('newPassword')}
                        className="bg-slate-800 border-slate-700 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {securityForm.formState.errors.newPassword && (
                      <p className="text-red-400 text-sm">{securityForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...securityForm.register('confirmPassword')}
                      className="bg-slate-800 border-slate-700"
                    />
                    {securityForm.formState.errors.confirmPassword && (
                      <p className="text-red-400 text-sm">{securityForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                    Şifreyi Değiştir
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* PIN Code */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" />
                  PIN Kodu
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Profilinize hızlı erişim için 4 haneli PIN kodu ayarlayın
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      pinEnabled ? "bg-green-500/20" : "bg-slate-800"
                    )}>
                      <KeyRound className={cn("h-5 w-5", pinEnabled ? "text-green-400" : "text-slate-400")} />
                    </div>
                    <div>
                      <p className="font-medium">PIN ile Giriş</p>
                      <p className="text-sm text-slate-400">
                        {pinEnabled ? 'PIN kodunuz aktif' : 'PIN kodu ayarlanmamış'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={pinEnabled}
                    onCheckedChange={(checked) => {
                      if (!checked) setPinEnabled(false);
                    }}
                  />
                </div>

                {!pinEnabled && (
                  <form onSubmit={pinForm.handleSubmit(handlePinSetup)} className="space-y-4 pt-4 border-t border-slate-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pin">PIN Kodu</Label>
                        <Input
                          id="pin"
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          {...pinForm.register('pin')}
                          className="bg-slate-800 border-slate-700 text-center text-2xl tracking-widest"
                          placeholder="••••"
                        />
                        {pinForm.formState.errors.pin && (
                          <p className="text-red-400 text-sm">{pinForm.formState.errors.pin.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPin">PIN Tekrar</Label>
                        <Input
                          id="confirmPin"
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          {...pinForm.register('confirmPin')}
                          className="bg-slate-800 border-slate-700 text-center text-2xl tracking-widest"
                          placeholder="••••"
                        />
                        {pinForm.formState.errors.confirmPin && (
                          <p className="text-red-400 text-sm">{pinForm.formState.errors.confirmPin.message}</p>
                        )}
                      </div>
                    </div>
                    <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                      PIN Kodu Ayarla
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  İki Faktörlü Doğrulama
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Hesabınızı ekstra güvenlik katmanıyla koruyun
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      twoFactorEnabled ? "bg-green-500/20" : "bg-slate-800"
                    )}>
                      <Shield className={cn("h-5 w-5", twoFactorEnabled ? "text-green-400" : "text-slate-400")} />
                    </div>
                    <div>
                      <p className="font-medium">2FA</p>
                      <p className="text-sm text-slate-400">
                        {twoFactorEnabled ? 'Aktif' : 'Devre dışı'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="border-slate-600"
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  >
                    {twoFactorEnabled ? 'Devre Dışı Bırak' : 'Etkinleştir'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Bildirim Tercihleri</CardTitle>
                <CardDescription className="text-slate-400">
                  Hangi bildirimleri almak istediğinizi seçin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'email', label: 'E-posta Bildirimleri', description: 'Önemli güncellemeler ve aktiviteler' },
                  { key: 'push', label: 'Push Bildirimleri', description: 'Anlık bildirimler' },
                  { key: 'sms', label: 'SMS Bildirimleri', description: 'Kritik güvenlik uyarıları' },
                  { key: 'marketing', label: 'Pazarlama', description: 'Kampanya ve fırsatlar' },
                  { key: 'security', label: 'Güvenlik Uyarıları', description: 'Şüpheli aktiviteler' },
                  { key: 'updates', label: 'Ürün Güncellemeleri', description: 'Yeni özellikler ve iyileştirmeler' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-slate-400">{item.description}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Gizlilik Ayarları</CardTitle>
                <CardDescription className="text-slate-400">
                  Profilinizin görünürlüğünü kontrol edin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'profilePublic', label: 'Herkese Açık Profil', description: 'Profiliniz herkes tarafından görülebilir' },
                  { key: 'showActivity', label: 'Aktivite Durumu', description: 'Son aktivitelerinizi göster' },
                  { key: 'showOnlineStatus', label: 'Çevrimiçi Durumu', description: 'Çevrimiçi olduğunuzda göster' },
                  { key: 'allowMessages', label: 'Mesajlara İzin Ver', description: 'Diğer kullanıcılar size mesaj gönderebilir' },
                  { key: 'allowTagging', label: 'Etiketlemeye İzin Ver', description: 'İçeriklerde etiketlenebilirsiniz' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-slate-400">{item.description}</p>
                    </div>
                    <Switch
                      checked={privacy[item.key as keyof typeof privacy]}
                      onCheckedChange={(checked) => setPrivacy({ ...privacy, [item.key]: checked })}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-red-950/30 border-red-900/50">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Tehlikeli Bölge
                </CardTitle>
                <CardDescription className="text-red-400/70">
                  Bu işlemler geri alınamaz
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full border-red-800 text-red-400 hover:bg-red-900/30">
                  Verilerimi İndir
                </Button>
                <Button variant="outline" className="w-full border-red-800 text-red-400 hover:bg-red-900/30">
                  Hesabımı Devre Dışı Bırak
                </Button>
                <Button variant="destructive" className="w-full bg-red-900 hover:bg-red-800">
                  Hesabımı Kalıcı Olarak Sil
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connected Accounts Tab */}
          <TabsContent value="connected" className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Bağlı Hesaplar</CardTitle>
                <CardDescription className="text-slate-400">
                  Diğer platformlarla hesabınızı bağlayın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'google', label: 'Google', icon: '🔵', color: 'text-blue-400' },
                  { key: 'apple', label: 'Apple', icon: '🍎', color: 'text-slate-400' },
                  { key: 'github', label: 'GitHub', icon: '⚫', color: 'text-white' },
                  { key: 'twitter', label: 'Twitter/X', icon: '🐦', color: 'text-sky-400' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className={cn("font-medium", item.color)}>{item.label}</p>
                        <p className="text-sm text-slate-400">
                          {connectedAccounts[item.key as keyof typeof connectedAccounts] 
                            ? 'Bağlı' 
                            : 'Bağlı değil'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "border-slate-600",
                        connectedAccounts[item.key as keyof typeof connectedAccounts] && "border-red-800 text-red-400"
                      )}
                      onClick={() => setConnectedAccounts({
                        ...connectedAccounts,
                        [item.key]: !connectedAccounts[item.key as keyof typeof connectedAccounts]
                      })}
                    >
                      {connectedAccounts[item.key as keyof typeof connectedAccounts] ? (
                        <>
                          <Unlink className="h-4 w-4 mr-1" />
                          Bağlantıyı Kes
                        </>
                      ) : (
                        <>
                          <Link2 className="h-4 w-4 mr-1" />
                          Bağla
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default ProfileSettingsPage;
