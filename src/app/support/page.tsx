'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HelpCircle, BookOpen, MessageCircle, Mail, Phone, Clock, Search, ExternalLink, ChevronRight } from 'lucide-react';
import SiteFooter from '@/components/site-footer';

const supportCategories = [
	{
		icon: BookOpen,
		title: 'Bilgi Bankası',
		description: 'Kullanım kılavuzları ve detaylı dökümanlar',
		link: '/faq',
		color: 'text-blue-400'
	},
	{
		icon: MessageCircle,
		title: 'Canlı Destek',
		description: 'Uzmanlarımızla anlık sohbet',
		link: '#',
		color: 'text-green-400',
		badge: 'Çevrimiçi'
	},
	{
		icon: Mail,
		title: 'E-posta Desteği',
		description: 'support@tv25.app',
		link: 'mailto:support@tv25.app',
		color: 'text-purple-400'
	},
	{
		icon: Phone,
		title: 'Telefon Desteği',
		description: '+90 850 123 4567',
		link: 'tel:+908501234567',
		color: 'text-orange-400',
		badge: 'Kurumsal'
	}
];

const popularArticles = [
	{ title: 'Üye olma ve giriş yapma', link: '/faq' },
	{ title: 'İlk kanvasınızı oluşturma', link: '/faq' },
	{ title: 'Video ve medya ekleme', link: '/faq' },
	{ title: 'Paylaşım ve işbirliği', link: '/faq' },
	{ title: 'Abonelik ve faturalandırma', link: '/faq' },
	{ title: 'API entegrasyonu başlangıç', link: '/faq' },
];

const supportTiers = [
	{
		tier: 'Ücretsiz',
		features: ['Bilgi bankası erişimi', 'Topluluk forumu', 'E-posta desteği (48 saat)'],
		color: 'border-border/50'
	},
	{
		tier: 'Pro',
		features: ['Tüm ücretsiz özellikler', 'Canlı sohbet desteği', 'E-posta desteği (24 saat)', 'Öncelikli destek kuyruğu'],
		color: 'border-primary/50',
		popular: true
	},
	{
		tier: 'Kurumsal',
		features: ['Tüm Pro özellikler', '7/24 telefon desteği', 'Özel hesap yöneticisi', 'SLA garantisi', 'Özel eğitim seansları'],
		color: 'border-purple-500/50'
	}
];

export default function SupportPage() {
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
					<div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-full mb-6">
						<Clock className="w-4 h-4" />
						<span className="text-sm font-medium">Ortalama Yanıt Süresi: 4 saat</span>
					</div>
					<h1 className="text-4xl md:text-5xl font-bold mb-4">
						Destek Merkezi
					</h1>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						Size yardımcı olmak için buradayız. Sorularınızı yanıtlıyor, sorunlarınızı çözüyoruz.
					</p>
				</div>

				{/* Quick Search */}
				<div className="max-w-2xl mx-auto mb-16">
					<div className="relative">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
						<input
							type="text"
							placeholder="Sorununuzu veya sorunuzu arayın..."
							className="w-full pl-12 pr-4 py-4 bg-card border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg"
						/>
					</div>
				</div>

				{/* Support Categories */}
				<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
					{supportCategories.map((category, idx) => (
						<Link key={idx} href={category.link}>
							<Card className="p-6 bg-card/50 border-border/50 hover:border-primary/50 transition-colors h-full">
								<div className="flex items-start justify-between mb-4">
									<category.icon className={`w-10 h-10 ${category.color}`} />
									{category.badge && (
										<span className={`px-2 py-1 rounded text-xs font-medium ${
											category.badge === 'Çevrimiçi' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'
										}`}>
											{category.badge}
										</span>
									)}
								</div>
								<h3 className="font-bold text-lg mb-2">{category.title}</h3>
								<p className="text-sm text-muted-foreground">{category.description}</p>
							</Card>
						</Link>
					))}
				</div>

				{/* Popular Articles */}
				<div className="mb-16">
					<h2 className="text-2xl font-bold mb-8 text-center">Popüler Yardım Makaleleri</h2>
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
						{popularArticles.map((article, idx) => (
							<Link 
								key={idx} 
								href={article.link}
								className="flex items-center justify-between p-4 bg-card/50 border border-border/50 rounded-lg hover:border-primary/50 transition-colors"
							>
								<span className="text-sm">{article.title}</span>
								<ChevronRight className="w-4 h-4 text-muted-foreground" />
							</Link>
						))}
					</div>
				</div>

				{/* Support Tiers */}
				<div className="mb-16">
					<h2 className="text-2xl font-bold mb-8 text-center">Destek Seviyeleri</h2>
					<div className="grid md:grid-cols-3 gap-6">
						{supportTiers.map((tier, idx) => (
							<Card key={idx} className={`p-6 bg-card/50 ${tier.color} relative`}>
								{tier.popular && (
									<span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
										En Popüler
									</span>
								)}
								<h3 className="font-bold text-xl mb-4">{tier.tier}</h3>
								<ul className="space-y-3">
									{tier.features.map((feature, fIdx) => (
										<li key={fIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
											<svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
											</svg>
											{feature}
										</li>
									))}
								</ul>
							</Card>
						))}
					</div>
				</div>

				{/* Contact CTA */}
				<Card className="p-8 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20 text-center">
					<HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
					<h3 className="text-2xl font-bold mb-2">Hala Yardıma mı İhtiyacınız Var?</h3>
					<p className="text-muted-foreground mb-6 max-w-lg mx-auto">
						Destek ekibimiz 7/24 yanınızda. Bize ulaşın, en kısa sürede yardımcı olalım.
					</p>
					<div className="flex flex-wrap justify-center gap-4">
						<Button asChild>
							<Link href="/contact">Bize Ulaşın</Link>
						</Button>
						<Button asChild variant="outline">
							<a href="mailto:support@tv25.app">
								<Mail className="w-4 h-4 mr-2" />
								support@tv25.app
							</a>
						</Button>
					</div>
				</Card>
			</main>

			<SiteFooter />
		</div>
	);
}
