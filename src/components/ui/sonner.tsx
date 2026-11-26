import { useLocation } from "react-router-dom";
import { Toaster as Sonner, toast } from "sonner";
import { STUDIO_IDS } from "@/data/studios";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  /* My Business (/business and /business/app) has its own floating support button at
     bottom-right, so its toasts move to the top-right there to avoid covering it. Studio tool
     pages (/tool/:id) move theirs up for the same reason — the support FAB, plus the "Works well
     with" cross-sell cards lower on the page that a bottom toast could sit over. Everywhere else
     keeps sonner's default bottom-right position. */
  const { pathname } = useLocation();
  const toolId = pathname.startsWith("/tool/") ? pathname.slice("/tool/".length).split("/")[0] : "";
  const inBusinessApp = pathname.startsWith("/business");
  const inStudioTool = STUDIO_IDS.has(toolId);

  return (
    <Sonner
      theme="light"
      position={inBusinessApp || inStudioTool ? "top-right" : undefined}
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
