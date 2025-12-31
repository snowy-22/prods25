// src/components/widgets/currency-converter-widget.tsx

'use client';

import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowRightLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

// Mock data, in a real app this would come from an API
const exchangeRates: Record<string, number> = {
    'TRY': 1,
    'USD': 0.030,
    'EUR': 0.028,
    'GBP': 0.024,
};
const currencies = Object.keys(exchangeRates);

interface CurrencyConverterProps {
  size?: 'small' | 'medium' | 'large';
}

export default function CurrencyConverterWidget({ size = 'medium' }: CurrencyConverterProps) {
    const [amount, setAmount] = useState('100');
    const [fromCurrency, setFromCurrency] = useState('TRY');
    const [toCurrency, setToCurrency] = useState('USD');
    const [result, setResult] = useState('');

    useEffect(() => {
        const convert = () => {
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount)) {
                setResult('');
                return;
            }
            const rateFrom = exchangeRates[fromCurrency];
            const rateTo = exchangeRates[toCurrency];
            const convertedAmount = (numAmount / rateFrom) * rateTo;
            setResult(convertedAmount.toFixed(2));
        };
        convert();
    }, [amount, fromCurrency, toCurrency]);

    const handleSwap = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    }

    const isSmall = size === 'small';
    const isLarge = size === 'large';

  return (
    <div className={cn(
      "flex h-full w-full flex-col items-center justify-center bg-muted text-center gap-4",
      isSmall && "p-2",
      !isSmall && !isLarge && "p-4",
      isLarge && "p-6"
    )}>
      <h3 className={cn(
        "font-bold",
        isSmall && "text-sm",
        !isSmall && !isLarge && "text-lg",
        isLarge && "text-2xl"
      )}>Döviz Çevirici</h3>
      <div className={cn('flex items-center w-full', isSmall && 'gap-1', !isSmall && !isLarge && 'gap-2', isLarge && 'gap-3')}>
         <Input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={cn(isSmall && "text-xs h-7", !isSmall && !isLarge && "text-lg", isLarge && "text-xl h-12")}
         />
         <Select value={fromCurrency} onValueChange={setFromCurrency}>
            <SelectTrigger className={cn("w-[80px]", isSmall && "text-xs h-7", isLarge && "w-[120px] h-12")}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
         </Select>
      </div>
      <div className='flex items-center justify-center w-full'>
          <Button variant="ghost" size="icon" className={cn(isSmall && "h-6 w-6", isLarge && "h-10 w-10")} onClick={handleSwap}>
              <ArrowRightLeft className={cn("text-primary", isSmall && "h-4 w-4", !isSmall && !isLarge && "h-5 w-5", isLarge && "h-6 w-6")}/>
          </Button>
      </div>
       <div className={cn('flex items-center w-full', isSmall && 'gap-1', !isSmall && !isLarge && 'gap-2', isLarge && 'gap-3')}>
         <Input 
            readOnly
            value={result}
            className={cn("font-bold", isSmall && "text-xs h-7", !isSmall && !isLarge && "text-lg", isLarge && "text-xl h-12")}
         />
         <Select value={toCurrency} onValueChange={setToCurrency}>
            <SelectTrigger className={cn("w-[80px]", isSmall && "text-xs h-7", isLarge && "w-[120px] h-12")}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
         </Select>
      </div>
    </div>
  );
}
