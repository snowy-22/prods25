
'use client';

import React from 'react';
import { Workflow, ArrowRight, Plus } from 'lucide-react';
import { Button } from '../ui/button';

export default function FlowchartWidget({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 bg-background overflow-auto">
      <div className="flex flex-col items-center gap-8">
        <div className="px-6 py-3 bg-primary text-primary-foreground rounded-lg shadow-lg font-bold">
          Başlangıç
        </div>
        <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
        <div className="px-6 py-3 border-2 border-primary rounded-lg shadow-md bg-card">
          İşlem Adımı 1
        </div>
        <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
        <div className="flex gap-12">
          <div className="px-6 py-3 border-2 border-orange-500 rounded-lg shadow-md bg-card">
            Karar A
          </div>
          <div className="px-6 py-3 border-2 border-blue-500 rounded-lg shadow-md bg-card">
            Karar B
          </div>
        </div>
        <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
        <div className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg font-bold">
          Bitiş
        </div>
      </div>
      <Button variant="outline" size="sm" className="absolute bottom-4 right-4">
        <Plus className="h-4 w-4 mr-2" />
        Adım Ekle
      </Button>
    </div>
  );
}
