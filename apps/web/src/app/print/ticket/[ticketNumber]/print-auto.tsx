"use client";

import { useEffect } from "react";

export function PrintAuto() {
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        window.print();
      } catch {
        // ignore
      }
    }, 200);

    return () => window.clearTimeout(id);
  }, []);

  return null;
}
