"use client";

import React, { useState } from 'react';
import { ContentItem } from '@/lib/initial-content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Check, 
  Clock, 
  Eye,
  Users,
  Send,
  CheckCircle2
} from 'lucide-react';

interface QuestionWidgetProps {
  item: ContentItem;
  size?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  onUpdate?: (updates: Partial<ContentItem>) => void;
  isEditing?: boolean;
  currentUserId?: string;
  currentUserName?: string;
  currentUserAvatar?: string;
}

export const QuestionWidget: React.FC<QuestionWidgetProps> = ({
  item,
  size = 'M',
  onUpdate,
  isEditing = false,
  currentUserId = 'user-1',
  currentUserName = 'Kullanıcı',
  currentUserAvatar,
}) => {
  const questionData = item.questionData || {
    question: 'Soru başlığı',
    details: 'Soru detayları...',
    askedBy: 'Anonim',
    askedByAvatar: undefined,
    askedAt: new Date().toISOString(),
    answers: [],
    isResolved: false,
    viewCount: 0,
    followCount: 0,
  };

  const [newAnswer, setNewAnswer] = useState('');
  const [showAnswerForm, setShowAnswerForm] = useState(false);

  const handleSubmitAnswer = () => {
    if (!newAnswer.trim()) return;

    const answer = {
      id: `ans-${Date.now()}`,
      content: newAnswer,
      answeredBy: currentUserName,
      answeredByAvatar: currentUserAvatar,
      answeredAt: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
      isAccepted: false,
    };

    onUpdate?.({
      questionData: {
        ...questionData,
        answers: [...questionData.answers, answer],
      },
    });

    setNewAnswer('');
    setShowAnswerForm(false);
  };

  const handleVote = (answerId: string, type: 'up' | 'down') => {
    const updatedAnswers = questionData.answers.map((ans) => {
      if (ans.id === answerId) {
        return {
          ...ans,
          upvotes: type === 'up' ? ans.upvotes + 1 : ans.upvotes,
          downvotes: type === 'down' ? ans.downvotes + 1 : ans.downvotes,
        };
      }
      return ans;
    });

    onUpdate?.({
      questionData: {
        ...questionData,
        answers: updatedAnswers,
      },
    });
  };

  const handleAcceptAnswer = (answerId: string) => {
    const updatedAnswers = questionData.answers.map((ans) => ({
      ...ans,
      isAccepted: ans.id === answerId,
    }));

    onUpdate?.({
      questionData: {
        ...questionData,
        answers: updatedAnswers,
        isResolved: true,
        acceptedAnswerId: answerId,
      },
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const sizeClasses = {
    XS: 'text-xs p-2',
    S: 'text-sm p-3',
    M: 'text-base p-4',
    L: 'text-lg p-5',
    XL: 'text-xl p-6',
  };

  const sortedAnswers = [...questionData.answers].sort((a, b) => {
    // Accepted answer first
    if (a.isAccepted) return -1;
    if (b.isAccepted) return 1;
    // Then by votes
    return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
  });

  return (
    <Card className={cn("w-full h-full flex flex-col", sizeClasses[size])}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <Badge variant={questionData.isResolved ? 'default' : 'secondary'}>
            {questionData.isResolved ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Çözüldü
              </>
            ) : (
              'Açık'
            )}
          </Badge>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {questionData.viewCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {questionData.answers.length}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {questionData.followCount || 0}
            </span>
          </div>
        </div>

        <CardTitle className="text-lg">{questionData.question}</CardTitle>

        {questionData.details && (
          <p className="text-sm text-muted-foreground mt-2">
            {questionData.details}
          </p>
        )}

        <div className="flex items-center gap-2 mt-3">
          <Avatar className="w-6 h-6">
            <AvatarImage src={questionData.askedByAvatar} />
            <AvatarFallback>{questionData.askedBy[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{questionData.askedBy}</span>
          <span className="text-xs text-muted-foreground">
            • {formatDate(questionData.askedAt)}
          </span>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 overflow-y-auto py-4 space-y-4">
        {/* Answers */}
        {sortedAnswers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Henüz cevap yok</p>
            <p className="text-xs">İlk cevabı siz verin!</p>
          </div>
        ) : (
          sortedAnswers.map((answer) => (
            <div
              key={answer.id}
              className={cn(
                "p-3 rounded-lg border",
                answer.isAccepted && "border-green-500 bg-green-50 dark:bg-green-950/20"
              )}
            >
              <div className="flex gap-3">
                {/* Vote buttons */}
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleVote(answer.id, 'up')}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    {answer.upvotes - answer.downvotes}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleVote(answer.id, 'down')}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </Button>
                </div>

                {/* Answer content */}
                <div className="flex-1">
                  {answer.isAccepted && (
                    <Badge variant="default" className="mb-2 bg-green-600">
                      <Check className="w-3 h-3 mr-1" />
                      Kabul Edildi
                    </Badge>
                  )}
                  
                  <p className="text-sm">{answer.content}</p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={answer.answeredByAvatar} />
                        <AvatarFallback>{answer.answeredBy[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{answer.answeredBy}</span>
                      <span className="text-xs text-muted-foreground">
                        • {formatDate(answer.answeredAt)}
                      </span>
                    </div>

                    {!questionData.isResolved && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleAcceptAnswer(answer.id)}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Kabul Et
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Answer form */}
        {showAnswerForm ? (
          <div className="space-y-3 pt-2">
            <Textarea
              placeholder="Cevabınızı yazın..."
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmitAnswer} disabled={!newAnswer.trim()}>
                <Send className="w-4 h-4 mr-2" />
                Gönder
              </Button>
              <Button variant="outline" onClick={() => setShowAnswerForm(false)}>
                İptal
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowAnswerForm(true)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Cevap Yaz
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionWidget;
