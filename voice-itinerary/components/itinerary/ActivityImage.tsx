"use client";

import {
  Coffee,
  Compass,
  Image as ImageIcon,
  Mountain,
  Music,
  Sunset,
  UtensilsCrossed,
  Waves,
  Sparkles,
} from "lucide-react";
import { gradientStyle } from "@/lib/images/gradient";

type Kind = "activity" | "food" | "experience" | "stay";

const ICON_BY_TAG: Array<{ tag: string; Icon: React.ComponentType<{ className?: string }> }> = [
  { tag: "sunset", Icon: Sunset },
  { tag: "ocean", Icon: Waves },
  { tag: "beach", Icon: Waves },
  { tag: "surf", Icon: Waves },
  { tag: "hike", Icon: Mountain },
  { tag: "cliff", Icon: Mountain },
  { tag: "scenic", Icon: Mountain },
  { tag: "music", Icon: Music },
  { tag: "fado", Icon: Music },
  { tag: "drinks", Icon: Music },
  { tag: "wifi", Icon: Coffee },
  { tag: "work-friendly", Icon: Coffee },
  { tag: "morning", Icon: Coffee },
  { tag: "foodie", Icon: UtensilsCrossed },
  { tag: "seafood", Icon: UtensilsCrossed },
  { tag: "iconic", Icon: Sparkles },
  { tag: "cultural", Icon: Compass },
  { tag: "heritage", Icon: Compass },
];

function pickIcon(kind: Kind, tags: string[] | undefined) {
  if (kind === "food") return UtensilsCrossed;
  if (!tags) return ImageIcon;
  for (const { tag, Icon } of ICON_BY_TAG) {
    if (tags.includes(tag)) return Icon;
  }
  if (kind === "stay") return Compass;
  return ImageIcon;
}

export function ActivityImage({
  destinationId,
  seed,
  kind = "activity",
  tags,
  size = "sm",
}: {
  destinationId: string | null | undefined;
  seed: string;
  kind?: Kind;
  tags?: string[];
  size?: "sm" | "md" | "lg";
}) {
  const Icon = pickIcon(kind, tags);
  const dim =
    size === "sm" ? "h-12 w-12" : size === "md" ? "h-20 w-20" : "h-32 w-full";
  return (
    <span
      role="img"
      aria-hidden
      className={`relative grid ${dim} shrink-0 place-items-center overflow-hidden rounded-xl text-white/90`}
      style={gradientStyle({ destinationId, seed })}
    >
      <Icon className="h-1/2 w-1/2 opacity-90 drop-shadow" strokeWidth={1.5} />
    </span>
  );
}
