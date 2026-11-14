// @ts-nocheck
/* eslint-disable */
import { BookingSlotCalendar } from "@/components/ui/booking-slot-calendar";

export default function BookingSlotCalendarDemo() {
  return (
    <div className="flex w-full items-center justify-center p-10">
      <BookingSlotCalendar onBook={(date, slot) => console.log(date, slot)} />
    </div>
  );
}
