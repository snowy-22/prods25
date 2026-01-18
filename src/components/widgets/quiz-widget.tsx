"use client";

import React, { useState, useEffect } from 'react';
import { ContentItem } from '@/lib/initial-content';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Trophy, 
  ArrowRight, 
  ArrowLeft,
  RotateCcw,
  Award
} from 'lucide-react';

interface QuizWidgetProps {
  item: ContentItem;
  size?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  onUpdate?: (updates: Partial<ContentItem>) => void;
  isEditing?: boolean;
}

type QuizState = 'idle' | 'in-progress' | 'completed';

export const QuizWidget: React.FC<QuizWidgetProps> = ({
  item,
  size = 'M',
  onUpdate,
  isEditing = false
}) => {
  const quizData = item.quizData || {
    title: 'Test Başlığı',
    description: 'Test açıklaması',
    questions: [
      {
        id: 'q1',
        question: 'Örnek soru?',
        type: 'multiple-choice' as const,
        options: ['Seçenek A', 'Seçenek B', 'Seçenek C', 'Seçenek D'],
        correctAnswer: 'Seçenek A',
        points: 10,
        explanation: 'Doğru cevabın açıklaması',
      },
    ],
    timeLimit: 300,
    passingScore: 60,
    randomizeQuestions: false,
    showCorrectAnswers: true,
    attempts: 0,
    bestScore: 0,
  };

  const [quizState, setQuizState] = useState<QuizState>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(quizData.timeLimit || 0);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const totalQuestions = quizData.questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Timer
  useEffect(() => {
    if (quizState !== 'in-progress' || !quizData.timeLimit) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState, quizData.timeLimit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setQuizState('in-progress');
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeRemaining(quizData.timeLimit || 0);
    setScore(0);
    setShowExplanation(false);
  };

  const handleAnswer = (answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setShowExplanation(false);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setShowExplanation(false);
    }
  };

  const handleComplete = () => {
    // Calculate score
    let totalScore = 0;
    let maxScore = 0;

    quizData.questions.forEach((q) => {
      const points = q.points || 10;
      maxScore += points;
      
      const userAnswer = answers[q.id];
      const correctAnswer = Array.isArray(q.correctAnswer) 
        ? q.correctAnswer[0] 
        : q.correctAnswer;
      
      if (userAnswer === correctAnswer) {
        totalScore += points;
      }
    });

    const percentage = Math.round((totalScore / maxScore) * 100);
    setScore(percentage);
    setQuizState('completed');

    // Update best score
    const newBestScore = Math.max(quizData.bestScore || 0, percentage);
    onUpdate?.({
      quizData: {
        ...quizData,
        attempts: (quizData.attempts || 0) + 1,
        bestScore: newBestScore,
        lastAttemptAt: new Date().toISOString(),
      },
    });
  };

  const isCorrect = (questionId: string) => {
    const q = quizData.questions.find((q) => q.id === questionId);
    if (!q) return false;
    const correctAnswer = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;
    return answers[questionId] === correctAnswer;
  };

  const sizeClasses = {
    XS: 'text-xs p-2',
    S: 'text-sm p-3',
    M: 'text-base p-4',
    L: 'text-lg p-5',
    XL: 'text-xl p-6',
  };

  // Idle State
  if (quizState === 'idle') {
    return (
      <Card className={cn("w-full h-full flex flex-col", sizeClasses[size])}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            {quizData.title}
          </CardTitle>
          <CardDescription>{quizData.description}</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{totalQuestions} Soru</Badge>
            </div>
            {quizData.timeLimit && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatTime(quizData.timeLimit)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Geçme Puanı:</span>
              <span className="font-medium">{quizData.passingScore}%</span>
            </div>
            {quizData.attempts !== undefined && quizData.attempts > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Deneme:</span>
                <span className="font-medium">{quizData.attempts}</span>
              </div>
            )}
          </div>

          {quizData.bestScore !== undefined && quizData.bestScore > 0 && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">En İyi Skor</span>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold">{quizData.bestScore}%</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button onClick={handleStart} className="w-full">
            <Play className="w-4 h-4 mr-2" />
            Teste Başla
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // In Progress State
  if (quizState === 'in-progress' && currentQuestion) {
    return (
      <Card className={cn("w-full h-full flex flex-col", sizeClasses[size])}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary">
              Soru {currentQuestionIndex + 1}/{totalQuestions}
            </Badge>
            {quizData.timeLimit && timeRemaining > 0 && (
              <Badge variant={timeRemaining < 60 ? 'destructive' : 'outline'}>
                <Clock className="w-3 h-3 mr-1" />
                {formatTime(timeRemaining)}
              </Badge>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-4">
          <div className="font-medium">{currentQuestion.question}</div>

          {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={handleAnswer}
              className="space-y-2"
            >
              {currentQuestion.options.map((option, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center space-x-2 rounded-lg border p-3 cursor-pointer transition-colors",
                    answers[currentQuestion.id] === option && "border-primary bg-primary/5"
                  )}
                  onClick={() => handleAnswer(option)}
                >
                  <RadioGroupItem value={option} id={`option-${idx}`} />
                  <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === 'true-false' && (
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={handleAnswer}
              className="space-y-2"
            >
              {['Doğru', 'Yanlış'].map((option) => (
                <div
                  key={option}
                  className={cn(
                    "flex items-center space-x-2 rounded-lg border p-3 cursor-pointer transition-colors",
                    answers[currentQuestion.id] === option && "border-primary bg-primary/5"
                  )}
                  onClick={() => handleAnswer(option)}
                >
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === 'short-answer' && (
            <Input
              placeholder="Cevabınızı yazın..."
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
            />
          )}

          {showExplanation && quizData.showCorrectAnswers && currentQuestion.explanation && (
            <div className={cn(
              "p-3 rounded-lg text-sm",
              isCorrect(currentQuestion.id) 
                ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200"
            )}>
              <div className="flex items-center gap-2 mb-1">
                {isCorrect(currentQuestion.id) ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span className="font-medium">
                  {isCorrect(currentQuestion.id) ? 'Doğru!' : 'Yanlış'}
                </span>
              </div>
              <p>{currentQuestion.explanation}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Önceki
          </Button>
          <Button onClick={handleNext} className="flex-1">
            {currentQuestionIndex === totalQuestions - 1 ? 'Bitir' : 'Sonraki'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Completed State
  return (
    <Card className={cn("w-full h-full flex flex-col", sizeClasses[size])}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          {score >= (quizData.passingScore || 60) ? (
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-yellow-500" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          )}
        </div>
        <CardTitle>
          {score >= (quizData.passingScore || 60) ? 'Tebrikler!' : 'Test Tamamlandı'}
        </CardTitle>
        <CardDescription>
          {score >= (quizData.passingScore || 60)
            ? 'Testi başarıyla geçtiniz!'
            : 'Geçme puanına ulaşamadınız.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div className="text-center">
          <div className="text-5xl font-bold">{score}%</div>
          <div className="text-sm text-muted-foreground">
            Geçme Puanı: {quizData.passingScore || 60}%
          </div>
        </div>

        <Progress
          value={score}
          className={cn(
            "h-3",
            score >= (quizData.passingScore || 60) ? "bg-green-100" : "bg-red-100"
          )}
        />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {quizData.questions.filter((q) => isCorrect(q.id)).length}
            </div>
            <div className="text-muted-foreground">Doğru</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {quizData.questions.filter((q) => !isCorrect(q.id)).length}
            </div>
            <div className="text-muted-foreground">Yanlış</div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button onClick={handleStart} variant="outline" className="w-full">
          <RotateCcw className="w-4 h-4 mr-2" />
          Tekrar Dene
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuizWidget;
