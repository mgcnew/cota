import { cn } from "@/lib/utils";

interface BrandLogoProps {
  /** Controla a altura do logo, ex: "h-8". A largura é automática. */
  className?: string;
  /** Renderiza apenas o glifo (sem o wordmark), útil em espaços estreitos. */
  iconOnly?: boolean;
}

/**
 * Logo do CotaPro desenhado em SVG inline.
 * Nítido em qualquer escala, adapta-se ao tema (o "pro" segue o tom de zinc)
 * e não depende de um asset com espaço em branco embutido.
 */
export function BrandLogo({ className, iconOnly = false }: BrandLogoProps) {
  const glyph = (
    <>
      <defs>
        <linearGradient id="cotapro-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>

      {/* Glifo (clipboard arredondado) */}
      <rect x="4" y="6" width="44" height="44" rx="12" fill="url(#cotapro-grad)" />

      {/* Checklist */}
      <g fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 19 l2.3 2.4 l4.4 -5" />
        <path d="M11 28 l2.3 2.4 l4.4 -5" />
        <path d="M11 37 l2.3 2.4 l4.4 -5" />
      </g>
      <g fill="#ffffff" opacity="0.92">
        <rect x="22" y="17.5" width="16" height="3" rx="1.5" />
        <rect x="22" y="26.5" width="16" height="3" rx="1.5" />
        <rect x="22" y="35.5" width="11" height="3" rx="1.5" />
      </g>
    </>
  );

  if (iconOnly) {
    return (
      <svg
        viewBox="0 0 52 56"
        className={cn("h-8 w-auto", className)}
        role="img"
        aria-label="CotaPro"
      >
        {glyph}
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 190 56"
      className={cn("h-8 w-auto", className)}
      role="img"
      aria-label="CotaPro"
    >
      {glyph}

      {/* Wordmark */}
      <text
        x="60"
        y="38"
        className="font-sans"
        fontWeight="800"
        fontSize="30"
        letterSpacing="-1.2"
      >
        <tspan fill="#3B82F6">cota</tspan>
        <tspan className="fill-zinc-400 dark:fill-zinc-500">pro</tspan>
      </text>
    </svg>
  );
}
