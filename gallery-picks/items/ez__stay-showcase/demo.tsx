// @ts-nocheck
/* eslint-disable */
import StayShowcase from "@/instant/showpieces/StayShowcase";

const pic = (hue) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' fill='hsl(${hue} 60% 80%)'/></svg>`)}`;

export default function Demo() {
  return (
    <div className="min-h-screen bg-background p-6">
      <StayShowcase
        rooms={[
          { name: "Deluxe room", price: "₹2,500", note: "King bed, city view" },
          { name: "Family suite", price: "₹4,200", note: "Two rooms, breakfast included" },
          { name: "Standard room", price: "₹1,600", note: "Queen bed" },
        ]}
        photos={[pic(20), pic(160), pic(260)]}
        bookHref="#"
        label="room"
      />
    </div>
  );
}
