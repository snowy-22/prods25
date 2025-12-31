// src/components/widgets/navigation-widget.tsx

'use client';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Navigation, Send } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface NavigationWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

export default function NavigationWidget({ size = 'medium' }: NavigationWidgetProps) {
    const isSmall = size === 'small';
    const isLarge = size === 'large';
    const [origin, setOrigin] = useState('Ankara, Türkiye');
    const [destination, setDestination] = useState('İstanbul, Türkiye');
    const [mapUrl, setMapUrl] = useState('');

    const handleGetDirections = () => {
        if (!MAPS_API_KEY) {
            alert("Google Maps API anahtarı ayarlanmamış.");
            return;
        }
         if (origin && destination) {
            const newUrl = `https://www.google.com/maps/embed/v1/directions?key=${MAPS_API_KEY}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
            setMapUrl(newUrl);
        }
    }


  return (
    <div className="flex h-full w-full flex-col bg-card">
        <div className={cn(
          "border-b space-y-2",
          isSmall && "p-1",
          !isSmall && !isLarge && "p-3",
          isLarge && "p-4"
        )}>
            <h3 className={cn(
              "font-bold flex items-center gap-2",
              isSmall && "text-xs",
              !isSmall && !isLarge && "text-sm",
              isLarge && "text-base"
            )}>
              <Navigation className={cn(
                "text-primary",
                isSmall && "h-4 w-4",
                !isSmall && !isLarge && "h-5 w-5",
                isLarge && "h-6 w-6"
              )}/>
              Rota Planlayıcı
            </h3>
            <Input 
                placeholder="Başlangıç noktası..."
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className={cn(isSmall && "h-7 text-xs", isLarge && "h-10 text-lg")}
            />
             <Input 
                placeholder="Varış noktası..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className={cn(isSmall && "h-7 text-xs", isLarge && "h-10 text-lg")}
            />
            <Button onClick={handleGetDirections} className={cn("w-full", isSmall && "h-7 text-xs", isLarge && "h-10 text-lg")}>
                <Send className={cn(
                  isSmall && "mr-1 h-3 w-3",
                  !isSmall && !isLarge && "mr-2 h-4 w-4",
                  isLarge && "mr-3 h-5 w-5"
                )}/>
                Rota Oluştur
            </Button>
        </div>
        <div className="flex-1 bg-muted">
            {mapUrl ? (
                <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={mapUrl}>
                </iframe>
            ) : (
                <div className='flex h-full w-full items-center justify-center text-muted-foreground'>Rota oluşturun...</div>
            )}
        </div>
    </div>
  );
}
