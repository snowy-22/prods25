// src/components/widgets/sports/fixture-widget.tsx
'use client';
import { ContentItem } from "@/lib/initial-content";
import Image from 'next/image';
import { Calendar } from "lucide-react";
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from "@/lib/utils";

interface FixtureWidgetProps {
  item: ContentItem;
  size?: 'small' | 'medium' | 'large';
}

export default function FixtureWidget({ item, size = 'medium' }: FixtureWidgetProps) {
  const fixtureData = item.fixtureData;

  if (!fixtureData) {
    return <div className="p-4 text-center text-muted-foreground">Fikstür bilgisi bulunamadı.</div>;
  }

  return (
    <div className={cn(
      "flex h-full w-full flex-col bg-card",
      size === 'large' ? "p-6" : size === 'medium' ? "p-2" : "p-1"
    )}>
      <h3 className={cn(
        "font-bold text-center p-2 flex items-center justify-center gap-2",
        size === 'large' ? "text-xl mb-4" : "text-sm"
      )}>
        <Calendar className={size === 'large' ? "h-6 w-6" : "h-4 w-4"} />
        {fixtureData.title}
      </h3>
      <div className={cn(
        "flex-1 overflow-auto",
        size === 'large' ? "space-y-3" : "space-y-1"
      )}>
        {fixtureData.matches.map((match) => (
          <div key={`${match.homeTeam.name}-${match.awayTeam.name}-${match.time}`} className={cn(
            "flex items-center justify-between rounded-md bg-muted",
            size === 'large' ? "p-4" : "p-2"
          )}>
            <div className="flex items-center gap-2 flex-1">
              <Image 
                src={match.homeTeam.logo} 
                alt={match.homeTeam.name} 
                width={size === 'large' ? 32 : 20} 
                height={size === 'large' ? 32 : 20} 
              />
              <span className={cn(
                "font-semibold text-right",
                size === 'large' ? "text-lg w-32" : "text-xs w-20",
                size === 'small' && "hidden sm:inline"
              )}>{match.homeTeam.name}</span>
            </div>
            
            <div className={cn(
              "text-center font-mono text-muted-foreground px-2",
              size === 'large' ? "text-sm min-w-[100px]" : "text-[10px] min-w-[60px]"
            )}>
              <div className="font-bold text-foreground">{format(new Date(match.date), 'dd MMM', { locale: tr })}</div>
              <div>{format(new Date(match.date), 'HH:mm')}</div>
            </div>
            
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className={cn(
                "font-semibold text-left",
                size === 'large' ? "text-lg w-32" : "text-xs w-20",
                size === 'small' && "hidden sm:inline"
              )}>{match.awayTeam.name}</span>
              <Image 
                src={match.awayTeam.logo} 
                alt={match.awayTeam.name} 
                width={size === 'large' ? 32 : 20} 
                height={size === 'large' ? 32 : 20} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
