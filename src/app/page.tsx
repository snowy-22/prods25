'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import SiteFooter from '@/components/site-footer';
import { Suspense } from 'react';

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
		cta: 'Üye Ol',
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

type SteelButtonProps = {
	href: string;
	children: React.ReactNode;
	size?: 'md' | 'lg';
	className?: string;
	icon?: React.ReactNode;
};

const SteelButton = ({ href, children, size = 'lg', className, icon }: SteelButtonProps) => {
	const [offset, setOffset] = useState({ x: 0, y: 0 });

	const handleMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
		const rect = event.currentTarget.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width - 0.5) * 14;
		const y = ((event.clientY - rect.top) / rect.height - 0.5) * 14;
		setOffset({ x, y });
	};

	const handleLeave = () => setOffset({ x: 0, y: 0 });

	const padding = size === 'lg' ? 'px-6 py-3 text-lg' : 'px-4 py-2 text-sm';

	return (
		<Link
			href={href}
			className={cn(
				'group relative inline-flex items-center justify-center overflow-hidden rounded-xl border border-white/15 text-white font-semibold tracking-tight shadow-lg transition-all duration-300',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
				padding,
				className
			)}
			onMouseMove={handleMove}
			onMouseLeave={handleLeave}
		>
			<span
				className="absolute inset-0 rounded-xl opacity-95"
				style={{
					backgroundImage:
						'linear-gradient(135deg, #6b7686 0%, #404854 40%, #1a1f27 100%), ' +
						'radial-gradient(circle at 18% 20%, rgba(255,255,255,0.18), transparent 32%), ' +
						'radial-gradient(circle at 82% 30%, rgba(255,255,255,0.12), transparent 38%), ' +
						'radial-gradient(circle at 50% 90%, rgba(0,0,0,0.35), transparent 48%), ' +
						'repeating-linear-gradient(135deg, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 1px, rgba(255,255,255,0.03) 3px, rgba(255,255,255,0.03) 5px)',
					backgroundBlendMode: 'soft-light, screen, screen, normal, overlay',
					transform: `translate(${offset.x}px, ${offset.y}px)`
				}}
			/>
			<span
				className="absolute inset-0 rounded-xl opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-80"
				style={{
					background:
						'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.35), transparent 42%), ' +
						'radial-gradient(circle at 70% 70%, rgba(0,0,0,0.35), transparent 45%)',
					transform: `translate(${offset.x * 0.6}px, ${offset.y * 0.6}px)`
				}}
			/>
			<span
				className="absolute inset-0 rounded-xl transition duration-200"
				style={{ boxShadow: `${offset.x * 0.6}px ${offset.y * 0.6}px 28px rgba(0,0,0,0.45)` }}
			/>
			<span className="relative z-10 flex items-center gap-2 drop-shadow-[0_8px_18px_rgba(0,0,0,0.35)]">
				{children}
				{icon}
			</span>
		</Link>
	);
};

const MainHeader = () => (
	<header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
		<div className="container mx-auto flex h-16 items-center justify-between px-4">
			<Logo />
			<nav className="flex items-center gap-2 sm:gap-4">
				<Link 
					href="/corporate" 
					className="hidden sm:inline-flex font-semibold text-sm text-muted-foreground hover:text-primary transition-colors"
				>
					Kurumlar için
				</Link>
				<Button asChild variant="ghost" size="sm">
					<Link href="/auth?mode=login">Giriş Yap</Link>
				</Button>
				<AnimatedBorderButton asChild variant="primary" size="sm">
					<Link href="/auth?mode=signup">Üye Ol</Link>
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
	'Takım Projeni',
	'Dijital Sanat Galerini',
	'Sihirli Kumandanı',
	'Görsel Programını',
	'Eğlence Dünyanı',
	'Eğitim Materyalini',
	'Marka Sunumunu',
	'Dijital Sanat Galerini',
	'Koleksiyonunu',
	'Müzeni',

	
];

// OAuth code handler component
function OAuthCodeHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      // Redirect to auth callback with the code
      router.replace(`/auth/callback?code=${code}`);
    }
  }, [router, searchParams]);
  
  return null;
}

