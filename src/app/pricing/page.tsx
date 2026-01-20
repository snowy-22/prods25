'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AnimatedBorderButton } from '@/components/animated-border-button';
import { CheckCircle, XCircle } from 'lucide-react';
import SiteFooter from '@/components/site-footer';

const pricingTiers = [
	{
		id: 'free',
		name: 'Başlangıç',
		price: 0,
		description: 'Kişisel kullanım için ideal',
		featured: false,
		features: [
			'5 GB depolama',
			'Temel widget\'ler',
			'Grid ve Canvas mod',
			'Topluluk desteği',
			'İçerik senkronizasyonu'
		],
		notIncluded: [
			'AI asistanı',
			'Sınırsız depolama',
			'Takım işbirliği',
			'Özel destek',
			'Özel özellikler'
		],
		cta: 'Hemen Başla',
		ctaLink: '/auth'
	},
	{
		id: 'plus',
		name: 'Plus',
		price: 9.99,
		description: 'Profesyoneller için',
		featured: true,
		features: [
			'100 GB depolama',
			'Tüm widget\'ler',
			'Grid ve Canvas mod',
			'AI asistanı',
			'Email desteği',
			'Gelişmiş analitikler'
		],
		notIncluded: [
			'Sınırsız depolama',
			'Takım işbirliği (5+ kişi)',
			'Telefon desteği',
			'Özel sunucu'
		],
		cta: 'Plus\'a Başla',
		ctaLink: '/auth'
	},
	{
		id: 'pro',
		name: 'Pro',
		price: 29.99,
		description: 'Kuruluşlar için',
		featured: false,
		features: [
			'Sınırsız depolama',
			'Tüm widget\'ler',
			'İleri AI özellikleri',
			'Takım işbirliği (10 kişi)',
			'Öncelikli email + telefon desteği',
			'Gelişmiş analitikler',
			'API erişimi',
			'Özel integrasyonlar'
		],
		notIncluded: [
			'Özel sunucu',
			'Adanmış hesap yöneticisi',
			'SLA garantileri'
		],
		cta: 'Pro\'ya Başla',
		ctaLink: '/auth'
	},
	{
		id: 'corporate',
		name: 'Kurumsal',
		price: 'Özel',
		description: 'Büyük kuruluşlar',
		featured: false,
		features: [
			'Sınırsız her şey',
			'Özel sunucu seçeneği',
			'Sınırsız takım üyesi',
			'24/7 telefon + email + sohbet desteği',
			'Adanmış hesap yöneticisi',
			'SLA garantileri (%99,99 uptime)',
			'Özel entegrasyonlar',
			'Özelleştirme ve white-label desteği'
		],
		notIncluded: [],
		cta: 'Demo Talep Edin',
		ctaLink: '/corporate'
	}
];

