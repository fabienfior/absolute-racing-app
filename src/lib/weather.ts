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

export type DayForecast = { date: string; max: number; min: number; rainChance: number; code: number };

/** Daily forecast for the circuit (up to 16 days ahead). */
export function useForecast(lat?: number, lon?: number) {
  const [days, setDays] = useState<DayForecast[] | null>(null);
  useEffect(() => {
    if (lat == null || lon == null) return;
    let cancelled = false;
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&forecast_days=16&timezone=auto`,
    )
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j.daily) return;
        setDays(
          j.daily.time.map((date: string, i: number) => ({
            date,
            max: Math.round(j.daily.temperature_2m_max[i]),
            min: Math.round(j.daily.temperature_2m_min[i]),
            rainChance: j.daily.precipitation_probability_max[i] ?? 0,
            code: j.daily.weather_code[i],
          })),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lat, lon]);
  return days;
}
