"use client";

import { motion } from "framer-motion";

import { easeInOutCubic } from "@/components/motion/motion-utils";

export function HoverLift({
  children,
  className = "",
  enabled = true,
  hoverOffset = 8,
  hoverScale = 1,
  normalElevation = 6,
  hoverElevation = 18,
}) {
  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={false}
      whileHover={{
        y: -hoverOffset,
        scale: hoverScale,
        boxShadow: `0 ${hoverElevation}px ${hoverElevation * 2}px rgba(15,24,35,0.14)`,
      }}
      animate={{
        y: 0,
        scale: 1,
        boxShadow: `0 ${Math.max(normalElevation, 1)}px ${normalElevation * 3}px rgba(15,24,35,0.06)`,
      }}
      transition={{ duration: 0.22, ease: easeInOutCubic }}
    >
      {children}
    </motion.div>
  );
}
