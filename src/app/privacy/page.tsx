'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import SiteFooter from '@/components/site-footer';

export default function PrivacyPolicyPage() {
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
					<h1 className="text-4xl md:text-5xl font-bold mb-6">Aydınlatma Metni</h1>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni
					</p>
					<p className="text-sm text-muted-foreground mt-4">
						Son güncelleme: {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
					</p>
				</div>

				{/* Content */}
				<div className="space-y-8">
					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">1. Veri Sorumlusu</h2>
						<p className="text-muted-foreground leading-relaxed">
							6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca, kişisel verileriniz; veri 
							sorumlusu sıfatıyla tv25.app platformu tarafından aşağıda açıklanan kapsamda işlenebilecektir.
						</p>
					</Card>

					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">2. İşlenen Kişisel Veriler</h2>
						<p className="text-muted-foreground leading-relaxed mb-4">
							Platformumuz tarafından işlenen kişisel veriler şunlardır:
						</p>
						<ul className="list-disc list-inside space-y-2 text-muted-foreground">
							<li><strong>Kimlik Bilgileri:</strong> Ad, soyad, kullanıcı adı</li>
							<li><strong>İletişim Bilgileri:</strong> E-posta adresi</li>
							<li><strong>Hesap Bilgileri:</strong> Şifre (şifrelenmiş halde), hesap oluşturma tarihi</li>
							<li><strong>Kullanım Verileri:</strong> Platform kullanım alışkanlıkları, tercihler</li>
							<li><strong>Teknik Veriler:</strong> IP adresi, tarayıcı türü, cihaz bilgileri</li>
							<li><strong>İçerik Verileri:</strong> Yüklenen medya dosyaları, oluşturulan canvas düzenleri</li>
						</ul>
					</Card>

					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">3. Kişisel Verilerin İşlenme Amaçları</h2>
						<p className="text-muted-foreground leading-relaxed mb-4">
							Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
						</p>
						<ul className="list-disc list-inside space-y-2 text-muted-foreground">
							<li>Platform hizmetlerinin sunulması ve iyileştirilmesi</li>
							<li>Kullanıcı hesaplarının oluşturulması ve yönetilmesi</li>
							<li>Kullanıcı deneyiminin kişiselleştirilmesi</li>
							<li>Teknik destek sağlanması</li>
							<li>Güvenlik önlemlerinin alınması ve dolandırıcılığın önlenmesi</li>
							<li>Yasal yükümlülüklerin yerine getirilmesi</li>
							<li>İletişim ve bilgilendirme faaliyetlerinin yürütülmesi</li>
							<li>İstatistiksel analizler yapılması</li>
						</ul>
					</Card>

					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">4. Kişisel Verilerin Aktarılması</h2>
						<p className="text-muted-foreground leading-relaxed mb-4">
							Kişisel verileriniz, aşağıdaki koşullarda üçüncü taraflarla paylaşılabilir:
						</p>
						<ul className="list-disc list-inside space-y-2 text-muted-foreground">
							<li><strong>Hizmet Sağlayıcılar:</strong> Hosting, veritabanı yönetimi ve analitik hizmetleri sunan tedarikçiler</li>
							<li><strong>Yasal Zorunluluklar:</strong> Yetkili kamu kurum ve kuruluşlarına yasal gereklilikler doğrultusunda</li>
							<li><strong>Ödeme İşlemleri:</strong> Ödeme hizmeti sağlayıcıları (Stripe vb.)</li>
							<li><strong>Güvenlik:</strong> Dolandırıcılık önleme ve güvenlik amacıyla ilgili kuruluşlara</li>
						</ul>
					</Card>

					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">5. Kişisel Verilerin Toplanma Yöntemleri</h2>
						<p className="text-muted-foreground leading-relaxed mb-4">
							Kişisel verileriniz aşağıdaki yöntemlerle toplanmaktadır:
						</p>
						<ul className="list-disc list-inside space-y-2 text-muted-foreground">
							<li>Kayıt ve giriş formları aracılığıyla</li>
							<li>Platform kullanımı sırasında otomatik olarak</li>
							<li>Çerezler ve benzeri teknolojiler aracılığıyla</li>
							<li>Sosyal medya girişi (Google, GitHub vb.) aracılığıyla</li>
							<li>Destek talepleri ve iletişim formları aracılığıyla</li>
						</ul>
					</Card>

					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">6. Kişisel Verilerin Saklanma Süresi</h2>
						<p className="text-muted-foreground leading-relaxed">
							Kişisel verileriniz, işlenme amaçlarının gerektirdiği süre boyunca saklanmaktadır. 
							Hesabınızı silmeniz halinde, verileriniz yasal saklama yükümlülükleri saklı kalmak 
							kaydıyla 30 gün içinde sistemlerimizden silinir. Bazı veriler, yasal yükümlülükler 
							gereği daha uzun süre saklanabilir.
						</p>
					</Card>

					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">7. Veri Güvenliği</h2>
						<p className="text-muted-foreground leading-relaxed">
							Kişisel verilerinizin güvenliğini sağlamak için endüstri standardı güvenlik önlemleri 
							kullanılmaktadır. Bu önlemler arasında SSL/TLS şifreleme, güvenli veri depolama, 
							erişim kontrolü ve düzenli güvenlik denetimleri yer almaktadır. Şifreleriniz 
							tek yönlü hash algoritmaları ile şifrelenerek saklanmaktadır.
						</p>
					</Card>

					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">8. Çerezler</h2>
						<p className="text-muted-foreground leading-relaxed mb-4">
							Platformumuz, kullanıcı deneyimini iyileştirmek amacıyla çerezler kullanmaktadır:
						</p>
						<ul className="list-disc list-inside space-y-2 text-muted-foreground">
							<li><strong>Zorunlu Çerezler:</strong> Platform işlevselliği için gerekli çerezler</li>
							<li><strong>Performans Çerezleri:</strong> Kullanım istatistikleri için çerezler</li>
							<li><strong>Tercih Çerezleri:</strong> Kullanıcı tercihlerinin saklanması için çerezler</li>
						</ul>
						<p className="text-muted-foreground leading-relaxed mt-4">
							Tarayıcı ayarlarınızdan çerez tercihlerinizi değiştirebilirsiniz.
						</p>
					</Card>

					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">9. Haklarınız</h2>
						<p className="text-muted-foreground leading-relaxed mb-4">
							KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
						</p>
						<ul className="list-disc list-inside space-y-2 text-muted-foreground">
							<li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
							<li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
							<li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
							<li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme</li>
							<li>Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
							<li>Kişisel verilerin silinmesini veya yok edilmesini isteme</li>
							<li>Yapılan işlemlerin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
							<li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhine bir sonucun ortaya çıkmasına itiraz etme</li>
							<li>Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme</li>
						</ul>
					</Card>

					<Card className="p-8 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
						<h2 className="text-2xl font-bold mb-4">10. İletişim</h2>
						<p className="text-muted-foreground mb-4">
							Haklarınızı kullanmak veya sorularınız için bizimle iletişime geçebilirsiniz:
						</p>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li>E-posta: <a href="mailto:privacy@tv25.app" className="text-primary hover:underline">privacy@tv25.app</a></li>
							<li>Genel İletişim: <a href="mailto:info@tv25.app" className="text-primary hover:underline">info@tv25.app</a></li>
						</ul>
					</Card>
				</div>
			</main>

			{/* Footer */}
		<SiteFooter />
	</div>
	);
}
