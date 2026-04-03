"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { STATUS_ICON_MAP } from "./tracking-icons";

const stepVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.12, duration: 0.4, ease: "easeOut" },
  }),
};

interface AnimatedStepProps {
  stepKey: string;
  status: "done" | "active" | "pending";
  title: string;
  time: string;
  desc: string;
  index: number;
  estimatedLabel?: string;
}

export function AnimatedTrackingStep({
  stepKey,
  status,
  title,
  time,
  desc,
  index,
  estimatedLabel,
}: AnimatedStepProps) {
  const isDone = status === "done";
  const isActive = status === "active";
  const isPending = status === "pending";

  const AnimatedIcon = isActive ? STATUS_ICON_MAP[stepKey] : null;

  return (
    <motion.div
      className="flex gap-5 sm:gap-6 w-full group"
      custom={index}
      variants={stepVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Indicator circle */}
      <div className="relative shrink-0 flex items-center justify-center pt-1">
        <motion.div
          className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-card shadow-sm z-10 transition-all duration-500
            ${isDone ? "bg-primary text-primary-foreground" : isActive ? "bg-card border-primary shadow-[0_0_15px_rgba(0,191,166,0.3)]" : "bg-muted border-muted text-muted-foreground/50"}`}
          layout
        >
          <AnimatePresence mode="wait">
            {isDone && (
              <motion.span
                key="done"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
              </motion.span>
            )}
            {isActive && (
              <motion.span
                key="active"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="text-primary"
              >
                {AnimatedIcon ? <AnimatedIcon /> : (
                  <>
                    <div className="w-3 h-3 bg-primary rounded-full animate-ping absolute" />
                    <div className="w-3 h-3 bg-primary rounded-full relative z-10" />
                  </>
                )}
              </motion.span>
            )}
            {isPending && (
              <motion.span
                key="pending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CircleDashed className="w-5 h-5 stroke-3" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Step content */}
      <motion.div
        className={`flex flex-col pt-0.5 transition-opacity duration-500 ${isPending ? "opacity-50" : "opacity-100"}`}
      >
        <h4
          className={`text-lg tracking-tight font-black leading-none ${isActive ? "text-primary" : "text-foreground"}`}
        >
          {title}
        </h4>

        <span
          className={`text-[13px] font-bold mt-1.5 ${isActive ? "text-foreground" : "text-muted-foreground"}`}
        >
          {time}
        </span>

        {isActive && estimatedLabel && (
          <motion.span
            className="text-xs font-semibold text-primary/80 mt-1"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {estimatedLabel}
          </motion.span>
        )}

        <p className="text-sm font-medium text-muted-foreground mt-1.5 leading-snug pr-4">
          {desc}
        </p>
      </motion.div>
    </motion.div>
  );
}

/** Animated progress bar for the vertical stepper */
export function AnimatedProgressBar({ percent }: { percent: number }) {
  return (
    <motion.div
      className="absolute top-10 sm:top-12 bottom-10 sm:bottom-12 left-10 sm:left-13 w-1 bg-primary -translate-x-1/2 rounded-full z-0 origin-top"
      initial={{ scaleY: 0 }}
      animate={{ scaleY: percent / 100 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
    />
  );
}

/**
 * Estimate minutes remaining based on current step.
 * Based on typical pizza prep times:
 *   RECEIVED → ~20 min total
 *   PREPARING → ~15 min
 *   IN_OVEN → ~8 min
 *   READY → 0
 */
const ESTIMATE_MAP: Record<string, number> = {
  RECEIVED: 20,
  PREPARING: 15,
  IN_OVEN: 8,
  READY: 0,
  DELIVERED: 0,
};

export function getEstimatedMinutes(status: string): number {
  return ESTIMATE_MAP[status] ?? 0;
}
