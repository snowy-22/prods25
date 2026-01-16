'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function KVKKPage() {
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
					<h1 className="text-4xl md:text-5xl font-bold mb-6">KVKK Politikası</h1>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						6698 Sayılı Kişisel Verilerin Korunması Kanunu Kapsamında Politikamız
					</p>
					<p className="text-sm text-muted-foreground mt-4">
						Son güncelleme: {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
					</p>
				</div>

				{/* Content */}
				<div className="space-y-8">
					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">1. Giriş</h2>
						<p className="text-muted-foreground leading-relaxed">
							tv25.app olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında 
							kişisel verilerin korunması konusunda azami hassasiyet göstermekteyiz. Bu politika, 
							kişisel verilerin işlenmesi, korunması ve ilgili kişilerin haklarının kullanılması 
							konularında uyguladığımız ilke ve prosedürleri açıklamaktadır.
						</p>
					</Card>

					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">2. Tanımlar</h2>
						<p className="text-muted-foreground leading-relaxed mb-4">
							Bu politikada kullanılan terimler:
						</p>
						<ul className="space-y-3 text-muted-foreground">
							<li><strong>Kişisel Veri:</strong> Kimliği belirli veya belirlenebilir gerçek kişiye ilişkin her türlü bilgi.</li>
							<li><strong>Özel Nitelikli Kişisel Veri:</strong> Irk, etnik köken, siyasi düşünce, felsefi inanç, din, mezhep veya diğer inançlar, kılık kıyafet, dernek, vakıf ya da sendika üyeliği, sağlık, cinsel hayat, ceza mahkumiyeti ve güvenlik tedbirleriyle ilgili veriler ile biyometrik ve genetik veriler.</li>
							<li><strong>Veri Sorumlusu:</strong> Kişisel verilerin işleme amaçlarını ve vasıtalarını belirleyen, veri kayıt sisteminin kurulmasından ve yönetilmesinden sorumlu olan gerçek veya tüzel kişi.</li>
							<li><strong>Veri İşleyen:</strong> Veri sorumlusunun verdiği yetkiye dayanarak onun adına kişisel verileri işleyen gerçek veya tüzel kişi.</li>
							<li><strong>İlgili Kişi:</strong> Kişisel verisi işlenen gerçek kişi.</li>
						</ul>
					</Card>

					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">3. Kişisel Veri İşleme İlkeleri</h2>
						<p className="text-muted-foreground leading-relaxed mb-4">
							KVKK&apos;nın 4. maddesi uyarınca kişisel verilerinizi aşağıdaki ilkelere uygun olarak işliyoruz:
						</p>
						<ul className="list-disc list-inside space-y-2 text-muted-foreground">
							<li><strong>Hukuka ve dürüstlük kurallarına uygun işleme:</strong> Tüm veri işleme faaliyetleri yasal çerçevede ve dürüstlük ilkesine uygun şekilde gerçekleştirilir.</li>
							<li><strong>Doğru ve gerektiğinde güncel olma:</strong> Verilerinizin doğruluğu sağlanır ve gerektiğinde güncellenir.</li>
							<li><strong>Belirli, açık ve meşru amaçlar için işleme:</strong> Veriler, önceden belirlenen meşru amaçlar doğrultusunda işlenir.</li>
							<li><strong>İşlendikleri amaçla bağlantılı, sınırlı ve ölçülü olma:</strong> Yalnızca gerekli olan veriler toplanır ve işlenir.</li>
							<li><strong>İlgili mevzuatta öngörülen veya işlendikleri amaç için gerekli olan süre kadar muhafaza edilme:</strong> Veriler yalnızca gerekli süre boyunca saklanır.</li>
						</ul>
					</Card>

					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">4. Kişisel Veri İşleme Şartları</h2>
						<p className="text-muted-foreground leading-relaxed mb-4">
							KVKK&apos;nın 5. maddesi uyarınca, kişisel veriler aşağıdaki şartlardan birinin varlığı halinde işlenebilir:
						</p>
						<ul className="list-disc list-inside space-y-2 text-muted-foreground">
							<li>İlgili kişinin açık rızasının bulunması</li>
							<li>Kanunlarda açıkça öngörülmesi</li>
							<li>Fiili imkânsızlık nedeniyle rızasını açıklayamayacak durumda bulunan veya rızasına hukuki geçerlilik tanınmayan kişinin kendisinin ya da bir başkasının hayatı veya beden bütünlüğünün korunması için zorunlu olması</li>
							<li>Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması kaydıyla, sözleşmenin taraflarına ait kişisel verilerin işlenmesinin gerekli olması</li>
							<li>Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması</li>
							<li>İlgili kişinin kendisi tarafından alenileştirilmiş olması</li>
							<li>Bir hakkın tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması</li>
							<li>İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, veri sorumlusunun meşru menfaatleri için veri işlenmesinin zorunlu olması</li>
						</ul>
					</Card>

					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">5. Özel Nitelikli Kişisel Verilerin İşlenmesi</h2>
						<p className="text-muted-foreground leading-relaxed mb-4">
							tv25.app platformunda, kullanıcılarımızın özel nitelikli kişisel verilerini işlememekteyiz. 
							Ancak, özel nitelikli kişisel verilerin işlenmesi gerektiği durumlarda, KVKK&apos;nın 6. maddesi 
							kapsamında gerekli önlemler alınarak işleme yapılacaktır:
						</p>
						<ul className="list-disc list-inside space-y-2 text-muted-foreground">
							<li>İlgili kişinin açık rızası alınacaktır</li>
							<li>Kurul tarafından belirlenen yeterli önlemler alınacaktır</li>
							<li>İşleme faaliyeti kayıt altına alınacaktır</li>
						</ul>
					</Card>

					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">6. Kişisel Verilerin Aktarılması</h2>
						<p className="text-muted-foreground leading-relaxed mb-4">
							Kişisel verileriniz, KVKK&apos;nın 8. ve 9. maddeleri kapsamında aşağıdaki koşullarda aktarılabilir:
						</p>
						
						<h3 className="font-bold mb-2 mt-4">Yurt İçi Aktarım</h3>
						<ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
							<li>İlgili kişinin açık rızası</li>
							<li>KVKK&apos;nın 5. ve 6. maddelerinde belirtilen şartların varlığı</li>
						</ul>

						<h3 className="font-bold mb-2">Yurt Dışı Aktarım</h3>
						<ul className="list-disc list-inside space-y-2 text-muted-foreground">
							<li>İlgili kişinin açık rızası</li>
							<li>Yeterli korumanın bulunduğu ülkelere aktarım</li>
							<li>Yeterli korumanın bulunmaması halinde, Türkiye&apos;deki ve ilgili yabancı ülkedeki veri sorumlularının yeterli korumayı yazılı olarak taahhüt etmeleri ve Kurulun izninin bulunması</li>
						</ul>
						<p className="text-muted-foreground leading-relaxed mt-4">
							Platformumuz, hosting ve altyapı hizmetleri için yurt dışındaki hizmet sağlayıcıları 
							kullanabilmektedir. Bu durumda, gerekli taahhütler alınarak veri güvenliği sağlanmaktadır.
						</p>
					</Card>

					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">7. Veri Güvenliği Tedbirleri</h2>
						<p className="text-muted-foreground leading-relaxed mb-4">
							KVKK&apos;nın 12. maddesi uyarınca aşağıdaki teknik ve idari tedbirleri almaktayız:
						</p>
						
						<h3 className="font-bold mb-2 mt-4">Teknik Tedbirler</h3>
						<ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
							<li>SSL/TLS şifreleme ile veri transferi güvenliği</li>
							<li>Şifrelerin tek yönlü hash algoritmaları ile saklanması</li>
							<li>Güvenlik duvarı ve saldırı tespit sistemleri</li>
							<li>Düzenli güvenlik güncellemeleri ve yamalar</li>
							<li>Erişim kontrolü ve yetkilendirme sistemleri</li>
							<li>Veri yedekleme ve felaket kurtarma planları</li>
						</ul>

						<h3 className="font-bold mb-2">İdari Tedbirler</h3>
						<ul className="list-disc list-inside space-y-2 text-muted-foreground">
							<li>Çalışan eğitimleri ve farkındalık programları</li>
							<li>Gizlilik sözleşmeleri</li>
							<li>Veri işleme politikaları ve prosedürleri</li>
							<li>Düzenli iç denetimler</li>
							<li>Olay müdahale prosedürleri</li>
						</ul>
					</Card>

					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">8. İlgili Kişinin Hakları</h2>
						<p className="text-muted-foreground leading-relaxed mb-4">
							KVKK&apos;nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:
						</p>
						<div className="bg-background/50 rounded-lg p-4 space-y-3">
							<p className="text-muted-foreground"><strong>a)</strong> Kişisel verilerinizin işlenip işlenmediğini öğrenme</p>
							<p className="text-muted-foreground"><strong>b)</strong> Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</p>
							<p className="text-muted-foreground"><strong>c)</strong> Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</p>
							<p className="text-muted-foreground"><strong>d)</strong> Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme</p>
							<p className="text-muted-foreground"><strong>e)</strong> Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</p>
							<p className="text-muted-foreground"><strong>f)</strong> KVKK&apos;nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme</p>
							<p className="text-muted-foreground"><strong>g)</strong> (e) ve (f) bentleri uyarınca yapılan işlemlerin, kişisel verilerinizin aktarıldığı üçüncü kişilere bildirilmesini isteme</p>
							<p className="text-muted-foreground"><strong>h)</strong> İşlenen verilerinizin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</p>
							<p className="text-muted-foreground"><strong>ı)</strong> Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</p>
						</div>
					</Card>

					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">9. Başvuru Yöntemi</h2>
						<p className="text-muted-foreground leading-relaxed mb-4">
							Yukarıda belirtilen haklarınızı kullanmak için aşağıdaki yöntemlerle başvuruda bulunabilirsiniz:
						</p>
						<ul className="list-disc list-inside space-y-2 text-muted-foreground">
							<li>E-posta: <a href="mailto:kvkk@tv25.app" className="text-primary hover:underline">kvkk@tv25.app</a></li>
							<li>Platform içi başvuru formu</li>
						</ul>
						<p className="text-muted-foreground leading-relaxed mt-4">
							Başvurunuzda kimliğinizi tevsik edici bilgi ve belgeler ile talep konusunun açıkça 
							belirtilmesi gerekmektedir. Başvurular en geç 30 gün içinde ücretsiz olarak sonuçlandırılır. 
							İşlemin ayrıca bir maliyet gerektirmesi hâlinde, Kişisel Verileri Koruma Kurulu tarafından 
							belirlenen tarifedeki ücret talep edilebilir.
						</p>
					</Card>

					<Card className="p-8 bg-card/50 border-border/50">
						<h2 className="text-2xl font-bold mb-4">10. Kurula Şikayet Hakkı</h2>
						<p className="text-muted-foreground leading-relaxed">
							Başvurunuzun reddedilmesi, verilen cevabın yetersiz bulunması veya süresinde başvuruya 
							cevap verilmemesi hâllerinde; cevabı öğrendiğiniz tarihten itibaren 30 gün ve her hâlde 
							başvuru tarihinden itibaren 60 gün içinde Kişisel Verileri Koruma Kurulu&apos;na şikâyette 
							bulunabilirsiniz.
						</p>
					</Card>

					<Card className="p-8 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
						<h2 className="text-2xl font-bold mb-4">11. İletişim</h2>
						<p className="text-muted-foreground mb-4">
							KVKK kapsamındaki başvurularınız için:
						</p>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li>KVKK Başvuruları: <a href="mailto:kvkk@tv25.app" className="text-primary hover:underline">kvkk@tv25.app</a></li>
							<li>Genel İletişim: <a href="mailto:info@tv25.app" className="text-primary hover:underline">info@tv25.app</a></li>
							<li>Gizlilik Soruları: <a href="mailto:privacy@tv25.app" className="text-primary hover:underline">privacy@tv25.app</a></li>
						</ul>
					</Card>
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
