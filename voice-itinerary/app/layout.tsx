import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Caveat } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/brand/TopNav";
import { VoiceShell } from "@/components/voice/VoiceShell";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tineri Voice — Plan a trip by talking",
  description:
    "Tineri Voice by Open Destinations. Press the orb, say where you're going, and watch your itinerary build itself.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-[color:var(--color-ink-900)]">
        <VoiceShell>
          <TopNav />
          <main className="flex flex-1 flex-col">{children}</main>
          <span
            aria-live="polite"
            id="trip-announcer"
            className="sr-only"
          />
        </VoiceShell>
      </body>
    </html>
  );
}
