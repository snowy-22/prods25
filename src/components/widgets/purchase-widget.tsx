"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Purchase,
  PurchaseItem,
  PurchaseWidgetConfig,
  ShippingInfo,
  BillingInfo,
  ECommerceBlockchain
} from '@/lib/ecommerce-system';
import { ContentItem } from '@/lib/initial-content';
import Image from 'next/image';

interface PurchaseWidgetProps {
  item: ContentItem;
  onUpdate?: (updates: Partial<ContentItem>) => void;
}

const DEFAULT_CONFIG: PurchaseWidgetConfig = {
  id: 'default-purchase',
  title: 'Ürün Satın Alma',
  products: [
    {
      id: 'prod-1',
      name: 'Örnek Ürün',
      description: 'Demo ürün açıklaması',
      price: 299.99,
      currency: 'TRY',
      stock: 10
    }
  ],
  shippingOptions: [
    { id: 'ship-1', name: 'Standart Kargo', price: 29.99, estimatedDays: 3 },
    { id: 'ship-2', name: 'Hızlı Kargo', price: 59.99, estimatedDays: 1 }
  ],
  taxRate: 18,
  acceptedPaymentMethods: [
    { id: 'card', name: 'Kredi Kartı', type: 'card', isEnabled: true },
    { id: 'crypto', name: 'Kripto Para', type: 'crypto', isEnabled: true }
  ],
  settings: {
    requireShipping: true,
    allowGuestCheckout: true,
    sendConfirmationEmail: true,
    enableInventoryTracking: true
  }
};

