import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
    filter: "blur(4px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    filter: "blur(2px)",
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className="min-h-screen will-change-transform"
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
      initial: { opacity: 0, y: 16, filter: "blur(4px)" },
      animate: { 
        opacity: 1, 
        y: 0,
        filter: "blur(0px)",
        transition: {
          duration: 0.6,
          ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
      },
    }}
    className={`${className} will-change-transform`}
  >
    {children}
  </motion.div>
);

// Scale in animation
export const ScaleIn = ({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
    animate={{ 
      opacity: 1, 
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.6,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    }}
    className={`${className} will-change-transform`}
  >
    {children}
  </motion.div>
);

// Hover card effect
export const HoverCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.div
    whileHover={{ 
      y: -6, 
      scale: 1.02,
      transition: { 
        duration: 0.3, 
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    }}
    whileTap={{ 
      scale: 0.98,
      transition: { duration: 0.1 },
    }}
    className={`${className} will-change-transform`}
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
    initial={{ opacity: 0, x: direction === "left" ? -20 : 20, filter: "blur(4px)" }}
    animate={{ 
      opacity: 1, 
      x: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.6,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    }}
    className={`${className} will-change-transform`}
  >
    {children}
  </motion.div>
);

// Smooth button press animation
export const SmoothButton = ({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) => (
  <motion.button
    whileHover={{ 
      scale: 1.03,
      transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] },
    }}
    whileTap={{ 
      scale: 0.97,
      transition: { duration: 0.1 },
    }}
    onClick={onClick}
    className={`${className} will-change-transform`}
  >
    {children}
  </motion.button>
);

// Smooth reveal on scroll
export const RevealOnScroll = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
    whileInView={{ 
      opacity: 1, 
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    }}
    viewport={{ once: true, margin: "-50px" }}
    className={`${className} will-change-transform`}
  >
    {children}
  </motion.div>
);
