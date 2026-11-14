// @ts-nocheck
/* eslint-disable */
// demo.tsx
import { PropertyCard } from "@/components/ui/card-3"; // Adjust path as needed

const PropertyCardDemo = () => {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background p-4">
      <PropertyCard
        imageUrl="https://cdn.21st.dev/assets/mirror/ee/ee498e62ac3db7a1f16eb122c547a47a425d51fd6086f30ef99e0ecd90ce7f78.jpg"
        name="La Brisa Vales"
        location="Ubud, Bali, Indonesia"
        price={980}
        rating={4.9}
        reviews={1982}
        imageAlt="Luxury villa with a pool surrounded by palm trees"
        aria-label="View details for La Brisa Vales in Ubud, Bali"
      />
    </div>
  );
};

export default PropertyCardDemo;