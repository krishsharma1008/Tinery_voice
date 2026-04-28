/**
 * Shape injected into the realtime session as `existing_commitments`.
 * Per PLAN §15.3 + the user decision (2026-04-25): titles and locations
 * preserved, attendees + descriptions stripped server-side.
 */
export type RedactedEvent = {
  id: string;
  title: string;
  start_local: string; // ISO local "YYYY-MM-DDTHH:mm"
  end_local: string;
  location?: string;
  has_video: boolean;
};

export type CalendarSource = "mock" | "google" | "off";
