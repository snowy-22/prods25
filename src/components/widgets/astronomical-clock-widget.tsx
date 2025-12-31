"use client";

import React, { useState, useEffect } from 'react';
import SunCalc from 'suncalc';
import { Sun, Moon, Sunrise, Sunset, Cloud, Droplets, Zap, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';

// Placeholder for weather data
const weatherData = {
  temp: 18,
  uv: 5,
  description: 'Parçalı Bulutlu',
};

const AstronomicalClockWidget = () => {
  const [now, setNow] = useState<Date | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000 * 30); // Update every 30 seconds
    
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setError(null);
        },
        () => {
          setError('Konum bilgisi alınamadı. Varsayılan konum kullanılıyor.');
          // Fallback location (e.g., Istanbul)
          setLocation({ latitude: 41.0082, longitude: 28.9784 });
        }
      );
    } else {
      setError('Tarayıcınız konum servisini desteklemiyor.');
      setLocation({ latitude: 41.0082, longitude: 28.9784 });
    }

    return () => clearInterval(timer);
  }, []);

  if (!location || !now) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-900 text-white">
        {error ? error : 'Konum bilgisi bekleniyor...'}
      </div>
    );
  }

  const times = SunCalc.getTimes(now, location.latitude, location.longitude);
  const sunPos = SunCalc.getPosition(now, location.latitude, location.longitude);
  const moonPos = SunCalc.getMoonPosition(now, location.latitude, location.longitude);
  const moonIllumination = SunCalc.getMoonIllumination(now);

  const solarNoonPos = SunCalc.getPosition(times.solarNoon, location.latitude, location.longitude);

  const altitudeToY = (alt: number) => 50 - (alt / (Math.PI / 2)) * 45;
  const azimuthToX = (az: number) => ((az * 180 / Math.PI + 180) % 360) / 360 * 100;

  const sunX = azimuthToX(sunPos.azimuth);
  const sunY = altitudeToY(sunPos.altitude);
  const moonX = azimuthToX(moonPos.azimuth);
  const moonY = altitudeToY(moonPos.altitude);
  const solarNoonX = azimuthToX(solarNoonPos.azimuth);

  const sunriseAzimuth = SunCalc.getPosition(times.sunrise, location.latitude, location.longitude).azimuth;
  const sunsetAzimuth = SunCalc.getPosition(times.sunset, location.latitude, location.longitude).azimuth;

  const sunriseX = azimuthToX(sunriseAzimuth);
  const sunsetX = azimuthToX(sunsetAzimuth);

  const MoonPhaseIcon = () => {
    const phase = moonIllumination.phase;
    if (phase < 0.06 || phase > 0.94) return <div className="w-4 h-4 rounded-full bg-gray-600" title="Yeni Ay" />; // New Moon
    if (phase < 0.18) return <div className="w-4 h-4 rounded-full bg-white" style={{ clipPath: 'inset(0 50% 0 0)'}} title="Hilal" />; // Waxing Crescent
    if (phase < 0.31) return <div className="w-4 h-4 rounded-full bg-white" style={{ clipPath: 'inset(0 25% 0 0)'}} title="İlk Dördün" />; // First Quarter
    if (phase < 0.44) return <div className="w-4 h-4 rounded-full bg-white" style={{ clipPath: 'inset(0 12% 0 0)'}} title="Büyüyen Ay" />; // Waxing Gibbous
    if (phase < 0.56) return <div className="w-4 h-4 rounded-full bg-white" title="Dolunay" />; // Full Moon
    if (phase < 0.69) return <div className="w-4 h-4 rounded-full bg-white" style={{ clipPath: 'inset(0 0 0 12%)'}} title="Küçülen Ay" />; // Waning Gibbous
    if (phase < 0.82) return <div className="w-4 h-4 rounded-full bg-white" style={{ clipPath: 'inset(0 0 0 25%)'}} title="Son Dördün" />; // Last Quarter
    return <div className="w-4 h-4 rounded-full bg-white" style={{ clipPath: 'inset(0 0 0 50%)'}} title="Küçülen Hilal" />; // Waning Crescent
  };
  
  const nowPos = (now.getHours() * 60 + now.getMinutes()) / (24 * 60) * 100;

  return (
    <div className="flex h-full w-full flex-col bg-sky-950 p-4 text-sky-100 font-sans">
      {/* Sky */}
      <div className="relative flex-1 rounded-t-lg bg-gradient-to-b from-sky-800 to-sky-600 overflow-hidden">
        {/* Horizon */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-gray-800 via-gray-900/50 to-transparent" />
        
        {/* Sun Path */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 border-t border-dashed border-yellow-300/30 -translate-y-1/2" />
        
        {/* Solar Noon indicator */}
        <div
          className="absolute top-0 bottom-1/2 border-l border-dashed border-yellow-200/50"
          style={{ left: `${solarNoonX}%` }}
        />

        {/* Sun */}
        <div
          className="absolute transition-all duration-1000"
          style={{ left: `${sunX}%`, top: `${sunY}%`, transform: 'translate(-50%, -50%)' }}
        >
          <Sun className={cn("h-6 w-6 text-yellow-300", sunY > 50 ? "opacity-50" : "opacity-100")} style={{ filter: 'drop-shadow(0 0 5px #fef08a)'}}/>
        </div>
        
        {/* Moon */}
        <div
          className="absolute transition-all duration-1000"
          style={{ left: `${moonX}%`, top: `${moonY}%`, transform: 'translate(-50%, -50%)' }}
        >
          <Moon className={cn("h-5 w-5 text-gray-300", moonY > 50 ? "opacity-30" : "opacity-100")} style={{ filter: 'drop-shadow(0 0 4px #e5e7eb)'}}/>
        </div>

        {/* Horizon line */}
        <div className="absolute bottom-[50%] left-0 right-0 h-px bg-gray-400" />
        <div className="absolute bottom-[50%] left-1 -translate-y-1/2 text-xs text-gray-400">Doğu</div>
        <div className="absolute bottom-[50%] right-1 -translate-y-1/2 text-xs text-gray-400">Batı</div>

        {/* Sunrise/Sunset markers */}
        <div className="absolute bottom-1/2" style={{ left: `${sunriseX}%`, transform: 'translateX(-50%)' }}>
            <Sunrise className="h-4 w-4 text-orange-300"/>
        </div>
        <div className="absolute bottom-1/2" style={{ left: `${sunsetX}%`, transform: 'translateX(-50%)' }}>
            <Sunset className="h-4 w-4 text-purple-300"/>
        </div>
      </div>
      
      {/* Time Axis */}
      <div className="relative h-4 mt-1 bg-gray-700 rounded-md">
        <div className="absolute top-0 bottom-0 bg-yellow-400/30" style={{ left: `${sunriseX}%`, width: `${sunsetX - sunriseX}%` }} />
        <div className="absolute -top-1 h-6 w-0.5 bg-white" style={{ left: `${nowPos}%`}} />
      </div>

      {/* Info Panel */}
      <div className="grid grid-cols-3 gap-2 p-2 mt-2 rounded-lg bg-sky-900/50">
        <div className="text-center">
            <p className="text-xs text-sky-300">Gündoğumu</p>
            <p className="font-bold">{times.sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="text-center">
            <p className="text-xs text-sky-300">Güneş Tepesi</p>
            <p className="font-bold">{times.solarNoon.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="text-center">
            <p className="text-xs text-sky-300">Günbatımı</p>
            <p className="font-bold">{times.sunset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>
      
      {/* Weather & Moon Panel */}
      <div className="flex justify-between items-center p-2 mt-2 rounded-lg bg-sky-900/50">
        <div className='flex items-center gap-3'>
            <Cloud className="h-6 w-6 text-white"/>
            <div>
                <p className="font-bold text-lg">{weatherData.temp}°C</p>
                <p className="text-xs text-sky-300">{weatherData.description}</p>
            </div>
        </div>
        <div className="text-center">
            <p className="text-xs text-sky-300">UV</p>
            <p className="font-bold text-lg">{weatherData.uv}</p>
        </div>
         <div className="flex items-center gap-2">
            <MoonPhaseIcon />
            <span className="text-sm font-medium">%{ (moonIllumination.fraction * 100).toFixed(0) }</span>
        </div>
      </div>
    </div>
  );
};

export default AstronomicalClockWidget;
