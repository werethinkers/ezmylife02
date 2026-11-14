/*
 * Event RSVP Card
 * Author: @cnippet-dev   Source: https://21st.dev/@cnippet-dev/components/v-card-19   21st.dev id: 25369
 * Licence: covered by the paid 21st.dev plan Ezyourlife bought on 14 Nov 2026 (the API returns no
 * per-component licence text, so the author's own terms were not checked line by line).
 * Kept as published; only this header was added.
 */
// @ts-nocheck
/* eslint-disable */
import { CalendarIcon, ClockIcon, MapPinIcon, UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/v-card-19-utils/badge";
import { Button } from "@/components/ui/v-card-19-utils/button";
import { Card, CardContent } from "@/components/ui/v-card-19-utils/card";

const event = {
  attendees: 42,
  category: "Workshop",
  date: "Jun 18, 2026",
  location: "Design Hub, Floor 3",
  spots: 10,
  time: "2:00 PM – 4:30 PM",
  title: "Design Systems in Practice",
};

export default function Pattern() {
  return (
    <Card className="w-full max-w-xs">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-snug">{event.title}</h3>
          <Badge size="sm" variant="secondary">
            {event.category}
          </Badge>
        </div>
        <div className="flex flex-col gap-2 text-muted-foreground text-xs">
          <span className="flex items-center gap-2">
            <CalendarIcon className="size-3.5 shrink-0" />
            {event.date}
          </span>
          <span className="flex items-center gap-2">
            <ClockIcon className="size-3.5 shrink-0" />
            {event.time}
          </span>
          <span className="flex items-center gap-2">
            <MapPinIcon className="size-3.5 shrink-0" />
            {event.location}
          </span>
          <span className="flex items-center gap-2">
            <UsersIcon className="size-3.5 shrink-0" />
            {event.attendees} attending ·{" "}
            <span className="text-amber-600 dark:text-amber-400">
              {event.spots} spots left
            </span>
          </span>
        </div>
        <Button className="w-full" size="sm">
          Reserve a Spot
        </Button>
      </CardContent>
    </Card>
  );
}
