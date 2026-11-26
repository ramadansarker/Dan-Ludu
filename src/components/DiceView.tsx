import React from 'react';
import { DICE_STYLES } from '../data/catalog';
import { DiceStyleId } from '../types/game';

interface DiceViewProps {
  value: number | null;
  rolling?: boolean;
  styleId?: DiceStyleId;
  size?: number;
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
}

const PIP_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [28, 28],
    [72, 72],
  ],
  3: [
    [26, 26],
    [50, 50],
    [74, 74],
  ],
  4: [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72],
  ],
  5: [
    [26, 26],
    [74, 26],
    [50, 50],
    [26, 74],
    [74, 74],
  ],
  6: [
    [28, 24],
    [72, 24],
    [28, 50],
    [72, 50],
    [28, 76],
    [72, 76],
  ],
};

export const DiceView: React.FC<DiceViewProps> = ({
  value,
  rolling = false,
  styleId = 'default',
  size = 48,
  disabled = false,
  active = false,
  onClick,
}) => {
  const styleMeta = DICE_STYLES.find((d) => d.id === styleId) || DICE_STYLES[0];
  const displayVal = value && value >= 1 && value <= 6 ? value : 6;
  const pips = PIP_POSITIONS[displayVal];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Roll dice${value ? `, current value ${value}` : ''}`}
      style={{
        width: size,
        height: size,
        background: styleMeta.bgGradient,
        borderColor: active ? '#facc15' : styleMeta.borderColor,
      }}
      className={`relative rounded-xl border-2 shadow-lg flex items-center justify-center transition-transform select-none shrink-0 ${
        rolling ? 'animate-dice-tumble' : ''
      } ${active && !disabled ? 'cursor-pointer hover:scale-105 active:scale-95 ring-2 ring-amber-300/80' : 'cursor-default'} ${
        disabled && !active ? 'opacity-75' : ''
      }`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="4" y="4" width="92" height="92" rx="18" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="3" />
        {pips.map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={displayVal === 1 ? 13 : 9.2}
            fill={displayVal === 1 && styleId === 'default' ? '#dc2626' : styleMeta.pipColor}
          />
        ))}
      </svg>
    </button>
  );
};
