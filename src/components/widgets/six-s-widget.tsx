"use client";

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, Shield, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type StepStatus = 'todo' | 'doing' | 'done';

type Step = {
  key: string;
  title: string;
  description: string;
  status: StepStatus;
};

const INITIAL_STEPS: Step[] = [
  { key: 'seiri', title: 'Seiri (Seç)', description: 'Gereksizleri ayıkla, iş alanını sadeleştir.', status: 'doing' },
  { key: 'seiton', title: 'Seiton (Sırala)', description: 'İşe göre diz, etiketle, herkes bulsun.', status: 'todo' },
  { key: 'seiso', title: 'Seiso (Sil)', description: 'Temizlik ve bakım rutinlerini belirle.', status: 'todo' },
  { key: 'seiketsu', title: 'Seiketsu (Standartlaştır)', description: 'İş talimatı, kontrol listesi, görsel standartlar.', status: 'todo' },
  { key: 'shitsuke', title: 'Shitsuke (Sürdür)', description: 'Disiplin, kültür ve alışkanlıkları pekiştir.', status: 'todo' },
  { key: 'safety', title: 'Safety (Güvenlik)', description: 'Risk analizi, PPE, acil durum planı.', status: 'doing' },
];

const statusOrder: StepStatus[] = ['todo', 'doing', 'done'];

export default function SixSWidget() {
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);

  const completion = useMemo(() => {
    const done = steps.filter((s) => s.status === 'done').length;
    return Math.round((done / steps.length) * 100);
  }, [steps]);

  const summary = useMemo(() => ({
    todo: steps.filter((s) => s.status === 'todo').length,
    doing: steps.filter((s) => s.status === 'doing').length,
    done: steps.filter((s) => s.status === 'done').length,
  }), [steps]);

  const cycleStatus = (key: string) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.key === key
          ? { ...step, status: statusOrder[(statusOrder.indexOf(step.status) + 1) % statusOrder.length] }
          : step
      )
    );
  };

  const setAllDone = () => setSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })));

  return (
    <Card className="h-full w-full">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle>6S Uygulaması</CardTitle>
          </div>
          <Button size="sm" variant="outline" onClick={setAllDone}>
            Hepsi Tamam
          </Button>
        </div>
        <CardDescription>Seiri, Seiton, Seiso, Seiketsu, Shitsuke, Safety</CardDescription>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tamamlanma</span>
            <span className="font-semibold text-foreground">%{completion}</span>
          </div>
          <Progress value={completion} />
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {summary.todo} Bekleyen</span>
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> {summary.doing} Devam</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {summary.done} Tamam</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.key}
            className={cn(
              'border rounded-lg p-3 transition-colors',
              step.status === 'done' ? 'border-emerald-200 bg-emerald-50/70' : 'hover:border-primary/30'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={step.status === 'done' ? 'default' : 'outline'} className="text-[10px] uppercase tracking-wide">
                    {step.title}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {step.status === 'todo' ? 'Planla' : step.status === 'doing' ? 'Uygula' : 'Tamamlandı'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-snug">{step.description}</p>
              </div>
              <Button size="sm" variant={step.status === 'done' ? 'secondary' : 'outline'} onClick={() => cycleStatus(step.key)}>
                {step.status === 'done' ? 'Geri Al' : 'İlerle'}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
