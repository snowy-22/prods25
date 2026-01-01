// src/components/widgets/profile-share-widget.tsx
'use client';
import { Button } from '@/components/ui/button';
import { ContentItem } from '@/lib/initial-content';
import { Twitter, Facebook, Linkedin } from 'lucide-react';
import Image from 'next/image';

interface ProfileShareWidgetProps {
  item: ContentItem;
  username: string;
}

export default function ProfileShareWidget({ item, username }: ProfileShareWidgetProps) {
    const profileUrl = `https://tv25.app/user/${username}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(profileUrl)}`;

    const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
        let shareUrl = '';
        const text = encodeURIComponent(`tv25 profilime göz at: ${username}`);
        const url = encodeURIComponent(profileUrl);

        switch(platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`;
                break;
        }
        window.open(shareUrl, '_blank');
    }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-card p-4 text-center">
        <h3 className="font-semibold mb-2">Profilimi Paylaş</h3>
        <div className='p-2 bg-white rounded-lg'>
             <Image src={qrCodeUrl} alt={`QR Code for ${username}`} width={120} height={120} />
        </div>
        <p className="text-xs text-muted-foreground mt-2 truncate max-w-full">{profileUrl}</p>
        <div className='flex gap-2 mt-4'>
            <Button variant="outline" size="icon" onClick={() => handleShare('twitter')}><Twitter className="h-4 w-4 text-[#1DA1F2]" /></Button>
            <Button variant="outline" size="icon" onClick={() => handleShare('facebook')}><Facebook className="h-4 w-4 text-[#1877F2]" /></Button>
            <Button variant="outline" size="icon" onClick={() => handleShare('linkedin')}><Linkedin className="h-4 w-4 text-[#0A66C2]" /></Button>
        </div>
    </div>
  );
}
