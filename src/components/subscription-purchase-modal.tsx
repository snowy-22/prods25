'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, AlertCircle, Sparkles } from 'lucide-react';
// Stripe kaldırıldı: yerel plan listesi kullanılıyor
import { SubscriptionTier } from '@/lib/subscription-types';
// import { loadStripe } from '@stripe/stripe-js';
// import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type BillingPeriod = 'monthly' | 'yearly';

interface SubscriptionPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier?: SubscriptionTier;
  userId?: string;
  userEmail?: string;
}

export function SubscriptionPurchaseModal({
  isOpen,
  onClose,
  selectedTier = 'plus',
  userId,
  userEmail,
}: SubscriptionPurchaseModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  // Yerel planlar (Stripe bağımsız)
  const PLANS = [
    { id: 'plan_guest', name: 'Misafir', description: 'Ücretsiz deneme', tier: 'guest' as const, amount: 0 },
    { id: 'plan_plus', name: 'Plus', description: 'Bireysel kullanıcılar için', tier: 'plus' as const, amount: 2900 },
    { id: 'plan_pro', name: 'Pro', description: 'Profesyoneller için', tier: 'pro' as const, amount: 7900 },
    { id: 'plan_kurumsal', name: 'Kurumsal', description: 'Kurumlar için', tier: 'kurumsal' as const, amount: 19900 },
    { id: 'plan_kurumsal_pro', name: 'Kurumsal Pro', description: 'Büyük kurumlar için', tier: 'kurumsal_pro' as const, amount: 49900 },
  ] as const;

  const plan = PLANS.find(p => p.tier === selectedTier);

  const handleClose = () => onClose();

  if (!plan) return null;

  const monthlyPrice = plan.amount / 100;
  const yearlyPrice = monthlyPrice * 12 * 0.8; // 20% discount

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            {plan.name} Üyeliği
            {plan.tier === 'pro' && (
              <Badge className="bg-purple-600">En Popüler</Badge>
            )}
            {plan.tier === 'kurumsal_pro' && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                <Sparkles className="w-3 h-3 inline mr-1" />
                Premium
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {plan.description}
          </DialogDescription>
        </DialogHeader>

        {/* Plan Selection */}
        <div className="space-y-6">
          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Aylık
              <div className="text-sm mt-1">${monthlyPrice}/ay</div>
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Yıllık
              <Badge className="ml-2 bg-green-500">%20 İndirim</Badge>
              <div className="text-sm mt-1">${yearlyPrice.toFixed(0)}/yıl</div>
            </button>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-semibold mb-3">Dahil Olan Özellikler:</h4>
            <div className="space-y-2">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trial Info */}
          {/* TODO: Add trialDays support to subscription plans
          {plan.trialDays && plan.trialDays > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 font-medium">
                🎉 {plan.trialDays} Gün Ücretsiz Deneme
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Deneme süreniz boyunca hiçbir ücret alınmaz. İstediğiniz zaman iptal edebilirsiniz.
              </p>
            </div>
          )}
          */}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Hata</p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Payment Form */}
          {/* TODO: Add Stripe Elements support - requires @stripe/stripe-js and @stripe/react-stripe-js packages
          {selectedTier !== 'guest' && clientSecret && (
            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4">Ödeme Bilgileri</h4>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#3b82f6',
                    },
                  },
                }}
              >
                <CheckoutForm
                  clientSecret={clientSecret}
                  customerId={customerId}
                  planName={plan.name}
                  onSuccess={handleClose}
                  onError={setError}
                />
              </Elements>
            </div>
          )}
          */}

          {/* Loading State (Stripe devre dışı) */}

          {/* Guest Plan - No Payment Needed */}
          {selectedTier === 'guest' && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                Misafir üyeliği tamamen ücretsizdir. Ödeme bilgisi gerekmez.
              </p>
              <Button
                onClick={handleClose}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Misafir Olarak Devam Et
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Checkout Form Component
/* TODO: Add Stripe integration - requires @stripe/stripe-js and @stripe/react-stripe-js packages
interface CheckoutFormProps {
  clientSecret: string;
  customerId: string;
  planName: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function CheckoutForm({ clientSecret, customerId, planName, onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    onError('');

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/subscription/success`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // Payment successful
      setPaymentSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      console.error('Payment error:', err);
      onError(err.message || 'Ödeme işlemi başarısız oldu');
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Ödeme Başarılı!
        </h3>
        <p className="text-gray-600">
          {planName} üyeliğiniz aktif hale getirildi.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <div className="space-y-3">
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              İşleniyor...
            </>
          ) : (
            `Ödemeyi Tamamla`
          )}
        </Button>
        
        <p className="text-xs text-center text-gray-500">
          Ödeme bilgileriniz güvenli bir şekilde Stripe tarafından işlenir.
          Kredi kartı bilgileriniz sunucularımızda saklanmaz.
        </p>
      </div>
    </form>
  );
}
*/
