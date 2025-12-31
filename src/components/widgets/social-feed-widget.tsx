'use client';
import { ContentItem, socialContent, socialUsers } from "@/lib/initial-content";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, MessageSquare, Share2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialFeedWidgetProps {
  item: ContentItem;
  size?: 'small' | 'medium' | 'large';
}

export default function SocialFeedWidget({ item, size = 'medium' }: SocialFeedWidgetProps) {
  return (
    <div className={cn(
      "flex h-full w-full flex-col bg-card",
      size === 'large' ? "p-6" : size === 'medium' ? "p-2" : "p-1"
    )}>
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className={cn("font-bold", size === 'large' ? "text-xl" : "text-sm")}>Canlı Akış</h3>
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <ScrollArea className="flex-1">
        <div className={cn(
          "space-y-4",
          size === 'large' ? "px-4" : "px-1"
        )}>
          {socialContent.map((post) => {
            const user = socialUsers.find(u => u.id === post.userId);
            return (
              <Card key={post.id} className={cn(
                "border-none bg-muted/50",
                size === 'large' ? "p-4" : "p-3"
              )}>
                <div className="flex gap-3">
                  <Avatar className={size === 'large' ? "h-10 w-10" : "h-8 w-8"}>
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>{user?.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={cn("font-bold truncate", size === 'large' ? "text-base" : "text-xs")}>
                        {user?.name}
                      </p>
                      <span className="text-[10px] text-muted-foreground">{post.timestamp}</span>
                    </div>
                    <p className={cn(
                      "text-muted-foreground mt-1 leading-relaxed",
                      size === 'large' ? "text-sm" : "text-[11px]"
                    )}>
                      {post.content}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-3 text-muted-foreground">
                      <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                        <Heart className={size === 'large' ? "h-4 w-4" : "h-3 w-3"} />
                        <span className="text-[10px]">{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                        <MessageSquare className={size === 'large' ? "h-4 w-4" : "h-3 w-3"} />
                        <span className="text-[10px]">{post.comments}</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-green-500 transition-colors ml-auto">
                        <Share2 className={size === 'large' ? "h-4 w-4" : "h-3 w-3"} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
