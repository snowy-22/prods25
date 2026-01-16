'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AnimatedBorderButton } from '@/components/animated-border-button';

export default function AboutPage() {
	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
				<nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
					<Link href="/" className="font-bold text-lg bg-gradient-to-r from-primary via-purple-500 to-cyan-400 bg-clip-text text-transparent">
						tv25.app
					</Link>
					<Button asChild variant="outline" size="sm">
						<Link href="/auth">Giriş Yap</Link>
					</Button>
				</nav>
			</header>

			<main className="max-w-4xl mx-auto px-4 py-16">
				{/* Hero */}
				<div className="text-center mb-16">
					<h1 className="text-4xl md:text-5xl font-bold mb-6">Hakkımızda</h1>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						Dijital içerik dünyasını yeniden şekillendiriyoruz
					</p>
				</div>

				{/* Content Sections */}
				<div className="space-y-12">
					{/* Mission */}
					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">Misyonumuz</h2>
						<p className="text-muted-foreground leading-relaxed">
							tv25.app, kullanıcıların dijital içeriklerini organize etmelerini, paylaşmalarını ve 
							yönetmelerini kolaylaştırmak için tasarlanmış yenilikçi bir platformdur. Videolar, 
							görüntüler, web siteleri ve widget'ları tek bir merkezi arayüzde bir araya getirerek 
							dijital deneyiminizi dönüştürüyoruz.
						</p>
					</Card>

					{/* Vision */}
					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">Vizyonumuz</h2>
						<p className="text-muted-foreground leading-relaxed">
							Herkesin dijital içeriklerini özgürce organize edebildiği, paylaşabildiği ve 
							yönetebildiği bir dünya yaratmak. Kullanıcı deneyimini ön planda tutarak, yapay zeka 
							destekli özelliklerle içerik yönetimini daha akıllı ve verimli hale getirmek.
						</p>
					</Card>

					{/* Values */}
					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-6">Değerlerimiz</h2>
						<div className="grid md:grid-cols-2 gap-6">
							{[
								{
									title: 'Kullanıcı Odaklılık',
									desc: 'Her kararımızı kullanıcılarımızın ihtiyaçlarını ön planda tutarak alıyoruz.'
								},
								{
									title: 'Yenilikçilik',
									desc: 'Sürekli gelişen teknolojilerle platformumuzu güncel ve çağdaş tutuyoruz.'
								},
								{
									title: 'Güvenlik',
									desc: 'Kullanıcı verilerinin güvenliği ve gizliliği en önemli önceliğimizdir.'
								},
								{
									title: 'Şeffaflık',
									desc: 'Açık ve dürüst iletişim ile güven ilişkisi kuruyoruz.'
								}
							].map((value, idx) => (
								<div key={idx} className="bg-background/50 rounded-lg p-4">
									<h3 className="font-bold mb-2">{value.title}</h3>
									<p className="text-sm text-muted-foreground">{value.desc}</p>
								</div>
							))}
						</div>
					</Card>

					{/* Team */}
					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">Ekibimiz</h2>
						<p className="text-muted-foreground leading-relaxed mb-6">
							tv25.app, dijital medya, yazılım geliştirme ve kullanıcı deneyimi konularında uzman 
							bir ekip tarafından geliştirilmektedir. Türkiye'den dünyaya açılan bir platform olarak, 
							global standartlarda hizmet sunmayı hedefliyoruz.
						</p>
					</Card>

					{/* Contact */}
					<Card className="p-8 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
						<h2 className="text-2xl font-bold mb-4">İletişim</h2>
						<p className="text-muted-foreground mb-4">
							Sorularınız veya önerileriniz için bizimle iletişime geçin:
						</p>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li>Email: <a href="mailto:info@tv25.app" className="text-primary hover:underline">info@tv25.app</a></li>
							<li>Kurumsal: <a href="mailto:enterprise@tv25.app" className="text-primary hover:underline">enterprise@tv25.app</a></li>
							<li>Destek: <a href="mailto:support@tv25.app" className="text-primary hover:underline">support@tv25.app</a></li>
						</ul>
					</Card>
				</div>

				{/* CTA */}
				<div className="mt-16 text-center">
					<AnimatedBorderButton asChild size="lg">
						<Link href="/auth">Aramıza Katılın</Link>
					</AnimatedBorderButton>
				</div>
			</main>

			{/* Footer */}
			<footer className="border-t border-border/50 mt-20 py-8">
				<div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
					<div className="flex flex-wrap justify-center gap-4 mb-4">
						<Link href="/about" className="hover:text-primary">Hakkımızda</Link>
						<Link href="/privacy" className="hover:text-primary">Aydınlatma Metni</Link>
						<Link href="/kvkk" className="hover:text-primary">KVKK</Link>
					</div>
					<p>© {new Date().getFullYear()} tv25.app</p>
				</div>
			</footer>
		</div>
	);
}
