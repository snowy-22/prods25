"use client";

import React, { useState, useEffect } from 'react';
import { ContentItem } from '@/lib/initial-content';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, BarChart3, Clock, Users, Lock, Unlock } from 'lucide-react';

interface PollWidgetProps {
  item: ContentItem;
  size?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  onUpdate?: (updates: Partial<ContentItem>) => void;
  isEditing?: boolean;
}

export const PollWidget: React.FC<PollWidgetProps> = ({
  item,
  size = 'M',
  onUpdate,
  isEditing = false
}) => {
  const pollData = item.pollData || {
    question: 'Anket sorusu giriniz',
    options: [
      { id: 'opt-1', text: 'Seçenek 1', votes: 0 },
      { id: 'opt-2', text: 'Seçenek 2', votes: 0 },
    ],
    allowMultiple: false,
    showResults: false,
    isAnonymous: true,
    totalVotes: 0,
    userVotedOptionIds: [],
  };

  const [selectedOptions, setSelectedOptions] = useState<string[]>(pollData.userVotedOptionIds || []);
  const [hasVoted, setHasVoted] = useState((pollData.userVotedOptionIds?.length || 0) > 0);
  const [showResults, setShowResults] = useState(pollData.showResults || hasVoted);

  const totalVotes = pollData.options.reduce((sum, opt) => sum + opt.votes, 0);
  const isExpired = pollData.endsAt ? new Date(pollData.endsAt) < new Date() : false;

  const handleOptionClick = (optionId: string) => {
    if (hasVoted || isExpired) return;

    if (pollData.allowMultiple) {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = () => {
    if (selectedOptions.length === 0 || hasVoted || isExpired) return;

    const updatedOptions = pollData.options.map(opt => ({
      ...opt,
      votes: selectedOptions.includes(opt.id) ? opt.votes + 1 : opt.votes,
    }));

    onUpdate?.({
      pollData: {
        ...pollData,
        options: updatedOptions,
        totalVotes: totalVotes + 1,
        userVotedOptionIds: selectedOptions,
      },
    });

    setHasVoted(true);
    setShowResults(true);
  };

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const sizeClasses = {
    XS: 'text-xs p-2',
    S: 'text-sm p-3',
    M: 'text-base p-4',
    L: 'text-lg p-5',
    XL: 'text-xl p-6',
  };

  return (
    <Card className={cn("w-full h-full flex flex-col", sizeClasses[size])}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant={isExpired ? 'destructive' : 'secondary'} className="text-xs">
            {isExpired ? 'Sona Erdi' : 'Aktif'}
          </Badge>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {pollData.isAnonymous ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            <Users className="w-3 h-3" />
            <span>{totalVotes}</span>
          </div>
        </div>
        <CardTitle className="mt-2">{pollData.question}</CardTitle>
        {pollData.endsAt && (
          <CardDescription className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Bitiş: {new Date(pollData.endsAt).toLocaleDateString('tr-TR')}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-2 overflow-y-auto">
        {pollData.options.map((option) => {
          const isSelected = selectedOptions.includes(option.id);
          const percentage = getPercentage(option.votes);
          const isWinning = showResults && option.votes === Math.max(...pollData.options.map(o => o.votes));

          return (
            <div
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              className={cn(
                "relative rounded-lg border p-3 cursor-pointer transition-all overflow-hidden",
                isSelected && !showResults && "border-primary ring-2 ring-primary/20",
                showResults && isWinning && "border-green-500 bg-green-50 dark:bg-green-950/20",
                hasVoted || isExpired ? "cursor-default" : "hover:bg-muted/50"
              )}
            >
              {/* Progress bar background */}
              {showResults && (
                <div
                  className="absolute inset-0 bg-primary/10 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSelected && !showResults && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                  <span className={cn(showResults && isWinning && "font-semibold")}>
                    {option.text}
                  </span>
                </div>

                {showResults && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{percentage}%</span>
                    <span className="text-xs text-muted-foreground">({option.votes})</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {!hasVoted && !isExpired && (
          <Button
            onClick={handleVote}
            disabled={selectedOptions.length === 0}
            className="mt-auto w-full"
          >
            Oy Ver
          </Button>
        )}

        {hasVoted && !showResults && (
          <Button
            variant="outline"
            onClick={() => setShowResults(true)}
            className="mt-auto w-full"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Sonuçları Gör
          </Button>
        )}

        {pollData.allowMultiple && !hasVoted && (
          <p className="text-xs text-muted-foreground text-center">
            Birden fazla seçenek işaretleyebilirsiniz
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PollWidget;
