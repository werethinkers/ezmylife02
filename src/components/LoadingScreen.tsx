import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6"
      >
        <motion.img
          src={logo}
          alt="Loading"
          className="h-16 w-auto"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-primary"
              animate={{
                y: [0, -8, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// Inline loading spinner
export const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} rounded-full border-2 border-primary/30 border-t-primary`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
};

// Skeleton loader with shimmer
export const SkeletonCard = () => (
  <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6">
    <div className="space-y-4">
      <div className="h-4 w-2/3 rounded-lg bg-muted animate-pulse" />
      <div className="h-3 w-full rounded-lg bg-muted animate-pulse" />
      <div className="h-3 w-4/5 rounded-lg bg-muted animate-pulse" />
    </div>
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
      animate={{ x: ["-100%", "100%"] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  </div>
);
