
'use client';

import React, { useState } from 'react';
import { Plus, MoreVertical, GripVertical } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  content: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

export default function KanbanWidget({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const [columns, setColumns] = useState<Column[]>([
    { id: 'todo', title: 'Yapılacaklar', tasks: [{ id: '1', content: 'Örnek görev 1' }, { id: '2', content: 'Örnek görev 2' }] },
    { id: 'doing', title: 'Devam Edenler', tasks: [{ id: '3', content: 'Örnek görev 3' }] },
    { id: 'done', title: 'Tamamlananlar', tasks: [{ id: '4', content: 'Örnek görev 4' }] },
  ]);

  return (
    <div className="flex h-full w-full gap-4 p-4 bg-muted/50 overflow-x-auto">
      {columns.map((column) => (
        <div key={column.id} className="flex flex-col w-72 flex-shrink-0 gap-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-semibold text-sm">{column.title}</h3>
            <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
              {column.tasks.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {column.tasks.map((task) => (
              <Card key={task.id} className="p-3 text-sm shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing flex items-start gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span>{task.content}</span>
              </Card>
            ))}
            <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground h-9">
              <Plus className="h-4 w-4 mr-2" />
              Kart Ekle
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
