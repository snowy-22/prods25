'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, MessageCircle, BookOpen, Video, Github, Twitter, Linkedin, Globe, ArrowRight } from 'lucide-react';
import SiteFooter from '@/components/site-footer';

const communityResources = [
	{
		icon: MessageCircle,
		title: 'Topluluk Forumu',
		description: 'Diğer kullanıcılarla bağlantı kurun, sorularınızı sorun ve deneyimlerinizi paylaşın.',
		link: '#',
		cta: 'Foruma Katıl'
	},
	{
		icon: BookOpen,
		title: 'Bilgi Bankası',
		description: 'Detaylı kullanım kılavuzları, ipuçları ve en iyi uygulamalar.',
		link: '/faq',
		cta: 'Keşfet'
	},
	{
		icon: Video,
		title: 'Video Eğitimler',
		description: 'Adım adım video eğitimler ile tv25.app\'u ustaca kullanın.',
		link: '#',
		cta: 'İzle'
	},
	{
		icon: Github,
		title: 'Açık Kaynak',
		description: 'Widget\'lar, entegrasyonlar ve topluluk projelerine katkıda bulunun.',
		link: '#',
		cta: 'GitHub\'da Gör'
	}
];

const socialLinks = [
	{ icon: Twitter, name: 'Twitter', handle: '@tv25app', link: '#' },
	{ icon: Linkedin, name: 'LinkedIn', handle: 'tv25.app', link: '#' },
	{ icon: Github, name: 'GitHub', handle: 'tv25app', link: '#' },
];

const upcomingEvents = [
	{
		date: '25 Ocak 2026',
		title: 'tv25.app Webinar: Verimlilik İpuçları',
		description: 'Uzmanlarımızdan verimlilik artırıcı ipuçları ve canlı demo.',
		type: 'webinar'
	},
	{
		date: '1 Şubat 2026',
		title: 'Topluluk Buluşması - İstanbul',
		description: 'tv25.app kullanıcıları ile yüz yüze buluşma ve networking.',
		type: 'meetup'
	},
	{
		date: '15 Şubat 2026',
		title: 'API Entegrasyon Workshop',
		description: 'Geliştiriciler için API kullanımı ve entegrasyon atölyesi.',
		type: 'workshop'
	}
];

export default function CommunityPage() {
	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
				<nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
					<Link href="/" className="font-bold text-lg hover:text-primary transition-colors">
						tv25.app
					</Link>
					<Button asChild variant="outline" size="sm">
						<Link href="/auth">Giriş Yap</Link>
					</Button>
				</nav>
			</header>

			<main className="max-w-7xl mx-auto px-4 py-16">
				{/* Hero */}
				<div className="text-center mb-16">
					<div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
						<Users className="w-4 h-4" />
						<span className="text-sm font-medium">10.000+ Aktif Üye</span>
					</div>
					<h1 className="text-4xl md:text-5xl font-bold mb-4">
						Topluluk Merkezi
					</h1>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						tv25.app topluluğuna katılın, diğer kullanıcılarla bağlantı kurun ve birlikte büyüyün.
					</p>
				</div>

				{/* Community Resources */}
				<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
					{communityResources.map((resource, idx) => (
						<Card key={idx} className="p-6 bg-card/50 border-border/50 hover:border-primary/50 transition-colors">
							<resource.icon className="w-10 h-10 text-primary mb-4" />
							<h3 className="font-bold text-lg mb-2">{resource.title}</h3>
							<p className="text-sm text-muted-foreground mb-4">{resource.description}</p>
							<Link 
								href={resource.link}
								className="inline-flex items-center text-sm text-primary hover:underline"
							>
								{resource.cta}
								<ArrowRight className="w-4 h-4 ml-1" />
							</Link>
						</Card>
					))}
				</div>

				{/* Upcoming Events */}
				<div className="mb-16">
					<h2 className="text-2xl font-bold mb-8 text-center">Yaklaşan Etkinlikler</h2>
					<div className="grid md:grid-cols-3 gap-6">
						{upcomingEvents.map((event, idx) => (
							<Card key={idx} className="p-6 bg-card/50 border-border/50">
								<div className="flex items-center gap-2 mb-3">
									<span className={`px-2 py-1 rounded text-xs font-medium ${
										event.type === 'webinar' ? 'bg-blue-500/20 text-blue-400' :
										event.type === 'meetup' ? 'bg-green-500/20 text-green-400' :
										'bg-purple-500/20 text-purple-400'
									}`}>
										{event.type === 'webinar' ? 'Webinar' : 
										 event.type === 'meetup' ? 'Buluşma' : 'Workshop'}
									</span>
									<span className="text-sm text-muted-foreground">{event.date}</span>
								</div>
								<h3 className="font-bold mb-2">{event.title}</h3>
								<p className="text-sm text-muted-foreground">{event.description}</p>
							</Card>
						))}
					</div>
				</div>

				{/* Social Links */}
				<div className="bg-card/30 border border-border/50 rounded-lg p-8 mb-16">
					<h2 className="text-xl font-bold mb-6 text-center">Bizi Takip Edin</h2>
					<div className="flex flex-wrap justify-center gap-6">
						{socialLinks.map((social, idx) => (
							<a 
								key={idx}
								href={social.link}
								className="flex items-center gap-3 px-6 py-3 bg-background/50 rounded-lg hover:bg-background transition-colors"
							>
								<social.icon className="w-5 h-5" />
								<div>
									<p className="font-medium text-sm">{social.name}</p>
									<p className="text-xs text-muted-foreground">{social.handle}</p>
								</div>
							</a>
						))}
					</div>
				</div>

				{/* Contribute CTA */}
				<Card className="p-8 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20 text-center">
					<Globe className="w-12 h-12 text-primary mx-auto mb-4" />
					<h3 className="text-2xl font-bold mb-2">Katkıda Bulunun</h3>
					<p className="text-muted-foreground mb-6 max-w-lg mx-auto">
						tv25.app açık kaynak projelerine katkıda bulunarak topluluğumuzu büyütün. 
						Widget geliştirin, çeviri yapın veya dökümantasyon yazın.
					</p>
					<div className="flex flex-wrap justify-center gap-4">
						<Button asChild>
							<a href="#">
								<Github className="w-4 h-4 mr-2" />
								GitHub Repo
							</a>
						</Button>
						<Button asChild variant="outline">
							<Link href="/contact">Bize Ulaşın</Link>
						</Button>
					</div>
				</Card>
			</main>

			<SiteFooter />
		</div>
	);
}
