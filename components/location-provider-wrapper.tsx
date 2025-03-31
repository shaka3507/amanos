"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { LocationPermissionModal } from "./location-permission-modal";

type LocationData = 
  | { type: "coords"; lat: number; lng: number }
  | { type: "zipcode"; zipcode: string }
  | null;

interface LocationContextType {
  locationData: LocationData;
  setLocationData: (location: LocationData) => void;
  hasPromptedForLocation: boolean;
}

const LocationContext = createContext<LocationContextType>({
  locationData: null,
  setLocationData: () => {},
  hasPromptedForLocation: false
});

export const useLocation = () => useContext(LocationContext);

export default function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locationData, setLocationData] = useState<LocationData>(null);
  const [showModal, setShowModal] = useState(false);
  const [hasPromptedForLocation, setHasPromptedForLocation] = useState(false);

  // Check local storage on mount
  useEffect(() => {
    try {
      const savedLocation = localStorage.getItem("amanos_location");
      const hasPrompted = localStorage.getItem("amanos_location_prompted");
      
      if (savedLocation) {
        try {
          setLocationData(JSON.parse(savedLocation));
        } catch (error) {
          console.error("Failed to parse saved location:", error);
          localStorage.removeItem("amanos_location");
        }
      }
      
      if (hasPrompted) {
        setHasPromptedForLocation(true);
      } else {
        // Show modal after a short delay if not prompted before
        const timer = setTimeout(() => {
          setShowModal(true);
          localStorage.setItem("amanos_location_prompted", "true");
          setHasPromptedForLocation(true);
        }, 1500);
        
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  }, []);

  const handleLocationSet = (location: { lat: number; lng: number } | { zipcode: string }) => {
    let locationToSave: LocationData;
    
    if ('lat' in location) {
      locationToSave = { type: "coords", lat: location.lat, lng: location.lng };
    } else {
      locationToSave = { type: "zipcode", zipcode: location.zipcode };
    }
    
    setLocationData(locationToSave);
    localStorage.setItem("amanos_location", JSON.stringify(locationToSave));
  };

  return (
    <LocationContext.Provider value={{ locationData, setLocationData, hasPromptedForLocation }}>
      {children}
      {showModal && (
        <LocationPermissionModal 
          onLocationSet={handleLocationSet} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </LocationContext.Provider>
  );
} 