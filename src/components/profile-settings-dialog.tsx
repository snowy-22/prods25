'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store';
import { profileService } from '@/lib/profile-service';
import { UserProfile, Gender, SocialLinks, ReferralStats } from '@/lib/profile-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Globe,
  Link as LinkIcon,
  Share2,
  Copy,
  Check,
  Gift,
  Users,
  TrendingUp,
  Settings,
  Eye,
  EyeOff,
  Loader2,
  BadgeCheck,
  Twitter,
  Instagram,
  Youtube,
  Github,
  Linkedin,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Form validation schema
const profileFormSchema = z.object({
  username: z.string()
    .min(3, 'Kullanıcı adı en az 3 karakter olmalı')
    .max(30, 'Kullanıcı adı en fazla 30 karakter olabilir')
    .regex(/^[a-z0-9_]+$/, 'Sadece küçük harf, rakam ve alt çizgi kullanılabilir'),
  full_name: z.string().max(100, 'İsim en fazla 100 karakter olabilir').optional().or(z.literal('')),
  bio: z.string().max(500, 'Biyografi en fazla 500 karakter olabilir').optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  location: z.string().max(100).optional().or(z.literal('')),
  website: z.string().url('Geçerli bir URL girin').optional().or(z.literal('')),
  is_public: z.boolean(),
  social_twitter: z.string().optional().or(z.literal('')),
  social_instagram: z.string().optional().or(z.literal('')),
  social_youtube: z.string().optional().or(z.literal('')),
  social_github: z.string().optional().or(z.literal('')),
  social_linkedin: z.string().optional().or(z.literal('')),
  social_discord: z.string().optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSettingsDialog({ open, onOpenChange }: ProfileSettingsDialogProps) {
  const { toast } = useToast();
  const { user, username } = useAppStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: '',
      full_name: '',
      bio: '',
      gender: '',
      birth_date: '',
      phone: '',
      location: '',
      website: '',
      is_public: true,
      social_twitter: '',
      social_instagram: '',
      social_youtube: '',
      social_github: '',
      social_linkedin: '',
      social_discord: '',
    },
  });

  // Load profile data
  useEffect(() => {
    if (open && user) {
      loadProfile();
      loadReferralStats();
    }
  }, [open, user]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const profileData = await profileService.getCurrentProfile();
      if (profileData) {
        setProfile(profileData);
        
        // Form'u doldur
        form.reset({
          username: profileData.username || '',
          full_name: profileData.full_name || '',
          bio: profileData.bio || '',
          gender: profileData.gender || '',
          birth_date: profileData.birth_date || '',
          phone: profileData.phone || '',
          location: profileData.location || '',
          website: profileData.website || '',
          is_public: profileData.is_public ?? true,
          social_twitter: profileData.social_links?.twitter || '',
          social_instagram: profileData.social_links?.instagram || '',
          social_youtube: profileData.social_links?.youtube || '',
          social_github: profileData.social_links?.github || '',
          social_linkedin: profileData.social_links?.linkedin || '',
          social_discord: profileData.social_links?.discord || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast({
        title: 'Hata',
        description: 'Profil yüklenemedi.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadReferralStats = async () => {
    try {
      const stats = await profileService.getReferralStats();
      setReferralStats(stats);
    } catch (error) {
      console.error('Failed to load referral stats:', error);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      const socialLinks: SocialLinks = {
        twitter: data.social_twitter || undefined,
        instagram: data.social_instagram || undefined,
        youtube: data.social_youtube || undefined,
        github: data.social_github || undefined,
        linkedin: data.social_linkedin || undefined,
        discord: data.social_discord || undefined,
      };

      const result = await profileService.updateProfile({
        username: data.username,
        full_name: data.full_name || undefined,
        bio: data.bio || undefined,
        gender: data.gender as Gender || undefined,
        birth_date: data.birth_date || undefined,
        phone: data.phone || undefined,
        location: data.location || undefined,
        website: data.website || undefined,
        is_public: data.is_public,
        social_links: socialLinks,
      });

      if (result.success) {
        toast({
          title: 'Başarılı',
          description: 'Profil güncellendi.',
        });
        await loadProfile();
      } else {
        toast({
          title: 'Hata',
          description: result.error || 'Profil güncellenemedi.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        title: 'Hata',
        description: 'Profil kaydedilemedi.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyReferralLink = async () => {
    if (referralStats?.share_url) {
      await navigator.clipboard.writeText(referralStats.share_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Kopyalandı!',
        description: 'Davet linki panoya kopyalandı.',
      });
    }
  };

  const copyProfileLink = async () => {
    const profileUrl = profileService.getProfileUrl(profile?.username || username || '');
    await navigator.clipboard.writeText(profileUrl);
    toast({
      title: 'Kopyalandı!',
      description: 'Profil linki panoya kopyalandı.',
    });
  };

  const genderOptions = [
    { value: 'male', label: 'Erkek' },
    { value: 'female', label: 'Kadın' },
    { value: 'non-binary', label: 'Non-binary' },
    { value: 'prefer_not_to_say', label: 'Belirtmek istemiyorum' },
    { value: 'other', label: 'Diğer' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Profil Ayarları
          </DialogTitle>
          <DialogDescription>
            Profilinizi düzenleyin ve davet kodunuzu paylaşın.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profil
              </TabsTrigger>
              <TabsTrigger value="referral" className="gap-2">
                <Gift className="h-4 w-4" />
                Davet Kodu
              </TabsTrigger>
              <TabsTrigger value="social" className="gap-2">
                <LinkIcon className="h-4 w-4" />
                Sosyal Bağlantılar
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[60vh] px-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="py-4">
                  
                  {/* PROFILE TAB */}
                  <TabsContent value="profile" className="mt-0 space-y-6">
                    {/* Avatar & Username Preview */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-20 w-20">
                            <AvatarImage src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username || 'U'}`} />
                            <AvatarFallback className="text-2xl">
                              {profile?.username?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold">{profile?.full_name || profile?.username || 'Kullanıcı'}</h3>
                              {profile?.verified && (
                                <BadgeCheck className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <p className="text-muted-foreground">@{profile?.username || 'username'}</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2 gap-2"
                              onClick={copyProfileLink}
                            >
                              <Copy className="h-3 w-3" />
                              Profil Linkini Kopyala
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Basic Info */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kullanıcı Adı *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                                <Input {...field} className="pl-8" placeholder="username" />
                              </div>
                            </FormControl>
                            <FormDescription>
                              tv25.app/{field.value || 'username'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ad Soyad</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Adınız Soyadınız" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Biyografi</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Kendinizi tanıtın..."
                              rows={3}
                              className="resize-none"
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value?.length || 0}/500 karakter
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Personal Details */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cinsiyet</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seçiniz" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {genderOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="birth_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Doğum Tarihi</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Konum</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} className="pl-10" placeholder="İstanbul, Türkiye" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Web Sitesi</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} className="pl-10" placeholder="https://example.com" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Privacy */}
                    <Card>
                      <CardContent className="pt-6">
                        <FormField
                          control={form.control}
                          name="is_public"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <FormLabel className="flex items-center gap-2">
                                  {field.value ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                  Herkese Açık Profil
                                </FormLabel>
                                <FormDescription>
                                  Profilinizi herkes görebilir ve {profile?.username || 'username'}.tv25.app adresinden erişebilir.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* REFERRAL TAB */}
                  <TabsContent value="referral" className="mt-0 space-y-6">
                    {/* Referral Stats */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Gift className="h-5 w-5" />
                          Davet İstatistikleri
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="p-4 bg-muted rounded-lg">
                            <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                            <p className="text-2xl font-bold">{referralStats?.total_referrals || 0}</p>
                            <p className="text-xs text-muted-foreground">Toplam Davet</p>
                          </div>
                          <div className="p-4 bg-muted rounded-lg">
                            <Check className="h-6 w-6 mx-auto mb-2 text-green-500" />
                            <p className="text-2xl font-bold">{referralStats?.completed_referrals || 0}</p>
                            <p className="text-xs text-muted-foreground">Tamamlanan</p>
                          </div>
                          <div className="p-4 bg-muted rounded-lg">
                            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                            <p className="text-2xl font-bold">{referralStats?.total_rewards_earned || 0}</p>
                            <p className="text-xs text-muted-foreground">Kazanılan Gün</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Referral Code */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Davet Kodunuz</CardTitle>
                        <CardDescription>
                          Bu kodu veya linki arkadaşlarınızla paylaşın. Her kayıt olan arkadaşınız için 7 gün premium kazanın!
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1">Davet Kodu</p>
                            <p className="text-2xl font-mono font-bold">
                              {referralStats?.referral_code || profile?.username || 'LOADING'}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText(referralStats?.referral_code || '');
                              toast({ title: 'Kopyalandı!' });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <p className="text-sm font-medium">Davet Linki</p>
                          <div className="flex gap-2">
                            <Input
                              readOnly
                              value={referralStats?.share_url || ''}
                              className="font-mono text-sm"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={copyReferralLink}
                              className="shrink-0 gap-2"
                            >
                              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              {copied ? 'Kopyalandı' : 'Kopyala'}
                            </Button>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={() => {
                              const url = encodeURIComponent(referralStats?.share_url || '');
                              const text = encodeURIComponent('TV25.app ile içeriklerini organize et! Davet kodum: ' + referralStats?.referral_code);
                              window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
                            }}
                          >
                            <Twitter className="h-4 w-4" />
                            Twitter'da Paylaş
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={() => {
                              const url = encodeURIComponent(referralStats?.share_url || '');
                              const text = encodeURIComponent('TV25.app ile içeriklerini organize et!');
                              window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
                            }}
                          >
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp'ta Paylaş
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* SOCIAL LINKS TAB */}
                  <TabsContent value="social" className="mt-0 space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Sosyal Medya Bağlantıları</CardTitle>
                        <CardDescription>
                          Profilinizde görünecek sosyal medya hesaplarınızı ekleyin.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="social_twitter"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Twitter className="h-4 w-4" />
                                Twitter / X
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="@username" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="social_instagram"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Instagram className="h-4 w-4" />
                                Instagram
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="@username" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="social_youtube"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Youtube className="h-4 w-4" />
                                YouTube
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="@channel veya URL" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="social_github"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Github className="h-4 w-4" />
                                GitHub
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="username" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="social_linkedin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Linkedin className="h-4 w-4" />
                                LinkedIn
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Profil URL'si" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="social_discord"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" />
                                Discord
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="username#0000" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Save Button */}
                  <div className="flex justify-end gap-2 pt-4 pb-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      İptal
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Kaydet
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default ProfileSettingsDialog;
