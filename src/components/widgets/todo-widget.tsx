

'use client';

import { useState } from 'react';
import { ContentItem, Task, TaskStatus } from '@/lib/initial-content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

interface ToDoListWidgetProps {
  item: ContentItem;
  onUpdateItem: (itemId: string, updates: Partial<ContentItem>) => void;
  statusToShow?: TaskStatus; // For expanded view
  size?: 'small' | 'medium' | 'large';
}

const statusMap: Record<TaskStatus, string> = {
  todo: 'Yapılacaklar',
  doing: 'Yapılıyor',
  done: 'Bitti',
};

const ToDoColumn = ({ 
  title, 
  tasks,
  status, 
  onAddTask, 
  onToggleTask, 
  onDeleteTask,
  size = 'medium',
  allowQuickAdd = false,
}: {
  title: string;
  tasks: Task[];
  status: TaskStatus;
  onAddTask: (status: TaskStatus, content: string) => void;
  onToggleTask: (status: TaskStatus, taskId: string) => void;
  onDeleteTask: (status: TaskStatus, taskId: string) => void;
  size?: 'small' | 'medium' | 'large';
  allowQuickAdd?: boolean;
}) => {
  const [newTaskContent, setNewTaskContent] = useState('');

  const handleAddTask = () => {
    if (newTaskContent.trim()) {
      onAddTask(status, newTaskContent);
      setNewTaskContent('');
    }
  };
  
  return (
    <div className={cn(
        'flex flex-col h-full bg-background/50 rounded-lg p-2',
        size === 'small' && 'p-1'
    )}>
        <h3 className={cn(
            "font-semibold text-center mb-2",
            size === 'small' && "text-xs mb-1"
        )}>{title}</h3>
        <ScrollArea className='flex-1 pr-2'>
            <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className={cn(
              "flex items-center gap-2 group bg-card p-2 rounded-md",
              size === 'small' && "p-1 gap-1"
            )}>
            <Checkbox
              id={`task-${task.id}`}
              checked={task.isCompleted}
              onCheckedChange={() => onToggleTask(status, task.id)}
              className={size === 'small' ? "h-3 w-3" : ""}
            />
            <label
              htmlFor={`task-${task.id}`}
              className={cn(
                "flex-1 text-sm font-medium leading-none cursor-pointer",
                task.isCompleted ? "line-through text-muted-foreground" : "",
                size === 'small' && "text-[10px]"
              )}
            >
              {task.content}
            </label>
            <Button 
              size="icon" 
              variant="ghost" 
              className={cn(
                'h-6 w-6 opacity-0 group-hover:opacity-100',
                size === 'small' && "h-4 w-4"
              )}
              onClick={() => onDeleteTask(status, task.id)}
            >
              <Trash2 className={cn("h-4 w-4 text-destructive", size === 'small' && "h-3 w-3")} />
            </Button>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className={cn("text-center text-xs text-muted-foreground py-4 border border-dashed rounded-md", size === 'small' && "py-2 text-[10px]")}>
              Henüz görev yok
            </div>
          )}
            </div>
        </ScrollArea>
        {size !== 'small' && (
            <div className="mt-2 flex items-center gap-2">
                <Input
                value={newTaskContent}
                onChange={(e) => setNewTaskContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder="Yeni görev ekle..."
                className='h-8'
                />
                <Button size="icon" className="h-8 w-8 flex-shrink-0" onClick={handleAddTask}>
                <Plus className="h-4 w-4" />
                </Button>
            </div>
        )}
        {size === 'small' && allowQuickAdd && (
          <Button variant="outline" size="sm" className="mt-2 text-[11px]" onClick={() => {
            const content = window.prompt('Yeni görev ekle');
            if (content) {
              onAddTask(status, content);
            }
          }}>
            <Plus className="h-3 w-3 mr-1" /> Görev ekle
          </Button>
        )}
    </div>
  )
}

export default function ToDoListWidget({ item, onUpdateItem, statusToShow, size = 'medium' }: ToDoListWidgetProps) {
  const tasksByStatus = item.tasksByStatus || { todo: [], doing: [], done: [] };

  const handleUpdate = (newTasks: Record<TaskStatus, Task[]>) => {
    onUpdateItem(item.id, { tasksByStatus: newTasks });
  };

  const handleAddTask = (status: TaskStatus, content: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      content,
      isCompleted: false,
    };
    const newTasks = { ...tasksByStatus, [status]: [...(tasksByStatus[status] || []), newTask] };
    handleUpdate(newTasks);
  };

  const handleToggleTask = (status: TaskStatus, taskId: string) => {
    const newTasksForStatus = (tasksByStatus[status] || []).map(task =>
      task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
    );
    const newTasks = { ...tasksByStatus, [status]: newTasksForStatus };
    handleUpdate(newTasks);
  };

  const handleDeleteTask = (status: TaskStatus, taskId: string) => {
    const newTasksForStatus = (tasksByStatus[status] || []).filter(task => task.id !== taskId);
    const newTasks = { ...tasksByStatus, [status]: newTasksForStatus };
    handleUpdate(newTasks);
  };
  
  // If size is small, only show 'todo' column or the specific statusToShow
  if (size === 'small') {
    const status = statusToShow || 'todo';
    return (
      <div className="h-full w-full overflow-hidden">
        <ToDoColumn
          title={statusMap[status]}
          tasks={tasksByStatus[status] || []}
          status={status}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          size="small"
          allowQuickAdd
        />
      </div>
    );
  }

  // If size is medium, show tabs or side-by-side
  if (size === 'medium') {
    return (
      <div className="h-full w-full flex flex-col p-2 bg-background text-foreground">
        <Tabs defaultValue="todo" className="flex flex-col flex-1 h-full">
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="todo" className="text-xs">{statusMap.todo}</TabsTrigger>
            <TabsTrigger value="doing" className="text-xs">{statusMap.doing}</TabsTrigger>
            <TabsTrigger value="done" className="text-xs">{statusMap.done}</TabsTrigger>
          </TabsList>
          {(Object.keys(statusMap) as TaskStatus[]).map(status => (
              <TabsContent key={status} value={status} className="flex-1 mt-2 min-h-0">
                  <ToDoColumn 
                      title=""
                      tasks={tasksByStatus[status] || []}
                      status={status}
                      onAddTask={handleAddTask}
                      onToggleTask={handleToggleTask}
                      onDeleteTask={handleDeleteTask}
                      size="medium"
                  />
              </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  }

  // Large size: Show all 3 columns side by side
  return (
    <div className="grid grid-cols-3 gap-4 h-full w-full overflow-hidden p-4 bg-background">
      {(['todo', 'doing', 'done'] as TaskStatus[]).map((status) => (
        <ToDoColumn
          key={status}
          title={statusMap[status]}
          tasks={tasksByStatus[status] || []}
          status={status}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          size="large"
        />
      ))}
    </div>
  );
}
