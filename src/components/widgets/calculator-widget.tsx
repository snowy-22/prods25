
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CalculatorWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

export default function CalculatorWidget({ size = 'medium' }: CalculatorWidgetProps) {
  const [display, setDisplay] = useState('0');
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(true);

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setCurrentValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (currentValue === null) {
      setCurrentValue(inputValue);
    } else if (operator) {
      const result = calculate(currentValue, inputValue, operator);
      setCurrentValue(result);
      setDisplay(String(result));
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const calculate = (firstOperand: number, secondOperand: number, op: string) => {
    switch (op) {
      case '+': return firstOperand + secondOperand;
      case '-': return firstOperand - secondOperand;
      case '*': return firstOperand * secondOperand;
      case '/': return firstOperand / secondOperand;
      case '=': return secondOperand;
      default: return secondOperand;
    }
  };

  const handleEquals = () => {
    if (operator && currentValue !== null) {
      const inputValue = parseFloat(display);
      const result = calculate(currentValue, inputValue, operator);
      setDisplay(String(result));
      setCurrentValue(null); // Reset for next calculation
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  const buttons = [
    { label: 'AC', handler: clearAll, className: 'col-span-2 bg-destructive/80 hover:bg-destructive text-destructive-foreground' },
    { label: 'C', handler: clearAll, className: 'bg-destructive/80 hover:bg-destructive text-destructive-foreground' },
    { label: '/', handler: () => performOperation('/'), isOperator: true },
    { label: '7', handler: () => inputDigit('7') },
    { label: '8', handler: () => inputDigit('8') },
    { label: '9', handler: () => inputDigit('9') },
    { label: '*', handler: () => performOperation('*'), isOperator: true },
    { label: '4', handler: () => inputDigit('4') },
    { label: '5', handler: () => inputDigit('5') },
    { label: '6', handler: () => inputDigit('6') },
    { label: '-', handler: () => performOperation('-'), isOperator: true },
    { label: '1', handler: () => inputDigit('1') },
    { label: '2', handler: () => inputDigit('2') },
    { label: '3', handler: () => inputDigit('3') },
    { label: '+', handler: () => performOperation('+'), isOperator: true },
    { label: '0', handler: () => inputDigit('0'), className: 'col-span-2' },
    { label: '.', handler: inputDecimal },
    { label: '=', handler: handleEquals, isOperator: true },
  ];

  return (
    <div className={cn(
      "flex h-full w-full flex-col bg-background",
      isSmall && "p-1",
      !isSmall && !isLarge && "p-2",
      isLarge && "p-4"
    )}>
      <div className={cn(
        "flex-1 rounded-md bg-muted text-right font-mono text-foreground flex items-end justify-end break-all",
        isSmall && "p-2 text-lg",
        !isSmall && !isLarge && "p-4 text-4xl",
        isLarge && "p-6 text-5xl"
      )}>
        {display}
      </div>
      <div className={cn(
        "grid grid-cols-4",
        isSmall && "mt-1 gap-1",
        !isSmall && !isLarge && "mt-2 gap-2",
        isLarge && "mt-3 gap-3"
      )}>
        {buttons.map((btn) => (
          <Button
            key={btn.label}
            onClick={btn.handler}
            variant={btn.isOperator ? 'default' : 'secondary'}
            className={cn(
              isSmall && 'h-8 text-sm',
              !isSmall && !isLarge && 'h-14 text-xl',
              isLarge && 'h-20 text-2xl',
              btn.className
            )}
          >
            {btn.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

    