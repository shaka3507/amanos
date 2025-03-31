"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import the LocationProvider with no SSR
const LocationProvider = dynamic(() => import("./location-provider-wrapper"), { 
  ssr: false
});

export default function ClientProviders({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <LocationProvider>
      {children}
    </LocationProvider>
  );
} 