'use client';
import { ContentItem, socialUsers } from "@/lib/initial-content";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface UserListWidgetProps {
  item: ContentItem;
  size?: 'small' | 'medium' | 'large';
}

export default function UserListWidget({ item, size = 'medium' }: UserListWidgetProps) {
  return (
    <div className={cn(
      "flex h-full w-full flex-col bg-card",
      size === 'large' ? "p-6" : size === 'medium' ? "p-2" : "p-1"
    )}>
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className={cn("font-bold", size === 'large' ? "text-xl" : "text-sm")}>Aktif Kullanıcılar</h3>
        {size !== 'small' && (
            <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder="Ara..." 
                    className="bg-muted border-none rounded-full pl-7 pr-3 py-1 text-[10px] w-32 focus:ring-1 focus:ring-primary outline-none"
                />
            </div>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {socialUsers.map((user) => (
            <div 
              key={user.id} 
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group",
                size === 'large' ? "p-3" : "p-2"
              )}
            >
              <div className="relative">
                <Avatar className={size === 'large' ? "h-10 w-10" : "h-8 w-8"}>
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <span className={cn(
                    "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card",
                    user.status === 'online' ? "bg-green-500" : user.status === 'away' ? "bg-yellow-500" : "bg-slate-400"
                )} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={cn("font-medium truncate", size === 'large' ? "text-base" : "text-xs")}>
                    {user.name}
                  </p>
                  {size === 'large' && (
                      <Badge variant="outline" className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                          Profil
                      </Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                    {user.status === 'online' ? 'Çevrimiçi' : user.lastSeen}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
