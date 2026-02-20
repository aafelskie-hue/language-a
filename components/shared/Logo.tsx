'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark' | 'copper';
  showWordmark?: boolean;
}

export function Logo({ size = 'md', variant = 'light', showWordmark = true }: LogoProps) {
  const sizes = {
    sm: { icon: 20, stroke: 4, text: 'text-base' },
    md: { icon: 24, stroke: 3.5, text: 'text-lg' },
    lg: { icon: 32, stroke: 3.5, text: 'text-xl' },
  };

  const colors = {
    light: { stroke: '#D4956A', text: 'text-white' },
    dark: { stroke: '#B5734A', text: 'text-charcoal' },
    copper: { stroke: '#FFFFFF', text: 'text-white' },
  };

  const s = sizes[size];
  const c = colors[variant];

  return (
    <div className="flex items-center gap-3">
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 52 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M26 6L6 46"
          stroke={c.stroke}
          strokeWidth={s.stroke}
          strokeLinecap="round"
        />
        <path
          d="M26 6L46 46"
          stroke={c.stroke}
          strokeWidth={s.stroke}
          strokeLinecap="round"
        />
        <path
          d="M14 30H38"
          stroke={c.stroke}
          strokeWidth={s.stroke}
          strokeLinecap="round"
        />
      </svg>
      {showWordmark && (
        <span className={`font-sans font-bold ${s.text} ${c.text} tracking-tight`}>
          Language A
        </span>
      )}
    </div>
  );
}