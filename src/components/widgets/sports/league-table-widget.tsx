// src/components/widgets/sports/league-table-widget.tsx
'use client';
import { ContentItem } from "@/lib/initial-content";
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { List } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeagueTableWidgetProps {
  item: ContentItem;
  size?: 'small' | 'medium' | 'large';
}

export default function LeagueTableWidget({ item, size = 'medium' }: LeagueTableWidgetProps) {
  const tableData = item.leagueTableData;

  if (!tableData) {
    return <div className="p-4 text-center text-muted-foreground">Puan durumu bilgisi bulunamadı.</div>;
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
        <List className={size === 'large' ? "h-6 w-6" : "h-4 w-4"} />
        {tableData.leagueName}
      </h3>
      <ScrollArea className="flex-1">
        <Table className={cn(
          size === 'large' ? "text-base" : "text-xs"
        )}>
          <TableHeader>
            <TableRow>
              <TableHead className={cn("p-1 text-center", size === 'large' ? "w-12" : "w-6")}>#</TableHead>
              <TableHead className="p-1">Takım</TableHead>
              <TableHead className={cn("p-1 text-center", size === 'large' ? "w-16" : "w-8")}>O</TableHead>
              {size !== 'small' && (
                <>
                  <TableHead className={cn("p-1 text-center", size === 'large' ? "w-16" : "w-8")}>G</TableHead>
                  <TableHead className={cn("p-1 text-center", size === 'large' ? "w-16" : "w-8")}>B</TableHead>
                  <TableHead className={cn("p-1 text-center", size === 'large' ? "w-16" : "w-8")}>M</TableHead>
                </>
              )}
              <TableHead className={cn("p-1 text-center", size === 'large' ? "w-16" : "w-8")}>P</TableHead>
              {size === 'large' && <TableHead className="w-16 p-1 text-center">Av</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.rows.map(row => (
              <TableRow key={row.rank}>
                <TableCell className="p-1 text-center font-medium">{row.rank}</TableCell>
                <TableCell className="p-1 font-semibold flex items-center gap-2">
                  <Image 
                    src={row.team.logo} 
                    alt={row.team.name} 
                    width={size === 'large' ? 24 : 16} 
                    height={size === 'large' ? 24 : 16} 
                  />
                  <span className={size === 'small' ? "truncate max-w-[60px]" : ""}>{row.team.name}</span>
                </TableCell>
                <TableCell className="p-1 text-center">{row.played}</TableCell>
                {size !== 'small' && (
                  <>
                    <TableCell className="p-1 text-center text-muted-foreground">{(row as any).won || 0}</TableCell>
                    <TableCell className="p-1 text-center text-muted-foreground">{(row as any).draw || 0}</TableCell>
                    <TableCell className="p-1 text-center text-muted-foreground">{(row as any).lost || 0}</TableCell>
                  </>
                )}
                <TableCell className="p-1 text-center font-bold">{row.points}</TableCell>
                {size === 'large' && <TableCell className="p-1 text-center">{row.goalDifference}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
