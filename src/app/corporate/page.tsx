'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AnimatedBorderButton } from '@/components/animated-border-button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function CorporatePage() {
	const [formData, setFormData] = useState({
		company: '',
		name: '',
		email: '',
		phone: '',
		employees: '',
		message: ''
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// In a real application, this would send data to your backend
		console.log('Form submitted:', formData);
		alert('Talebiniz alındı! Kısa sürede sizinle iletişime geçeceğiz.');
		setFormData({ company: '', name: '', email: '', phone: '', employees: '', message: '' });
	};

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
				<div className="text-center mb-20">
					<h1 className="text-4xl md:text-5xl font-bold mb-6">
						Kurumsal Çözümler
					</h1>
					<p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
						Fortune 500'den startuplara kadar binlerce kuruluş CanvasFlow'u güveniyor.
						Sınırsız ölçeklenebilirlik, güvenlik ve destek.
					</p>
				</div>

				{/* Key Benefits */}
				<div className="grid md:grid-cols-3 gap-8 mb-20">
					{[
						{
							icon: '🏢',
							title: 'Adanmış Altyapı',
							desc: 'Kendi özel sunucu seçeneği. Tam kontrol, maksimum güvenlik ve performans.'
						},
						{
							icon: '👨‍💼',
							title: 'Adanmış Destek',
							desc: '24/7 telefon, email ve sohbet desteği. Ayrılmış hesap yöneticisi ve teknik ekip.'
						},
						{
							icon: '🔐',
							title: 'İleri Güvenlik',
							desc: 'SOC 2 Type II, ISO 27001 sertifikası. End-to-end şifreleme ve gelişmiş audit logs.'
						},
						{
							icon: '⚙️',
							title: 'Özelleştirme',
							desc: 'Tamamen özelleştirilebilir arayüz, entegrasyonlar ve iş akışları.'
						},
						{
							icon: '📊',
							title: 'Advanced Analytics',
							desc: 'Detaylı kullanım analitikleri, aktivite raporları ve performans metrikleri.'
						},
						{
							icon: '🚀',
							title: 'Sınırsız Ölçekleme',
							desc: 'Büyüdüğünüzde sınırlama yok. Sınırsız kullanıcı, veri ve API çağrıları.'
						}
					].map((benefit, idx) => (
						<Card key={idx} className="bg-card/50 p-6 border-border/50">
							<div className="text-4xl mb-3">{benefit.icon}</div>
							<h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
							<p className="text-muted-foreground">{benefit.desc}</p>
						</Card>
					))}
				</div>

				{/* Customer Success Stories */}
				<div className="mb-20">
					<h2 className="text-3xl font-bold text-center mb-12">Müşteri Başarı Hikayeleri</h2>
					<div className="grid md:grid-cols-3 gap-8">
						{[
							{
								company: 'TechCorp Global',
								industry: 'Yazılım & Teknoloji',
								quote: 'CanvasFlow, 5000+ çalışanımızın işbirliğini tamamen dönüştürdü. Verimlilikte %40 artış sağladık.',
								contact: 'CEO - John Smith'
							},
							{
								company: 'EduHub International',
								industry: 'Eğitim',
								quote: '30+ ülkedeki eğitim kurumları ile CanvasFlow kullanıyoruz. Öğrenme deneyimi harika.',
								contact: 'Operasyon Direktörü - Sarah Johnson'
							},
							{
								company: 'Creative Studios Inc.',
								industry: 'Medya & Yayıncılık',
								quote: 'Proje yönetimi ve içerik organizasyonu artık çok kolay. Ekibimiz daha yaratıcı olabiliyor.',
								contact: 'Yönetim Kurulu Başkanı - Mike Davis'
							}
						].map((story, idx) => (
							<Card key={idx} className="bg-gradient-to-br from-primary/5 to-purple-500/5 p-8 border-border/50">
								<div className="mb-4">
									<p className="text-sm text-primary font-semibold">{story.company}</p>
									<p className="text-xs text-muted-foreground">{story.industry}</p>
								</div>
								<blockquote className="italic text-muted-foreground mb-4">
									"{story.quote}"
								</blockquote>
								<p className="text-sm font-medium">{story.contact}</p>
							</Card>
						))}
					</div>
				</div>

				{/* Integration & API */}
				<div className="bg-card/30 border border-border/50 rounded-lg p-12 mb-20">
					<h2 className="text-2xl font-bold mb-4">Entegrasyon & API</h2>
					<p className="text-muted-foreground mb-8 max-w-2xl">
						CanvasFlow, mevcut araçlarınız ile sorunsuz entegrasyon sağlar. REST API, Webhooks ve özel entegrasyon seçenekleri.
					</p>
					<div className="grid md:grid-cols-4 gap-4 mb-8">
						{['Slack', 'Microsoft Teams', 'Salesforce', 'HubSpot', 'Zapier', 'Make.com', 'Jira', 'Asana'].map((tool, idx) => (
							<div key={idx} className="bg-background/50 rounded p-3 text-center text-sm font-medium">
								{tool}
							</div>
						))}
					</div>
					<Button asChild variant="outline">
						<Link href="mailto:enterprise@tv25.app">API Dokümantasyonunu Göster</Link>
					</Button>
				</div>

				{/* Pricing Comparison */}
				<div className="mb-20">
					<h2 className="text-3xl font-bold text-center mb-12">Kurumsal Paketler</h2>
					<div className="grid md:grid-cols-3 gap-6">
						{[
							{
								tier: 'Kuruluş (100-500 kişi)',
								price: 'Özel',
								features: ['Adanmış sunucu', '24/7 desteği', 'Gelişmiş entegrasyonlar', 'SSO & SAML', 'Audit logs']
							},
							{
								tier: 'Kurumsal (500+ kişi)',
								price: 'Özel',
								features: ['Özel altyapı seçeneği', 'Ayrılmış teknisyen', 'Tüm entegrasyon', 'SLA garantisi', 'White-label desteği'],
								featured: true
							},
							{
								tier: 'Hükümet & Kamu',
								price: 'Özel',
								features: ['Uyum sertifikasyonları', 'Gizlilik uyumu', 'Güvenlik denetimi', 'Özel sunucu', 'Seçilmiş destek']
							}
						].map((pkg, idx) => (
							<Card 
								key={idx} 
								className={`p-8 ${pkg.featured ? 'border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5' : 'bg-card/50 border-border/50'}`}
							>
								<h3 className="text-xl font-bold mb-2">{pkg.tier}</h3>
								<p className="text-3xl font-bold text-primary mb-6">{pkg.price}</p>
								<ul className="space-y-3">
									{pkg.features.map((feature, i) => (
										<li key={i} className="flex items-start gap-2">
											<span className="text-primary mt-0.5">✓</span>
											<span className="text-sm">{feature}</span>
										</li>
									))}
								</ul>
							</Card>
						))}
					</div>
				</div>

				{/* Contact Form */}
				<div className="max-w-2xl mx-auto bg-card/30 border border-border/50 rounded-lg p-8">
					<h2 className="text-2xl font-bold mb-2 text-center">Demo Talep Edin</h2>
					<p className="text-center text-muted-foreground mb-8">
						Satış ekibimiz 24 saat içinde sizinle iletişime geçecek
					</p>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium mb-2">Şirket Adı</label>
								<Input
									placeholder="Şirketinizin adı"
									value={formData.company}
									onChange={(e) => setFormData({...formData, company: e.target.value})}
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Ad Soyad</label>
								<Input
									placeholder="Adınız ve soyadınız"
									value={formData.name}
									onChange={(e) => setFormData({...formData, name: e.target.value})}
									required
								/>
							</div>
						</div>

						<div className="grid md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium mb-2">Email</label>
								<Input
									type="email"
									placeholder="İş emailiniz"
									value={formData.email}
									onChange={(e) => setFormData({...formData, email: e.target.value})}
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Telefon</label>
								<Input
									placeholder="+90 (555) 123 4567"
									value={formData.phone}
									onChange={(e) => setFormData({...formData, phone: e.target.value})}
									required
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium mb-2">Çalışan Sayısı</label>
							<select
								value={formData.employees}
								onChange={(e) => setFormData({...formData, employees: e.target.value})}
								className="w-full px-3 py-2 bg-background border border-border/50 rounded-md text-sm"
								required
							>
								<option value="">Seçiniz...</option>
								<option value="100-500">100-500 çalışan</option>
								<option value="500-1000">500-1000 çalışan</option>
								<option value="1000+">1000+ çalışan</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium mb-2">Mesaj (Opsiyonel)</label>
							<textarea
								placeholder="Sizin için nasıl yardımcı olabileceğimiz hakkında anlatın..."
								rows={4}
								value={formData.message}
								onChange={(e) => setFormData({...formData, message: e.target.value})}
								className="w-full px-3 py-2 bg-background border border-border/50 rounded-md text-sm"
							/>
						</div>

						<Button type="submit" className="w-full">
							Demo Talep Edin
						</Button>
					</form>

					<p className="text-xs text-muted-foreground text-center mt-4">
						Gizliliğiniz önemlidir. Bilgileriniz hiçbir zaman üçüncü taraflara paylaşılmaz.
					</p>
				</div>
			</main>

			{/* Footer */}
			<footer className="border-t border-border/50 mt-20 py-8">
				<div className="max-w-7xl mx-auto px-4">
					<div className="grid md:grid-cols-4 gap-8 mb-8">
						<div>
							<h4 className="font-bold mb-3">Ürün</h4>
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li><Link href="/features" className="hover:text-primary">Özellikler</Link></li>
								<li><Link href="/pricing" className="hover:text-primary">Fiyatlandırma</Link></li>
								<li><Link href="/">Ana Sayfa</Link></li>
							</ul>
						</div>
						<div>
							<h4 className="font-bold mb-3">Kurumsal</h4>
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li><a href="mailto:enterprise@tv25.app" className="hover:text-primary">Satış</a></li>
								<li><a href="mailto:support@tv25.app" className="hover:text-primary">Destek</a></li>
								<li><a href="#" className="hover:text-primary">Güvenlik</a></li>
							</ul>
						</div>
						<div>
							<h4 className="font-bold mb-3">Yasal</h4>
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li><a href="#" className="hover:text-primary">Gizlilik</a></li>
								<li><a href="#" className="hover:text-primary">Hizmet Şartları</a></li>
								<li><a href="#" className="hover:text-primary">İşleme Sözleşmesi</a></li>
							</ul>
						</div>
						<div>
							<h4 className="font-bold mb-3">İletişim</h4>
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li>Email: <a href="mailto:enterprise@tv25.app" className="hover:text-primary">enterprise@tv25.app</a></li>
								<li>Telefon: <a href="tel:+905551234567" className="hover:text-primary">+90 555 123 45 67</a></li>
							</ul>
						</div>
					</div>
					<div className="border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
						<div className="flex flex-wrap justify-center gap-4 mb-4">
							<Link href="/about" className="hover:text-primary">Hakkımızda</Link>
							<Link href="/privacy" className="hover:text-primary">Aydınlatma Metni</Link>
							<Link href="/kvkk" className="hover:text-primary">KVKK</Link>
						</div>
						<p>© {new Date().getFullYear()} tv25.app Kurumsal</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
