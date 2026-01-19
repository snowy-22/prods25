'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, MessageCircle, Phone, Mail } from 'lucide-react';
import SiteFooter from '@/components/site-footer';

const faqCategories = [
	{
		category: 'Genel Sorular',
		questions: [
			{
				q: 'tv25.app nedir?',
				a: 'tv25.app, dijital içeriklerinizi organize etmek, yönetmek ve paylaşmak için tasarlanmış modern bir kanvas uygulamasıdır. Video, görsel, web sitesi ve widget\'larınızı grid veya serbest kanvas düzeninde organize edebilirsiniz.'
			},
			{
				q: 'Ücretsiz deneme var mı?',
				a: 'Evet! tv25.app\'u ücretsiz olarak kullanmaya başlayabilirsiniz. Ücretsiz plan temel özellikleri içerir ve kredi kartı gerektirmez.'
			},
			{
				q: 'Hangi cihazlarda kullanabilirim?',
				a: 'tv25.app web tabanlı bir uygulamadır ve tüm modern tarayıcılarda çalışır. Masaüstü, tablet ve mobil cihazlardan erişebilirsiniz. Ayrıca PWA desteği ile mobil cihazlarınıza uygulama olarak kurabilirsiniz.'
			},
			{
				q: 'Verilerim güvende mi?',
				a: 'Evet, verileriniz end-to-end şifreleme ile korunur. ISO 27001 sertifikalı altyapımız ve KVKK uyumlu politikalarımız ile verileriniz güvendedir.'
			}
		]
	},
	{
		category: 'Hesap & Faturalandırma',
		questions: [
			{
				q: 'Planımı nasıl yükseltebilirim?',
				a: 'Ayarlar > Abonelik bölümünden istediğiniz plana geçiş yapabilirsiniz. Yükseltme anında aktif olur ve fatura dönemine göre orantılı ücretlendirilir.'
			},
			{
				q: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
				a: 'Visa, MasterCard, American Express kredi/banka kartları ve banka havalesi kabul ediyoruz. Kurumsal müşteriler için fatura ile ödeme de mümkündür.'
			},
			{
				q: 'Aboneliğimi nasıl iptal edebilirim?',
				a: 'Ayarlar > Abonelik bölümünden aboneliğinizi istediğiniz zaman iptal edebilirsiniz. İptal sonrası mevcut dönem sonuna kadar hizmet almaya devam edersiniz.'
			},
			{
				q: 'Faturamı nereden görebilirim?',
				a: 'Ayarlar > Faturalandırma bölümünden tüm faturalarınızı görüntüleyebilir ve PDF olarak indirebilirsiniz.'
			}
		]
	},
	{
		category: 'Teknik Sorular',
		questions: [
			{
				q: 'Hangi dosya formatlarını destekliyorsunuz?',
				a: 'Görsel: JPG, PNG, GIF, WebP, SVG. Video: MP4, WebM, YouTube, Vimeo, Twitch. Ses: MP3, WAV, OGG, Spotify, SoundCloud. Döküman: PDF, iframe embed.'
			},
			{
				q: 'Maksimum dosya boyutu nedir?',
				a: 'Ücretsiz plan: 50MB/dosya, Pro plan: 500MB/dosya, Kurumsal: Sınırsız. Video streaming için boyut sınırı yoktur.'
			},
			{
				q: 'API entegrasyonu var mı?',
				a: 'Evet, Pro ve üzeri planlarda REST API erişimi mevcuttur. Webhooks, özel entegrasyonlar ve Zapier/Make.com desteği sunuyoruz.'
			},
			{
				q: 'Offline çalışabilir miyim?',
				a: 'Evet, PWA desteği ile offline modda çalışabilirsiniz. İnternet bağlantısı sağlandığında verileriniz otomatik senkronize edilir.'
			}
		]
	},
	{
		category: 'Güvenlik & Gizlilik',
		questions: [
			{
				q: 'Verilerim nerede saklanıyor?',
				a: 'Verileriniz ISO 27001 sertifikalı veri merkezlerinde, AES-256 şifreleme ile saklanır. Avrupa veri merkezleri GDPR uyumludur.'
			},
			{
				q: 'KVKK\'ya uyumlu musunuz?',
				a: 'Evet, tam KVKK uyumluğuz. Kişisel verilerinizi koruma politikamız ve aydınlatma metnimiz için /kvkk sayfasını ziyaret edin.'
			},
			{
				q: 'İki faktörlü doğrulama var mı?',
				a: 'Evet, hesabınız için 2FA (iki faktörlü doğrulama) etkinleştirebilirsiniz. SMS ve authenticator app destekliyoruz.'
			},
			{
				q: 'Hesabım hack\'lendi, ne yapmalıyım?',
				a: 'Hemen support@tv25.app adresine yazın. Şifrenizi değiştirin ve 2FA\'yı etkinleştirin. Şüpheli aktiviteleri bildirin.'
			}
		]
	}
];

