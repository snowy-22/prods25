'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, ButtonProps } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ChevronRight, Grid, Share2, Palette, SlidersHorizontal, Presentation, Cpu, Tv, Building, Container, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LandingPageDemoGrid } from '@/components/landing/LandingPageDemoGrid';
import { BouncingDvd } from '@/components/landing/BouncingDvd';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { QRCodeCanvas } from 'qrcode.react';
import { AnimatedBorderButton } from '@/components/animated-border-button';

const Logo = () => {
	const [pageUrl, setPageUrl] = useState('');
	useEffect(() => {
		setPageUrl(window.location.href);
	}, []);
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Link href="/" className="flex items-center gap-2 rounded-lg p-2 bg-black/30 backdrop-blur-md border border-white/10 group">
						<div className="flex items-center gap-2 relative">
							<div className="relative h-8 w-8">
								<Tv className="absolute inset-0 h-full w-full text-primary" />
								<div className="absolute inset-0 flex items-center justify-center p-1.5 overflow-hidden">
									{pageUrl && <QRCodeCanvas value={pageUrl} size={20} fgColor="hsl(var(--primary))" bgColor="transparent" />}
								</div>
							</div>
							<span className="font-headline text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-cyan-400 bg-clip-text text-transparent">tv25.app</span>
						</div>
					</Link>
				</TooltipTrigger>
				<TooltipContent side="bottom">
					<Card className="w-48 h-48 p-2 bg-white">
						{pageUrl && <QRCodeCanvas value={pageUrl} size={176} fgColor="#000" bgColor="#fff" />}
					</Card>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}


const pricingTiers = [
	{
		id: 'free',
		name: 'Ücretsiz',
		price: 0,
		description: 'Kişisel kullanım için ideal',
		featured: false,
		features: [
			'1 Dinamik Lİste',
			'Temel Izgara Modu',
			'Topluluk Paylaşımı'
		],
		cta: 'Kayıt Ol',
		ctaLink: '/register'
	},
	{
		id: 'plus',
		name: 'Plus',
		price: 49,
		description: 'Profesyoneller ve küçük takımlar için',
		featured: true,
		features: [
			'Sınırsız Liste',
			'Tüm Izgara Modları',
			'Reklamsız Deneyim',
			'Özel Profiller'
		],
		cta: 'Planı Seç',
		ctaLink: '/register'
	},
	{
		id: 'pro',
		name: 'Pro',
		price: 99,
		description: 'Gelişmiş özellikler ve AI desteği',
		featured: false,
		features: [
			'Plus\'taki Her Şey',
			'AI Asistan',
			'3D Model Görüntüleyici',
			'Sunum Araçları'
		],
		cta: 'Planı Seç',
		ctaLink: '/register'
	},
	{
		id: 'enterprise',
		name: 'Kurumsal',
		price: null,
		description: 'Kuruluşlar için özel çözümler',
		featured: false,
		features: [
			'Pro\'daki Her Şey',
			'Özel Entegrasyonlar',
			'Öncelikli Destek',
			'Eğitim & Danışmanlık'
		],
		cta: 'Demo Talep Edin',
		ctaLink: '/corporate'
	}
];


// (removed duplicate import of Button, ButtonProps)
import React from "react";

const SectionSeparator = () => <div className="section-separator" />;

const MainHeader = () => (
	<header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
		<div className="container mx-auto flex h-16 items-center justify-between px-4">
			<Logo />
			<nav className="flex items-center gap-4">
				<AnimatedBorderButton asChild>
					<Link href="/auth">Giriş / Kayıt Ol</Link>
				</AnimatedBorderButton>
			</nav>
		</div>
	</header>
);

const heroWords = [
	'Yayın Akışını',
	'İnternet Deneyimini',
	'İş Akışını',
	'Haber Deneyimini',
	'Sihirli Değneğini',
	'Görsel Programını',
	'Eğlence Dünyanı',
	'Eğitim Materyalini',
	'Marka Sunumunu',
	'Dijital Sanat Galerini',
];

