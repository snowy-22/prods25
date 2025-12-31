// src/components/widgets/unit-converter-widget.tsx

'use client';

import { useState, useMemo } from 'react';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

const conversionFactors: Record<string, Record<string, number>> = {
  length: {
    m: 1,
    km: 1000,
    cm: 0.01,
    mm: 0.001,
    mi: 1609.34,
    yd: 0.9144,
    ft: 0.3048,
    in: 0.0254,
  },
  mass: {
    kg: 1,
    g: 0.001,
    mg: 0.000001,
    lb: 0.453592,
    oz: 0.0283495,
  },
  temperature: {
    c: 1,
    f: 1,
    k: 1,
  },
};

const categoryNames = {
  length: 'Uzunluk',
  mass: 'Kütle',
  temperature: 'Sıcaklık',
};

type Category = keyof typeof conversionFactors;

interface UnitConverterWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

export default function UnitConverterWidget({ size = 'medium' }: UnitConverterWidgetProps) {
  const [category, setCategory] = useState<Category>('length');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('km');
  const [inputValue, setInputValue] = useState('1');
  const [outputValue, setOutputValue] = useState('0.001');

  const units = useMemo(() => Object.keys(conversionFactors[category]), [category]);

  // Reset units when category changes
  useState(() => {
    setFromUnit(units[0]);
    setToUnit(units[1] || units[0]);
  });

  useMemo(() => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      setOutputValue('');
      return;
    }

    let result;
    if (category === 'temperature') {
        if (fromUnit === 'c' && toUnit === 'f') result = value * 9/5 + 32;
        else if (fromUnit === 'f' && toUnit === 'c') result = (value - 32) * 5/9;
        else if (fromUnit === 'c' && toUnit === 'k') result = value + 273.15;
        else if (fromUnit === 'k' && toUnit === 'c') result = value - 273.15;
        else if (fromUnit === 'f' && toUnit === 'k') result = (value - 32) * 5/9 + 273.15;
        else if (fromUnit === 'k' && toUnit === 'f') result = (value - 273.15) * 9/5 + 32;
        else result = value; // Same unit
    } else {
        const fromFactor = conversionFactors[category][fromUnit];
        const toFactor = conversionFactors[category][toUnit];
        result = (value * fromFactor) / toFactor;
    }

    setOutputValue(result.toFixed(3));
  }, [inputValue, fromUnit, toUnit, category]);

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <div className={cn(
      "flex h-full w-full flex-col bg-card gap-3",
      isSmall && "p-1",
      !isSmall && !isLarge && "p-3",
      isLarge && "p-4"
    )}>
        <h3 className={cn(
          "font-bold flex items-center gap-2",
          isSmall && "text-xs",
          !isSmall && !isLarge && "text-sm",
          isLarge && "text-base"
        )}>
          <Scale className={cn("text-primary", isSmall && "h-4 w-4", !isSmall && !isLarge && "h-5 w-5", isLarge && "h-6 w-6")}/>
          Birim Çevirici
        </h3>
        <Select value={category} onValueChange={(val) => setCategory(val as Category)}>
            <SelectTrigger className={cn(isSmall && "h-7 text-xs", isLarge && "h-10")}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {Object.keys(categoryNames).map(cat => (
                    <SelectItem key={cat} value={cat}>{(categoryNames as any)[cat]}</SelectItem>
                ))}
            </SelectContent>
        </Select>

        <div className={cn("flex items-center", isSmall && "gap-1", !isSmall && !isLarge && "gap-2", isLarge && "gap-3")}>
            <Input 
              type="number" 
              value={inputValue} 
              onChange={e => setInputValue(e.target.value)}
              className={cn(isSmall && "h-7 text-xs", isLarge && "h-10 text-lg")} 
            />
            <Select value={fromUnit} onValueChange={setFromUnit}>
                <SelectTrigger className={cn("w-[100px]", isSmall && "h-7 text-xs", isLarge && "w-[140px] h-10")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
        </div>
        <div className={cn("flex items-center", isSmall && "gap-1", !isSmall && !isLarge && "gap-2", isLarge && "gap-3")}>
            <Input 
              readOnly 
              value={outputValue}
              className={cn("font-semibold", isSmall && "h-7 text-xs", isLarge && "h-10 text-lg")}
            />
            <Select value={toUnit} onValueChange={setToUnit}>
                <SelectTrigger className={cn("w-[100px]", isSmall && "h-7 text-xs", isLarge && "w-[140px] h-10")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
        </div>
    </div>
  );
}