export default function FAQPage() {
	const [openItems, setOpenItems] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState('');

	const toggleItem = (key: string) => {
		setOpenItems(prev => 
			prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
		);
	};

	const filteredCategories = faqCategories.map(cat => ({
		...cat,
		questions: cat.questions.filter(
			q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
			     q.a.toLowerCase().includes(searchQuery.toLowerCase())
		)
	})).filter(cat => cat.questions.length > 0);

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

			<main className="max-w-4xl mx-auto px-4 py-16">
				{/* Hero */}
				<div className="text-center mb-12">
					<h1 className="text-4xl md:text-5xl font-bold mb-4">
						Sıkça Sorulan Sorular
					</h1>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						En çok merak edilen soruların cevaplarını bulun. Aradığınızı bulamazsanız bize ulaşın.
					</p>
				</div>

				{/* Search */}
				<div className="relative mb-12">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
					<input
						type="text"
						placeholder="Soru veya anahtar kelime ara..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-12 pr-4 py-3 bg-card border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
					/>
				</div>

				{/* FAQ Categories */}
				<div className="space-y-8">
					{filteredCategories.map((category, catIdx) => (
						<div key={catIdx}>
							<h2 className="text-xl font-bold mb-4 text-primary">{category.category}</h2>
							<div className="space-y-3">
								{category.questions.map((item, idx) => {
									const key = `${catIdx}-${idx}`;
									const isOpen = openItems.includes(key);
									return (
										<Card 
											key={key}
											className="border-border/50 overflow-hidden"
										>
											<button
												onClick={() => toggleItem(key)}
												className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-accent/50 transition-colors"
											>
												<span className="font-medium pr-4">{item.q}</span>
												{isOpen ? (
													<ChevronUp className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
												) : (
													<ChevronDown className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
												)}
											</button>
											{isOpen && (
												<div className="px-6 pb-4 text-muted-foreground">
													{item.a}
												</div>
											)}
										</Card>
									);
								})}
							</div>
						</div>
					))}
				</div>

				{/* Contact CTA */}
				<Card className="mt-16 p-8 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
					<div className="text-center">
						<h3 className="text-2xl font-bold mb-2">Sorunuz mu var?</h3>
						<p className="text-muted-foreground mb-6">
							Aradığınızı bulamadıysanız destek ekibimiz size yardımcı olmaya hazır.
						</p>
						<div className="flex flex-wrap justify-center gap-4">
							<Button asChild>
								<Link href="/contact">
									<MessageCircle className="w-4 h-4 mr-2" />
									Bize Ulaşın
								</Link>
							</Button>
							<Button asChild variant="outline">
								<a href="mailto:support@tv25.app">
									<Mail className="w-4 h-4 mr-2" />
									support@tv25.app
								</a>
							</Button>
						</div>
					</div>
				</Card>
			</main>

			<SiteFooter />
		</div>
	);
}
