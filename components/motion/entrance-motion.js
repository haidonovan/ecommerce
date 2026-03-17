"use client";

import { motion } from "framer-motion";

import { easeInOutCubic } from "@/components/motion/motion-utils";

export function EntranceMotion({
  children,
  className = "",
  active = true,
  delay = 0,
  duration = 0.9,
  beginOffset = [-0.08, 0],
}) {
  const [xOffset = -0.08, yOffset = 0] = Array.isArray(beginOffset) ? beginOffset : [-0.08, 0];

  if (!active) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: xOffset * 120, y: yOffset * 120 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: easeInOutCubic }}
    >
      {children}
    </motion.div>
  );
}
