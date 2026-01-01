'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import { TrendingUp, DollarSign, Calculator, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Currency = 'USD' | 'EUR' | 'GBP' | 'TRY' | 'JPY' | 'INR';

interface InflationDataPoint {
    year: number;
    inflation: number;
    price: number;
}

interface RegressionData {
    timestamp: number;
    price: number;
    currency: Currency;
}

// Exchange rates (relative to USD)
const exchangeRates: Record<Currency, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    TRY: 32.5,
    JPY: 149.5,
    INR: 83.1,
};

const inflationRates: Record<Currency, number> = {
    USD: 3.4,
    EUR: 2.6,
    GBP: 4.0,
    TRY: 61.5,
    JPY: 2.5,
    INR: 6.8,
};

export default function FinancialCalculator() {
    const { toast } = useToast();

    // Inflation Calculator
    const [oldPrice, setOldPrice] = useState<number>(100);
    const [inflationPercent, setInflationPercent] = useState<number>(3.4);
    const [years, setYears] = useState<number>(5);
    const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
    const [futureYears, setFutureYears] = useState<number>(10);

    // Multi-Currency Price Tracker
    const [priceHistory, setPriceHistory] = useState<RegressionData[]>([
        { timestamp: 0, price: 100, currency: 'USD' },
        { timestamp: 90, price: 105, currency: 'USD' },
        { timestamp: 180, price: 110, currency: 'USD' },
        { timestamp: 270, price: 108, currency: 'USD' },
        { timestamp: 360, price: 115, currency: 'USD' },
    ]);

    const [newPrice, setNewPrice] = useState<number>(115);
    const [newCurrency, setNewCurrency] = useState<Currency>('USD');

    // Calculations
    const inflationData = useMemo(() => {
        const data: InflationDataPoint[] = [];
        const rate = inflationPercent / 100;
        let currentPrice = oldPrice;

        for (let i = 0; i <= years; i++) {
            data.push({
                year: i,
                inflation: inflationPercent,
                price: Math.round(currentPrice * 100) / 100,
            });
            currentPrice *= (1 + rate);
        }

        return data;
    }, [oldPrice, inflationPercent, years]);

    const futureProjection = useMemo(() => {
        const data: InflationDataPoint[] = [];
        const rate = inflationPercent / 100;
        let currentPrice = oldPrice;

        for (let i = 0; i <= futureYears; i++) {
            data.push({
                year: i,
                inflation: inflationPercent,
                price: Math.round(currentPrice * 100) / 100,
            });
            currentPrice *= (1 + rate);
        }

        return data;
    }, [oldPrice, inflationPercent, futureYears]);

    const midPointPrice = useMemo(() => {
        if (inflationData.length > 0) {
            const midIndex = Math.floor(inflationData.length / 2);
            return inflationData[midIndex].price;
        }
        return oldPrice;
    }, [inflationData, oldPrice]);

    // Linear Regression for price prediction
    const calculateRegression = (data: RegressionData[]) => {
        if (data.length < 2) return null;

        const n = data.length;
        const sumX = data.reduce((sum, d) => sum + d.timestamp, 0);
        const sumY = data.reduce((sum, d) => sum + d.price, 0);
        const sumXY = data.reduce((sum, d) => sum + d.timestamp * d.price, 0);
        const sumX2 = data.reduce((sum, d) => sum + d.timestamp * d.timestamp, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return { slope, intercept };
    };

    const regression = calculateRegression(priceHistory);

    const predictedPrice = useMemo(() => {
        if (!regression) return newPrice;
        const prediction = regression.intercept + regression.slope * 450;
        return Math.round(prediction * 100) / 100;
    }, [regression, newPrice]);

    // Currency conversion
    const convertPrice = (price: number, fromCurrency: Currency, toCurrency: Currency) => {
        const inUSD = price / exchangeRates[fromCurrency];
        return inUSD * exchangeRates[toCurrency];
    };

    const currencyConversionChart = useMemo(() => {
        const currencies: Currency[] = ['USD', 'EUR', 'GBP', 'TRY', 'JPY'];
        return currencies.map(curr => ({
            currency: curr,
            price: Math.round(convertPrice(100, 'USD', curr) * 100) / 100,
        }));
    }, []);

    const handleAddPricePoint = () => {
        const newData = [
            ...priceHistory,
            { timestamp: (priceHistory[priceHistory.length - 1]?.timestamp || 0) + 90, price: newPrice, currency: newCurrency },
        ];
        setPriceHistory(newData);
        toast({ title: 'Fiyat noktası eklendi', description: `${newPrice} ${newCurrency}` });
    };

    return (
        <div className="w-full space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Finansal Araçlar
                    </CardTitle>
                    <CardDescription>
                        Enflasyon, fiyat takibi ve çoklu kur hesaplamaları
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="inflation" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="inflation">Enflasyon</TabsTrigger>
                            <TabsTrigger value="tracking">Fiyat Takibi</TabsTrigger>
                            <TabsTrigger value="currency">Çoklu Kur</TabsTrigger>
                        </TabsList>

                        {/* INFLATION CALCULATOR */}
                        <TabsContent value="inflation" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Eski Fiyat ({selectedCurrency})</Label>
                                    <Input
                                        type="number"
                                        value={oldPrice}
                                        onChange={(e) => setOldPrice(parseFloat(e.target.value) || 0)}
                                        placeholder="100"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Enflasyon Oranı (%)</Label>
                                    <div className="flex gap-2 items-center">
                                        <Slider
                                            value={[inflationPercent]}
                                            onValueChange={(v) => setInflationPercent(v[0])}
                                            min={0.1}
                                            max={100}
                                            step={0.1}
                                            className="flex-1"
                                        />
                                        <span className="text-sm font-semibold w-12">{inflationPercent.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Para Birimi</Label>
                                    <Select value={selectedCurrency} onValueChange={(v) => setSelectedCurrency(v as Currency)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.keys(exchangeRates).map((curr) => (
                                                <SelectItem key={curr} value={curr}>
                                                    {curr}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Dönem (Yıl)</Label>
                                    <Input
                                        type="number"
                                        value={years}
                                        onChange={(e) => setYears(parseInt(e.target.value) || 0)}
                                        placeholder="5"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gelecek (Yıl)</Label>
                                    <Input
                                        type="number"
                                        value={futureYears}
                                        onChange={(e) => setFutureYears(parseInt(e.target.value) || 0)}
                                        placeholder="10"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <Card className="bg-blue-50 dark:bg-blue-950">
                                    <CardContent className="pt-4">
                                        <div className="text-sm text-muted-foreground">Yeni Fiyat ({years} yıl sonra)</div>
                                        <div className="text-2xl font-bold">
                                            {(inflationData[years]?.price || oldPrice).toFixed(2)} {selectedCurrency}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-green-50 dark:bg-green-950">
                                    <CardContent className="pt-4">
                                        <div className="text-sm text-muted-foreground">Ara Dönem ({Math.ceil(years / 2)} yıl)</div>
                                        <div className="text-2xl font-bold">
                                            {midPointPrice.toFixed(2)} {selectedCurrency}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-purple-50 dark:bg-purple-950">
                                    <CardContent className="pt-4">
                                        <div className="text-sm text-muted-foreground">Fark</div>
                                        <div className="text-2xl font-bold text-red-600">
                                            +{((inflationData[years]?.price || 0) - oldPrice).toFixed(2)} {selectedCurrency}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={futureProjection}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="year" label={{ value: 'Yıl', position: 'insideRight', offset: -5 }} />
                                    <YAxis label={{ value: 'Fiyat', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip formatter={(value) => (typeof value === 'number' ? value.toFixed(2) : value)} />
                                    <Legend />
                                    <Bar dataKey="inflation" fill="#8884d8" name="Enflasyon %" opacity={0.4} />
                                    <Line type="monotone" dataKey="price" stroke="#82ca9d" name="Fiyat" strokeWidth={2} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </TabsContent>

                        {/* PRICE TRACKING */}
                        <TabsContent value="tracking" className="space-y-4">
                            <div className="space-y-2">
                                <Label>Yeni Fiyat Ekle</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                                        placeholder="Fiyat"
                                        className="flex-1"
                                    />
                                    <Select value={newCurrency} onValueChange={(v) => setNewCurrency(v as Currency)}>
                                        <SelectTrigger className="w-24">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.keys(exchangeRates).map((curr) => (
                                                <SelectItem key={curr} value={curr}>
                                                    {curr}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={handleAddPricePoint}>Ekle</Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Card className="bg-blue-50 dark:bg-blue-950">
                                    <CardContent className="pt-4">
                                        <div className="text-sm text-muted-foreground">Ortalama Fiyat</div>
                                        <div className="text-2xl font-bold">
                                            {(priceHistory.reduce((sum, d) => sum + d.price, 0) / priceHistory.length).toFixed(2)} {newCurrency}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-green-50 dark:bg-green-950">
                                    <CardContent className="pt-4">
                                        <div className="text-sm text-muted-foreground">Tahmin (Gelecek Dönem)</div>
                                        <div className="text-2xl font-bold text-green-600">
                                            {predictedPrice.toFixed(2)} {newCurrency}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={priceHistory}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="timestamp" label={{ value: 'Gün', position: 'insideRight', offset: -5 }} />
                                    <YAxis label={{ value: 'Fiyat', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip formatter={(value) => (typeof value === 'number' ? value.toFixed(2) : value)} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="price"
                                        stroke="#82ca9d"
                                        name="Fiili Fiyat"
                                        strokeWidth={2}
                                        dot={{ fill: '#82ca9d', r: 4 }}
                                    />
                                    {regression && (
                                        <Line
                                            type="linear"
                                            dataKey={(d) => regression.intercept + regression.slope * d.timestamp}
                                            stroke="#8884d8"
                                            name="Regresyon (Tahmin)"
                                            strokeDasharray="5 5"
                                        />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </TabsContent>

                        {/* MULTI-CURRENCY */}
                        <TabsContent value="currency" className="space-y-4">
                            <div className="space-y-2">
                                <Label>100 USD = ?</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {currencyConversionChart.map((item) => (
                                        <Card key={item.currency}>
                                            <CardContent className="pt-4 text-center">
                                                <div className="text-sm text-muted-foreground">{item.currency}</div>
                                                <div className="text-xl font-bold">{item.price.toFixed(2)}</div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={currencyConversionChart}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="currency" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => (typeof value === 'number' ? value.toFixed(2) : value)} />
                                    <Legend />
                                    <Line type="monotone" dataKey="price" stroke="#ffc658" name="100 USD Karşılığı" strokeWidth={2} dot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
