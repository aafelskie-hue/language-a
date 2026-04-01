'use client';

function HorizonMark() {
  return (
    <a
      href="https://beachheadsystems.ca"
      target="_blank"
      rel="noopener noreferrer"
      className="horizon-mark block"
      aria-label="Beachhead Systems"
    >
      <svg
        viewBox="0 0 56 56"
        width={44}
        height={44}
        xmlns="http://www.w3.org/2000/svg"
        className="block"
      >
        <rect
          className="horizon-bar horizon-bar-1"
          y={12}
          height={3}
          rx={1.5}
        />
        <rect
          className="horizon-bar horizon-bar-2"
          y={24}
          height={6}
          rx={2}
        />
        <rect
          className="horizon-bar horizon-bar-3"
          y={38}
          height={11}
          rx={3}
        />
      </svg>
    </a>
  );
}

export function Footer() {
  return (
    <footer
      className="mt-auto bg-navy-deep border-t border-white/[0.06]"
      role="contentinfo"
    >
      <div className="px-6 py-5 flex flex-col items-center gap-4 md:flex-row md:items-center">
        {/* Built by — order-2 on mobile, first on desktop */}
        <span className="order-2 md:order-none md:flex-1 font-mono text-[10px] uppercase text-silver tracking-[1.5px]">
          BUILT BY BEACHHEAD SYSTEMS
        </span>

        {/* Horizon Mark — order-1 on mobile (top), center on desktop */}
        <div className="order-1 md:order-none flex justify-center">
          <HorizonMark />
        </div>

        {/* Copyright — order-3 on mobile, right on desktop */}
        <span className="order-3 md:order-none md:flex-1 text-right font-mono text-[10px] text-silver tracking-[1.5px]">
          &copy; 2026 Beachhead Systems Inc.
        </span>
      </div>
    </footer>
  );
}
