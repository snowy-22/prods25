'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Lock, Eye, EyeOff, X } from 'lucide-react';

interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (pin: string) => Promise<boolean>;
  accountName: string;
  accountAvatar?: string;
  pinLength?: number;
  title?: string;
  description?: string;
}

export function PinVerificationModal({
  isOpen,
  onClose,
  onVerify,
  accountName,
  accountAvatar,
  pinLength = 4,
  title = 'PIN Kodunu Girin',
  description = 'Hesabınıza erişmek için PIN kodunuzu girin.'
}: PinVerificationModalProps) {
  const [pin, setPin] = useState<string[]>(Array(pinLength).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on open
  useEffect(() => {
    if (isOpen) {
      setPin(Array(pinLength).fill(''));
      setError(null);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen, pinLength]);

  // Handle input change
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newPin = [...pin];
    newPin[index] = value.slice(-1); // Take only last digit
    setPin(newPin);
    setError(null);

    // Auto-focus next input
    if (value && index < pinLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newPin.every(digit => digit !== '') && value) {
      handleSubmit(newPin.join(''));
    }
  };

  // Handle keydown for backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < pinLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (e.key === 'Enter') {
      const fullPin = pin.join('');
      if (fullPin.length === pinLength) {
        handleSubmit(fullPin);
      }
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, pinLength);
    
    if (pastedData.length > 0) {
      const newPin = [...pin];
      pastedData.split('').forEach((digit, i) => {
        if (i < pinLength) {
          newPin[i] = digit;
        }
      });
      setPin(newPin);
      
      // Focus last filled or next empty
      const lastIndex = Math.min(pastedData.length, pinLength) - 1;
      inputRefs.current[lastIndex]?.focus();
      
      // Auto-submit if complete
      if (pastedData.length === pinLength) {
        handleSubmit(newPin.join(''));
      }
    }
  };

  // Handle submit
  const handleSubmit = async (fullPin: string) => {
    if (fullPin.length !== pinLength) {
      setError('Lütfen tüm rakamları girin');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isValid = await onVerify(fullPin);
      if (!isValid) {
        setError('Yanlış PIN kodu. Tekrar deneyin.');
        setPin(Array(pinLength).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Bir hata oluştu. Tekrar deneyin.');
      setPin(Array(pinLength).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isLoading && onClose()}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-slate-700">
                <AvatarImage 
                  src={accountAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${accountName}`} 
                  alt={accountName} 
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl">
                  {getInitials(accountName)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-slate-800 rounded-full p-1.5 border-2 border-slate-700">
                <Lock className="h-4 w-4 text-purple-400" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-xl">{accountName}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {/* PIN Input */}
          <div className="flex justify-center gap-3 mb-4">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el; }}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={cn(
                  "w-14 h-14 text-center text-2xl font-bold rounded-lg",
                  "bg-slate-800 border-2 border-slate-700",
                  "focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20",
                  "transition-all duration-200",
                  error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
                disabled={isLoading}
                autoComplete="off"
              />
            ))}
          </div>

          {/* Show/Hide PIN Toggle */}
          <div className="flex justify-center mb-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => setShowPin(!showPin)}
            >
              {showPin ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  PIN&apos;i Gizle
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  PIN&apos;i Göster
                </>
              )}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center justify-center gap-2 text-red-400 text-sm mb-4">
              <X className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => handleSubmit(pin.join(''))}
              disabled={pin.some(d => !d) || isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Doğrulanıyor...
                </span>
              ) : (
                'Giriş Yap'
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
            >
              İptal
            </Button>
          </div>

          {/* Forgot PIN */}
          <div className="mt-4 text-center">
            <button 
              type="button"
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              disabled={isLoading}
            >
              PIN kodumu unuttum
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PinVerificationModal;
