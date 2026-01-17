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
							<li><a href="mailto:enterprise@tv25.app" className="hover:text-primary">Satış</a></li>
							<li><a href="mailto:support@tv25.app" className="hover:text-primary">Destek</a></li>
						</ul>
					</div>
					<div>
						<h4 className="font-bold mb-3">Yasal</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li><Link href="/privacy" className="hover:text-primary">Gizlilik</Link></li>
							<li><Link href="/kvkk" className="hover:text-primary">KVKK</Link></li>
							<li><Link href="/about" className="hover:text-primary">Hakkımızda</Link></li>
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
					<p>© {new Date().getFullYear()} tv25.app</p>
				</div>
			</div>
		</footer>
	);
}
