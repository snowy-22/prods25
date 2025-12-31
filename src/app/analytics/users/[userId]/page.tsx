'use client';
import { useParams } from 'next/navigation';
import { usersData } from '../../page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, FileText, BarChart, Activity, User, Mail, MessageSquare, Star, Share2 } from 'lucide-react';
import Link from 'next/link';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const mockActivityLog = [
    { type: 'create_item', detail: 'Yeni bir video öğesi oluşturdu.', time: '2 saat önce' },
    { type: 'rate_item', detail: 'Bir içeriğe 8/10 puan verdi.', time: '3 saat önce' },
    { type: 'login', detail: 'Başarıyla giriş yaptı.', time: '5 saat önce' },
    { type: 'share_item', detail: 'Bir listeyi dışa aktardı.', time: 'dün' },
    { type: 'change_setting', detail: 'Tema ayarlarını değiştirdi.', time: '2 gün önce' },
];

const activityIcons = {
    create_item: FileText,
    rate_item: Star,
    login: User,
    share_item: Share2,
    change_setting: Activity,
};

const activityByDay = [
  { day: 'Pzt', activity: 30 },
  { day: 'Sal', activity: 45 },
  { day: 'Çar', activity: 20 },
  { day: 'Per', activity: 60 },
  { day: 'Cum', activity: 75 },
  { day: 'Cmt', activity: 50 },
  { day: 'Paz', activity: 80 },
];

const contentInteractionData = [
  { name: 'Videolar', value: 40, fill: 'hsl(var(--chart-1))'},
  { name: 'Listeler', value: 25, fill: 'hsl(var(--chart-2))'},
  { name: 'Notlar', value: 15, fill: 'hsl(var(--chart-3))'},
  { name: 'Diğer', value: 20, fill: 'hsl(var(--chart-4))'},
];


export default function UserDetailPage() {
    const params = useParams();
    const { userId } = params;

    const user = usersData.find(u => u.id === userId);

    if (!user) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-muted/40">
                <p>Kullanıcı bulunamadı.</p>
                <Link href="/analytics">
                    <Button variant="link" className="mt-4">Geri Dön</Button>
                </Link>
            </div>
        );
    }
    
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-8 md:gap-8">
                <div className="mb-6">
                    <Link href="/analytics" className='flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground'>
                         <ArrowLeft className="h-4 w-4" /> Kullanıcılar Sayfasına Geri Dön
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Left Column - User Profile */}
                    <div className="md:col-span-1 space-y-6">
                        <Card>
                            <CardHeader className="flex flex-col items-center text-center">
                                <Avatar className="h-24 w-24 mb-4">
                                    <AvatarImage src={`https://avatar.vercel.sh/${user.name}.png`} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <CardTitle>{user.name}</CardTitle>
                                <CardDescription>{user.role}</CardDescription>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                                    <Mail className="h-4 w-4" /> <span>{user.email}</span>
                                </div>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2"><BarChart className="h-5 w-5"/>Önemli Metrikler</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Toplam Oturum</span>
                                    <span className="font-bold">128</span>
                                </div>
                                 <div className="flex justify-between">
                                    <span className="text-muted-foreground">Oluşturulan İçerik</span>
                                    <span className="font-bold">{user.contentCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Toplam Etkileşim</span>
                                    <span className="font-bold">1,245</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Son Giriş</span>
                                    <span className="font-bold">{user.lastLogin}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Analytics */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5" />Aktivite Zaman Çizelgesi</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {mockActivityLog.map((log, index) => {
                                        const Icon = activityIcons[log.type as keyof typeof activityIcons] || Activity;
                                        return (
                                            <div key={index} className="flex items-start gap-3">
                                                <div className="bg-muted p-2 rounded-full mt-1">
                                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm">{log.detail}</p>
                                                    <p className="text-xs text-muted-foreground">{log.time}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                         <div className="grid gap-6 sm:grid-cols-2">
                             <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Haftalık Aktivite</CardTitle>
                                </CardHeader>
                                <CardContent className="h-60">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsBarChart data={activityByDay}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="day" fontSize={12}/>
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="activity" fill="hsl(var(--primary))" name="Etkileşim" />
                                        </RechartsBarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">İçerik Etkileşimi</CardTitle>
                                </CardHeader>
                                <CardContent className="h-60">
                                    <ResponsiveContainer width="100%" height="100%">
                                         <PieChart>
                                            <Pie data={contentInteractionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} label>
                                                {contentInteractionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend iconSize={10} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                         </div>
                    </div>
                </div>
            </main>
        </div>
    );
}