export default function PurchaseWidget({ item, onUpdate }: PurchaseWidgetProps) {
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [step, setStep] = useState<'products' | 'shipping' | 'payment' | 'confirmation'>('products');
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'TR'
  });
  const [selectedShipping, setSelectedShipping] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [confirmedPurchase, setConfirmedPurchase] = useState<Purchase | null>(null);

  const config = (item.metadata?.purchaseConfig as PurchaseWidgetConfig) || DEFAULT_CONFIG;
  const blockchain = new ECommerceBlockchain();

  const addToCart = (productId: string) => {
    const current = cart.get(productId) || 0;
    const product = config.products.find(p => p.id === productId);
    if (product && (!product.stock || current < product.stock)) {
      setCart(new Map(cart.set(productId, current + 1)));
    }
  };

  const removeFromCart = (productId: string) => {
    const current = cart.get(productId) || 0;
    if (current > 1) {
      setCart(new Map(cart.set(productId, current - 1)));
    } else {
      cart.delete(productId);
      setCart(new Map(cart));
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    const items: PurchaseItem[] = [];

    cart.forEach((quantity, productId) => {
      const product = config.products.find(p => p.id === productId);
      if (product) {
        subtotal += product.price * quantity;
        items.push({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          quantity,
          imageUrl: product.imageUrl
        });
      }
    });

    const shippingCost = selectedShipping 
      ? config.shippingOptions.find(s => s.id === selectedShipping)?.price || 0
      : 0;

    const tax = (subtotal + shippingCost) * (config.taxRate / 100);
    const total = subtotal + shippingCost + tax;

    return { items, subtotal, tax, total, shippingCost };
  };

  const handlePurchase = async () => {
    const { items, subtotal, tax, total } = calculateTotals();

    const purchase = blockchain.createPurchase(
      'user-id', // Should come from auth context
      items,
      subtotal,
      tax,
      total,
      config.products[0].currency,
      config.settings.requireShipping ? shippingInfo : undefined,
      config.settings.requireShipping ? shippingInfo : undefined
    );

    // Auto-confirm payment for demo
    const confirmedPurchase = blockchain.confirmPayment(
      purchase,
      'user',
      selectedPayment
    );

    setConfirmedPurchase(confirmedPurchase);
    setStep('confirmation');

    // Award achievement if first purchase
    // TODO: Award 'ach-first-purchase' achievement
  };

  const { items, subtotal, tax, total, shippingCost } = calculateTotals();
  const cartItemCount = Array.from(cart.values()).reduce((sum, qty) => sum + qty, 0);

  return (
    <Card className="w-full h-full overflow-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🛍️ {config.title}
          {cartItemCount > 0 && (
            <Badge className="ml-auto">{cartItemCount} ürün</Badge>
          )}
        </CardTitle>
        <CardDescription>
          {config.description || 'Güvenli ve blockchain doğrulamalı alışveriş'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {step === 'products' && (
          <div className="space-y-4">
            {/* Product List */}
            <div className="space-y-3">
              {config.products.map((product) => {
                const inCart = cart.get(product.id) || 0;
                const isOutOfStock = product.stock !== undefined && product.stock <= 0;

                return (
                  <div key={product.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex gap-3">
                      {product.imageUrl && (
                        <div className="relative w-20 h-20 flex-shrink-0 bg-muted rounded">
                          <Image 
                            src={product.imageUrl} 
                            alt={product.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{product.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-lg font-bold">
                            {product.price} {product.currency}
                          </span>
                          {product.stock !== undefined && (
                            <Badge variant={product.stock > 5 ? 'secondary' : 'destructive'} className="text-xs">
                              {product.stock} stok
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {inCart > 0 ? (
                        <div className="flex items-center gap-2 w-full">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removeFromCart(product.id)}
                          >
                            -
                          </Button>
                          <span className="font-semibold min-w-[30px] text-center">
                            {inCart}
                          </span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => addToCart(product.id)}
                            disabled={isOutOfStock || (product.stock !== undefined && inCart >= product.stock)}
                          >
                            +
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          className="w-full" 
                          size="sm"
                          onClick={() => addToCart(product.id)}
                          disabled={isOutOfStock}
                        >
                          {isOutOfStock ? 'Stokta Yok' : 'Sepete Ekle'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {cart.size > 0 && (
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between font-semibold">
                  <span>Ara Toplam:</span>
                  <span>{subtotal.toFixed(2)} TRY</span>
                </div>
                <Button className="w-full" onClick={() => setStep('shipping')}>
                  Devam Et →
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 'shipping' && config.settings.requireShipping && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setStep('products')}>
              ← Geri
            </Button>

            <div className="space-y-3">
              <h4 className="font-semibold">Teslimat Bilgileri</h4>
              
              <Input 
                placeholder="Adres"
                value={shippingInfo.address}
                onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input 
                  placeholder="Şehir"
                  value={shippingInfo.city}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                />
                <Input 
                  placeholder="Posta Kodu"
                  value={shippingInfo.zipCode}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, zipCode: e.target.value })}
                />
              </div>

              <Separator />

              <h4 className="font-semibold">Kargo Seçeneği</h4>
              {config.shippingOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedShipping(option.id)}
                  className={`w-full p-3 rounded border-2 text-left ${
                    selectedShipping === option.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{option.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {option.estimatedDays} iş günü
                      </div>
                    </div>
                    <div className="font-bold">{option.price} TRY</div>
                  </div>
                </button>
              ))}

              <Button 
                className="w-full" 
                onClick={() => setStep('payment')}
                disabled={!shippingInfo.address || !shippingInfo.city || !selectedShipping}
              >
                Ödemeye Geç →
              </Button>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setStep('shipping')}>
              ← Geri
            </Button>

            <div className="space-y-3">
              <h4 className="font-semibold">Ödeme Yöntemi</h4>
              
              {config.acceptedPaymentMethods.filter(m => m.isEnabled).map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`w-full p-4 rounded border-2 text-left ${
                    selectedPayment === method.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <div className="font-semibold">{method.name}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {method.type}
                  </div>
                </button>
              ))}

              <Separator />

              {/* Order Summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold mb-3">Sipariş Özeti</h4>
                
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{(item.price * item.quantity).toFixed(2)} TRY</span>
                  </div>
                ))}

                <Separator />
                
                <div className="flex justify-between text-sm">
                  <span>Ara Toplam:</span>
                  <span>{subtotal.toFixed(2)} TRY</span>
                </div>
                
                {shippingCost && shippingCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Kargo:</span>
                    <span>{shippingCost.toFixed(2)} TRY</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span>KDV ({config.taxRate}%):</span>
                  <span>{tax.toFixed(2)} TRY</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Toplam:</span>
                  <span>{total.toFixed(2)} TRY</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePurchase}
                disabled={!selectedPayment}
              >
                🔒 Ödemeyi Onayla ve Hash'le
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                🔗 Blockchain ile doğrulanmış güvenli ödeme
              </p>
            </div>
          </div>
        )}

        {step === 'confirmation' && confirmedPurchase && (
          <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-500">
            <div className="text-center">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-xl font-bold text-green-700 dark:text-green-300">
                Siparişiniz Onaylandı!
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Blockchain ile doğrulanmış sipariş
              </p>
            </div>

            <div className="space-y-2 text-sm bg-white dark:bg-gray-900 rounded p-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sipariş No:</span>
                <span className="font-mono font-bold">{confirmedPurchase.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Onay Kodu:</span>
                <span className="font-mono font-bold text-lg">
                  {confirmedPurchase.confirmationCode}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ürün Sayısı:</span>
                <span className="font-semibold">{confirmedPurchase.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Toplam Tutar:</span>
                <span className="font-bold text-xl">
                  {confirmedPurchase.total.toFixed(2)} {confirmedPurchase.currency}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Blockchain Hash:</span>
                <span className="font-mono text-xs truncate max-w-[180px]">
                  {confirmedPurchase.blockchainHash}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doğrulama Zinciri:</span>
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900">
                  ✓ {confirmedPurchase.verificationChain.length} node
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Durum:</span>
                <Badge className="bg-green-600">Ödeme Alındı</Badge>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setStep('products');
                setCart(new Map());
                setConfirmedPurchase(null);
              }}
            >
              Yeni Alışveriş Yap
            </Button>

            <Button variant="ghost" className="w-full" size="sm">
              📄 NFT Sertifikasını İndir
            </Button>
          </div>
        )}
      </CardContent>

      {step !== 'confirmation' && (
        <CardFooter className="text-xs text-muted-foreground border-t pt-4">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">🔒 SSL Şifreli</Badge>
            <Badge variant="secondary">🔗 Blockchain Doğrulamalı</Badge>
            <Badge variant="secondary">🛡️ Güvenli Ödeme</Badge>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
