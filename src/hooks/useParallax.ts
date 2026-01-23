import { useScroll, useTransform, useSpring, MotionValue } from "framer-motion";
import { useRef } from "react";

interface ParallaxOptions {
  speed?: number;
  direction?: "up" | "down";
  springConfig?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  };
}

export const useParallax = (options: ParallaxOptions = {}) => {
  const {
    speed = 0.5,
    direction = "up",
    springConfig = { stiffness: 100, damping: 30, mass: 1 }
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollY } = useScroll();
  
  const multiplier = direction === "up" ? -speed : speed;
  
  const y = useTransform(scrollY, [0, 1000], [0, 1000 * multiplier]);
  
  const smoothY = useSpring(y, springConfig);

  return { ref, y: smoothY };
};

export const useParallaxRange = (
  inputRange: [number, number],
  outputRange: [number, number],
  springConfig = { stiffness: 100, damping: 30, mass: 1 }
): MotionValue<number> => {
  const { scrollY } = useScroll();
  const value = useTransform(scrollY, inputRange, outputRange);
  return useSpring(value, springConfig);
};

export const useParallaxOpacity = (
  fadeStart = 0,
  fadeEnd = 500
): MotionValue<number> => {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [fadeStart, fadeEnd], [1, 0]);
  return useSpring(opacity, { stiffness: 100, damping: 30 });
};

export const useParallaxScale = (
  scaleStart = 1,
  scaleEnd = 0.9,
  scrollRange: [number, number] = [0, 500]
): MotionValue<number> => {
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, scrollRange, [scaleStart, scaleEnd]);
  return useSpring(scale, { stiffness: 100, damping: 30 });
};

export const useParallaxRotate = (
  rotateAmount = 5,
  scrollRange: [number, number] = [0, 1000]
): MotionValue<number> => {
  const { scrollY } = useScroll();
  const rotate = useTransform(scrollY, scrollRange, [0, rotateAmount]);
  return useSpring(rotate, { stiffness: 50, damping: 20 });
};

export const useMouseParallax = (intensity = 20) => {
  const x = useSpring(0, { stiffness: 150, damping: 15 });
  const y = useSpring(0, { stiffness: 150, damping: 15 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (event.clientX - centerX) / rect.width;
    const deltaY = (event.clientY - centerY) / rect.height;
    
    x.set(deltaX * intensity);
    y.set(deltaY * intensity);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return { x, y, handleMouseMove, handleMouseLeave };
};
