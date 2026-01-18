"use client";

import React, { useState } from 'react';
import { ContentItem } from '@/lib/initial-content';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Circle,
  ChevronRight,
  ChevronDown,
  Play,
  Image as ImageIcon,
  Video,
  Code,
  Award,
  RotateCcw
} from 'lucide-react';

interface InstructionWidgetProps {
  item: ContentItem;
  size?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  onUpdate?: (updates: Partial<ContentItem>) => void;
  isEditing?: boolean;
}

export const InstructionWidget: React.FC<InstructionWidgetProps> = ({
  item,
  size = 'M',
  onUpdate,
  isEditing = false
}) => {
  const instructionData = item.instructionData || {
    title: 'Talimat Başlığı',
    description: 'Bu talimat nasıl yapılacağını adım adım anlatır.',
    steps: [
      {
        id: 'step-1',
        order: 1,
        title: 'İlk Adım',
        content: 'İlk adımın detaylı açıklaması...',
        isOptional: false,
        estimatedTime: 5,
      },
      {
        id: 'step-2',
        order: 2,
        title: 'İkinci Adım',
        content: 'İkinci adımın detaylı açıklaması...',
        isOptional: false,
        estimatedTime: 10,
      },
    ],
    difficulty: 'beginner' as const,
    estimatedTotalTime: 15,
    completedSteps: [],
    completionRate: 0,
  };

  const [expandedStepId, setExpandedStepId] = useState<string | null>(
    instructionData.steps[0]?.id || null
  );
  const [viewMode, setViewMode] = useState<'list' | 'focus'>('list');

  const completedSteps = instructionData.completedSteps || [];
  const totalSteps = instructionData.steps.length;
  const completionRate = totalSteps > 0 
    ? Math.round((completedSteps.length / totalSteps) * 100) 
    : 0;

  const handleStepComplete = (stepId: string) => {
    const isCompleted = completedSteps.includes(stepId);
    const updatedCompletedSteps = isCompleted
      ? completedSteps.filter((id) => id !== stepId)
      : [...completedSteps, stepId];

    const newCompletionRate = Math.round(
      (updatedCompletedSteps.length / totalSteps) * 100
    );

    onUpdate?.({
      instructionData: {
        ...instructionData,
        completedSteps: updatedCompletedSteps,
        completionRate: newCompletionRate,
        lastAccessedStep: stepId,
      },
    });
  };

  const handleReset = () => {
    onUpdate?.({
      instructionData: {
        ...instructionData,
        completedSteps: [],
        completionRate: 0,
        lastAccessedStep: undefined,
      },
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'Başlangıç';
      case 'intermediate':
        return 'Orta';
      case 'advanced':
        return 'İleri';
      default:
        return difficulty;
    }
  };

  const getMediaIcon = (mediaType?: string) => {
    switch (mediaType) {
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'embed':
        return <Code className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const sizeClasses = {
    XS: 'text-xs p-2',
    S: 'text-sm p-3',
    M: 'text-base p-4',
    L: 'text-lg p-5',
    XL: 'text-xl p-6',
  };

  const currentStepIndex = instructionData.steps.findIndex(
    (s) => s.id === expandedStepId
  );

  return (
    <Card className={cn("w-full h-full flex flex-col", sizeClasses[size])}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge className={getDifficultyColor(instructionData.difficulty || 'beginner')}>
            {getDifficultyLabel(instructionData.difficulty || 'beginner')}
          </Badge>
          <div className="flex items-center gap-2">
            {completionRate === 100 && (
              <Badge variant="default" className="bg-green-600">
                <Award className="w-3 h-3 mr-1" />
                Tamamlandı
              </Badge>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleReset}>
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <CardTitle className="mt-2 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          {instructionData.title}
        </CardTitle>
        
        {instructionData.description && (
          <CardDescription>{instructionData.description}</CardDescription>
        )}

        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {instructionData.estimatedTotalTime || 0} dk
          </span>
          <span>{totalSteps} adım</span>
        </div>

        {/* Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span>{completedSteps.length}/{totalSteps} adım tamamlandı</span>
            <span className="font-medium">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto py-4">
        {/* Steps List */}
        <div className="space-y-2">
          {instructionData.steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isExpanded = expandedStepId === step.id;
            const isActive = instructionData.lastAccessedStep === step.id;

            return (
              <div
                key={step.id}
                className={cn(
                  "rounded-lg border transition-all",
                  isCompleted && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
                  isActive && !isCompleted && "border-primary",
                  isExpanded && "shadow-sm"
                )}
              >
                {/* Step Header */}
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                >
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => handleStepComplete(step.id)}
                    onClick={(e) => e.stopPropagation()}
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs font-mono px-1.5 py-0.5 rounded",
                        isCompleted 
                          ? "bg-green-200 dark:bg-green-800" 
                          : "bg-muted"
                      )}>
                        {index + 1}
                      </span>
                      <span className={cn(
                        "font-medium",
                        isCompleted && "line-through text-muted-foreground"
                      )}>
                        {step.title}
                      </span>
                      {step.isOptional && (
                        <Badge variant="outline" className="text-xs">
                          Opsiyonel
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    {step.estimatedTime && (
                      <span className="text-xs">{step.estimatedTime} dk</span>
                    )}
                    {step.mediaType && getMediaIcon(step.mediaType)}
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t">
                    <div className="pt-3 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {step.content}
                      </p>

                      {step.mediaUrl && (
                        <div className="rounded-lg overflow-hidden bg-muted">
                          {step.mediaType === 'image' ? (
                            <img
                              src={step.mediaUrl}
                              alt={step.title}
                              className="w-full h-auto"
                            />
                          ) : step.mediaType === 'video' ? (
                            <video
                              src={step.mediaUrl}
                              controls
                              className="w-full"
                            />
                          ) : step.mediaType === 'embed' ? (
                            <iframe
                              src={step.mediaUrl}
                              className="w-full aspect-video"
                              allowFullScreen
                            />
                          ) : null}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          variant={isCompleted ? 'outline' : 'default'}
                          onClick={() => handleStepComplete(step.id)}
                        >
                          {isCompleted ? (
                            <>
                              <Circle className="w-4 h-4 mr-1" />
                              Tamamlanmadı Olarak İşaretle
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Tamamlandı
                            </>
                          )}
                        </Button>

                        {index < instructionData.steps.length - 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (!isCompleted) handleStepComplete(step.id);
                              setExpandedStepId(instructionData.steps[index + 1].id);
                            }}
                          >
                            Sonraki Adım
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Prerequisites */}
        {instructionData.prerequisites && instructionData.prerequisites.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Ön Koşullar</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {instructionData.prerequisites.map((prereq, idx) => (
                <li key={idx}>{prereq}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InstructionWidget;
