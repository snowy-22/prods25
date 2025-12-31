// src/components/widgets/currency-rates-widget.tsx

'use client';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type RateData = {
    currency: string;
    rate: number;
    previousRate?: number;
    direction?: 'up' | 'down' | 'steady';
};

const currenciesToFetch = ['USD', 'EUR', 'GBP'];

async function fetchCurrencyRates(): Promise<Record<string, number> | null> {
    try {
        const response = await fetch(`https://api.frankfurter.app/latest?from=TRY&to=${currenciesToFetch.join(',')}`);
        if (!response.ok) {
            console.error("Döviz kuru API'sinden yanıt alınamadı.");
            return null;
        }
        const data = await response.json();
        return data.rates;
    } catch (error) {
        console.error("Döviz kurları çekilirken hata oluştu:", error);
        return null;
    }
}

interface CurrencyRatesWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

export default function CurrencyRatesWidget({ size = 'medium' }: CurrencyRatesWidgetProps) {
    const [rates, setRates] = useState<RateData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
        const updateRates = async () => {
            const newApiRates = await fetchCurrencyRates();
            if (newApiRates) {
                setRates(prevRates => {
                    return currenciesToFetch.map(currency => {
                        const newRate = 1 / newApiRates[currency]; // Convert from TRY to TARGET
                        const oldRateData = prevRates.find(r => r.currency === currency);
                        const previousRate = oldRateData?.rate;
                        let direction: RateData['direction'] = 'steady';
                        if (previousRate) {
                            if (newRate > previousRate) direction = 'up';
                            else if (newRate < previousRate) direction = 'down';
                        }
                        return { currency, rate: newRate, previousRate, direction };
                    });
                });
                setLastUpdated(new Date());
            }
            setIsLoading(false);
        };

        updateRates(); // Initial fetch
        const intervalId = setInterval(updateRates, 15000); // Update every 15 seconds

        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, []);

    const renderChange = (rate: RateData) => {
        if (!rate.previousRate || rate.direction === 'steady') {
            return <span className="text-muted-foreground">-</span>;
        }
        const change = ((rate.rate - rate.previousRate) / rate.previousRate) * 100;
        
        return (
            <div className={cn(
                "flex items-center text-xs font-semibold",
                rate.direction === 'up' ? 'text-green-500' : 'text-red-500'
            )}>
                {rate.direction === 'up' ? <TrendingUp className="h-4 w-4 mr-1"/> : <TrendingDown className="h-4 w-4 mr-1" />}
                <span>{change.toFixed(2)}%</span>
            </div>
        );
    };

    return (
        <div className="flex h-full w-full flex-col bg-card p-2">
            <h3 className="font-semibold text-center text-sm p-2">Canlı Kurlar (TRY)</h3>
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            ) : (
                <div className="flex-1 space-y-1">
                    {rates.map(item => (
                        <div key={item.currency} className="grid grid-cols-3 items-center p-2 rounded-md hover:bg-muted">
                            <div className="font-semibold text-sm">{item.currency}</div>
                            <div className="text-center font-mono">{item.rate.toFixed(4)}</div>
                            <div className="flex justify-end">
                                {renderChange(item)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="text-center text-xs text-muted-foreground p-1 border-t">
                {lastUpdated ? `Son Güncelleme: ${lastUpdated.toLocaleTimeString()}` : 'Yükleniyor...'}
            </div>
        </div>
    );
}
