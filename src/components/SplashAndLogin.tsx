import React, { useEffect, useState } from 'react';
import { CloudUpload, Smartphone, ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';
import { HERO_EMBLEM_SRC } from '../data/catalog';
import { soundEngine } from '../utils/sound';

interface SplashScreenProps {
  onComplete: () => void;
}

const BRAND_TILES = [
  { char: 'R', bg: '#ef4444' },
  { char: 'A', bg: '#84cc16' },
  { char: 'M', bg: '#d946ef' },
  { char: 'A', bg: '#eab308' },
  { char: 'D', bg: '#38bdf8' },
  { char: 'A', bg: '#f97316' },
  { char: 'N', bg: '#22c55e' },
  { char: ' ', bg: 'transparent' },
  { char: 'D', bg: '#facc15' },
  { char: 'E', bg: '#ef4444' },
  { char: 'V', bg: '#3b82f6' },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'studio' | 'loading'>('studio');
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const t1 = window.setTimeout(() => setStage('loading'), 1050);
    return () => window.clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (stage !== 'loading') return;
    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(interval);
          window.setTimeout(onComplete, 220);
          return 100;
        }
        return Math.min(100, prev + 14);
      });
    }, 150);
    return () => window.clearInterval(interval);
  }, [stage, onComplete]);

  if (stage === 'studio') {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,#0b5ed7_0%,#032263_58%,#010f33_100%)] p-6">
        <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-md">
          {BRAND_TILES.map((tile, idx) =>
            tile.char === ' ' ? (
              <span key={idx} className="w-3" />
            ) : (
              <span
                key={idx}
                style={{
                  backgroundColor: tile.bg,
                  transform: `rotate(${idx % 2 === 0 ? -3 : 3}deg)`,
                }}
                className="w-9 h-11 sm:w-11 sm:h-13 rounded-sm flex items-center justify-center font-display font-black text-2xl sm:text-3xl text-slate-950 shadow-lg"
              >
                {tile.char}
              </span>
            )
          )}
        </div>
        <p className="mt-5 text-xs tracking-[0.28em] text-blue-200/80 uppercase font-semibold">
          Original Classic Board Studio
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full ludo-bg-pattern flex flex-col items-center justify-between py-12 px-6">
      <div />
      <div className="flex flex-col items-center text-center max-w-sm w-full">
        <div className="relative w-64 h-48 sm:w-72 sm:h-54 rounded-2xl overflow-hidden gold-frame bg-[#04236a] shadow-2xl mb-5">
          <img
            src={HERO_EMBLEM_SRC}
            alt="RAMADAN DEV Classic Ludo board and tokens"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 drop-shadow-[0_3px_0_rgba(120,53,15,0.9)]">
          RAMADAN DEV
        </h1>
        <p className="text-sm font-semibold text-blue-200 mt-1 tracking-wide">
          Classic Ludo Edition
        </p>
      </div>

      <div className="w-full max-w-xs space-y-2.5">
        <div className="h-4 w-full rounded-full bg-[#021238] border-2 border-amber-400/80 p-0.5 overflow-hidden shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs font-semibold text-blue-200">
          <span>Loading Board & Assets...</span>
          <span className="font-mono-num text-amber-300">{progress}%</span>
        </div>
      </div>
    </div>
  );
};

