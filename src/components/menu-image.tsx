"use client";

import { useEffect, useState } from "react";

/**
 * Large menu photo that opens a full-size lightbox on click.
 * Closes on Escape, backdrop click, or the close button.
 */
export function MenuImage({
  src,
  alt,
  ringColor,
}: {
  src: string;
  alt: string;
  ringColor: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Enlarge photo of ${alt}`}
        className="group relative block w-full overflow-hidden rounded-2xl border-[3px] shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
        style={{ borderColor: ringColor }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-52 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-ink/70 px-3 py-1 text-xs font-bold text-cream opacity-0 transition-opacity group-hover:opacity-100">
          Click to enlarge
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 grid place-items-center bg-ink/85 p-4 backdrop-blur-sm"
        >
          <figure
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="max-h-[80vh] w-full rounded-2xl object-contain shadow-2xl"
            />
            <figcaption className="mt-3 text-center font-display text-2xl font-extrabold text-cream">
              {alt}
            </figcaption>
          </figure>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute right-5 top-5 rounded-full bg-cream/90 px-4 py-2 font-display font-extrabold text-ink shadow-lg hover:bg-cream"
          >
            ✕ Close
          </button>
        </div>
      )}
    </>
  );
}
