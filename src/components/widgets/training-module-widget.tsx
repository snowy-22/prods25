'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ContentItem } from '@/lib/initial-content';
import { 
  TRAINING_MODULES,
  TrainingModule,
  TrainingStep,
  TrainingTracker,
  UserTrainingProgress
} from '@/lib/training-system';
import { 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  Lock, 
  Play, 
  Lightbulb,
  Award,
  ChevronRight,
  Bot
} from 'lucide-react';

interface TrainingModuleWidgetProps {
  item: ContentItem;
  onUpdate?: (updates: Partial<ContentItem>) => void;
}

/**
 * Eğitim Modülü Widget
 * 
 * İnteraktif eğitim modüllerini sunar. Her modül:
 * - Adım adım rehberlik
 * - AI asistan ipuçları
 * - İleriye takip
 * - Tamamlama ödülleri
 * 
 * Özellikler:
 * - Önkoşul sistemi
 * - Adım doğrulama
 * - İlerleme yüzdesi
 * - Quiz ve pratik testler
 */
export default function TrainingModuleWidget({ item, onUpdate }: TrainingModuleWidgetProps) {
  const [tracker] = useState(() => new TrainingTracker());
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [allProgress, setAllProgress] = useState<UserTrainingProgress[]>([]);
  const [showAIHint, setShowAIHint] = useState(false);

  // Demo: Kullanıcı ID'si (gerçekte auth'dan gelir)
  const userId = 'user123';

  useEffect(() => {
    const progress = tracker.getUserProgress(userId);
    setAllProgress(progress);
  }, [userId, tracker]);

  // Modül başlat
  const startModule = (module: TrainingModule) => {
    tracker.startModule(userId, module.id);
    setSelectedModule(module);
    setCurrentStep(0);
    setShowAIHint(false);
  };

  // Adımı tamamla
  const completeStep = (moduleId: string, stepId: string) => {
    const result = tracker.completeStep(userId, moduleId, stepId);
    
    if (result.completedAt) {
      // Modül tamamlandı
      alert(`🎉 Modül tamamlandı! ${result.achievementsEarned.length > 0 ? `Ödül: ${result.achievementsEarned.join(', ')}` : ''}`);
      setSelectedModule(null);
    } else {
      // Bir sonraki adıma geç
      setCurrentStep(prev => prev + 1);
    }
    
    const progress = tracker.getUserProgress(userId);
    setAllProgress(progress);
    setShowAIHint(false);
  };

  // Modül kart bileşeni
  const ModuleCard = ({ module }: { module: TrainingModule }) => {
    const progress = tracker.getModuleProgress(userId, module.id);
    const completedModuleIds = allProgress.filter(p => p.completedAt).map(p => p.moduleId);
    const isLocked = (module.prerequisiteModules || []).some(preId => 
      !completedModuleIds.includes(preId)
    );
    const percentage = progress?.progress || 0;

    return (
      <Card className={`cursor-pointer transition-all hover:shadow-md ${isLocked ? 'opacity-50' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-base">{module.title}</CardTitle>
                <CardDescription className="text-xs">{module.description}</CardDescription>
              </div>
            </div>
            {isLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">İlerleme</span>
            <span className="font-semibold">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
          
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge variant="outline" className="text-xs">
              {module.category}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {module.difficulty}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {module.steps.length} adım
            </Badge>
          </div>

          {module.completionReward && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
              <Award className="w-3 h-3" />
              <span>Ödül: {module.completionReward}</span>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button 
            className="w-full" 
            size="sm"
            onClick={() => !isLocked && startModule(module)}
            disabled={isLocked}
          >
            {percentage > 0 && percentage < 100 ? (
              <>Devam Et</>
            ) : percentage === 100 ? (
              <>Tamamlandı <CheckCircle2 className="w-4 h-4 ml-2" /></>
            ) : (
              <>Başla <Play className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Adım detay görünümü
  const StepView = ({ module, step, index }: { module: TrainingModule; step: TrainingStep; index: number }) => {
    const progress = tracker.getModuleProgress(userId, module.id);
    const isCompleted = progress?.completedSteps.includes(step.id) || false;
    const isCurrent = index === currentStep;

    return (
      <div className={`border rounded-lg p-4 ${isCurrent ? 'border-primary bg-primary/5' : 'border-border'}`}>
        <div className="flex items-start gap-3">
          <div className="mt-1">
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : isCurrent ? (
              <Circle className="w-5 h-5 text-primary" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <div>
              <div className="font-semibold text-sm">Adım {index + 1}: {step.titleTr}</div>
              <div className="text-sm text-muted-foreground">{step.contentTr}</div>
            </div>

            {step.type === 'interactive' && step.requiredAction && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-2 text-xs">
                <div className="font-semibold">Görev:</div>
                <div>Aksiyon: {step.requiredAction.type}</div>
                {step.requiredAction.target && <div>Hedef: {step.requiredAction.target}</div>}
                {step.requiredAction.expectedValue && (
                  <div>Beklenen: {String(step.requiredAction.expectedValue)}</div>
                )}
              </div>
            )}

            {isCurrent && step.aiHintTr && (
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAIHint(!showAIHint)}
                  className="mb-2"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  {showAIHint ? 'İpucunu Gizle' : 'AI İpucu'}
                </Button>
                
                {showAIHint && (
                  <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded p-3 text-xs">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">AI Asistan İpucu:</div>
                        <div className="space-y-1">
                          <div><strong>TR:</strong> {step.aiHintTr}</div>
                          {step.aiHint && <div><strong>EN:</strong> {step.aiHint}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isCurrent && !isCompleted && (
              <Button 
                size="sm"
                onClick={() => completeStep(module.id, step.id)}
                className="mt-2"
              >
                Adımı Tamamla
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Ana görünüm
  if (!selectedModule) {
    const completedCount = allProgress.filter(p => p.completedAt).length;
    
    return (
      <Card className="w-full h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {item.title || 'Eğitim Modülleri'}
          </CardTitle>
          <CardDescription>
            {completedCount} / {TRAINING_MODULES.length} modül tamamlandı
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto">
          <div className="space-y-3">
            {TRAINING_MODULES.map(module => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <div className="w-full">
            <div className="text-xs text-muted-foreground mb-1">Genel İlerleme</div>
            <Progress 
              value={(completedCount / TRAINING_MODULES.length) * 100} 
              className="h-2"
            />
          </div>
          <div className="text-xs text-muted-foreground text-center w-full">
            AI asistanlı öğrenme sistemi
          </div>
        </CardFooter>
      </Card>
    );
  }

  // Modül detay görünümü
  const progress = tracker.getModuleProgress(userId, selectedModule.id);
  const percentage = progress?.progress || 0;
  
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{selectedModule.titleTr}</CardTitle>
            <CardDescription>{selectedModule.descriptionTr}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSelectedModule(null)}>
            ← Geri
          </Button>
        </div>
        <div className="mt-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">İlerleme</span>
            <span className="font-semibold">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
        <div className="space-y-3">
          {selectedModule.steps.map((step, index) => (
            <StepView 
              key={index} 
              module={selectedModule} 
              step={step} 
              index={index}
            />
          ))}
        </div>
      </CardContent>

      <CardFooter>
        {selectedModule.completionReward && (
          <div className="w-full text-center text-sm">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Award className="w-4 h-4" />
              <span>Modül ödülü: {selectedModule.completionReward}</span>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
