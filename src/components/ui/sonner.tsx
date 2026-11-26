import { useLocation } from "react-router-dom";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  /* My Business (/business and /business/app) has its own floating support button at
     bottom-right, so its toasts move to the top-right there to avoid covering it. Everywhere
     else keeps sonner's default bottom-right position. */
  const { pathname } = useLocation();
  const inBusinessApp = pathname.startsWith("/business");

  return (
    <Sonner
      theme="light"
      position={inBusinessApp ? "top-right" : undefined}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-xl group-[.toaster]:border-2 group-[.toaster]:border-foreground group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:shadow-block",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:border-2 group-[.toast]:border-foreground group-[.toast]:bg-pink group-[.toast]:font-bold group-[.toast]:text-ink",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
