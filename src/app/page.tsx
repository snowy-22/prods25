'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLogo } from '@/components/icons/app-logo';
import { Button, ButtonProps } from '@/components/ui/button';
import { AuthDialog } from '@/components/auth-dialog';
import { useToast } from '@/hooks/use-toast';
import { User } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useAppStore } from '@/lib/store';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ChevronRight, Grid, Share2, Palette, SlidersHorizontal, Presentation, Cpu, Tv, Building, Container } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LandingPageDemoGrid } from '@/components/landing/LandingPageDemoGrid';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { BouncingDvd } from '@/components/landing/BouncingDvd';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { QRCodeCanvas } from 'qrcode.react';

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
		name: 'Ücretsiz',
		price: '₺0',
		features: [
			'1 Dinamik Lİste',
			'Temel Izgara Modu',
			'Topluluk Paylaşımı'
		],
		cta: 'Kayıt Ol',
		ctaLink: '/register'
	},
	{
		name: 'Plus',
		price: '₺49/ay',
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
		name: 'Pro',
		price: '₺99/ay',
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
		name: 'Kurumsal',
		price: 'Bize Ulaşın',
		features: [
			'Pro\'daki Her Şey',
			'Özel Entegrasyonlar',
			'Öncelikli Destek',
			'Eğitim & Danışmanlık'
		],
		cta: 'Demo Talep Edin',
		ctaLink: '/kurumlar'
	}
]

// (removed duplicate import of Button, ButtonProps)
import React from "react";
type AnimatedBorderButtonProps = ButtonProps & { children: React.ReactNode };
const AnimatedBorderButton: React.FC<AnimatedBorderButtonProps> = ({ children, className, ...props }) => (
	<div className="relative inline-block p-[2px] rounded-md bg-gradient-to-r from-primary via-purple-500 to-cyan-400 animate-gradient-pan bg-[length:200%_auto]">
		<Button className={cn("w-full", className)} {...props}>
			{children}
		</Button>
	</div>
);

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
  const businessImage = PlaceHolderImages.find(p => p.id === 'business-wide');
  const [heroWordIndex, setHeroWordIndex] = useState(0);
  const heroWord = heroWords[heroWordIndex];
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const router = useRouter();
	const { user } = useAuth();
	const isAuthenticated = !!user;

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace('/sca');
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

	// Local state for AuthDialog props
	const [authAction, setAuthAction] = useState<'login' | 'signup' | null>('login');
	const [authData, setAuthData] = useState<{ email: string; isRegistered?: boolean } | null>(null);
	const handleAuthSuccess = (username: string) => {
		// Optionally show a toast or redirect, but since user will be authenticated, redirect will happen via useEffect
	};

	if (!isAuthenticated) {
		return (
			<div className="bg-black text-foreground font-body antialiased min-h-screen flex flex-col items-center justify-center">
				<MainHeader />
				<div className="w-full max-w-md mx-auto mt-12">
					<AuthDialog
						action={authAction}
						authData={authData}
						setAction={setAuthAction}
						onAuthSuccess={handleAuthSuccess}
					/>
				</div>
			</div>
		);
	}

  return (
    <div className="bg-black text-foreground font-body antialiased">
      {isHeaderVisible && <MainHeader />}
      <main className="snap-y snap-mandatory h-screen w-screen overflow-y-auto overflow-x-hidden">
        {/* ...existing code... */}
      </main>
    </div>
  );
}
