'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Ticket, Package, Trash2, Plus, Minus,
  Loader2, CreditCard, Truck, MapPin, Clock, Tag,
  ChevronRight, ArrowRight, Gift, ShoppingBag, Percent,
  AlertCircle, CheckCircle2, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store';
import CouponsSection from '@/components/coupons/coupons-section';

interface ShoppingPanelProps {
  className?: string;
  defaultTab?: 'cart' | 'coupons' | 'orders';
}

export default function ShoppingPanel({ 
  className,
  defaultTab = 'cart'
}: ShoppingPanelProps) {
  const { toast } = useToast();
  const user = useAppStore(state => state.user);
  const shoppingCart = useAppStore(state => state.shoppingCart);
  const products = useAppStore(state => state.products);
  const orders = useAppStore(state => state.orders);
  const updateCartItemQuantity = useAppStore(state => state.updateCartItemQuantity);
  const removeFromCart = useAppStore(state => state.removeFromCart);
  const clearCart = useAppStore(state => state.clearCart);
  const applyDiscountCode = useAppStore(state => state.applyDiscountCode);
  const removeDiscountCode = useAppStore(state => state.removeDiscountCode);
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [discountInput, setDiscountInput] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  
  // Get product details for cart items
  const cartItemsWithDetails = useMemo(() => {
    return shoppingCart.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        ...item,
        product
      };
    });
  }, [shoppingCart.items, products]);
  
  // Apply discount code
  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) return;
    
    setIsApplyingDiscount(true);
    try {
      const success = await applyDiscountCode(discountInput.trim());
      if (success) {
        toast({
          title: 'Kupon uygulandı',
          description: 'İndirim sepetinize eklendi!',
        });
        setDiscountInput('');
      } else {
        toast({
          title: 'Geçersiz kupon',
          description: 'Kupon kodu bulunamadı veya süresi dolmuş.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Kupon uygulanırken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsApplyingDiscount(false);
    }
  };
  
  // Format price
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };
  
  // Update quantity
  const handleQuantityChange = (itemId: string, delta: number) => {
    const item = shoppingCart.items.find(i => i.id === itemId);
    if (item) {
      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        removeFromCart(itemId);
      } else {
        updateCartItemQuantity(itemId, newQuantity);
      }
    }
  };
  
  // Checkout
  const handleCheckout = async () => {
    if (cartItemsWithDetails.length === 0) return;
    
    setIsCheckingOut(true);
    try {
      // Mock checkout - in real implementation, this would call a payment API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Sipariş oluşturuldu!',
        description: 'Siparişiniz başarıyla alındı.',
      });
      
      clearCart();
      setShowCheckoutDialog(false);
      setActiveTab('orders');
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Sipariş oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingOut(false);
    }
  };
  
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          E-Ticaret
        </h2>
        <p className="text-sm text-muted-foreground">Sepetim, kuponlarım ve siparişlerim</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4 grid grid-cols-3">
          <TabsTrigger value="cart" className="gap-1.5">
            <ShoppingCart className="h-4 w-4" />
            <span>Sepetim</span>
            {shoppingCart.items.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 flex items-center justify-center text-xs">
                {shoppingCart.items.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="coupons" className="gap-1.5">
            <Ticket className="h-4 w-4" />
            <span>Kuponlarım</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5">
            <Package className="h-4 w-4" />
            <span>Siparişler</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Cart Tab */}
        <TabsContent value="cart" className="flex-1 mt-0 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {cartItemsWithDetails.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium mb-1">Sepetiniz boş</h3>
                  <p className="text-sm text-muted-foreground">
                    Ürün eklemek için mağazayı ziyaret edin
                  </p>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {cartItemsWithDetails.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                        >
                          <Card>
                            <CardContent className="p-3">
                              <div className="flex gap-3">
                                {/* Product Image */}
                                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                                  {item.product?.image ? (
                                    <img 
                                      src={item.product.image} 
                                      alt={item.product.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm truncate">
                                    {item.product?.title || 'Ürün'}
                                  </h4>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {item.product?.category}
                                  </p>
                                  <p className="text-sm font-semibold mt-1">
                                    {formatPrice(item.price)}
                                  </p>
                                </div>
                                
                                {/* Quantity Controls */}
                                <div className="flex flex-col items-end justify-between">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeFromCart(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleQuantityChange(item.id, -1)}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-6 text-center text-sm font-medium">
                                      {item.quantity}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleQuantityChange(item.id, 1)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  
                  {/* Discount Code Input */}
                  <Card>
                    <CardContent className="p-3">
                      <Label className="text-sm mb-2 block">Kupon Kodu</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Kupon kodunuzu girin"
                          value={discountInput}
                          onChange={(e) => setDiscountInput(e.target.value)}
                          disabled={!!shoppingCart.discountCode}
                          className="flex-1"
                        />
                        {shoppingCart.discountCode ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={removeDiscountCode}
                          >
                            Kaldır
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={handleApplyDiscount}
                            disabled={isApplyingDiscount || !discountInput.trim()}
                          >
                            {isApplyingDiscount ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Uygula'
                            )}
                          </Button>
                        )}
                      </div>
                      {shoppingCart.discountCode && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Kupon uygulandı: {shoppingCart.discountCode}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Order Summary */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Sipariş Özeti</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ara Toplam</span>
                        <span>{formatPrice(shoppingCart.subtotal)}</span>
                      </div>
                      {shoppingCart.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span className="flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            İndirim
                          </span>
                          <span>-{formatPrice(shoppingCart.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Kargo</span>
                        <span>{formatPrice(shoppingCart.shipping)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Vergi</span>
                        <span>{formatPrice(shoppingCart.tax)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Toplam</span>
                        <span>{formatPrice(shoppingCart.total)}</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
                        <DialogTrigger asChild>
                          <Button className="w-full" size="lg">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Ödemeye Geç
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Siparişi Onayla</DialogTitle>
                            <DialogDescription>
                              Siparişinizi onaylamak üzeresiniz. Devam etmek istiyor musunuz?
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 py-4">
                            <div className="p-4 rounded-lg bg-muted">
                              <div className="flex justify-between mb-2">
                                <span className="text-muted-foreground">Ürün Sayısı</span>
                                <span className="font-medium">{shoppingCart.items.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Toplam Tutar</span>
                                <span className="font-bold text-lg">{formatPrice(shoppingCart.total)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <AlertCircle className="h-4 w-4" />
                              <span>Bu bir demo siparişidir. Gerçek ödeme alınmayacaktır.</span>
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCheckoutDialog(false)}>
                              İptal
                            </Button>
                            <Button onClick={handleCheckout} disabled={isCheckingOut}>
                              {isCheckingOut ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  İşleniyor...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Onayla
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardFooter>
                  </Card>
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        {/* Coupons Tab */}
        <TabsContent value="coupons" className="flex-1 mt-0">
          <CouponsSection 
            userId={user?.id} 
            className="h-full"
            showHeader={false}
          />
        </TabsContent>
        
        {/* Orders Tab */}
        <TabsContent value="orders" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium mb-1">Henüz sipariş yok</h3>
                  <p className="text-sm text-muted-foreground">
                    İlk siparişinizi vermek için alışverişe başlayın
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-sm">Sipariş #{order.id.slice(-6).toUpperCase()}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                          <Badge variant={
                            order.status === 'completed' ? 'default' :
                            order.status === 'processing' ? 'secondary' :
                            order.status === 'shipped' ? 'outline' :
                            'destructive'
                          }>
                            {order.status === 'pending' && 'Beklemede'}
                            {order.status === 'processing' && 'İşleniyor'}
                            {order.status === 'shipped' && 'Kargoda'}
                            {order.status === 'delivered' && 'Teslim Edildi'}
                            {order.status === 'completed' && 'Tamamlandı'}
                            {order.status === 'cancelled' && 'İptal'}
                            {order.status === 'refunded' && 'İade'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Package className="h-4 w-4" />
                            <span>{order.items.length} ürün</span>
                          </div>
                          <div className="flex-1" />
                          <span className="font-semibold">{formatPrice(order.total)}</span>
                        </div>
                        
                        {order.trackingNumber && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2 text-sm">
                              <Truck className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Takip:</span>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {order.trackingNumber}
                              </code>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
