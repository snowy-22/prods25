'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AnimatedBorderButton } from '@/components/animated-border-button';
import SiteFooter from '@/components/site-footer';

const features = [
	{
		category: 'Düzenleme & Organizasyon',
		items: [
			{
				icon: '🎨',
				title: 'Grid Modu',
				desc: 'İçeriklerinizi düzenli bir ızgara şeklinde organize edin. Duyarlı, otomatik boyutlandırma ile her cihazda mükemmel görünür.'
			},
			{
				icon: '🖼️',
				title: 'Canvas Modu',
				desc: 'Sınırsız bir kanvasta istediğiniz yere içerik yerleştirin. Tam özgürlük ve yaratıcılık ile tasarım yapın.'
			},
			{
				icon: '📁',
				title: 'Hiyerarşik Klasörler',
				desc: 'İçeriğinizi mantıksal gruplar halinde organize edin. İç içe klasörler ve tam arama desteği.'
			},
			{
				icon: '🏷️',
				title: 'Etiketler & Kategoriler',
				desc: 'Gelişmiş etiketleme sistemi ile içeriklerinizi kolayca bulun ve filtreyin.'
			}
		]
	},
	{
		category: 'Yapay Zeka & Otomasyon',
		items: [
			{
				icon: '🤖',
				title: 'AI Asistanı',
				desc: 'Doğal dille yapay zeka asistanı ile etkileşime geçin. İçeriğinizi analiz edin, öneriler alın ve görevleri otomasyonla yapın.'
			},
			{
				icon: '🔍',
				title: 'İçerik Analizi',
				desc: 'AI-destekli analiz ile içeriklerinizin özeti, ana noktaları ve önemli detaylarını otomatik olarak çıkartın.'
			},
			{
				icon: '✨',
				title: 'Akıllı Öneriler',
				desc: 'AI, kullanım deseninize göre yeni özellikleri ve optimize etme önerileri sunmaya devam eder.'
			},
			{
				icon: '🎯',
				title: 'Makro & Otomasyon',
				desc: 'Tekrarlayan görevleri otomatize edin. Makrolar ile verimlilik artırın.'
			}
		]
	},
	{
		category: 'Multimedya Desteği',
		items: [
			{
				icon: '▶️',
				title: 'Video Player',
				desc: 'Kesintisiz video oynatma. YouTube, Vimeo, Twitch ve daha birçok platform desteği.'
			},
			{
				icon: '🎵',
				title: 'Ses Oynatıcı',
				desc: 'Yüksek kaliteli ses oynatma. Spotify, SoundCloud ve yerel dosya desteği.'
			},
			{
				icon: '📸',
				title: 'Galeri & Görüntüler',
				desc: 'Yüksek kaliteli görüntü galerisi. Otomatik sıkıştırma ve optimize etme.'
			},
			{
				icon: '📄',
				title: 'Web İçeriği',
				desc: 'Web sayfalarını doğrudan kanvasınıza embed edin. Tam iframe desteği.'
			}
		]
	},
	{
		category: 'Widget\'ler & Araçlar',
		items: [
			{
				icon: '⏰',
				title: 'Dijital Saat',
				desc: 'Özelleştirilebilir analog ve dijital saatler. Zaman dilimi desteği.'
			},
			{
				icon: '📝',
				title: 'Not Alanı',
				desc: 'Hızlı notlar ve rich text editing. Markdown desteği ve otomatik kaydetme.'
			},
			{
				icon: '✅',
				title: 'Yapılacak Listesi',
				desc: 'İnteraktif yapılacak listesi. Alt görevler, öncelik ve vade tarihleri.'
			},
			{
				icon: '📊',
				title: 'İstatistik & Grafikler',
				desc: 'Özel grafikler ve veri görselleştirmesi. Gerçek zamanlı güncellemeler.'
			}
		]
	},
	{
		category: 'İşbirliği & Paylaşım',
		items: [
			{
				icon: '👥',
				title: 'Takım İşbirliği',
				desc: 'Ekip üyeleriyle gerçek zamanlı işbirliği yapın. Yorum, etiket ve @mention desteği.'
			},
			{
				icon: '🔗',
				title: 'Paylaşım Bağlantıları',
				desc: 'Güvenli paylaşım bağlantıları oluşturun. İzinleri tam kontrol edin.'
			},
			{
				icon: '💬',
				title: 'Mesajlaşma',
				desc: 'Doğrudan mesajlaşma ve grup sohbetleri. Dosya paylaşımı ve görüntülü arama desteği.'
			},
			{
				icon: '📢',
				title: 'Sosyal Paylaşım',
				desc: 'Sosyal medyaya doğrudan paylaş. Planlı gönderiler ve analitikler.'
			}
		]
	},
	{
		category: 'Senkronizasyon & Depolama',
		items: [
			{
				icon: '☁️',
				title: 'Bulut Senkronizasyonu',
				desc: 'Tüm cihazlarınızda otomatik senkronizasyon. Çevrimdışı modu da destekliyoruz.'
			},
			{
				icon: '📦',
				title: 'Sınırsız Depolama',
				desc: 'Premium planlarda sınırsız dosya depolaması. Hızlı CDN ile dağıtım.'
			},
			{
				icon: '⏮️',
				title: 'Sürüm Geçmişi',
				desc: 'Tüm değişikliklerin geçmişini saklayın. Kolayca önceki sürümlere dönün.'
			},
			{
				icon: '🔐',
				title: 'Şifreleme & Güvenlik',
				desc: 'End-to-end şifreleme. ISO 27001 sertifikası ve GDPR uyumluluk.'
			}
		]
	}
];