export default function PricingPage() {
	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
				<nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
					<Link href="/" className="font-bold text-lg hover:text-primary transition-colors">
						CanvasFlow
					</Link>
					<Button asChild variant="outline" size="sm">
						<Link href="/auth">Giriş Yap</Link>
					</Button>
				</nav>
			</header>

			<main className="max-w-7xl mx-auto px-4 py-16">
				{/* Hero */}
				<div className="text-center mb-16">
					<h1 className="text-4xl md:text-5xl font-bold mb-6">
						Şeffaf Fiyatlandırma
					</h1>
					<p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
						Her bütçe için bir plan var. Yıllık ödeme ile %20 tasarruf edin.
					</p>
				</div>

				{/* Pricing Cards */}
				<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
					{pricingTiers.map((tier) => (
						<Card 
							key={tier.id} 
							className={`flex flex-col justify-between backdrop-blur-sm overflow-hidden transition-all ${
								tier.featured 
									? 'border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5 lg:scale-105 lg:shadow-2xl' 
									: 'bg-card/50 border-border/50'
							}`}
						>
							<div className="p-6 flex flex-col h-full">
								{tier.featured && (
									<div className="mb-3 text-center">
										<span className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full font-medium">
											En Popüler
										</span>
									</div>
								)}

								<h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
								<p className="text-muted-foreground text-sm mb-4">{tier.description}</p>

								<div className="mb-6">
									{typeof tier.price === 'number' ? (
										<>
											<div className="text-4xl font-bold text-primary">${tier.price}</div>
											<p className="text-xs text-muted-foreground mt-1">/ay veya yıllık %20 indirim</p>
										</>
									) : (
										<div className="text-4xl font-bold text-primary">{tier.price}</div>
									)}
								</div>

								<div className="flex-1 mb-6">
									<div className="mb-4">
										<h4 className="font-semibold text-sm mb-3">Dahil Olan Özellikler</h4>
										<ul className="space-y-2">
											{tier.features.map((feature, idx) => (
												<li key={idx} className="flex items-start gap-2 text-sm">
													<CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
													<span>{feature}</span>
												</li>
											))}
										</ul>
									</div>

									{tier.notIncluded.length > 0 && (
										<div>
											<h4 className="font-semibold text-sm mb-3 text-muted-foreground">Dahil Olmayan</h4>
											<ul className="space-y-2">
												{tier.notIncluded.map((feature, idx) => (
													<li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
														<XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
														<span>{feature}</span>
													</li>
												))}
											</ul>
										</div>
									)}
								</div>

								<Button 
									asChild 
									className="w-full" 
									variant={tier.featured ? 'default' : 'outline'}
								>
									<Link href={tier.ctaLink}>{tier.cta}</Link>
								</Button>
							</div>
						</Card>
					))}
				</div>

				{/* Comparison Table */}
				<div className="bg-card/30 border border-border/50 rounded-lg p-8 mb-16">
					<h2 className="text-2xl font-bold mb-8">Ayrıntılı Karşılaştırma</h2>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border/50">
									<th className="text-left py-3 px-4 font-semibold">Özellik</th>
									<th className="text-center py-3 px-4">Başlangıç</th>
									<th className="text-center py-3 px-4">Plus</th>
									<th className="text-center py-3 px-4">Pro</th>
									<th className="text-center py-3 px-4">Kurumsal</th>
								</tr>
							</thead>
							<tbody>
								{[
									{ feature: 'Depolama', free: '5 GB', plus: '100 GB', pro: 'Sınırsız', corporate: 'Sınırsız' },
									{ feature: 'AI Asistanı', free: '❌', plus: '✅', pro: '✅ (İleri)', corporate: '✅ (İleri)' },
									{ feature: 'Takım İşbirliği', free: '❌', plus: '2 kişi', pro: '10 kişi', corporate: 'Sınırsız' },
									{ feature: 'Destek', free: 'Topluluk', plus: 'Email', pro: 'Email + Telefon', corporate: '24/7 Profesyonel' },
									{ feature: 'API Erişimi', free: '❌', plus: '❌', pro: '✅', corporate: '✅' },
									{ feature: 'Özel Entegrasyonlar', free: '❌', plus: '❌', pro: 'Sınırlı', corporate: '✅' },
									{ feature: 'White Label', free: '❌', plus: '❌', pro: '❌', corporate: '✅' },
									{ feature: 'SLA Garantisi', free: '❌', plus: '❌', pro: '❌', corporate: '✅' }
								].map((row, idx) => (
									<tr key={idx} className="border-b border-border/30 hover:bg-primary/5 transition-colors">
										<td className="py-3 px-4 font-medium">{row.feature}</td>
										<td className="py-3 px-4 text-center">{row.free}</td>
										<td className="py-3 px-4 text-center">{row.plus}</td>
										<td className="py-3 px-4 text-center">{row.pro}</td>
										<td className="py-3 px-4 text-center">{row.corporate}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* FAQ */}
				<div className="mb-16">
					<h2 className="text-2xl font-bold mb-8 text-center">Sık Sorulan Sorular</h2>
					<div className="grid md:grid-cols-2 gap-6">
						{[
							{
								q: 'Planı istediğim zaman değiştirebilir miyim?',
								a: 'Evet! Planı istediğiniz zaman yükseltebilir veya düşürebilirsiniz. Değişiklikler hemen etkili olur.'
							},
							{
								q: 'İptal etme ücreti var mı?',
								a: 'Hayır! Hiçbir iptal ücreti yoktur. Dilediğiniz zaman aboneliğinizi iptal edebilirsiniz.'
							},
							{
								q: 'Kuruluşlar için indirim var mı?',
								a: 'Evet! Toplu satın alma ve uzun vadeli abonelikler için özel fiyatlandırma sunuyoruz. Satış ekibimizle iletişime geçin.'
							},
							{
								q: 'Ücretsiz deneme süresi var mı?',
								a: 'Evet! Plus ve Pro planlarını 14 gün boyunca ücretsiz olarak deneyebilirsiniz. Kredi kartı gerektirmez.'
							}
						].map((item, idx) => (
							<Card key={idx} className="bg-card/50 p-6">
								<h3 className="font-bold mb-3">{item.q}</h3>
								<p className="text-muted-foreground text-sm">{item.a}</p>
							</Card>
						))}
					</div>
				</div>

				{/* CTA */}
				<div className="text-center bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg p-12">
					<h2 className="text-3xl font-bold mb-4">Başlamaya Hazır Mısınız?</h2>
					<p className="text-lg text-muted-foreground mb-6">
						Ücretsiz planla başlayın. İstediğiniz zaman yükseltebilirsiniz.
					</p>
					<AnimatedBorderButton asChild size="lg">
						<Link href="/auth">Kayıt Ol</Link>
					</AnimatedBorderButton>
				</div>
			</main>

			{/* Footer */}
			<SiteFooter />
		</div>
	);
}
