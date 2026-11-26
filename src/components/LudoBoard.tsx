import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Crown,
  HelpCircle,
  Menu,
  MessageSquare,
  Send,
  Smartphone,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  Music,
  X,
} from 'lucide-react';
import { AVATAR_LIST, BOARD_THEMES, TRANSLATIONS } from '../data/catalog';
import {
  getCurrentPlayerColor,
  getTokenBoardCoord,
  HOME_COLUMN_COORDS,
  STAR_TRACK_INDICES,
  START_TRACK_INDEX,
  TRACK_COORDS,
  YARD_TOKEN_COORDS,
} from '../game/ludoEngine';
import {
  AppSettings,
  BoardThemeId,
  ChatMessage,
  DiceStyleId,
  GameState,
  PlayerColor,
  TokenStyleId,
} from '../types/game';
import { DiceView } from './DiceView';
import { TokenGraphic } from './TokenGraphic';
import { soundEngine } from '../utils/sound';

interface LudoBoardProps {
  gameState: GameState;
  themeId: BoardThemeId;
  tokenStyleId: TokenStyleId;
  diceStyleId: DiceStyleId;
  settings: AppSettings;
  localClientId?: string | null; // set in online mode to restrict interaction to own color
  isRolling: boolean;
  chatMessages?: ChatMessage[];
  onRollDice: () => void;
  onSelectToken: (tokenId: number) => void;
  onSendChat?: (text: string) => void;
  onToggleSetting: (key: 'soundEnabled' | 'musicEnabled' | 'vibrationEnabled') => void;
  onQuitGame: () => void;
  onPlayAgain: () => void;
}

const COLOR_HEX: Record<PlayerColor, string> = {
  red: '#dc2626',
  green: '#16a34a',
  yellow: '#eab308',
  blue: '#2563eb',
};

const QUICK_CHATS = ['Good luck!', 'Nice move!', 'Hurry up!', 'Well played!', 'Oops!'];

