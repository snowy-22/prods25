/**
 * Referral Settings Panel
 * 
 * Complete referral management:
 * - My referral code & QR
 * - Referee list
 * - Rewards history
 * - Settings
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Copy, Share2, Download, Users, Gift, Settings, Award } from 'lucide-react';

interface ReferralSettingsPanelProps {
  userId: string;
  className?: string;
}

export function ReferralSettingsPanel({ userId, className }: ReferralSettingsPanelProps) {
  const { toast } = useToast();
  const supabase = createClient();
  
  const [stats, setStats] = useState<any>(null);
  const [referralCode, setReferralCode] = useState<any>(null);
  const [referees, setReferees] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadReferralData();
    }
  }, [userId]);

  const loadReferralData = async () => {
    setIsLoading(true);
    
    try {
      // Load stats
      const statsRes = await fetch('/api/referral/stats');
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
        setReferralCode(data.stats.referralCode);
      }

      // Load referees
      const { data: refereesData } = await supabase
        .from('user_referrals')
        .select(`
          *,
          referee:auth.users!referee_id(id, email, raw_user_meta_data)
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (refereesData) setReferees(refereesData);

      // Load rewards
      const { data: rewardsData } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (rewardsData) setRewards(rewardsData);

      // Load settings
      const { data: settingsData } = await supabase
        .from('referral_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (settingsData) setSettings(settingsData);
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (referralCode?.code) {
      navigator.clipboard.writeText(referralCode.code);
      toast({ title: '📋 Kopyalandı!', description: 'Referans kodun panoya kopyalandı.' });
    }
  };

  const copyReferralLink = () => {
    if (referralCode?.code) {
      const link = `${window.location.origin}/signup?ref=${referralCode.code}`;
      navigator.clipboard.writeText(link);
      toast({ title: '🔗 Link kopyalandı!', description: 'Referans linkin panoya kopyalandı.' });
    }
  };

  const shareReferralCode = async () => {
    if (!referralCode?.code) return;

    const link = `${window.location.origin}/signup?ref=${referralCode.code}`;
    const text = `CanvasFlow'a katıl! Referans kodum: ${referralCode.code}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'CanvasFlow Davetiyesi', text, url: link });
        toast({ title: '✅ Paylaşıldı!' });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      copyReferralLink();
    }
  };

  const downloadQRCode = () => {
    if (referralCode?.qrData) {
      const qrDataObj = JSON.parse(referralCode.qrData);
      toast({ 
        title: '📥 QR İndirme', 
        description: 'QR kod generatörü henüz aktif değil. Yakında eklenecek!' 
      });
    }
  };

  const updateSettings = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('referral_settings')
        .update({ [key]: value })
        .eq('user_id', userId);

      if (error) throw error;

      setSettings({ ...settings, [key]: value });
      toast({ title: '✅ Ayarlar güncellendi' });
    } catch (error) {
      toast({ title: 'Hata', description: 'Ayarlar güncellenemedi', variant: 'destructive' });
    }
  };

  const claimReward = async (rewardId: string) => {
    try {
      const response = await fetch('/api/referral/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId })
      });

      if (response.ok) {
        toast({ title: '🎁 Ödül talep edildi!' });
        loadReferralData();
      } else {
        throw new Error('Claim failed');
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'Ödül talep edilemedi', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className={className}>Yükleniyor...</div>;
  }

  return (
    <div className={className}>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Genel</TabsTrigger>
          <TabsTrigger value="referees">Davetlilerim</TabsTrigger>
          <TabsTrigger value="rewards">Ödüllerim</TabsTrigger>
          <TabsTrigger value="settings">Ayarlar</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Referans Kodum
              </CardTitle>
              <CardDescription>
                Arkadaşlarınla paylaş ve özel ödüller kazan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  value={referralCode?.code || 'YÜKLENİYOR...'}
                  readOnly
                  className="font-mono text-lg font-bold text-center"
                />
                <Button size="icon" variant="outline" onClick={copyReferralCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={copyReferralLink}>
                  <Copy className="mr-2 h-4 w-4" />
                  Link Kopyala
                </Button>
                <Button variant="outline" onClick={shareReferralCode}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Paylaş
                </Button>
              </div>

              {referralCode?.qrData && (
                <div className="border rounded-lg p-4 text-center space-y-3">
                  <div className="w-48 h-48 mx-auto bg-muted rounded flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">QR Kod Buraya Gelecek</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={downloadQRCode}>
                    <Download className="mr-2 h-4 w-4" />
                    QR İndir
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Toplam Davet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalReferrals || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.verifiedReferrals || 0} doğrulanmış
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Toplam Ödül</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalRewards || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.unclaimedRewards || 0} talep edilmemiş
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* REFEREES TAB */}
        <TabsContent value="referees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Davet Ettiğim Kullanıcılar ({referees.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {referees.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Henüz kimseyi davet etmedin. Referans kodunu paylaş!
                </p>
              ) : (
                <div className="space-y-3">
                  {referees.map((ref) => (
                    <div key={ref.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">
                          {ref.referee?.raw_user_meta_data?.username || ref.referee?.email || 'Kullanıcı'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ref.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {ref.referee_verified && (
                          <Badge variant="success">✓ Doğrulandı</Badge>
                        )}
                        {ref.is_friend && (
                          <Badge variant="secondary">👥 Arkadaş</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* REWARDS TAB */}
        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Ödül Geçmişi ({rewards.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rewards.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Henüz ödülün yok. Arkadaşlarını davet et!
                </p>
              ) : (
                <div className="space-y-3">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">
                          {reward.reward_category === 'points' && '💎'}
                          {reward.reward_category === 'achievement' && '🏆'}
                          {reward.reward_category === 'badge' && '🎖️'}
                          {' '}
                          {reward.reward_value.message || 'Ödül'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(reward.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {reward.reward_value.points && (
                          <Badge>+{reward.reward_value.points} XP</Badge>
                        )}
                        {!reward.is_claimed ? (
                          <Button size="sm" onClick={() => claimReward(reward.id)}>
                            Talep Et
                          </Button>
                        ) : (
                          <Badge variant="success">✓ Alındı</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Referans Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Otomatik Arkadaş Ekleme</Label>
                    <p className="text-xs text-muted-foreground">
                      Davet ettiğin kişiler otomatik arkadaş olsun
                    </p>
                  </div>
                  <Switch
                    checked={settings?.auto_friend_referrals ?? true}
                    onCheckedChange={(checked) => updateSettings('auto_friend_referrals', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Otomatik Takip</Label>
                    <p className="text-xs text-muted-foreground">
                      Karşılıklı otomatik takip başlat
                    </p>
                  </div>
                  <Switch
                    checked={settings?.auto_follow_referrals ?? true}
                    onCheckedChange={(checked) => updateSettings('auto_follow_referrals', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Davet Sayısını Göster</Label>
                    <p className="text-xs text-muted-foreground">
                      Profilinde davet sayını göster
                    </p>
                  </div>
                  <Switch
                    checked={settings?.show_referral_count ?? true}
                    onCheckedChange={(checked) => updateSettings('show_referral_count', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Davet Bildirimleri</Label>
                    <p className="text-xs text-muted-foreground">
                      Yeni davet ve ödül bildirimleri al
                    </p>
                  </div>
                  <Switch
                    checked={settings?.notify_on_referral ?? true}
                    onCheckedChange={(checked) => updateSettings('notify_on_referral', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
