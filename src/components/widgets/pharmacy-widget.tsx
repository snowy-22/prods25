
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, MapPin, Navigation, AlertTriangle } from 'lucide-react';
import { PharmacyLogo } from '../icons/pharmacy-logo';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';

type LocationState = {
  latitude: number;
  longitude: number;
};

type PharmacyInfo = {
  name: string;
  address: string;
  distance: string;
};

export default function PharmacyWidget() {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [foundPharmacy, setFoundPharmacy] = useState<PharmacyInfo | null>(null);

  const requestLocation = useCallback(() => {
    setIsLoading(true);
    setError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsLoading(false);
        },
        (err) => {
          setError('Konum izni reddedildi. Lütfen tarayıcı ayarlarınızı kontrol edin.');
          setIsLoading(false);
        }
      );
    } else {
      setError('Tarayıcınız konum servisini desteklemiyor.');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const handleFindPharmacy = () => {
    setIsLoading(true);
    // Simulate finding a pharmacy
    setTimeout(() => {
      setFoundPharmacy({
        name: 'Marmara Eczanesi',
        address: 'Örnek Mah. Atatürk Cad. No: 123, Kadıköy/İstanbul',
        distance: '1.2 km',
      });
      setIsLoading(false);
    }, 1500);
  };

  const getMapSrc = () => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        setError("Google Maps API anahtarı bulunamadı.");
        return '';
    }
    if (!location) return '';
    
    const { latitude, longitude } = location;
    if (foundPharmacy) {
      // Simulate pharmacy location near the user
      const pharmacyLat = latitude + 0.01;
      const pharmacyLon = longitude + 0.01;
      return `https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&origin=${latitude},${longitude}&destination=${pharmacyLat},${pharmacyLon}&mode=driving`;
    }
    return `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${latitude},${longitude}&zoom=15`;
  };
  
  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-muted p-4 text-center">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={requestLocation} className="mt-4">Tekrar Dene</Button>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-muted">
      {isLoading && !location && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {location && (
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={getMapSrc()}
        ></iframe>
      )}

      {!foundPharmacy ? (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <Button onClick={handleFindPharmacy} className="w-full shadow-lg" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PharmacyLogo className="mr-2 h-5 w-5" />}
            En Yakın Nöbetçi Eczaneyi Bul
          </Button>
        </div>
      ) : (
        <Card className="absolute bottom-4 left-4 right-4 z-10 shadow-lg">
          <CardHeader>
             <div className='flex items-start gap-3'>
                <MapPin className='h-5 w-5 text-primary mt-1 flex-shrink-0'/>
                <div>
                    <h3 className="font-semibold">{foundPharmacy.name}</h3>
                    <p className="text-xs text-muted-foreground">{foundPharmacy.address}</p>
                </div>
             </div>
          </CardHeader>
          <CardFooter className="flex justify-between">
            <span className="font-bold">{foundPharmacy.distance}</span>
            <a 
              href={`https://www.google.com/maps/dir/?api=1&origin=${location?.latitude},${location?.longitude}&destination=${encodeURIComponent(foundPharmacy.address)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button>
                  <Navigation className="mr-2 h-4 w-4" />
                  Yol Tarifi Al
              </Button>
            </a>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
