"use client";

import { useEffect } from "react";

/**
 * Pops the browser's print dialog as soon as the print page renders so
 * the user can save as PDF in one step. No-ops on SSR.
 */
export function PrintAutoOpen() {
  useEffect(() => {
    const id = window.setTimeout(() => window.print(), 250);
    return () => window.clearTimeout(id);
  }, []);
  return null;
}
