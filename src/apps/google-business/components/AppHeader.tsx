import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { APP_NAME, gb } from "../lib/business";

/** EzYourLife navbar plus this app's own title bar. */
export function AppHeader({ right }: { right?: ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
          <Link to={gb("/")} className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <MapPin className="h-4 w-4" />
            </span>
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-2">{right}</div>
        </div>
      </div>
    </>
  );
}
