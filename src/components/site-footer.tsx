import Link from 'next/link';

export default function SiteFooter() {
	return (
		<footer className="border-t border-border/50 mt-20 py-8">
			<div className="max-w-7xl mx-auto px-4">
				<div className="grid md:grid-cols-4 gap-8 mb-8">
					<div>
						<h4 className="font-bold mb-3">Ürün</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li><Link href="/features" className="hover:text-primary">Özellikler</Link></li>
							<li><Link href="/pricing" className="hover:text-primary">Fiyatlandırma</Link></li>
							<li><Link href="/" className="hover:text-primary">Ana Sayfa</Link></li>
						</ul>
					</div>
					<div>
						<h4 className="font-bold mb-3">Kurumsal</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li><Link href="/corporate" className="hover:text-primary">Kurumsal</Link></li>
							<li><Link href="/about" className="hover:text-primary">Hakkımızda</Link></li>
						</ul>
					</div>
					<div>
						<h4 className="font-bold mb-3">Destek</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li><Link href="/faq" className="hover:text-primary">Sıkça Sorulan Sorular</Link></li>
							<li><Link href="/community" className="hover:text-primary">Topluluk Merkezi</Link></li>
							<li><Link href="/support" className="hover:text-primary">Destek</Link></li>
							<li><Link href="/contact" className="hover:text-primary">Bize Ulaşın</Link></li>
						</ul>
					</div>
					<div>
						<h4 className="font-bold mb-3">İletişim</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li><a href="mailto:support@tv25.app" className="hover:text-primary">support@tv25.app</a></li>
							<li><a href="tel:+908501234567" className="hover:text-primary">+90 850 123 4567</a></li>
						</ul>
						<h4 className="font-bold mb-3 mt-6">Yasal</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li><Link href="/privacy" className="hover:text-primary">Gizlilik</Link></li>
							<li><Link href="/kvkk" className="hover:text-primary">KVKK</Link></li>
						</ul>
					</div>
				</div>
				<div className="border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
					<p>© {new Date().getFullYear()} <Link href="/" className="hover:text-primary">tv25.app</Link> - Tüm hakları saklıdır.</p>
				</div>
			</div>
		</footer>
	);
}
