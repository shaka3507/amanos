"use client";

import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { CloudSun, Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind } from "lucide-react";

type WeatherData = {
  location: string;
  temperature: number;
  condition: string;
  icon: string;
  high: number;
  low: number;
};

export default function WeatherDisplay() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchWeather() {
      try {
        setLoading(true);
        
        // Get location data from localStorage
        const locationData = localStorage.getItem("amanos_location");
        if (!locationData) {
          setLoading(false);
          return;
        }
        
        const location = JSON.parse(locationData);
        let apiUrl = "";
        
        // Construct API URL based on location type
        if (location.type === "coords") {
          apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&q=${location.lat},${location.lng}&days=1`;
        } else if (location.type === "zipcode") {
          apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&q=${location.zipcode}&days=1`;
        }
        
        // For demo purposes, simulate a weather API response
        // In a real app, you would make a fetch request to the weather API
        // const response = await fetch(apiUrl);
        // const data = await response.json();
        
        // DEMO: Simulate API response
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Random temperature between 40 and 85
        const temp = Math.floor(Math.random() * 45) + 40;
        const conditions = ["Sunny", "Partly cloudy", "Cloudy", "Light rain", "Rain", "Snow", "Thunderstorm", "Windy"];
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        
        // Format location name
        const locationName = location.type === "zipcode" 
          ? `${location.zipcode}`
          : "Your location";
        
        setWeather({
          location: locationName,
          temperature: temp,
          condition: condition,
          icon: condition.toLowerCase().replace(/\s/g, "-"),
          high: temp + Math.floor(Math.random() * 8),
          low: temp - Math.floor(Math.random() * 12)
        });
      } catch (err) {
        console.error("Error fetching weather:", err);
        setError("Unable to load weather information");
      } finally {
        setLoading(false);
      }
    }
    
    fetchWeather();
  }, []);

  // Return null if no weather data
  if (!weather && !loading && !error) return null;

  // Get appropriate weather icon
  const getWeatherIcon = () => {
    if (!weather) return <CloudSun className="h-8 w-8 text-blue-500" />;
    
    const condition = weather.condition.toLowerCase();
    
    if (condition.includes("sunny") || condition.includes("clear")) {
      return <Sun className="h-8 w-8 text-yellow-500" />;
    } else if (condition.includes("rain")) {
      return <CloudRain className="h-8 w-8 text-blue-400" />;
    } else if (condition.includes("cloud")) {
      return <Cloud className="h-8 w-8 text-gray-400" />;
    } else if (condition.includes("snow")) {
      return <CloudSnow className="h-8 w-8 text-blue-200" />;
    } else if (condition.includes("thunder")) {
      return <CloudLightning className="h-8 w-8 text-purple-500" />;
    } else if (condition.includes("wind")) {
      return <Wind className="h-8 w-8 text-gray-500" />;
    }
    
    return <CloudSun className="h-8 w-8 text-blue-500" />;
  };

  return (
    <Card className="p-4 border-2 border-black">
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-pulse h-10 w-10 bg-blue-100 rounded-full" />
          <div className="space-y-2">
            <div className="animate-pulse h-4 w-24 bg-gray-100 rounded" />
            <div className="animate-pulse h-3 w-32 bg-gray-100 rounded" />
          </div>
        </div>
      ) : error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : weather && (
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-50 rounded-full p-2">
              {getWeatherIcon()}
            </div>
            <div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">{weather.temperature}°</span>
                <span className="text-xs text-gray-500 ml-2">H:{weather.high}° L:{weather.low}°</span>
              </div>
              <p className="text-sm text-gray-600">{weather.condition} · {weather.location}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
} 