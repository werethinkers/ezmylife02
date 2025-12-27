import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as const,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: {
      duration: 0.25,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Stagger container for list items
export const StaggerContainer = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.div
    initial="initial"
    animate="animate"
    variants={{
      initial: {},
      animate: {
        transition: {
          staggerChildren: 0.08,
          delayChildren: 0.1,
        },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Fade up animation for individual items
export const FadeUpItem = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.div
    variants={{
      initial: { opacity: 0, y: 20 },
      animate: { 
        opacity: 1, 
        y: 0,
        transition: {
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1] as const,
        },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Scale in animation
export const ScaleIn = ({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Hover card effect
export const HoverCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.div
    whileHover={{ 
      y: -4, 
      scale: 1.02,
      transition: { duration: 0.2, ease: "easeOut" },
    }}
    whileTap={{ scale: 0.98 }}
    className={className}
  >
    {children}
  </motion.div>
);

// Slide in from side
export const SlideIn = ({ 
  children, 
  className = "", 
  direction = "left",
  delay = 0 
}: { 
  children: ReactNode; 
  className?: string; 
  direction?: "left" | "right";
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x: direction === "left" ? -30 : 30 }}
    animate={{ 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);
