/**
 * In-memory share-link store for the demo. Per PLAN §13: not durable across
 * Vercel cold starts; that's acceptable for the demo. Swap for Vercel KV
 * later. Single source of truth for both the POST and GET handlers.
 */

export type SharedTrip = {
  share_id: string;
  saved_at: number;
  // Loose shape — we don't need server-side type rigor; client validates.
  payload: unknown;
};

declare global {
  // eslint-disable-next-line no-var
  var __tineriShareStore: Map<string, SharedTrip> | undefined;
}

export const shareStore: Map<string, SharedTrip> =
  globalThis.__tineriShareStore ??
  (globalThis.__tineriShareStore = new Map<string, SharedTrip>());
