"use client";

/**
 * Renders a country flag image using flagcdn.com CDN.
 * Falls back to emoji flag if the image fails to load.
 */
export function CountryFlag({
  code,
  emoji,
  size = 20,
  className,
}: {
  /** ISO 3166-1 alpha-2 country code, e.g. "PE" */
  code: string;
  /** Emoji fallback, e.g. "🇵🇪" */
  emoji?: string;
  /** Width in px (height is auto, aspect ~3:2) */
  size?: number;
  className?: string;
}) {
  const src = `https://flagcdn.com/w${size <= 20 ? 40 : 80}/${code.toLowerCase()}.png`;

  return (
    <img
      src={src}
      alt={code}
      width={size}
      height={Math.round(size * 0.75)}
      loading="lazy"
      className={className}
      style={{ objectFit: "cover", borderRadius: 2 }}
      onError={(e) => {
        // Replace with emoji text on error
        const span = document.createElement("span");
        span.textContent = emoji ?? code;
        span.style.fontSize = `${size * 0.75}px`;
        span.style.lineHeight = "1";
        (e.target as HTMLElement).replaceWith(span);
      }}
    />
  );
}
