
'use client';

import { Sun, Cloud, CloudRain, CloudSnow, Wind, Droplets } from 'lucide-react';
import { useMemo } from 'react';

import { ContentItem } from '@/lib/initial-content';
import { cn } from '@/lib/utils';

// Simulated data
const weatherData = {
  location: 'Istanbul',
  temperature: 24,
  description: 'Parçalı Bulutlu',
  humidity: 65,
  windSpeed: 15,
  icon: 'cloudy', // 'sunny', 'rainy', 'snowy'
};

interface WeatherWidgetProps {
  item: ContentItem;
  size?: 'small' | 'medium' | 'large';
}

export default function WeatherWidget({ item, size = 'medium' }: WeatherWidgetProps) {
  const WeatherIcon = useMemo(() => {
    switch (weatherData.icon) {
      case 'sunny':
        return Sun;
      case 'rainy':
        return CloudRain;
      case 'snowy':
        return CloudSnow;
      case 'cloudy':
      default:
        return Cloud;
    }
  }, []);

  return (
    <div className={cn(
      "flex h-full w-full flex-col items-center justify-between bg-gradient-to-br from-blue-400 to-blue-600 text-white",
      size === 'large' ? "p-10" : size === 'medium' ? "p-6" : "p-2"
    )}>
      <div className="flex w-full items-start justify-between">
        <div>
          <p className={cn(
            "font-bold",
            size === 'large' ? "text-4xl" : size === 'medium' ? "text-xl" : "text-xs"
          )}>{weatherData.location}</p>
          {size !== 'small' && <p className={cn(
            size === 'large' ? "text-xl" : "text-sm"
          )}>{weatherData.description}</p>}
        </div>
      </div>
      
      <div className={cn(
        "flex items-center gap-4",
        size === 'small' ? "flex-row" : "flex-col"
      )}>
        <WeatherIcon 
          className={cn(
            size === 'large' ? "h-40 w-40" : size === 'medium' ? "h-20 w-20" : "h-8 w-8"
          )} 
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }} 
        />
        <p className={cn(
          "font-bold",
          size === 'large' ? "text-9xl" : size === 'medium' ? "text-7xl" : "text-2xl"
        )}>{weatherData.temperature}°</p>
      </div>

      {size !== 'small' && (
        <div className="flex w-full justify-around text-center">
          <div>
            <Wind className={cn("mx-auto", size === 'large' ? "h-8 w-8" : "h-5 w-5")} />
            <p className={cn("font-bold", size === 'large' ? "text-xl" : "text-sm")}>{weatherData.windSpeed} km/h</p>
            <p className={cn("opacity-80", size === 'large' ? "text-sm" : "text-xs")}>Rüzgar</p>
          </div>
          <div>
            <Droplets className={cn("mx-auto", size === 'large' ? "h-8 w-8" : "h-5 w-5")} />
            <p className={cn("font-bold", size === 'large' ? "text-xl" : "text-sm")}>{weatherData.humidity}%</p>
            <p className={cn("opacity-80", size === 'large' ? "text-sm" : "text-xs")}>Nem</p>
          </div>
        </div>
      )}
    </div>
  );
}

    