export const LudoBoard: React.FC<LudoBoardProps> = ({
  gameState,
  themeId,
  tokenStyleId,
  diceStyleId,
  settings,
  localClientId,
  isRolling,
  chatMessages = [],
  onRollDice,
  onSelectToken,
  onSendChat,
  onToggleSetting,
  onQuitGame,
  onPlayAgain,
}) => {
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const theme = useMemo(
    () => BOARD_THEMES.find((t) => t.id === themeId) || BOARD_THEMES[0],
    [themeId]
  );
  const t = TRANSLATIONS[settings.language];
  const currentColor = getCurrentPlayerColor(gameState);
  const currentPlayer = gameState.players[currentColor];

  const isOnlineMatch =
    gameState.playMode === 'online' ||
    gameState.playMode === 'team_up' ||
    gameState.playMode === 'friends';

  const canLocalAct = useMemo(() => {
    if (!currentPlayer || currentPlayer.isAI) return false;
    if (isOnlineMatch) {
      return Boolean(localClientId && currentPlayer.clientId === localClientId);
    }
    return true;
  }, [currentPlayer, isOnlineMatch, localClientId]);

  // Precompute special track cell lookup by "r,c"
  const cellLookup = useMemo(() => {
    const map = new Map<
      string,
      {
        startColor?: PlayerColor;
        isStar?: boolean;
        homeColor?: PlayerColor;
        arrow?: PlayerColor;
      }
    >();

    (Object.keys(START_TRACK_INDEX) as PlayerColor[]).forEach((c) => {
      const [r, col] = TRACK_COORDS[START_TRACK_INDEX[c]];
      map.set(`${r},${col}`, { startColor: c });
    });

    STAR_TRACK_INDICES.forEach((idx) => {
      const [r, col] = TRACK_COORDS[idx];
      const prev = map.get(`${r},${col}`) || {};
      map.set(`${r},${col}`, { ...prev, isStar: true });
    });

    // Home turn-in arrow cells (step 50)
    const turnInArrows: Record<PlayerColor, [number, number]> = {
      red: [7, 0],
      green: [0, 7],
      yellow: [7, 14],
      blue: [14, 7],
    };
    (Object.keys(turnInArrows) as PlayerColor[]).forEach((c) => {
      const [r, col] = turnInArrows[c];
      const prev = map.get(`${r},${col}`) || {};
      map.set(`${r},${col}`, { ...prev, arrow: c });
    });

    (Object.keys(HOME_COLUMN_COORDS) as PlayerColor[]).forEach((c) => {
      HOME_COLUMN_COORDS[c].slice(0, 5).forEach(([r, col]) => {
        map.set(`${r},${col}`, { homeColor: c });
      });
    });

    return map;
  }, []);

  // Flatten all tokens and group by coordinate for collision-free stacking offsets
  const renderedTokens = useMemo(() => {
    interface FlatToken {
      color: PlayerColor;
      tokenId: number;
      step: number;
      row: number;
      col: number;
      coordKey: string;
      isMovable: boolean;
    }

    const list: FlatToken[] = [];
    for (const c of gameState.activeOrder) {
      const p = gameState.players[c];
      if (!p) continue;
      for (const tok of p.tokens) {
        const [row, col] = getTokenBoardCoord(c, tok.id, tok.step);
        const isMovable =
          gameState.phase === 'WAIT_MOVE' &&
          c === currentColor &&
          canLocalAct &&
          gameState.movableTokens.includes(tok.id);
        list.push({
          color: c,
          tokenId: tok.id,
          step: tok.step,
          row,
          col,
          coordKey: `${row.toFixed(1)},${col.toFixed(1)}`,
          isMovable,
        });
      }
    }

    const groups = new Map<string, FlatToken[]>();
    for (const item of list) {
      const arr = groups.get(item.coordKey) || [];
      arr.push(item);
      groups.set(item.coordKey, arr);
    }

    return list.map((item) => {
      const siblings = groups.get(item.coordKey) || [item];
      const count = siblings.length;
      const idx = siblings.findIndex(
        (s) => s.color === item.color && s.tokenId === item.tokenId
      );
      let offsetX = 0;
      let offsetY = 0;
      let scale = 1;
      if (count > 1 && item.step !== -1) {
        const angle = (idx / count) * Math.PI * 2;
        const radius = count === 2 ? 1.1 : 1.35;
        offsetX = Math.cos(angle) * radius;
        offsetY = Math.sin(angle) * radius;
        scale = count >= 3 ? 0.78 : 0.86;
      }
      return {
        ...item,
        leftPct: ((item.col + 0.5) / 15) * 100 + offsetX,
        topPct: ((item.row + 0.5) / 15) * 100 + offsetY,
        scale,
      };
    });
  }, [gameState, currentColor, canLocalAct]);

  const renderPlayerTray = (color: PlayerColor, align: 'left' | 'right') => {
    const player = gameState.players[color];
    if (!player) {
      return <div className="h-16" />;
    }
    const isTurn = currentColor === color && gameState.phase !== 'GAME_OVER';
    const avatarSrc =
      AVATAR_LIST.find((a) => a.id === player.avatarId)?.src || AVATAR_LIST[0].src;
    const canClickDice = isTurn && canLocalAct && gameState.phase === 'WAIT_ROLL' && !isRolling;

    return (
      <div
        className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 border-2 transition-all ${
          align === 'right' ? 'flex-row-reverse text-right' : 'flex-row text-left'
        } ${
          isTurn
            ? 'bg-[#0b3e9f] border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.4)]'
            : 'bg-[#042366]/85 border-blue-400/30 opacity-85'
        }`}
      >
        <div className="relative shrink-0">
          <img
            src={avatarSrc}
            alt={player.name}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-lg object-cover border-2"
            style={{ borderColor: COLOR_HEX[color] }}
          />
          {player.teamId && (
            <span className="absolute -bottom-1 -right-1 px-1 rounded bg-slate-900 text-[9px] font-bold text-amber-300 border border-amber-400/60">
              T{player.teamId}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-display font-bold text-white truncate max-w-[92px] sm:max-w-[120px]">
            {player.name}
          </p>
          <p className="text-[10px] font-semibold text-blue-200/90 flex items-center gap-1 justify-start">
            {align === 'right' && <span className="flex-1" />}
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: COLOR_HEX[color] }}
            />
            <span>
              {player.isAI ? 'CPU' : isTurn ? (gameState.phase === 'WAIT_MOVE' ? 'Move' : t.yourTurn) : 'Wait'}
            </span>
          </p>
        </div>

        <div className="relative flex items-center gap-1.5">
          {isTurn && canClickDice && (
            <span className="hidden sm:inline-block text-[10px] font-bold text-amber-300 animate-pulse">
              {t.rollDice}
            </span>
          )}
          <DiceView
            value={isTurn ? gameState.diceValue : null}
            rolling={isTurn && isRolling}
            styleId={diceStyleId}
            size={42}
            active={canClickDice}
            disabled={!canClickDice}
            onClick={() => {
              if (canClickDice) onRollDice();
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full ludo-bg-pattern flex flex-col items-center justify-between py-2 px-2 sm:px-4">
      {/* Top Arena Controls */}
      <div className="w-full max-w-[540px] flex items-center justify-between gap-2 mb-1.5">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setShowQuitModal(true);
          }}
          aria-label="Game menu"
          className="w-10 h-10 rounded-xl royal-btn flex items-center justify-center shrink-0"
        >
          <Menu className="w-5 h-5 text-amber-300" />
        </button>

        <div className="flex-1 min-w-0 text-center px-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-200 truncate max-w-full">
            <span className="font-display font-black tracking-wide text-amber-300">RAMADAN DEV</span>
            <span aria-hidden="true">·</span>
            <span className="uppercase">{gameState.gameType.replace('_', ' ')}</span>
          </div>
          <p className="text-[11px] text-blue-100 truncate">{gameState.lastEvent}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onSendChat && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setShowChat((v) => !v);
              }}
              aria-label="Text chat"
              className="w-10 h-10 rounded-xl royal-btn flex items-center justify-center relative"
            >
              <MessageSquare className="w-4 h-4 text-amber-300" />
              {chatMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-[9px] font-bold flex items-center justify-center">
                  {Math.min(9, chatMessages.length)}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setShowRulesModal(true);
            }}
            aria-label="Game rules"
            className="w-10 h-10 rounded-xl royal-btn flex items-center justify-center"
          >
            <HelpCircle className="w-4 h-4 text-amber-300" />
          </button>
        </div>
      </div>

      {/* Top Players Row (Red Left, Green Right) */}
      <div className="w-full max-w-[540px] grid grid-cols-2 gap-2 mb-2">
        {renderPlayerTray('red', 'left')}
        {renderPlayerTray('green', 'right')}
      </div>

      {/* 15x15 Interactive Ludo Board */}
      <div
        className="relative w-full max-w-[520px] aspect-square rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.65)] border-4"
        style={{
          backgroundColor: theme.boardBg,
          borderColor: theme.borderColor,
          backgroundImage: theme.patternOverlay,
        }}
      >
        {/* Grid Cells */}
        <div
          className="w-full h-full grid"
          style={{
            gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
            gridTemplateRows: 'repeat(15, minmax(0, 1fr))',
          }}
        >
          {Array.from({ length: 15 * 15 }).map((_, idx) => {
            const r = Math.floor(idx / 15);
            const c = idx % 15;

            // Skip cells covered by 6x6 yards and 3x3 center goal (rendered cleanly as overlays)
            const inRedYard = r < 6 && c < 6;
            const inGreenYard = r < 6 && c > 8;
            const inBlueYard = r > 8 && c < 6;
            const inYellowYard = r > 8 && c > 8;
            const inCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;

            if (inRedYard || inGreenYard || inBlueYard || inYellowYard || inCenter) {
              return <div key={idx} className="pointer-events-none" />;
            }

            const info = cellLookup.get(`${r},${c}`);
            let bg = (r + c) % 2 === 0 ? theme.trackBg : theme.trackAltBg;
            if (info?.startColor) {
              bg = theme.yardColors[info.startColor];
            } else if (info?.homeColor) {
              bg = theme.yardColors[info.homeColor];
            }

            return (
              <div
                key={idx}
                style={{
                  backgroundColor: bg,
                  borderColor:
                    theme.id === 'disco' || theme.id === 'battle'
                      ? 'rgba(255,255,255,0.16)'
                      : 'rgba(15,23,42,0.22)',
                }}
                className="border-[0.5px] flex items-center justify-center relative"
              >
                {info?.isStar && (
                  <Star
                    className="w-3/5 h-3/5"
                    style={{
                      color: theme.id === 'disco' || theme.id === 'battle' ? '#fde047' : '#64748b',
                    }}
                    strokeWidth={2}
                  />
                )}
                {info?.startColor && (
                  <Star className="w-3/5 h-3/5 text-white/90" fill="rgba(255,255,255,0.25)" />
                )}
                {info?.arrow === 'red' && (
                  <ArrowRight className="w-3/5 h-3/5" style={{ color: theme.yardColors.red }} />
                )}
                {info?.arrow === 'green' && (
                  <ArrowDown className="w-3/5 h-3/5" style={{ color: theme.yardColors.green }} />
                )}
                {info?.arrow === 'yellow' && (
                  <ArrowLeft className="w-3/5 h-3/5" style={{ color: theme.yardColors.yellow }} />
                )}
                {info?.arrow === 'blue' && (
                  <ArrowUp className="w-3/5 h-3/5" style={{ color: theme.yardColors.blue }} />
                )}
              </div>
            );
          })}
        </div>

        {/* 4 Colored Corner Yards (6x6 each = 40% x 40%) */}
        {(
          [
            { color: 'red' as PlayerColor, pos: 'top-0 left-0' },
            { color: 'green' as PlayerColor, pos: 'top-0 right-0' },
            { color: 'blue' as PlayerColor, pos: 'bottom-0 left-0' },
            { color: 'yellow' as PlayerColor, pos: 'bottom-0 right-0' },
          ] as const
        ).map(({ color, pos }) => {
          const isCurrent = currentColor === color && gameState.phase !== 'GAME_OVER';
          return (
            <div
              key={color}
              style={{
                width: '40%',
                height: '40%',
                backgroundColor: theme.yardColors[color],
                borderColor: theme.borderColor,
              }}
              className={`absolute ${pos} border p-[6.5%] flex items-center justify-center transition-shadow ${
                isCurrent ? 'ring-4 ring-inset ring-amber-300/90' : ''
              }`}
            >
              <div
                className="w-full h-full rounded-xl bg-white/95 shadow-inner grid grid-cols-2 grid-rows-2 place-items-center p-2 sm:p-3 border border-slate-900/15"
              >
                {[0, 1, 2, 3].map((slotIdx) => (
                  <div
                    key={slotIdx}
                    style={{ backgroundColor: theme.yardColors[color] }}
                    className="w-[62%] h-[62%] rounded-full opacity-90 shadow-inner border-2 border-black/15"
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Center 3x3 Home Goal Triangles */}
        <div
          className="absolute top-[40%] left-[40%] w-[20%] h-[20%] border border-slate-900/40"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full block">
            {/* Top Green */}
            <polygon points="0,0 100,0 50,50" fill={theme.yardColors.green} stroke="#0f172a" strokeWidth="1.5" />
            {/* Right Yellow */}
            <polygon points="100,0 100,100 50,50" fill={theme.yardColors.yellow} stroke="#0f172a" strokeWidth="1.5" />
            {/* Bottom Blue */}
            <polygon points="0,100 100,100 50,50" fill={theme.yardColors.blue} stroke="#0f172a" strokeWidth="1.5" />
            {/* Left Red */}
            <polygon points="0,0 0,100 50,50" fill={theme.yardColors.red} stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="16" fill="#0f172a" stroke="#f5b700" strokeWidth="2.5" />
          </svg>
          <Crown className="w-4 h-4 text-amber-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Dynamic Token Layer */}
        <div className="absolute inset-0 pointer-events-none">
          {renderedTokens.map((tok) => {
            const yardFallback = YARD_TOKEN_COORDS[tok.color][tok.tokenId];
            void yardFallback;
            return (
              <button
                key={`${tok.color}-${tok.tokenId}`}
                type="button"
                disabled={!tok.isMovable}
                onClick={() => {
                  if (tok.isMovable) {
                    onSelectToken(tok.tokenId);
                  }
                }}
                aria-label={`${tok.color} token ${tok.tokenId + 1}`}
                style={{
                  left: `${tok.leftPct}%`,
                  top: `${tok.topPct}%`,
                  transform: `translate(-50%, -50%) scale(${tok.scale})`,
                  zIndex: tok.isMovable ? 40 : tok.step >= 0 ? 20 : 15,
                }}
                className={`absolute w-[7.2%] h-[7.2%] min-w-[26px] min-h-[26px] flex items-center justify-center transition-all duration-200 ease-out ${
                  tok.isMovable ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
                }`}
              >
                <TokenGraphic
                  color={tok.color}
                  styleId={tokenStyleId}
                  size={28}
                  highlight={tok.isMovable}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Players Row (Blue Left, Yellow Right) */}
      <div className="w-full max-w-[540px] grid grid-cols-2 gap-2 mt-2">
        {renderPlayerTray('blue', 'left')}
        {renderPlayerTray('yellow', 'right')}
      </div>

      {/* Quick Text Chat Drawer (Online / Friends only, NO voice/mic) */}
      {showChat && onSendChat && (
        <div className="fixed bottom-4 right-4 z-40 w-80 max-w-[92vw] rounded-2xl bg-[#052468] gold-frame p-3 shadow-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-sm text-amber-300">Match Chat</span>
            <button
              type="button"
              onClick={() => setShowChat(false)}
              className="p-1 text-blue-200 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="h-32 overflow-y-auto space-y-1.5 bg-[#02143d] rounded-xl p-2">
            {chatMessages.length === 0 ? (
              <p className="text-xs text-blue-300/60 text-center py-8">No messages yet.</p>
            ) : (
              chatMessages.map((m) => (
                <div key={m.id} className="text-xs leading-snug">
                  <span className="font-bold text-amber-300">{m.sender}: </span>
                  <span className="text-white">{m.text}</span>
                </div>
              ))
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {QUICK_CHATS.map((qc) => (
              <button
                key={qc}
                type="button"
                onClick={() => onSendChat(qc)}
                className="px-2 py-1 rounded-lg bg-[#0c3f9e] hover:bg-[#1452c4] text-[11px] font-semibold text-white"
              >
                {qc}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!chatInput.trim()) return;
              onSendChat(chatInput);
              setChatInput('');
            }}
            className="flex gap-1.5"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type message..."
              className="flex-1 min-w-0 rounded-lg bg-[#02143d] border border-blue-400/40 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
            />
            <button type="submit" className="gold-btn px-3 rounded-lg flex items-center justify-center">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Quit Game Modal (matching Screenshot 2) */}
      {showQuitModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#0a44aa] to-[#041e58] gold-frame p-6 text-center space-y-6 shadow-2xl">
            <h2 className="font-display font-black text-2xl text-amber-300 tracking-wide">
              {t.quitGame}
            </h2>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onQuitGame();
                }}
                className="royal-btn px-6 py-2.5 rounded-full font-display font-bold text-base"
              >
                {t.yes}
              </button>

              <button
                type="button"
                onClick={() => onToggleSetting('soundEnabled')}
                aria-label="Toggle sound"
                className={`w-11 h-11 rounded-full gold-frame flex items-center justify-center ${
                  settings.soundEnabled ? 'bg-[#0b47b3] text-amber-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={() => onToggleSetting('vibrationEnabled')}
                aria-label="Toggle vibration"
                className={`w-11 h-11 rounded-full gold-frame flex items-center justify-center ${
                  settings.vibrationEnabled ? 'bg-[#0b47b3] text-amber-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Smartphone className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => onToggleSetting('musicEnabled')}
                aria-label="Toggle music"
                className={`w-11 h-11 rounded-full gold-frame flex items-center justify-center ${
                  settings.musicEnabled ? 'bg-[#0b47b3] text-amber-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Music className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setShowQuitModal(false);
                }}
                className="royal-btn px-6 py-2.5 rounded-full font-display font-bold text-base"
              >
                {t.no}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#052770] gold-frame p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-xl text-amber-300">RAMADAN DEV Ludo Rules</h3>
              <button onClick={() => setShowRulesModal(false)} className="p-1 text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ul className="text-xs sm:text-sm text-blue-100 space-y-2 list-disc pl-5">
              <li>Roll a <strong>6</strong> to move a token out of your yard onto your colored start square.</li>
              <li>Rolling a <strong>6</strong>, capturing an opponent, or reaching the center Home grants a bonus roll.</li>
              <li>Rolling three consecutive <strong>6s</strong> forfeits your turn.</li>
              <li>Colored start squares and <strong>Star</strong> squares are Safe Zones — no captures can happen there.</li>
              <li><strong>Classic Team Up</strong>: Opposite corners partner up (Blue & Green vs Red & Yellow).</li>
              <li><strong>Quick Mode</strong>: Each player starts with 1 token on the board; bring 2 tokens home to win!</li>
            </ul>
            <button
              type="button"
              onClick={() => setShowRulesModal(false)}
              className="w-full gold-btn py-2.5 rounded-xl font-display font-bold text-sm"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Game Over / Victory Overlay */}
      {gameState.phase === 'GAME_OVER' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-gradient-to-b from-[#0b47b3] to-[#041d54] gold-frame p-6 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-400/20 border-2 border-amber-300 flex items-center justify-center">
              <Trophy className="w-9 h-9 text-amber-300" />
            </div>
            <div>
              <h2 className="font-display font-black text-3xl text-amber-300">MATCH COMPLETE</h2>
              <p className="text-base font-bold text-white mt-1">{gameState.lastEvent}</p>
            </div>

            <div className="space-y-2 text-left">
              {gameState.rankings.map((c, idx) => {
                const p = gameState.players[c];
                if (!p) return null;
                return (
                  <div
                    key={c}
                    className="flex items-center justify-between rounded-xl bg-[#03194a] border border-blue-400/30 px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono-num font-bold text-amber-300 w-6">#{idx + 1}</span>
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLOR_HEX[c] }}
                      />
                      <span className="font-display font-bold text-sm text-white">{p.name}</span>
                    </div>
                    <span className="text-xs font-mono-num font-bold text-emerald-300">
                      {idx === 0 ? '+500 Coins' : '+100 Coins'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onQuitGame();
                }}
                className="royal-btn py-3 rounded-xl font-display font-bold text-sm"
              >
                Main Menu
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onPlayAgain();
                }}
                className="gold-btn py-3 rounded-xl font-display font-bold text-sm"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
