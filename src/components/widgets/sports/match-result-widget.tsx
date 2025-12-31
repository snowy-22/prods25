// src/components/widgets/sports/match-result-widget.tsx
'use client';
import { ContentItem, MatchStatus } from "@/lib/initial-content";
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MatchResultWidgetProps {
  item: ContentItem;
  size?: 'small' | 'medium' | 'large';
}

const getStatusBadge = (status: MatchStatus, size: string) => {
    const sizeClass = size === 'small' ? "text-[8px] px-1 h-4" : "";
    switch (status) {
        case 'live':
            return <Badge className={cn("bg-red-500 text-white animate-pulse", sizeClass)}>CANLI</Badge>;
        case 'finished':
            return <Badge variant="secondary" className={sizeClass}>Bitti</Badge>;
        case 'upcoming':
            return <Badge variant="outline" className={sizeClass}>Başlamadı</Badge>;
        default:
            return null;
    }
}

export default function MatchResultWidget({ item, size = 'medium' }: MatchResultWidgetProps) {
  const matchData = item.matchData;

  if (!matchData) {
    return <div className="p-4 text-center text-muted-foreground">Maç bilgisi bulunamadı.</div>;
  }

  const { homeTeam, awayTeam, score, status, league, date } = matchData;

  return (
    <div className={cn(
      "flex h-full w-full flex-col items-center justify-center bg-card text-center",
      size === 'large' ? "p-8" : size === 'medium' ? "p-4" : "p-1"
    )}>
      {size !== 'small' && <div className={cn(
        "text-muted-foreground mb-2",
        size === 'large' ? "text-lg" : "text-xs"
      )}>{league}</div>}
      
      <div className="grid grid-cols-3 items-center w-full gap-2">
        <div className="flex flex-col items-center gap-2">
          <Image 
            src={homeTeam.logo} 
            alt={homeTeam.name} 
            width={size === 'large' ? 120 : size === 'medium' ? 60 : 30} 
            height={size === 'large' ? 120 : size === 'medium' ? 60 : 30} 
          />
          <p className={cn(
            "font-bold",
            size === 'large' ? "text-2xl" : size === 'medium' ? "text-sm" : "text-[10px]"
          )}>{homeTeam.name}</p>
        </div>
        
        <div className="text-center">
          {status === 'finished' || status === 'live' ? (
             <p className={cn(
               "font-bold",
               size === 'large' ? "text-8xl" : size === 'medium' ? "text-4xl" : "text-xl"
             )}>{score}</p>
          ) : (
            <div className={cn(
              "font-semibold text-muted-foreground",
              size === 'large' ? "text-2xl" : size === 'medium' ? "text-sm" : "text-[10px]"
            )}>
                <div>{new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</div>
                <div>{new Date(date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <Image 
            src={awayTeam.logo} 
            alt={awayTeam.name} 
            width={size === 'large' ? 120 : size === 'medium' ? 60 : 30} 
            height={size === 'large' ? 120 : size === 'medium' ? 60 : 30} 
          />
          <p className={cn(
            "font-bold",
            size === 'large' ? "text-2xl" : size === 'medium' ? "text-sm" : "text-[10px]"
          )}>{awayTeam.name}</p>
        </div>
      </div>
      
      <div className={size === 'large' ? "mt-6" : "mt-3"}>
        {getStatusBadge(status, size)}
      </div>
    </div>
  );
}
