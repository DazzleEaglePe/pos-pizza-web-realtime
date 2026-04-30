"use client";

import { motion } from "framer-motion";

const size = 28;

/** Pulse circle — RECEIVED */
export function ReceivedIcon() {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.circle
        cx="14"
        cy="14"
        r="8"
        fill="currentColor"
        opacity={0.15}
        animate={{ r: [8, 12, 8] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle cx="14" cy="14" r="5" fill="currentColor" />
    </motion.svg>
  );
}

/** Rolling pin / kneading — PREPARING */
export function PreparingIcon() {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Dough circle */}
      <motion.ellipse
        cx="14"
        cy="18"
        rx="9"
        ry="5"
        fill="currentColor"
        opacity={0.15}
        animate={{ rx: [9, 11, 9], ry: [5, 4, 5] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Rolling pin */}
      <motion.rect
        x="4"
        y="10"
        width="20"
        height="4"
        rx="2"
        fill="currentColor"
        animate={{ x: [4, 6, 4] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}

/** Flame — IN_OVEN */
export function InOvenIcon() {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.path
        d="M14 4c0 0-6 6.5-6 12a6 6 0 0 0 12 0c0-5.5-6-12-6-12z"
        fill="currentColor"
        opacity={0.15}
      />
      <motion.path
        d="M14 4c0 0-6 6.5-6 12a6 6 0 0 0 12 0c0-5.5-6-12-6-12z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Inner flame */}
      <motion.path
        d="M14 12c0 0-3 3-3 6a3 3 0 0 0 6 0c0-3-3-6-3-6z"
        fill="currentColor"
        animate={{ scaleY: [1, 1.15, 0.9, 1], scaleX: [1, 0.9, 1.05, 1] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "14px 18px" }}
      />
    </motion.svg>
  );
}

/** Confetti star burst — READY */
export function ReadyIcon() {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Check */}
      <motion.path
        d="M8 14.5l3.5 3.5 8.5-8.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      {/* Sparkle dots */}
      {[
        [3, 5],
        [24, 4],
        [25, 22],
        [2, 23],
        [14, 2],
        [14, 26],
      ].map(([cx, cy], i) => (
        <motion.circle
          key={i}
          cx={cx}
          cy={cy}
          r="1.5"
          fill="currentColor"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.svg>
  );
}

/** Static check — DELIVERED */
export function DeliveredIcon() {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.circle
        cx="14"
        cy="14"
        r="10"
        fill="currentColor"
        opacity={0.15}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
      />
      <motion.path
        d="M8 14.5l3.5 3.5 8.5-8.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
    </motion.svg>
  );
}

export const STATUS_ICON_MAP: Record<string, React.FC> = {
  RECEIVED: ReceivedIcon,
  PREPARING: PreparingIcon,
  IN_OVEN: InOvenIcon,
  READY: ReadyIcon,
  DELIVERED: DeliveredIcon,
};