export default function LandingPage() {
  const [heroWordIndex, setHeroWordIndex] = useState(0);
  const heroWord = heroWords[heroWordIndex];
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
	const { user, loading } = useAuth();
	const isAuthenticated = !!user;

	// Scroll to top on mount
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'instant' });
	}, []);

	// Hero word carousel effect - MUST run unconditionally before any conditional returns
	useEffect(() => {
    const timer = setInterval(() => {
      setHeroWordIndex(prevIndex => (prevIndex + 1) % heroWords.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

	// Auth redirect effect - MUST run unconditionally
	useEffect(() => {
		if (!loading && isAuthenticated && user) {
			console.log('✅ User authenticated, redirecting to canvas...');
			setIsRedirecting(true);
			router.replace('/canvas');
		}
	}, [loading, isAuthenticated, user, router]);
	
	// Show loading screen while auth is loading or redirecting
	if (loading || isRedirecting) {
		return (
			<div className="flex h-screen w-full items-center justify-center bg-background">
				<div className="flex flex-col items-center gap-4">
					<Tv className="h-16 w-16 text-primary animate-pulse" />
					<div className="flex flex-col items-center gap-2">
						<p className="text-lg font-medium">Yükleniyor...</p>
						<p className="text-sm text-muted-foreground">Canvas hazırlanıyor</p>
					</div>
				</div>
			</div>
		);
	}

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
			{/* Handle OAuth code if present in URL */}
			<Suspense fallback={null}>
				<OAuthCodeHandler />
			</Suspense>
			{isHeaderVisible && <MainHeader />}
			<main className="flex-1 flex flex-col items-center justify-center px-2 sm:px-0 w-full">
				<section className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-12 py-12 md:py-24 px-4">
					{/* Left: Hero Text */}
					<div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-6 max-w-2xl">
						<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-headline font-bold leading-tight">
							<span className="block mb-2">Hayalindeki</span>
							<span className={getWordStyle(heroWord)}>{heroWord}</span>
							<span className="block mt-2">tv25.app ile oluştur!</span>
						</h1>
						<p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-md md:max-w-lg">
							Web içeriklerini, videoları, widget'ları ve daha fazlasını tek bir dijital kanvasta organize et. Sürükle-bırak, AI entegrasyonu ve çoklu görünüm modları ile üretkenliğini artır.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center md:justify-start">
							<SteelButton href="/guest-canvas" icon={<ChevronRight className="h-4 w-4" />}>
								Hemen Dene
							</SteelButton>
							<AnimatedBorderButton asChild variant="shimmer" size="lg">
								<Link href="/auth?mode=signup">Hemen Üye Ol!</Link>
							</AnimatedBorderButton>
						</div>
						{/* Scroll indicator with click functionality */}
						<button 
							onClick={() => {
								const demoSection = document.getElementById('demo-section');
								if (demoSection) {
									demoSection.scrollIntoView({ behavior: 'smooth' });
								}
							}}
							className="flex flex-col items-center mt-8 animate-bounce cursor-pointer group hover:opacity-80 transition-opacity"
						>
							<span className="text-sm text-muted-foreground/80 mb-2 font-medium group-hover:text-primary transition-colors">
								Daha fazlası için kaydır veya tıkla
							</span>
							<div className="w-10 h-10 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-all">
								<svg className="w-5 h-5 text-muted-foreground/60 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
								</svg>
							</div>
						</button>
					</div>
					{/* Right: Responsive DVD Animation */}
					<div className="flex-1 flex items-center justify-center w-full md:w-auto max-w-2xl">
						<div className="w-[220px] h-[120px] sm:w-[320px] sm:h-[180px] md:w-[400px] md:h-[220px] lg:w-[480px] lg:h-[260px] xl:w-[560px] xl:h-[300px] max-w-full">
							<BouncingDvd />
						</div>
					</div>
				</section>
				{/* Demo Grid Section */}
				<section id="demo-section" className="w-full max-w-6xl mx-auto py-12 md:py-20 px-4 scroll-mt-16">
					<LandingPageDemoGrid />
				</section>

				{/* Features Section */}
				<section className="w-full bg-gradient-to-b from-background to-accent/5 py-20">
					<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="text-center mb-16">
							<h2 className="text-3xl md:text-4xl font-bold mb-4">Neden tv25.app?</h2>
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
							<SteelButton href="/features" size="md" icon={<ChevronRight className="h-4 w-4" />}>
								Tüm Özellikleri Keşfet
							</SteelButton>
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

								{tier.id === 'enterprise' ? (
									<SteelButton href={tier.ctaLink} size="md" className="w-full justify-center" icon={<ChevronRight className="h-4 w-4" />}>
										{tier.cta}
									</SteelButton>
								) : tier.featured ? (
									<AnimatedBorderButton asChild variant="primary" className="w-full">
										<Link href={tier.ctaLink}>{tier.cta}</Link>
									</AnimatedBorderButton>
								) : (
									<Button asChild className="w-full" variant="outline">
										<Link href={tier.ctaLink}>{tier.cta}</Link>
									</Button>
								)}
							</Card>
						))}
					</div>

					<div className="text-center">
						<p className="text-muted-foreground mb-4">Teknik destek, özel özellikleri veya toplu satın alma hakkında mı?</p>
						<SteelButton href="/corporate" size="md" icon={<ChevronRight className="h-4 w-4" />}>
							Kurumsal Çözümler
						</SteelButton>
					</div>
				</section>

				{/* Corporate Section */}
				<section className="w-full bg-gradient-to-r from-primary/10 via-purple-500/10 to-cyan-500/10 py-20">
					<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="text-center mb-12">
							<h2 className="text-3xl md:text-4xl font-bold mb-4">Kurumsal Çözümler</h2>
							<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
							Büyük takımlar ve kuruluşlar için özelleştirilmiş tv25.app deneyimi
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
								{['Fortune 500', 'Girişim Şirketleri', 'Eğitim Kurumları','Dernekler ve Kamu Kurumları', 'Yayın Şirketleri'].map((type, idx) => (
									<div key={idx} className="flex items-center gap-2">
										<span className="w-2 h-2 bg-primary rounded-full"></span>
										<span className="font-medium">{type}</span>
									</div>
								))}
							</div>

							<SteelButton href="/corporate" icon={<ChevronRight className="h-4 w-4" />}>
								Demo Talep Edin
							</SteelButton>
						</div>
					</div>
				</section>

				{/* Footer */}
				<SiteFooter />
			</main>
		</div>
	);
}
