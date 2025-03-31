"use client";

import dynamic from "next/dynamic";

// Import the LocationWrapper with no SSR
const LocationWrapper = dynamic(() => import("@/components/location-wrapper"), {
  ssr: false
});

export default function HomeLocationWrapper() {
  return <LocationWrapper />;
} 