import Link from "next/link";
import type { ReactNode } from "react";

/** Rounded category badge ("pill"), teal or orange per the posters. */
export function Pill({
  children,
  tone = "teal",
  className = "",
}: {
  children: ReactNode;
  tone?: "teal" | "orange";
  className?: string;
}) {
  const bg = tone === "teal" ? "bg-brand" : "bg-accent";
  return (
    <span
      className={`inline-block rounded-full ${bg} px-5 py-1.5 font-display text-sm font-extrabold uppercase tracking-wide text-cream shadow-md ${className}`}
    >
      {children}
    </span>
  );
}

/** Primary / secondary call-to-action button (renders as a link). */
export function CTAButton({
  href,
  children,
  tone = "accent",
  className = "",
}: {
  href: string;
  children: ReactNode;
  tone?: "accent" | "brand" | "outline";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-7 py-3.5 font-display text-lg font-extrabold shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0";
  const tones = {
    accent: "bg-accent text-cream hover:bg-accent-dark",
    brand: "bg-brand text-cream hover:bg-brand-dark",
    outline: "border-[3px] border-brand bg-cream text-brand hover:bg-brand hover:text-cream",
  } as const;
  return (
    <Link href={href} className={`${base} ${tones[tone]} ${className}`}>
      {children}
    </Link>
  );
}

/** A course card: pill badge + circular decorative frame + name + description. */
export function CourseCard({
  badge,
  badgeTone,
  title,
  description,
  ringColor,
}: {
  badge: string;
  badgeTone: "teal" | "orange";
  title: string;
  description: string;
  ringColor: string;
}) {
  // Decorative circular placeholder (no real food photos were provided — honest).
  const initials = title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <article className="relative flex flex-col rounded-3xl border-[3px] border-ink/15 bg-cream-deep/70 p-6 shadow-[0_6px_0_rgba(58,44,32,0.12)]">
      <div className="-mt-10 mb-2 self-start">
        <Pill tone={badgeTone}>{badge}</Pill>
      </div>
      <div className="flex items-start gap-4">
        <div
          className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-[5px] bg-cream font-display text-2xl font-extrabold text-ink/70"
          style={{ borderColor: ringColor }}
          aria-hidden
        >
          {initials}
        </div>
        <div>
          <h3 className="font-display text-2xl font-extrabold leading-tight text-maroon">
            {title}
          </h3>
        </div>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/80">{description}</p>
    </article>
  );
}
