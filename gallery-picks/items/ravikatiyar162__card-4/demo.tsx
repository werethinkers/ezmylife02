// @ts-nocheck
/* eslint-disable */
import { PropertyCard } from "@/components/ui/card-4";

export default function PropertyCardDemo() {
  const handleReserveClick = () => {
    // In a real app, this would handle the reservation logic
    alert("Reserve button clicked!");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <PropertyCard
        imageUrl="https://cdn.21st.dev/assets/mirror/e2/e29a400771a8ddd70d0986c9ce88aedebd3aa98ade01efe83ec5dd01bad224ef.jpg"
        imageAlt="Modern wooden cabin in a grassy, mountainous landscape"
        title="Iceland Cabin"
        price={680}
        pricePeriod="per night"
        description="Cozy cabin nestled in Iceland's breathtaking landscape, offering stunning views of mountains and Northern Lights."
        stats={[
          { label: "Days", value: 3 },
          { label: "Rating", value: "4.9" },
        ]}
        actionLabel="Reserve"
        onActionClick={handleReserveClick}
      />
    </div>
  );
}