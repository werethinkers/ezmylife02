import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {

  return (
    <Sonner
      theme="light"
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
