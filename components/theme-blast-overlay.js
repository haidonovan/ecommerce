"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { easeInOutCubic } from "@/components/motion/motion-utils";

const THEME_BLAST_EVENT = "grocery-theme-blast";

export function ThemeBlastOverlay() {
  const [blast, setBlast] = useState(null);

  useEffect(() => {
    function handleBlast(event) {
      const { x = window.innerWidth / 2, y = 48, fill = "#d9eee9", ring = "#127c73", durationMs = 900 } = event.detail || {};
      const maxRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      setBlast({
        id: Date.now(),
        x,
        y,
        size: maxRadius * 2.15,
        fill,
        ring,
        durationMs,
      });
    }

    window.addEventListener(THEME_BLAST_EVENT, handleBlast);

    return () => {
      window.removeEventListener(THEME_BLAST_EVENT, handleBlast);
    };
  }, []);

  return (
    <AnimatePresence>
      {blast ? (
        <div key={blast.id} className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
          <motion.div
            className="absolute rounded-full"
            style={{
              left: blast.x,
              top: blast.y,
              width: 24,
              height: 24,
              marginLeft: -12,
              marginTop: -12,
              background: `radial-gradient(circle, rgba(255,255,255,0.95) 0%, ${blast.ring} 55%, rgba(255,255,255,0) 100%)`,
              filter: "blur(1px)",
            }}
            initial={{ scale: 0.1, opacity: 0.95 }}
            animate={{ scale: [0.1, 1.6, 2.6], opacity: [0.95, 0.62, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: (blast.durationMs - 180) / 1000, times: [0, 0.18, 1], ease: easeInOutCubic }}
          />
          <motion.div
            className="absolute rounded-full border"
            style={{
              left: blast.x,
              top: blast.y,
              width: blast.size,
              height: blast.size,
              marginLeft: -(blast.size / 2),
              marginTop: -(blast.size / 2),
              backgroundColor: blast.fill,
              borderColor: "rgba(255,255,255,0.2)",
            }}
            initial={{ scale: 0, opacity: 0.98 }}
            animate={{ scale: [0, 0.18, 0.58, 1], opacity: [0.98, 0.98, 0.94, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: blast.durationMs / 1000, times: [0, 0.18, 0.58, 1], ease: easeInOutCubic }}
            onAnimationComplete={() => setBlast(null)}
          />
          <motion.div
            className="absolute rounded-full border-[10px]"
            style={{
              left: blast.x,
              top: blast.y,
              width: blast.size * 0.9,
              height: blast.size * 0.9,
              marginLeft: -(blast.size * 0.45),
              marginTop: -(blast.size * 0.45),
              borderColor: blast.ring,
            }}
            initial={{ scale: 0, opacity: 0.55 }}
            animate={{ scale: [0, 0.36, 0.82, 1.04], opacity: [0.55, 0.52, 0.42, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: (blast.durationMs - 80) / 1000, times: [0, 0.32, 0.76, 1], ease: easeInOutCubic }}
          />
          <motion.div
            className="absolute rounded-full border-[4px]"
            style={{
              left: blast.x,
              top: blast.y,
              width: blast.size * 0.78,
              height: blast.size * 0.78,
              marginLeft: -(blast.size * 0.39),
              marginTop: -(blast.size * 0.39),
              borderColor: "rgba(255,255,255,0.28)",
            }}
            initial={{ scale: 0, opacity: 0.22 }}
            animate={{ scale: [0, 0.28, 0.72, 0.96], opacity: [0.22, 0.2, 0.16, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: (blast.durationMs - 120) / 1000, times: [0, 0.3, 0.74, 1], ease: easeInOutCubic }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              left: blast.x,
              top: blast.y,
              width: blast.size * 0.28,
              height: blast.size * 0.28,
              marginLeft: -(blast.size * 0.14),
              marginTop: -(blast.size * 0.14),
              background: `radial-gradient(circle, rgba(255,255,255,0.22) 0%, ${blast.fill} 62%, rgba(255,255,255,0) 100%)`,
              filter: "blur(10px)",
            }}
            initial={{ scale: 0, opacity: 0.1 }}
            animate={{ scale: [0, 0.55, 1], opacity: [0.1, 0.16, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: blast.durationMs / 1000, times: [0, 0.58, 1], ease: easeInOutCubic }}
          />
        </div>
      ) : null}
    </AnimatePresence>
  );
}
