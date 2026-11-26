import React from 'react';
import { PlayerColor, TokenStyleId } from '../types/game';

interface TokenGraphicProps {
  color: PlayerColor;
  styleId?: TokenStyleId;
  size?: number;
  highlight?: boolean;
}

const COLOR_PALETTE: Record<PlayerColor, { main: string; dark: string; light: string }> = {
  red: { main: '#ef4444', dark: '#991b1b', light: '#fecaca' },
  green: { main: '#22c55e', dark: '#166534', light: '#bbf7d0' },
  yellow: { main: '#eab308', dark: '#854d0e', light: '#fef08a' },
  blue: { main: '#3b82f6', dark: '#1e3a8a', light: '#bfdbfe' },
};

export const TokenGraphic: React.FC<TokenGraphicProps> = ({
  color,
  styleId = 'pin',
  size = 28,
  highlight = false,
}) => {
  const pal = COLOR_PALETTE[color];

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center select-none ${
        highlight ? 'animate-token-ready' : ''
      }`}
    >
      {highlight && (
        <span
          className="absolute inset-[-4px] rounded-full border-2 border-amber-300 pointer-events-none"
          aria-hidden="true"
        />
      )}
      <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-[0_3px_3px_rgba(0,0,0,0.45)]">
        {styleId === 'pin' && (
          <>
            <ellipse cx="32" cy="56" rx="16" ry="5" fill="rgba(0,0,0,0.3)" />
            <path
              d="M32 6 C19 6 11 15 11 26 C11 39 32 55 32 55 C32 55 53 39 53 26 C53 15 45 6 32 6 Z"
              fill={pal.main}
              stroke="#ffffff"
              strokeWidth="4"
            />
            <circle cx="32" cy="25" r="9.5" fill="#ffffff" />
            <circle cx="32" cy="25" r="5" fill={pal.dark} />
          </>
        )}

        {styleId === 'classic' && (
          <>
            <circle cx="32" cy="34" r="24" fill={pal.dark} stroke="#ffffff" strokeWidth="3.5" />
            <circle cx="32" cy="30" r="22" fill={pal.main} stroke="#ffffff" strokeWidth="3" />
            <circle cx="32" cy="30" r="13" fill="none" stroke={pal.light} strokeWidth="2.5" />
            <circle cx="32" cy="30" r="6" fill="#ffffff" />
          </>
        )}

        {styleId === 'star' && (
          <>
            <circle cx="32" cy="32" r="24" fill={pal.dark} stroke="#ffffff" strokeWidth="3.5" />
            <circle cx="32" cy="30" r="21" fill={pal.main} />
            <polygon
              points="32,14 36.8,24.2 48,25.6 39.8,33.4 41.9,44.5 32,39.1 22.1,44.5 24.2,33.4 16,25.6 27.2,24.2"
              fill="#fde047"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </>
        )}

        {styleId === 'hammer' && (
          <>
            <rect x="27" y="28" width="10" height="27" rx="4" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2.5" />
            <rect x="12" y="10" width="40" height="22" rx="6" fill={pal.main} stroke="#ffffff" strokeWidth="3.5" />
            <path d="M28 15 L35 15 L31 21 L37 21 L28 28 L30 22 L25 22 Z" fill="#fef08a" />
          </>
        )}

        {styleId === 'crown' && (
          <>
            <circle cx="32" cy="34" r="23" fill={pal.main} stroke="#ffffff" strokeWidth="3.5" />
            <path
              d="M16 40 L18 22 L26 30 L32 18 L38 30 L46 22 L48 40 Z"
              fill="#fde047"
              stroke="#78350f"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="32" cy="18" r="3" fill="#ffffff" />
          </>
        )}
      </svg>
    </div>
  );
};
