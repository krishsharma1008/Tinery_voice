"use client";

import { Mic, MicOff, Loader2, PowerOff } from "lucide-react";
import { useVoiceStore } from "@/lib/store/voice";
import { useAudioReactive } from "@/lib/voice/useAudioReactive";
import { useVoiceSession } from "./VoiceSessionProvider";

type Variant = "primary" | "fab";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * VoiceOrb is purely presentational. The connection itself lives in
 * VoiceSessionProvider (in app/layout.tsx) so the WebRTC session survives
 * route changes between / and /trip/[id]. The orb's only responsibility
 * is to render the right visuals for the current state and forward
 * tap → connect / disconnect.
 */
export function VoiceOrb({ variant = "primary" }: { variant?: Variant } = {}) {
  const session = useVoiceSession();
  const { conn, hint, micStream, remoteStream, connect, disconnect } = session;

  const reduced =
    typeof window !== "undefined" ? prefersReducedMotion() : false;
  const isLive = conn === "active";
  const voiceState = useVoiceStore((s) => s.state);
  const isSpeaking = voiceState === "speaking";

  const micAmp = useAudioReactive(
    micStream,
    !reduced && isLive && !isSpeaking,
  );
  const remoteAmp = useAudioReactive(remoteStream, !reduced && isSpeaking);
  const amp = isSpeaking ? remoteAmp : micAmp;

  const handlePress = () => {
    if (conn === "active" || conn === "connecting" || conn === "reconnecting") {
      return;
    }
    void connect();
  };

  const handleEndSession = () => {
    void disconnect();
  };

  const isBusy = conn === "connecting" || conn === "reconnecting";
  const Icon = isLive ? Mic : isBusy ? Loader2 : MicOff;

  const isFab = variant === "fab";
  const orbSize = isFab ? 96 : 220;
  const iconSize = isFab ? "h-6 w-6" : "h-12 w-12";

  const bodyScale = 1 + amp * 0.04;
  const iconScale = 1 + amp * 0.08;
  const sonarActive =
    isLive && (voiceState === "listening" || voiceState === "speaking");
  const orbAmp = sonarActive ? Math.max(0.25, amp) : 0;

  const button = (
    <button
      type="button"
      onClick={handlePress}
      aria-label={
        isLive
          ? "Voice session live"
          : conn === "reconnecting"
            ? "Reconnecting…"
            : isBusy
              ? "Connecting…"
              : isFab
                ? "Press to keep editing by voice"
                : "Press to plan your trip with voice"
      }
      data-state={conn}
      data-voice-state={voiceState}
      data-active={sonarActive ? "true" : "false"}
      className="orb focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--color-orange-300)]"
      style={
        {
          width: orbSize,
          height: orbSize,
          ["--orb-amp" as string]: orbAmp.toFixed(3),
        } as React.CSSProperties
      }
    >
      <span aria-hidden className="orb__halo" />
      <span aria-hidden className="orb__sonar orb__sonar--1" />
      <span aria-hidden className="orb__sonar orb__sonar--2" />
      <span aria-hidden className="orb__sonar orb__sonar--3" />
      <span
        aria-hidden
        className="orb__body"
        style={{ transform: `scale(${bodyScale})`, transition: "transform 90ms ease-out" }}
      />
      <span aria-hidden className="orb__arc" />
      <Icon
        className={`orb__icon ${iconSize}`}
        strokeWidth={1.6}
        style={{
          transform: `scale(${iconScale})`,
          filter: isLive
            ? `drop-shadow(0 0 ${4 + amp * 14}px rgba(255,255,255,0.85))`
            : undefined,
        }}
      />
    </button>
  );

  if (isFab) {
    return (
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 print-hide">
        {button}
        <p className="rounded-full bg-white/85 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[color:var(--color-ink-600)] shadow-[var(--shadow-soft)]">
          {conn === "idle" || conn === "closed"
            ? "tap to keep editing"
            : conn === "reconnecting"
              ? "reconnecting…"
              : conn === "connecting"
                ? "tuning in…"
                : isSpeaking
                  ? "speaking…"
                  : "listening"}
        </p>
        {isLive && (
          <button
            type="button"
            onClick={handleEndSession}
            className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-cream-200)] bg-white/90 px-3 py-1 text-[11px] font-medium text-[color:var(--color-ink-600)] shadow-[var(--shadow-soft)] hover:bg-white"
          >
            <PowerOff className="h-3 w-3" />
            end session
          </button>
        )}
        {hint && (
          <p className="max-w-[220px] text-right text-[11px] text-[color:var(--color-danger)]">
            {hint}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {button}

      <p className="mt-6 text-xs uppercase tracking-[0.18em] text-[color:var(--color-ink-400)]">
        {conn === "idle" || conn === "closed"
          ? "press the orb to begin"
          : conn === "reconnecting"
            ? "reconnecting…"
            : conn === "connecting"
              ? "tuning in…"
              : isSpeaking
                ? "speaking…"
                : "listening · talk like you're texting a friend"}
      </p>

      {isLive && (
        <button
          type="button"
          onClick={handleEndSession}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-cream-200)] bg-white/70 px-3 py-1.5 text-xs font-medium text-[color:var(--color-ink-600)] transition-colors hover:bg-white"
        >
          <PowerOff className="h-3 w-3" />
          end session
        </button>
      )}

      {hint && (
        <p className="mt-3 max-w-md text-center text-xs text-[color:var(--color-danger)]">
          {hint}
        </p>
      )}
    </div>
  );
}