export default function FeaturesPage() {
	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
				<nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
					<Link href="/" className="font-bold text-lg hover:text-primary transition-colors bg-gradient-to-r from-primary via-purple-500 to-cyan-400 bg-clip-text text-transparent">
						tv25.app
					</Link>
					<Button asChild variant="outline" size="sm">
						<Link href="/auth">Giriş Yap</Link>
					</Button>
				</nav>
			</header>

			<main className="max-w-7xl mx-auto px-4 py-16">
				{/* Hero */}
				<div className="text-center mb-20">
					<h1 className="text-4xl md:text-5xl font-bold mb-6">
						tv25.app Tüm Özellikler
					</h1>
					<p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
						Dijital içeriğinizi organize etmek, paylaşmak ve yönetmek için ihtiyacınız olan tüm araçlar.
						Her özellik, üretkenliğinizi ve yaratıcılığınızı arttırmak için tasarlanmıştır.
					</p>
				</div>

				{/* Features by Category */}
				{features.map((category, catIdx) => (
					<div key={catIdx} className="mb-16">
						<h2 className="text-3xl font-bold mb-8 text-center">{category.category}</h2>
						<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
							{category.items.map((feature, idx) => (
								<Card 
									key={idx} 
									className="bg-card/50 border-border/50 hover:border-primary/50 hover:shadow-lg transition-all p-6"
								>
									<div className="text-4xl mb-3">{feature.icon}</div>
									<h3 className="font-bold text-lg mb-2">{feature.title}</h3>
									<p className="text-sm text-muted-foreground">{feature.desc}</p>
								</Card>
							))}
						</div>
					</div>
				))}

				{/* CTA Section */}
				<div className="mt-20 text-center bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg p-12">
					<h2 className="text-3xl font-bold mb-4">Şimdi Başlamaya Hazır Mısınız?</h2>
					<p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
						Tüm bu özelliklere ücretsiz olarak erişin. Kredi kartı gerektirmez.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<AnimatedBorderButton asChild size="lg">
							<Link href="/auth">Ücretsiz Hesap Oluştur</Link>
						</AnimatedBorderButton>
						<Button asChild variant="outline" size="lg">
							<Link href="/">Ana Sayfaya Dön</Link>
						</Button>
					</div>
				</div>
			</main>

			{/* Footer */}
			<SiteFooter />
		</div>
	);
}
