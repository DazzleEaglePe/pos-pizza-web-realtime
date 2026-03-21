"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useApiLoading } from "@/store/api-loading-store";

export function LoadingBar() {
  const pending = useApiLoading((s) => s.pending);
  const pathname = usePathname();
  const prevPath = useRef(pathname);

  const [navLoading, setNavLoading] = useState(false);

  // Detect route changes (covers Server Component transitions)
  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      setNavLoading(true);
      const id = window.setTimeout(() => setNavLoading(false), 500);
      return () => window.clearTimeout(id);
    }
  }, [pathname]);

  const isActive = pending > 0 || navLoading;

  if (!isActive) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-9999 h-0.75 overflow-hidden bg-primary/20">
      <div className="h-full w-1/3 bg-primary rounded-full animate-loading-bar" />
    </div>
  );
}
