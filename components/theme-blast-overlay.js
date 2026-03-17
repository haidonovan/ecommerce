"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { easeInOutCubic } from "@/components/motion/motion-utils";

const THEME_BLAST_EVENT = "grocery-theme-blast";

export function ThemeBlastOverlay() {
  const [blast, setBlast] = useState(null);

  useEffect(() => {
    function handleBlast(event) {
      const { x = window.innerWidth / 2, y = 48 } = event.detail || {};
      const maxRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      setBlast({
        id: Date.now(),
        x,
        y,
        size: maxRadius * 2.15,
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
            className="absolute rounded-full border border-white/20 bg-[color:color-mix(in_srgb,var(--action)_28%,white)]"
            style={{
              left: blast.x,
              top: blast.y,
              width: blast.size,
              height: blast.size,
              marginLeft: -(blast.size / 2),
              marginTop: -(blast.size / 2),
            }}
            initial={{ scale: 0, opacity: 0.96 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.74, ease: easeInOutCubic }}
            onAnimationComplete={() => setBlast(null)}
          />
          <motion.div
            className="absolute rounded-full border-[10px] border-white/25"
            style={{
              left: blast.x,
              top: blast.y,
              width: blast.size * 0.9,
              height: blast.size * 0.9,
              marginLeft: -(blast.size * 0.45),
              marginTop: -(blast.size * 0.45),
            }}
            initial={{ scale: 0, opacity: 0.55 }}
            animate={{ scale: 1.08, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.68, ease: easeInOutCubic }}
          />
        </div>
      ) : null}
    </AnimatePresence>
  );
}
