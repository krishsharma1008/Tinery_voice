"use client";

import { create } from "zustand";

/**
 * Voice / connection state machine. Source of truth for the orb's visual mode.
 * State diagram lives in PLAN §5.1.
 */
export type VoiceState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "disconnected";

export type TranscriptTurn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  finalized: boolean;
};

type VoiceStore = {
  state: VoiceState;
  error: string | null;
  micPermission: "unknown" | "granted" | "denied";
  transcript: TranscriptTurn[];
  setState: (s: VoiceState) => void;
  setError: (e: string | null) => void;
  setMic: (p: VoiceStore["micPermission"]) => void;
  appendUserTurn: (id: string, text: string) => void;
  appendAssistantDelta: (id: string, delta: string) => void;
  finalizeAssistantTurn: (id: string, transcript: string) => void;
  reset: () => void;
};

export const useVoiceStore = create<VoiceStore>((set) => ({
  state: "idle",
  error: null,
  micPermission: "unknown",
  transcript: [],

  setState: (s) => set({ state: s }),
  setError: (e) => set({ error: e }),
  setMic: (p) => set({ micPermission: p }),

  appendUserTurn: (id, text) =>
    set((st) => ({
      transcript: [
        ...st.transcript,
        { id, role: "user", text, finalized: true },
      ],
    })),

  appendAssistantDelta: (id, delta) =>
    set((st) => {
      const existing = st.transcript.find((t) => t.id === id);
      if (existing) {
        return {
          transcript: st.transcript.map((t) =>
            t.id === id ? { ...t, text: t.text + delta } : t,
          ),
        };
      }
      return {
        transcript: [
          ...st.transcript,
          { id, role: "assistant", text: delta, finalized: false },
        ],
      };
    }),

  finalizeAssistantTurn: (id, transcript) =>
    set((st) => ({
      transcript: st.transcript.map((t) =>
        t.id === id ? { ...t, text: transcript, finalized: true } : t,
      ),
    })),

  reset: () =>
    set({
      state: "idle",
      error: null,
      transcript: [],
    }),
}));
