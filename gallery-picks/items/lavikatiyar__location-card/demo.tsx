// @ts-nocheck
/* eslint-disable */
import { LocationCard } from "@/components/ui/location-card"; // Adjust the import path accordingly

const LocationCardDemo = () => {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center bg-background p-4">
      <LocationCard
        imageUrl="https://cdn.21st.dev/assets/mirror/45/459200ecb3f9516faa4f15b6113d4b7e0f4d0fa0407864e87a19c49861f2f8f0.jpg"
        location="Dolomites"
        country="Italy"
        href="https://www.google.com/maps/place/Dolomites"
      />
    </div>
  );
};

export default LocationCardDemo;