interface LoginScreenProps {
  onGuestLogin: () => void;
  onGoogleLogin: () => Promise<void>;
  onOpenTransfer: (code: string) => Promise<void>;
  onOpenPrivacy: () => void;
  authBusy: boolean;
  authError: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onGuestLogin,
  onGoogleLogin,
  onOpenTransfer,
  onOpenPrivacy,
  authBusy,
  authError,
}) => {
  const [showTransferInput, setShowTransferInput] = useState(false);
  const [transferCode, setTransferCode] = useState('');

  return (
    <div className="min-h-screen w-full ludo-bg-pattern flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Top Emblem */}
        <div className="relative w-52 h-38 rounded-2xl overflow-hidden gold-frame shadow-2xl mb-3">
          <img
            src={HERO_EMBLEM_SRC}
            alt="RAMADAN DEV Classic Ludo"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <h1 className="font-display font-black text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 drop-shadow-[0_2px_0_rgba(120,53,15,0.85)]">
          RAMADAN DEV
        </h1>
        <p className="font-display font-bold text-lg text-white tracking-wider mt-1 mb-4">
          LOGIN TO CONTINUE
        </p>

        {/* Main Blue & Gold Login Card */}
        <div className="w-full rounded-2xl bg-[#042b7a]/95 gold-frame p-4 sm:p-5 space-y-4">
          {/* Benefit Row matching screenshot */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-[#0b3e9f] border border-blue-400/35 px-2 py-2.5 flex items-center gap-1.5">
              <CloudUpload className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-[11px] leading-tight font-bold text-white">Save Data</span>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setShowTransferInput((v) => !v);
              }}
              className="rounded-xl bg-[#0b3e9f] hover:bg-[#104ab8] border border-blue-400/35 px-2 py-2.5 flex items-center gap-1.5 text-left transition-colors"
            >
              <Smartphone className="w-5 h-5 text-cyan-300 shrink-0" />
              <span className="text-[11px] leading-tight font-bold text-white">Change Device</span>
            </button>
            <div className="rounded-xl bg-[#0b3e9f] border border-blue-400/35 px-2 py-2.5 flex items-center justify-center gap-1">
              <span className="text-sm" aria-hidden="true">💎</span>
              <span className="text-xs font-mono-num font-bold text-cyan-200">+100</span>
            </div>
          </div>

          {showTransferInput && (
            <div className="rounded-xl bg-[#031d56] border border-amber-400/50 p-3 space-y-2">
              <p className="text-xs text-blue-100 font-medium flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                Sign in with Google first, then enter a Change Device transfer code:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={transferCode}
                  onChange={(e) => setTransferCode(e.target.value.toUpperCase())}
                  placeholder="e.g. RD8K2P9Q"
                  className="flex-1 min-w-0 rounded-lg bg-[#011238] border border-blue-400/40 px-3 py-2 text-sm font-mono-num text-white placeholder:text-blue-300/50 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  disabled={authBusy || !transferCode.trim()}
                  onClick={() => onOpenTransfer(transferCode)}
                  className="gold-btn px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap disabled:opacity-50"
                >
                  Restore
                </button>
              </div>
            </div>
          )}

          {/* Google Sign-In */}
          <button
            type="button"
            disabled={authBusy}
            onClick={() => {
              soundEngine.playClick();
              onGoogleLogin();
            }}
            className="w-full h-12 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-display font-bold text-base flex items-center justify-center gap-3 shadow-md active:scale-[0.99] transition-transform disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            <span>{authBusy ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>

          <p className="text-[11px] text-center text-blue-200/90">
            Syncs coins, diamonds, themes, and stats across devices
          </p>

          {authError && (
            <div className="rounded-lg bg-red-950/70 border border-red-400/50 px-3 py-2 text-xs text-red-100 text-center">
              {authError}
            </div>
          )}
        </div>

        <div className="my-3 font-display font-black text-xl text-amber-400">OR</div>

        {/* Play as Guest */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onGuestLogin();
          }}
          className="w-full max-w-xs h-12 rounded-xl royal-btn font-display font-bold text-lg flex items-center justify-center gap-2"
        >
          <span>Play as Guest</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="mt-5 text-center space-y-1.5">
          <p className="text-[11px] text-blue-200/80 leading-relaxed">
            By continuing you agree that RAMADAN DEV may store and process your game data in accordance with our
          </p>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onOpenPrivacy();
            }}
            className="text-xs font-semibold text-amber-300 underline underline-offset-4 hover:text-amber-200 inline-flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
};
