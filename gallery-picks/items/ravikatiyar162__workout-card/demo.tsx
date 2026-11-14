// @ts-nocheck
/* eslint-disable */
import { WorkoutCard, Exercise } from "@/components/ui/workout-card"; // Adjust the import path as needed

// Sample data for the demo
const warmUpExercises: Exercise[] = [
  {
    iconSrc: "https://www.thiings.co/_next/image?url=https%3A%2F%2Flftz25oez4aqbxpq.public.blob.vercel-storage.com%2Fimage-ZZfiEQIFOGeqPmFDkIYdNbWbSwhGOy.png&w=320&q=75",
    name: "Jumping Jacks",
    detail: "2 minutes",
  },
  {
    iconSrc: "https://www.thiings.co/_next/image?url=https%3A%2F%2Flftz25oez4aqbxpq.public.blob.vercel-storage.com%2Fimage-GM1g71NpPRRnefhKHqhn5fqHXV709G.png&w=320&q=75",
    name: "High Knees",
    detail: "4 minutes",
  },
  {
    iconSrc: "https://www.thiings.co/_next/image?url=https%3A%2F%2Flftz25oez4aqbxpq.public.blob.vercel-storage.com%2Fimage-rYlgXFYWRAgTR7Ui67Hvg1honG39aV.png&w=320&q=75",
    name: "Bicycle Crunches",
    detail: "20 reps",
  },
];

export default function WorkoutCardDemo() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background p-4">
      <WorkoutCard
        date="Wed Jul 17"
        wodTitle="WOD"
        sessionTitle="Warm-Up Session"
        sessionDuration={50}
        exercises={warmUpExercises}
      />
    </div>
  );
}