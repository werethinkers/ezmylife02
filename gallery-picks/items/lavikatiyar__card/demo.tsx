// @ts-nocheck
/* eslint-disable */
import { HotelCard } from "@/components/ui/card"; // Adjust the import path

export default function HotelCardDemo() {
  return (
    <div className="flex w-full items-center justify-center bg-background p-8">
      <div className="w-full max-w-3xl">
        <HotelCard
          href="#" // Making the card a clickable link
          imageUrl="https://cdn.21st.dev/assets/mirror/28/281e2e52a64a17d165f8fcf16e40b09464947e451ae4e47bd36c8a3be2de2731.jpg"
          imageAlt="Luxury hotel room with a pool view"
          roomType="Deluxe Room"
          hotelName="Sao Pulo Hotel"
          location="Ubud, Bali, Indonesia"
          rating={4.9}
          reviewCount={1092}
        />
      </div>
    </div>
  );
}