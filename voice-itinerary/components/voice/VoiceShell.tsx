"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { VoiceSessionProvider } from "./VoiceSessionProvider";

/**
 * Thin client wrapper so app/layout.tsx (a server component) can mount the
 * VoiceSessionProvider with a router-driven navigateAfterFinalize callback.
 *
 * The provider lives ABOVE the page tree, so navigation between / and
 * /trip/[id] does not unmount it — the WebRTC session, audio element, and
 * mic stream all survive route changes.
 */
export function VoiceShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const navigateAfterFinalize = useCallback(
    (shareId: string) => {
      router.push(`/trip/${shareId}`);
    },
    [router],
  );
  return (
    <VoiceSessionProvider navigateAfterFinalize={navigateAfterFinalize}>
      {children}
    </VoiceSessionProvider>
  );
}
