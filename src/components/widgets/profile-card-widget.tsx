// src/components/widgets/profile-card-widget.tsx
'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ContentItem } from '@/lib/initial-content';

interface ProfileCardWidgetProps {
  item: ContentItem;
  username: string;
}

export default function ProfileCardWidget({ item, username }: ProfileCardWidgetProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-card to-card p-4">
        <Avatar className='h-24 w-24 border-4 border-primary/50 shadow-lg'>
            <AvatarImage src={`https://avatar.vercel.sh/${username}.png`} alt={username || 'User avatar'} />
            <AvatarFallback>{username ? username.charAt(0) : 'P'}</AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold mt-4">{username || 'Kullanıcı'}</h2>
        <p className="text-muted-foreground">{item.content || "tv25 Meraklısı"}</p>
    </div>
  );
}
