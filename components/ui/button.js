"use client";

import { cva } from "class-variance-authority";
import { motion } from "framer-motion";

import { easeInOutCubic } from "@/components/motion/motion-utils";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--action)] px-[1.125rem] py-[0.875rem] text-[var(--action-foreground)] shadow-[var(--shadow-soft)] hover:brightness-[1.03]",
        secondary:
          "border border-[var(--border-soft)] bg-[var(--surface)] px-[1.125rem] py-[0.875rem] text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--surface)_82%,var(--accent))]",
        ghost: "px-3 py-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

export function Button({ className, variant, ...props }) {
  return (
    <motion.button
      whileTap={{ scale: props.disabled ? 1 : 0.97 }}
      transition={{ duration: 0.14, ease: easeInOutCubic }}
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  );
}