export default function LandingPage() {
  const [heroWordIndex, setHeroWordIndex] = useState(0);
  const heroWord = heroWords[heroWordIndex];
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const router = useRouter();
	const { user } = useAuth();
	const isAuthenticated = !!user;

	useEffect(() => {
		if (isAuthenticated && user) {
			router.replace('/canvas');
		}
	}, [isAuthenticated, user, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroWordIndex(prevIndex => (prevIndex + 1) % heroWords.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const getWordStyle = (word: string) => {
    const baseStyle = 'inline-block px-4 py-1 rounded-md text-white -rotate-2 shadow-lg transition-all duration-300';
    switch (word) {
      case 'İnternet Deneyimini':
        return `${baseStyle} bg-gradient-to-r from-pink-500 to-yellow-500`;
      case 'İş Akışını':
        return `${baseStyle} bg-gradient-to-r from-blue-600 to-green-400`;
      case 'Haber Deneyimini':
        return `${baseStyle} bg-gradient-to-r from-red-600 to-gray-800`;
      case 'Sihirli Değneğini':
        return `${baseStyle} font-headline bg-purple-600 text-yellow-300 shadow-yellow-400/50`;
      case 'Görsel Programını':
        return `${baseStyle} bg-gradient-to-r from-indigo-500 to-teal-400`;
      case 'Eğlence Dünyanı':
        return `${baseStyle} bg-gradient-to-r from-orange-500 to-red-500`;
      case 'Eğitim Materyalini':
        return `${baseStyle} bg-gradient-to-r from-green-500 to-lime-400`;
      case 'Marka Sunumunu':
        return `${baseStyle} bg-gradient-to-r from-gray-700 to-gray-500`;
      case 'Dijital Sanat Galerini':
        return `${baseStyle} bg-gradient-to-r from-fuchsia-600 to-pink-600`;
      default: // Yayın Akışını
        return `${baseStyle} bg-gradient-to-r from-cyan-500 to-blue-500`;
    }
  };

	return (
		<div className="bg-black text-foreground font-body antialiased min-h-screen flex flex-col">
			{isHeaderVisible && <MainHeader />}
			<main className="flex-1 flex flex-col items-center justify-center px-2 sm:px-0 w-full pt-64">
				<section className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-8 py-12 md:py-24">
					{/* Left: Hero Text */}
					<div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-6">
						<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-headline font-bold leading-tight">
							<span className="block mb-2">Hayalindeki</span>
							<span className={getWordStyle(heroWord)}>{heroWord}</span>
							<span className="block mt-2">CanvasFlow ile oluştur!</span>
						</h1>
						<p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-md md:max-w-lg">
							Web içeriklerini, videoları, widget'ları ve daha fazlasını tek bir dijital kanvasta organize et. Sürükle-bırak, AI entegrasyonu ve çoklu görünüm modları ile üretkenliğini artır.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center md:justify-start">
							<AnimatedBorderButton asChild>
								<Link href="/auth">Hemen Başla</Link>
							</AnimatedBorderButton>
							<AnimatedBorderButton asChild className="bg-background/80">
								<Link href="#pricing">Fiyatlandırma</Link>
							</AnimatedBorderButton>
						</div>
					</div>
					{/* Right: Responsive DVD Animation */}
					<div className="flex-1 flex items-center justify-center w-full md:w-auto">
						<div className="w-[220px] h-[120px] sm:w-[320px] sm:h-[180px] md:w-[400px] md:h-[220px] lg:w-[480px] lg:h-[260px] xl:w-[560px] xl:h-[300px] max-w-full">
							<BouncingDvd />
						</div>
					</div>
				</section>
				{/* Demo Grid Section */}
				<section className="w-full max-w-6xl mx-auto py-8 md:py-16 px-2">
					<LandingPageDemoGrid />
				</section>

				{/* Features Section */}
				<section className="w-full bg-gradient-to-b from-background to-accent/5 py-20">
					<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="text-center mb-16">
							<h2 className="text-3xl md:text-4xl font-bold mb-4">Neden CanvasFlow?</h2>
							<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
								Tüm dijital içeriklerinizi organize etmek ve yönetmek için gereken güçlü araçlar
							</p>
						</div>

						<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
							{[
								{
									icon: '🎨',
									title: 'Sınırsız Yaratıcılık',
									desc: 'Grid ve canvas modları ile tamamen özelleştirilebilir düzenleme'
								},
								{
									icon: '⚡',
									title: 'Yapay Zeka Entegrasyonu',
									desc: 'İçeriğinizi analiz edin, öneriler alın ve otomasyonlar oluşturun'
								},
								{
									icon: '📱',
									title: 'Tüm Cihazlarda Çalışır',
									desc: 'Mobil, tablet veya masaüstünde sorunsuz deneyim'
								},
								{
									icon: '🔐',
									title: 'Güvenli & Gizli',
									desc: 'End-to-end şifreleme ve ISO 27001 sertifikası'
								},
								{
									icon: '🚀',
									title: 'Gerçek Zamanlı Senkronizasyon',
									desc: 'Tüm cihazlarınızda anında güncelleme'
								},
								{
									icon: '👥',
									title: 'İşbirliği Araçları',
									desc: 'Takımla çalışın, yorum yapın ve değişiklikleri paylaşın'
								}
							].map((feature, idx) => (
								<div key={idx} className="bg-card/50 border border-border/50 rounded-lg p-6 hover:border-primary/50 transition-all hover:shadow-lg">
									<div className="text-4xl mb-3">{feature.icon}</div>
									<h3 className="text-xl font-bold mb-2">{feature.title}</h3>
									<p className="text-muted-foreground">{feature.desc}</p>
								</div>
							))}
						</div>

						<div className="text-center mt-12">
							<AnimatedBorderButton asChild>
								<Link href="/features">Tüm Özellikleri Keşfet</Link>
							</AnimatedBorderButton>
						</div>
					</div>
				</section>

				{/* Pricing Section */}
				<section id="pricing" className="w-full max-w-6xl mx-auto py-20 px-2">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">Şeffaf Fiyatlandırma</h2>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
							Tüm planlar sınırsız depolama, AI asistanı ve gerçek zamanlı senkronizasyon içerir
						</p>
					</div>

					<div className="grid md:grid-cols-4 gap-6 mb-8">
						{pricingTiers.map((tier) => (
							<Card 
								key={tier.id} 
								className={`flex flex-col justify-between backdrop-blur-sm ${tier.featured ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10 md:scale-105 md:shadow-2xl' : 'bg-card/50'}`}
							>
								<div>
									{tier.featured && <div className="mb-3 text-center"><span className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full">En Popüler</span></div>}
									<h3 className="text-xl font-bold mb-2">{tier.name}</h3>
									<p className="text-3xl font-bold text-primary mb-1">
										{tier.price === null || tier.price === 0 ? 'Ücretsiz' : `$${tier.price}`}
									</p>
									{tier.price !== null && tier.price > 0 && <p className="text-sm text-muted-foreground mb-4">/ay veya yıllık %20 indirim</p>}
									<p className="text-sm text-muted-foreground mb-6">{tier.description}</p>

									<ul className="space-y-2 mb-6">
										{tier.features.map((feature, idx) => (
											<li key={idx} className="text-sm flex items-start">
												<span className="text-primary mr-2">✓</span>
												<span>{feature}</span>
											</li>
										))}
									</ul>
								</div>

								<Button asChild className="w-full" variant={tier.featured ? 'default' : 'outline'}>
									<Link href={tier.ctaLink}>{tier.cta}</Link>
								</Button>
							</Card>
						))}
					</div>

					<div className="text-center">
						<p className="text-muted-foreground mb-4">Teknik destek, özel özellikleri veya toplu satın alma hakkında mı?</p>
						<Button asChild variant="outline" size="lg">
							<Link href="/corporate">Kurumsal Çözümler</Link>
						</Button>
					</div>
				</section>

				{/* Corporate Section */}
				<section className="w-full bg-gradient-to-r from-primary/10 via-purple-500/10 to-cyan-500/10 py-20">
					<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="text-center mb-12">
							<h2 className="text-3xl md:text-4xl font-bold mb-4">Kurumsal Çözümler</h2>
							<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
								Büyük takımlar ve kuruluşlar için özelleştirilmiş CanvasFlow deneyimi
							</p>
						</div>

						<div className="grid md:grid-cols-3 gap-8 mb-12">
							{[
								{ icon: '🏢', title: 'Adanmış Sunucu', desc: 'Kendi özel altyapınız, tam kontrol' },
								{ icon: '👨‍💼', title: '24/7 Destek', desc: 'Ayrılmış destek takımı ve priori yardım' },
								{ icon: '⚙️', title: 'Özelleştirme', desc: 'Markalaştırma, entegrasyonlar, özel özellikler' }
							].map((item, idx) => (
								<div key={idx} className="text-center">
									<div className="text-5xl mb-3">{item.icon}</div>
									<h3 className="font-bold text-lg mb-2">{item.title}</h3>
									<p className="text-muted-foreground">{item.desc}</p>
								</div>
							))}
						</div>

						<div className="bg-card/80 border border-border/50 rounded-lg p-8 text-center">
							<h3 className="text-2xl font-bold mb-4">Kurumsal Müşterilerin Tercih Ettiği</h3>
							<div className="flex flex-wrap justify-center gap-8 mb-8">
								{['Fortune 500', 'Teknoloji Başlangıçları', 'Eğitim Kurumları', 'Yayın Şirketleri'].map((type, idx) => (
									<div key={idx} className="flex items-center gap-2">
										<span className="w-2 h-2 bg-primary rounded-full"></span>
										<span className="font-medium">{type}</span>
									</div>
								))}
							</div>

							<Button asChild size="lg">
								<Link href="/corporate">Demo Talep Edin</Link>
							</Button>
						</div>
					</div>
				</section>

				{/* Footer */}
				<footer className="w-full py-6 text-center text-xs text-muted-foreground">
					© {new Date().getFullYear()} tv25.app | CanvasFlow
				</footer>
			</main>
		</div>
	);
}
