// @ts-nocheck
/* eslint-disable */
// demo.tsx
import { LocationCard } from "@/components/ui/card-17";

// Sample data for the locations
const locations = [
  {
    city: "India",
    address: "Hawa Mahal, Pink City, Jaipur, Rajasthan India",
    imageUrl: "https://cdn.21st.dev/assets/mirror/74/740222c47d4bf69328ff684fdaf3f4e01d34d940edbbe3b57d33f60912426462.jpg", // Replace with your actual image URL
    directionsUrl: "https://maps.app.goo.gl/TWAmMefs3B22wU5LA",
  },
  {
    city: "Sydney",
    address: "456 Ocean View Road, Bondi Beach, NSW 2026",
    imageUrl: "https://cdn.21st.dev/assets/mirror/c2/c2ef9661f3e913500b2e6d1a6e70079b764b5acfc424b0e7ad4c13fea73f63a9.jpg", // Replace with your actual image URL
    directionsUrl: "https://maps.app.goo.gl/3qXzH4fSjK6rB7yP8",
  },
];

const LocationCardDemo = () => {
  return (
    <div className="w-full bg-background text-foreground p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            LOCATIONS
          </p>
          <h1 className="text-4xl font-bold tracking-tight">
            Our Offices
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Find us at our offices in Sydney and New York.
          </p>
        </div>
        
        {/* Responsive grid for the location cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{ perspective: "1000px" }}>
          {locations.map((location) => (
            <LocationCard
              key={location.city}
              city={location.city}
              address={location.address}
              imageUrl={location.imageUrl}
              directionsUrl={location.directionsUrl}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationCardDemo;