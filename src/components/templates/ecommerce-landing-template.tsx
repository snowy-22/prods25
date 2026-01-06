'use client';

import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  ShoppingBag, 
  Star, 
  TrendingUp, 
  Zap,
  Shield,
  Truck,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function EcommerceLandingTemplate() {
  const products = useAppStore((state) => state.products);
  const addToCart = useAppStore((state) => state.addToCart);

  const featuredProducts = products.slice(0, 3);
  const trendingProducts = products.slice(3, 7);

  return (
    <ScrollArea className="h-full">
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/10">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 opacity-50" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <Badge className="w-fit" variant="secondary">
                  <Zap className="h-3 w-3 mr-1.5" />
                  Yeni Sezon İndirimleri
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Dijital ve Fiziksel{' '}
                  <span className="text-primary">Ürünler</span>{' '}
                  Bir Arada
                </h1>
                <p className="text-xl text-muted-foreground">
                  Premium kalitede eğitimler, yazılım araçları ve profesyonel ekipmanlar. 
                  Kariyerinizi bir üst seviyeye taşıyın.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" className="gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Alışverişe Başla
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline">
                    Kategorileri Keşfet
                  </Button>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 pt-8">
                  <div>
                    <p className="text-3xl font-bold text-primary">500+</p>
                    <p className="text-sm text-muted-foreground">Ürün</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">10K+</p>
                    <p className="text-sm text-muted-foreground">Müşteri</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">4.9</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      Puan
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary to-blue-500 rounded-full blur-3xl opacity-20" />
                <div className="relative grid grid-cols-2 gap-4">
                  {featuredProducts.map((product, idx) => (
                    <div
                      key={product.id}
                      className={cn(
                        "group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300",
                        idx === 0 && "col-span-2"
                      )}
                    >
                      {product.image && (
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                          <p className="font-semibold mb-1">{product.title}</p>
                          <p className="text-2xl font-bold">${(product.price / 100).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: Truck, title: 'Ücretsiz Kargo', desc: '500₺ ve üzeri alışverişlerde' },
                { icon: Shield, title: 'Güvenli Ödeme', desc: '256-bit SSL şifreleme' },
                { icon: Award, title: 'Kalite Garantisi', desc: '30 gün iade hakkı' },
                { icon: Zap, title: 'Hızlı Teslimat', desc: '1-3 gün içinde kapınızda' },
              ].map((feature, idx) => (
                <div key={idx} className="flex flex-col items-center text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Products */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold mb-2">Trend Ürünler</h2>
                <p className="text-muted-foreground">En çok satanlar ve yeni eklenenler</p>
              </div>
              <Button variant="outline">
                Tümünü Gör
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingProducts.map((product) => (
                <div
                  key={product.id}
                  className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {product.image && (
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-primary/90">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Trend
                        </Badge>
                      </div>
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold line-clamp-2 min-h-[3rem]">
                      {product.title}
                    </h3>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">(128)</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <p className="text-xl font-bold text-primary">
                        ${(product.price / 100).toFixed(2)}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => addToCart(product, 1)}
                      >
                        Sepete Ekle
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-10 text-center">Kategoriler</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Eğitim', emoji: '📚', count: 150 },
                { name: 'Tasarım', emoji: '🎨', count: 89 },
                { name: 'Yazılım', emoji: '💻', count: 124 },
                { name: 'Elektronik', emoji: '⚡', count: 67 },
                { name: 'Aksesuar', emoji: '🎧', count: 93 },
                { name: 'Kitap', emoji: '📖', count: 201 },
                { name: 'Araçlar', emoji: '🔧', count: 45 },
                { name: 'Diğer', emoji: '✨', count: 112 },
              ].map((category, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="h-auto py-8 flex-col gap-3 hover:bg-primary/10 hover:border-primary transition-all group"
                >
                  <span className="text-4xl group-hover:scale-110 transition-transform">
                    {category.emoji}
                  </span>
                  <div className="text-center">
                    <p className="font-semibold">{category.name}</p>
                    <p className="text-xs text-muted-foreground">{category.count} ürün</p>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-500 opacity-10" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-4xl font-bold">Harika Fırsatları Kaçırma!</h2>
            <p className="text-xl text-muted-foreground">
              İlk alışverişine özel %20 indirim kodu: <code className="bg-primary/10 px-3 py-1 rounded font-mono">ILKALISVERIS</code>
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg">
                Hemen Alışveriş Yap
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline">
                Market Yerini Keşfet
              </Button>
            </div>
          </div>
        </section>
      </div>
    </ScrollArea>
  );
}
