// Fiesta decor — pure CSS/SVG, no raster assets. Recreates the poster aesthetic:
// banderitas bunting, string fairy lights, woven inabel stripe, tropical foliage,
// and the multicolor per-letter title. All are decorative (aria-hidden).

const FIESTA_HEX = [
  "#d23b2e", // red
  "#e2641f", // orange
  "#f3b73e", // yellow
  "#3a9d4b", // green
  "#138a8c", // teal
  "#2a6fb0", // blue
  "#7a4ea3", // purple
];

const FIESTA_TEXT = [
  "text-fiesta-red",
  "text-fiesta-orange",
  "text-fiesta-yellow",
  "text-fiesta-green",
  "text-fiesta-teal",
  "text-fiesta-blue",
  "text-fiesta-purple",
];

/** Multicolor per-letter title, fiesta-banner style. */
export function FiestaTitle({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  let colorIdx = 0;
  return (
    <span className={className}>
      {text.split("").map((ch, i) => {
        if (ch === " ") {
          return (
            <span key={i} aria-hidden>
              {" "}
            </span>
          );
        }
        const cls = FIESTA_TEXT[colorIdx % FIESTA_TEXT.length];
        colorIdx++;
        return (
          <span key={i} className={cls}>
            {ch}
          </span>
        );
      })}
    </span>
  );
}

/** Triangle bunting row. */
export function Banderitas({
  count = 28,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none flex w-full items-start justify-between ${className}`}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="h-4 w-4 shrink-0"
          style={{
            backgroundColor: FIESTA_HEX[i % FIESTA_HEX.length],
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
          }}
        />
      ))}
    </div>
  );
}

/** Hanging bulb garland. */
export function StringLights({
  count = 22,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none relative h-6 w-full ${className}`}
      aria-hidden
    >
      <div className="absolute left-0 right-0 top-1 h-3 rounded-b-[100%] border-t-2 border-ink/25" />
      <div className="flex justify-between px-3">
        {Array.from({ length: count }).map((_, i) => {
          const c = FIESTA_HEX[i % FIESTA_HEX.length];
          return (
            <span
              key={i}
              className="mt-2 h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: c, boxShadow: `0 0 7px ${c}` }}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Repeating woven inabel stripe band. */
export function WovenStripe({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-2.5 w-full ${className}`}
      aria-hidden
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg,#d23b2e 0 12px,#f3b73e 12px 24px,#3a9d4b 24px 36px,#2a6fb0 36px 48px,#e2641f 48px 60px,#7a4ea3 60px 72px)",
      }}
    />
  );
}

/** Tropical leaf corner accent. */
export function LeafCorner({
  className = "",
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={`pointer-events-none ${className}`}
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      aria-hidden
      fill="currentColor"
    >
      <path d="M8 112 C8 56 50 10 116 6 C112 70 70 112 12 116 Z" opacity="0.9" />
      <path
        d="M14 110 C40 80 78 44 110 14"
        stroke="#0f5f2a"
        strokeWidth="2.5"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M40 96 L58 78 M62 80 L78 60 M30 84 L46 70"
        stroke="#0f5f2a"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
}
