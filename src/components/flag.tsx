import { countryName } from "@/lib/countries";

// Circular country flag from flagcdn.com (external CDN; not emoji, which Windows
// renders as letter codes). object-cover crops the rectangular flag into a circle.
export function Flag({
  code,
  size = 32,
  className = "",
}: {
  code: string;
  size?: number;
  className?: string;
}) {
  if (!code) return null;
  const c = code.toLowerCase();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w80/${c}.png`}
      alt={countryName(c)}
      title={countryName(c)}
      loading="lazy"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`inline-block shrink-0 rounded-full border-2 border-inkline/25 object-cover ${className}`}
    />
  );
}
