import { useEffect, useState } from "react";

let promise: Promise<boolean> | null = null;

function load(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);
  if (promise) return promise;
  promise = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => { promise = null; resolve(false); };
    document.body.appendChild(s);
  });
  return promise;
}

export function useRazorpayScript() {
  const [ready, setReady] = useState<boolean>(typeof window !== "undefined" && !!(window as any).Razorpay);
  useEffect(() => { load().then(setReady); }, []);
  return ready;
}

export const ensureRazorpay = load;
