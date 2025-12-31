
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Expand } from 'lucide-react';

type TVMField = 'N' | 'I/Y' | 'PV' | 'PMT' | 'FV';

type AmortizationRow = {
  period: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
};

export default function FinancialEngineeringWidget() {
  const [n, setN] = useState('120'); // Periods (e.g., months)
  const [iy, setIy] = useState('5'); // Interest per year
  const [pv, setPv] = useState('100000'); // Present Value
  const [pmt, setPmt] = useState(''); // Payment
  const [fv, setFv] = useState('0'); // Future Value
  const [compute, setCompute] = useState<TVMField>('PMT');
  const [amortizationTable, setAmortizationTable] = useState<AmortizationRow[]>([]);
  const [isTableVisible, setIsTableVisible] = useState(false);

  // Simple Interest State
  const [simplePrincipal, setSimplePrincipal] = useState('10000');
  const [simpleRate, setSimpleRate] = useState('5');
  const [simpleTime, setSimpleTime] = useState('1');
  const [simpleResult, setSimpleResult] = useState<string | null>(null);

  // Compound Interest State
  const [compoundPrincipal, setCompoundPrincipal] = useState('10000');
  const [compoundRate, setCompoundRate] = useState('5');
  const [compoundTime, setCompoundTime] = useState('10');
  const [compoundFreq, setCompoundFreq] = useState('12'); // Monthly
  const [compoundResult, setCompoundResult] = useState<string | null>(null);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  }

  const calculateTVM = () => {
    const i = parseFloat(iy) / 100 / 12; // Monthly interest rate
    const periods = parseFloat(n);
    let presentValue = parseFloat(pv) || 0;
    let payment = parseFloat(pmt) || 0;
    let futureValue = parseFloat(fv) || 0;
    let table: AmortizationRow[] = [];
    let balance = presentValue;

    try {
        let result: number;
        switch (compute) {
            case 'FV':
                result = -(presentValue * Math.pow(1 + i, periods) + payment * (Math.pow(1 + i, periods) - 1) / i);
                setFv(result.toFixed(2));
                break;
            case 'PV':
                result = -((payment * (Math.pow(1 + i, periods) - 1)) / i + futureValue) / Math.pow(1 + i, periods);
                setPv(result.toFixed(2));
                presentValue = result; // Update for table
                balance = result;
                break;
            case 'PMT':
                result = -(presentValue * Math.pow(1 + i, periods) + futureValue) / ((Math.pow(1 + i, periods) - 1) / i);
                setPmt(result.toFixed(2));
                payment = result; // Update for table
                break;
            case 'N':
                result = Math.log((payment - i * futureValue) / (payment + i * presentValue)) / Math.log(1 + i);
                setN(result.toFixed(2));
                break;
            case 'I/Y':
                 alert('Faiz oranı (I/Y) hesaplaması şu anda desteklenmemektedir.');
                 return;
        }

        // Generate amortization table
        if (compute === 'PMT' || compute === 'PV') {
             for (let j = 1; j <= periods; j++) {
                const interestPayment = balance * i;
                const principalPayment = payment + interestPayment; // Payment is negative
                balance += principalPayment;
                table.push({
                    period: j,
                    payment: -payment,
                    interest: -interestPayment,
                    principal: -principalPayment,
                    balance: balance,
                });
            }
            setAmortizationTable(table);
        } else {
            setAmortizationTable([]);
        }


    } catch(e) {
        alert('Hesaplama hatası. Lütfen girdileri kontrol edin.');
    }
  };

   const calculateSimpleInterest = () => {
    const p = parseFloat(simplePrincipal);
    const r = parseFloat(simpleRate) / 100;
    const t = parseFloat(simpleTime);
    if (isNaN(p) || isNaN(r) || isNaN(t)) return;
    const interest = p * r * t;
    const total = p + interest;
    setSimpleResult(`Toplam: ${formatCurrency(total)} (Faiz: ${formatCurrency(interest)})`);
  };

  const calculateCompoundInterest = () => {
    const p = parseFloat(compoundPrincipal);
    const r = parseFloat(compoundRate) / 100;
    const t = parseFloat(compoundTime);
    const n_freq = parseInt(compoundFreq);
    if (isNaN(p) || isNaN(r) || isNaN(t) || isNaN(n_freq)) return;
    const amount = p * Math.pow((1 + r / n_freq), n_freq * t);
    const interest = amount - p;
    setCompoundResult(`Toplam: ${formatCurrency(amount)} (Faiz: ${formatCurrency(interest)})`);
  };


  const tvmFields: { id: TVMField; label: string; value: string; setter: (val: string) => void }[] = [
    { id: 'N', label: 'Periyot (Ay)', value: n, setter: setN },
    { id: 'I/Y', label: 'Yıllık Faiz %', value: iy, setter: setIy },
    { id: 'PV', label: 'Bugünkü Değer (₺)', value: pv, setter: setPv },
    { id: 'PMT', label: 'Taksit (₺)', value: pmt, setter: setPmt },
    { id: 'FV', label: 'Gelecek Değer (₺)', value: fv, setter: setFv },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-background p-2 text-foreground">
        <Tabs defaultValue="tvm" className="w-full flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tvm">TVM</TabsTrigger>
                <TabsTrigger value="simple">Basit</TabsTrigger>
                <TabsTrigger value="compound">Bileşik</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tvm" className="flex-1 flex flex-col mt-2">
                 <div className="space-y-1.5 p-1 flex-1">
                    {tvmFields.map(field => (
                        <div key={field.id} className="grid grid-cols-5 items-center gap-2">
                            <Label htmlFor={field.id} className="col-span-2 text-xs text-muted-foreground">{field.label}</Label>
                            <Input
                                id={field.id}
                                type="number"
                                value={field.value}
                                onChange={(e) => field.setter(e.target.value)}
                                className={cn("col-span-3 h-8 text-right", compute === field.id && "bg-primary/10 border-primary font-bold")}
                                disabled={compute === field.id}
                            />
                        </div>
                    ))}
                </div>
                <div className="p-1">
                    <Label className="text-xs text-muted-foreground">Hesaplanacak Değer</Label>
                    <ToggleGroup type="single" value={compute} onValueChange={(value: TVMField) => value && setCompute(value)} className="grid grid-cols-5 gap-1 mt-1">
                        {tvmFields.map(field => (
                            <ToggleGroupItem key={`toggle-${field.id}`} value={field.id} aria-label={field.label} className="h-8">
                                {field.id}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                    <div className='flex gap-2 mt-2'>
                        <Button onClick={calculateTVM} className="w-full">
                            Hesapla
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setIsTableVisible(true)} disabled={amortizationTable.length === 0}>
                            <Expand className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="simple" className="flex-1 flex flex-col mt-2 p-1">
                <div className="space-y-2 flex-1">
                    <div>
                        <Label htmlFor="simplePrincipal">Ana Para (₺)</Label>
                        <Input id="simplePrincipal" type="number" value={simplePrincipal} onChange={(e) => setSimplePrincipal(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="simpleRate">Yıllık Faiz Oranı (%)</Label>
                        <Input id="simpleRate" type="number" value={simpleRate} onChange={(e) => setSimpleRate(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="simpleTime">Süre (Yıl)</Label>
                        <Input id="simpleTime" type="number" value={simpleTime} onChange={(e) => setSimpleTime(e.target.value)} />
                    </div>
                </div>
                <Button onClick={calculateSimpleInterest} className="w-full mt-2">Hesapla</Button>
                {simpleResult && <p className="mt-4 text-center font-semibold">{simpleResult}</p>}
            </TabsContent>
            
            <TabsContent value="compound" className="flex-1 flex flex-col mt-2 p-1">
                 <div className="space-y-2 flex-1">
                    <div>
                        <Label htmlFor="compoundPrincipal">Ana Para (₺)</Label>
                        <Input id="compoundPrincipal" type="number" value={compoundPrincipal} onChange={(e) => setCompoundPrincipal(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="compoundRate">Yıllık Faiz Oranı (%)</Label>
                        <Input id="compoundRate" type="number" value={compoundRate} onChange={(e) => setCompoundRate(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="compoundTime">Süre (Yıl)</Label>
                        <Input id="compoundTime" type="number" value={compoundTime} onChange={(e) => setCompoundTime(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="compoundFreq">Yıllık Birleştirme Sayısı</Label>
                        <Input id="compoundFreq" type="number" value={compoundFreq} onChange={(e) => setCompoundFreq(e.target.value)} />
                    </div>
                </div>
                <Button onClick={calculateCompoundInterest} className="w-full mt-2">Hesapla</Button>
                {compoundResult && <p className="mt-4 text-center font-semibold">{compoundResult}</p>}
            </TabsContent>

        </Tabs>
         <Dialog open={isTableVisible} onOpenChange={setIsTableVisible}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Amortisman Tablosu</DialogTitle>
                    <DialogDescription>
                        Kredi veya yatırımınızın zaman içindeki geri ödeme dökümü.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1">
                    <Table>
                        <TableHeader className='sticky top-0 bg-secondary'>
                            <TableRow>
                                <TableHead>Periyot</TableHead>
                                <TableHead className="text-right">Taksit</TableHead>
                                <TableHead className="text-right">Faiz</TableHead>
                                <TableHead className="text-right">Anapara</TableHead>
                                <TableHead className="text-right">Kalan Bakiye</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {amortizationTable.map(row => (
                                <TableRow key={row.period}>
                                    <TableCell>{row.period}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.payment)}</TableCell>
                                    <TableCell className="text-right text-red-500">{formatCurrency(row.interest)}</TableCell>
                                    <TableCell className="text-right text-green-500">{formatCurrency(row.principal)}</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(row.balance)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    </div>
  );
}
