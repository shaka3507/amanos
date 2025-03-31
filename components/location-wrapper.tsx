"use client";

import { useState, useEffect } from "react";
import LocationModal from "./location-modal";

export default function LocationWrapper() {
  const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    // Check if we've already prompted for location
    const hasPrompted = localStorage.getItem("amanos_location_prompted");
    
    if (!hasPrompted) {
      // Show modal after a short delay
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  const handleLocationSet = (location: { lat: number; lng: number } | { zipcode: string }) => {
    // Save location to localStorage
    localStorage.setItem("amanos_location", JSON.stringify(location));
    localStorage.setItem("amanos_location_prompted", "true");
    
    // Close modal
    setShowModal(false);
  };
  
  const handleClose = () => {
    // Mark as prompted even if user dismisses
    localStorage.setItem("amanos_location_prompted", "true");
    setShowModal(false);
  };
  
  if (!showModal) return null;
  
  return (
    <LocationModal 
      onClose={handleClose}
      onLocationSet={handleLocationSet}
    />
  );
} 