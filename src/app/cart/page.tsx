'use client';

import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function CartPage() {
  const router = useRouter();
  const { 
    shoppingCart, 
    removeFromCart, 
    updateCartItemQuantity,
    clearCart,
    user
  } = useAppStore();

  if (shoppingCart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold mb-2">Sepetiniz Boş</h2>
          <p className="text-gray-600 mb-6">
            Ürün eklemek için marketplace'e göz atın.
          </p>
          <Link href="/products">
            <Button>Ürünleri Gözat</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleCheckout = () => {
    if (!user) {
      router.push('/auth?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <Link href="/products" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Alışverişe Devam
          </Link>
          <h1 className="text-3xl font-bold">Sepetim</h1>
          <p className="text-gray-600 mt-1">{shoppingCart.items.length} ürün</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {shoppingCart.items.map((item: any) => {
            // Get product from store to display image and name
            const { products } = useAppStore();
            const product = products.find(p => p.id === item.productId);
            
            return (
            <div key={item.id} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex gap-6">
                {/* Product Image */}
                {product?.image && (
                  <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Product Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{product?.title || 'Unknown Product'}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {product?.type === 'digital' ? 'Dijital Ürün' : 'Fiziksel Ürün'}
                  </p>
                  {item.selectedVariant?.color && (
                    <p className="text-sm text-gray-500">Varyant: {item.selectedVariant.color}</p>
                  )}

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="font-semibold w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Price & Remove */}
                <div className="text-right flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Birim Fiyat</p>
                    <p className="font-semibold">${(item.price / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Toplam</p>
                    <p className="text-xl font-bold text-blue-600">
                      ${((item.price * item.quantity) / 100).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Kaldır
                  </Button>
                </div>
              </div>
            </div>
          );
          })}

          {/* Clear Cart Button */}
          <Button
            variant="outline"
            onClick={clearCart}
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Sepeti Temizle
          </Button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg p-6 shadow-sm sticky top-8">
            <h3 className="text-lg font-bold mb-4">Sipariş Özeti</h3>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Ara Toplam</span>
                <span>${(shoppingCart.subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Vergi</span>
                <span>${(shoppingCart.tax / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Kargo</span>
                <span>${(shoppingCart.shipping / 100).toFixed(2)}</span>
              </div>
              {shoppingCart.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>İndirim</span>
                  <span>-${(shoppingCart.discount / 100).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between font-bold text-xl">
                <span>Toplam</span>
                <span className="text-blue-600">
                  ${(shoppingCart.total / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <Button 
              onClick={handleCheckout} 
              className="w-full" 
              size="lg"
            >
              Ödemeye Geç
            </Button>

            <p className="text-xs text-gray-500 mt-4 text-center">
              {user ? 'Güvenli ödeme sayfasına yönlendirileceksiniz' : 'Devam etmek için giriş yapmanız gerekiyor'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
