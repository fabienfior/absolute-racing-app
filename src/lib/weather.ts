import { useEffect, useState } from 'react';

/** Track weather from Open-Meteo (free, no API key). */
export type Weather = { temperature: number; rainChance: number; wind: number; code: number };

export function useWeather(lat?: number, lon?: number) {
  const [weather, setWeather] = useState<Weather | null>(null);
  useEffect(() => {
    if (lat == null || lon == null) return;
    let cancelled = false;
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1`,
    )
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j.current) return;
        const hour = new Date().getHours();
        setWeather({
          temperature: Math.round(j.current.temperature_2m),
          wind: Math.round(j.current.wind_speed_10m),
          code: j.current.weather_code,
          rainChance: j.hourly?.precipitation_probability?.[hour] ?? 0,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lat, lon]);
  return weather;
}

export function weatherLabel(code: number): { label: string; icon: 'sunny-outline' | 'partly-sunny-outline' | 'cloudy-outline' | 'rainy-outline' | 'thunderstorm-outline' } {
  if (code === 0) return { label: 'Clear', icon: 'sunny-outline' };
  if (code <= 3) return { label: 'Partly cloudy', icon: 'partly-sunny-outline' };
  if (code <= 48) return { label: 'Fog', icon: 'cloudy-outline' };
  if (code <= 82) return { label: 'Rain', icon: 'rainy-outline' };
  return { label: 'Storms', icon: 'thunderstorm-outline' };
}
