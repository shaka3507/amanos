"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Import weather display with no SSR
const WeatherDisplay = dynamic(() => import("./weather-display"), {
  ssr: false,
  loading: () => <WeatherLoadingPlaceholder />
});

function WeatherLoadingPlaceholder() {
  return (
    <div className="p-4 border-2 border-black rounded-md">
      <div className="flex items-center space-x-2">
        <div className="animate-pulse h-10 w-10 bg-blue-100 rounded-full" />
        <div className="space-y-2">
          <div className="animate-pulse h-4 w-24 bg-gray-100 rounded" />
          <div className="animate-pulse h-3 w-32 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

export function WeatherClient() {
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    try {
      const location = localStorage.getItem("amanos_location");
      setHasLocation(!!location);
    } catch (error) {
      console.error("Error checking for location data:", error);
    }
  }, []);

  if (!hasLocation) return null;

  return <WeatherDisplay />;
} 