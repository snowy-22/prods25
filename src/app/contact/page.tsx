'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, Building2 } from 'lucide-react';
import SiteFooter from '@/components/site-footer';

export default function ContactPage() {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		subject: '',
		message: ''
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		
		// Simulate form submission
		await new Promise(resolve => setTimeout(resolve, 1500));
		
		setIsSubmitting(false);
		setIsSubmitted(true);
		setFormData({ name: '', email: '', subject: '', message: '' });
	};

	const contactInfo = [
		{
			icon: Mail,
			title: 'E-posta',
			value: 'support@tv25.app',
			link: 'mailto:support@tv25.app',
			description: 'Genel sorular ve destek'
		},
		{
			icon: Phone,
			title: 'Telefon',
			value: '+90 850 123 4567',
			link: 'tel:+908501234567',
			description: 'Pzt-Cuma: 09:00-18:00'
		},
		{
			icon: MapPin,
			title: 'Adres',
			value: 'İstanbul, Türkiye',
			link: '#',
			description: 'Levent, Beşiktaş'
		},
		{
			icon: Clock,
			title: 'Çalışma Saatleri',
			value: '7/24 Online Destek',
			link: '#',
			description: 'Her zaman yanınızdayız'
		}
	];

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
					<h1 className="text-4xl md:text-5xl font-bold mb-4">
						Bize Ulaşın
					</h1>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						Sorularınız, önerileriniz veya işbirliği teklifleriniz için bize ulaşın. 
						En kısa sürede size dönüş yapacağız.
					</p>
				</div>

				<div className="grid lg:grid-cols-2 gap-12">
					{/* Contact Form */}
					<div>
						<Card className="p-8 bg-card/50 border-border/50">
							<h2 className="text-2xl font-bold mb-6">Mesaj Gönderin</h2>
							
							{isSubmitted ? (
								<div className="text-center py-12">
									<div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
										<Send className="w-8 h-8 text-green-400" />
									</div>
									<h3 className="text-xl font-bold mb-2">Mesajınız Gönderildi!</h3>
									<p className="text-muted-foreground mb-4">
										En kısa sürede size dönüş yapacağız.
									</p>
									<Button onClick={() => setIsSubmitted(false)} variant="outline">
										Yeni Mesaj Gönder
									</Button>
								</div>
							) : (
								<form onSubmit={handleSubmit} className="space-y-6">
									<div>
										<label className="block text-sm font-medium mb-2">Adınız Soyadınız</label>
										<input
											type="text"
											required
											value={formData.name}
											onChange={(e) => setFormData({ ...formData, name: e.target.value })}
											className="w-full px-4 py-3 bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
											placeholder="Adınız Soyadınız"
										/>
									</div>
									
									<div>
										<label className="block text-sm font-medium mb-2">E-posta Adresiniz</label>
										<input
											type="email"
											required
											value={formData.email}
											onChange={(e) => setFormData({ ...formData, email: e.target.value })}
											className="w-full px-4 py-3 bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
											placeholder="ornek@email.com"
										/>
									</div>
									
									<div>
										<label className="block text-sm font-medium mb-2">Konu</label>
										<select
											required
											value={formData.subject}
											onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
											className="w-full px-4 py-3 bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
										>
											<option value="">Konu Seçin</option>
											<option value="genel">Genel Soru</option>
											<option value="destek">Teknik Destek</option>
											<option value="fiyatlandirma">Fiyatlandırma</option>
											<option value="kurumsal">Kurumsal Çözümler</option>
											<option value="isbirligi">İşbirliği Teklifi</option>
											<option value="geri-bildirim">Geri Bildirim</option>
											<option value="diger">Diğer</option>
										</select>
									</div>
									
									<div>
										<label className="block text-sm font-medium mb-2">Mesajınız</label>
										<textarea
											required
											rows={5}
											value={formData.message}
											onChange={(e) => setFormData({ ...formData, message: e.target.value })}
											className="w-full px-4 py-3 bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
											placeholder="Mesajınızı buraya yazın..."
										/>
									</div>
									
									<Button type="submit" className="w-full" disabled={isSubmitting}>
										{isSubmitting ? (
											<>
												<span className="animate-spin mr-2">⏳</span>
												Gönderiliyor...
											</>
										) : (
											<>
												<Send className="w-4 h-4 mr-2" />
												Mesaj Gönder
											</>
										)}
									</Button>
								</form>
							)}
						</Card>
					</div>

					{/* Contact Info */}
					<div>
						<h2 className="text-2xl font-bold mb-6">İletişim Bilgileri</h2>
						
						<div className="grid gap-4 mb-8">
							{contactInfo.map((info, idx) => (
								<Card key={idx} className="p-6 bg-card/50 border-border/50 hover:border-primary/50 transition-colors">
									<a href={info.link} className="flex items-start gap-4">
										<div className="p-3 bg-primary/10 rounded-lg">
											<info.icon className="w-6 h-6 text-primary" />
										</div>
										<div>
											<h3 className="font-bold mb-1">{info.title}</h3>
											<p className="text-primary">{info.value}</p>
											<p className="text-sm text-muted-foreground">{info.description}</p>
										</div>
									</a>
								</Card>
							))}
						</div>

						{/* Enterprise CTA */}
						<Card className="p-6 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
							<div className="flex items-start gap-4">
								<div className="p-3 bg-primary/20 rounded-lg">
									<Building2 className="w-6 h-6 text-primary" />
								</div>
								<div>
									<h3 className="font-bold text-lg mb-2">Kurumsal Müşteriler</h3>
									<p className="text-sm text-muted-foreground mb-4">
										Özel fiyatlandırma ve kurumsal çözümler için iletişime geçin.
									</p>
									<Button asChild size="sm">
										<Link href="/corporate">
											Kurumsal Çözümler
										</Link>
									</Button>
								</div>
							</div>
						</Card>

						{/* Live Chat */}
						<Card className="p-6 bg-card/50 border-border/50 mt-4">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-green-500/10 rounded-lg">
									<MessageCircle className="w-6 h-6 text-green-400" />
								</div>
								<div className="flex-1">
									<h3 className="font-bold mb-1">Canlı Destek</h3>
									<p className="text-sm text-muted-foreground">Anlık yardım için sohbet başlatın</p>
								</div>
								<div className="flex items-center gap-2">
									<span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
									<span className="text-sm text-green-400">Çevrimiçi</span>
								</div>
							</div>
						</Card>
					</div>
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}
