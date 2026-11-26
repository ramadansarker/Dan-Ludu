import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, HelpCircle, Palette, Users, Swords, Zap, Check } from 'lucide-react';
import { TOKEN_STYLES, TRANSLATIONS } from '../data/catalog';
import {
  GameType,
  LanguageCode,
  OnlineRoomSummary,
  PlayerColor,
  PlayMode,
  TokenStyleId,
} from '../types/game';
import { TokenGraphic } from './TokenGraphic';
import { soundEngine } from '../utils/sound';

export interface StartGameConfig {
  playMode: PlayMode;
  gameType: GameType;
  playerCount: 2 | 3 | 4;
  humanColor: PlayerColor;
  playerNames: Record<PlayerColor, string>;
  stakeCoins: number;
  friendAction?: 'create' | 'join';
  joinCode?: string;
}

interface GameModeModalProps {
  initialMode: PlayMode;
  selectedToken: TokenStyleId;
  unlockedTokens: TokenStyleId[];
  playerName: string;
  language: LanguageCode;
  publicRooms: OnlineRoomSummary[];
  onSelectToken: (tokenId: TokenStyleId) => void;
  onOpenThemes: () => void;
  onBack: () => void;
  onStart: (config: StartGameConfig) => void;
  onJoinRoomDirect: (roomId: string) => void;
}

export const GameModeModal: React.FC<GameModeModalProps> = ({
  initialMode,
  selectedToken,
  unlockedTokens,
  playerName,
  language,
  publicRooms,
  onSelectToken,
  onOpenThemes,
  onBack,
  onStart,
  onJoinRoomDirect,
}) => {
  const t = TRANSLATIONS[language];
  const [gameType, setGameType] = useState<GameType>(
    initialMode === 'team_up' ? 'team_up' : 'classic'
  );
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(
    initialMode === 'team_up' ? 4 : initialMode === 'computer' ? 4 : 2
  );
  const [humanColor, setHumanColor] = useState<PlayerColor>('blue');
  const [stakeCoins, setStakeCoins] = useState<number>(initialMode === 'online' || initialMode === 'team_up' ? 500 : 0);
  const [friendAction, setFriendAction] = useState<'create' | 'join'>('create');
  const [joinCode, setJoinCode] = useState('');
  const [showRulesHelp, setShowRulesHelp] = useState(false);

  const [names, setNames] = useState<Record<PlayerColor, string>>({
    blue: playerName || 'Player 1',
    red: initialMode === 'pass_n_play' ? 'Player 2' : 'Orion Bot',
    green: initialMode === 'pass_n_play' ? 'Player 3' : 'Atlas Bot',
    yellow: initialMode === 'pass_n_play' ? 'Player 4' : 'Nova Bot',
  });

  const [tokenScrollIdx, setTokenScrollIdx] = useState(0);

  const effectivePlayerCount = gameType === 'team_up' ? 4 : playerCount;

  const handleNext = () => {
    soundEngine.playClick();
    onStart({
      playMode: initialMode,
      gameType,
      playerCount: effectivePlayerCount,
      humanColor,
      playerNames: names,
      stakeCoins,
      friendAction,
      joinCode: joinCode.trim().toUpperCase(),
    });
  };

  return (
    <div className="fixed inset-0 z-40 ludo-bg-pattern/95 bg-[#021646]/95 backdrop-blur-md flex flex-col items-center justify-between p-4 overflow-y-auto">
      <div className="w-full max-w-md space-y-4 my-auto">
        {/* Shortcut Banner: Select Theme */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onOpenThemes();
            }}
            className="royal-btn px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-display font-bold"
          >
            <Palette className="w-4 h-4 text-amber-300" />
            <span>SELECT THEME</span>
          </button>
        </div>

        {/* Select Token Strip (matching Screenshot 4) */}
        <div className="rounded-2xl bg-[#052978]/95 gold-frame p-4 space-y-3">
          <h2 className="text-center font-display font-black text-lg text-amber-300 tracking-wide">
            {t.selectToken}
          </h2>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setTokenScrollIdx((i) => Math.max(0, i - 1))}
              aria-label="Previous tokens"
              className="p-2 text-amber-300 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center gap-3 flex-1">
              {TOKEN_STYLES.slice(tokenScrollIdx, tokenScrollIdx + 4).map((tok) => {
                const unlocked = unlockedTokens.includes(tok.id);
                const active = selectedToken === tok.id;
                return (
                  <button
                    key={tok.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      if (unlocked) onSelectToken(tok.id);
                    }}
                    className={`relative w-14 h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all ${
                      active
                        ? 'bg-[#1253c7] border-amber-300 scale-105'
                        : unlocked
                        ? 'bg-[#083490] border-blue-400/40 hover:border-amber-300/60'
                        : 'bg-[#031b52] border-slate-600/50 opacity-60'
                    }`}
                  >
                    <TokenGraphic color="blue" styleId={tok.id} size={32} />
                    {active && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                    {!unlocked && (
                      <span className="absolute bottom-0.5 text-[9px] font-bold text-amber-200">
                        Locked
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setTokenScrollIdx((i) => Math.min(Math.max(0, TOKEN_STYLES.length - 4), i + 1))}
              aria-label="Next tokens"
              className="p-2 text-amber-300 hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Select Game Section (matching Screenshot 4) */}
        <div className="rounded-2xl bg-[#052978]/95 gold-frame p-4 space-y-3.5 relative">
          <div className="flex items-center justify-between">
            <span className="w-7" />
            <h2 className="font-display font-black text-lg text-amber-300 tracking-wide">
              {t.selectGame}
            </h2>
            <button
              type="button"
              onClick={() => setShowRulesHelp((v) => !v)}
              aria-label="Game type rules"
              className="w-7 h-7 rounded-full border border-amber-400 text-amber-300 flex items-center justify-center"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          {showRulesHelp && (
            <div className="rounded-xl bg-[#021644] border border-amber-400/40 p-3 text-xs text-blue-100 space-y-1">
              <p><strong>Classic:</strong> Move all 4 tokens home to win.</p>
              <p><strong>Classic Team Up:</strong> 2v2 partners (opposite corners). Both partners finish to win!</p>
              <p><strong>Quick:</strong> Start with 1 token out; bring 2 tokens home first to win!</p>
            </div>
          )}

          <div className="space-y-2.5">
            {/* Classic */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setGameType('classic');
              }}
              className={`w-full flex items-center gap-3 rounded-xl p-2 border-2 transition-all ${
                gameType === 'classic'
                  ? 'bg-[#0e4bc0] border-amber-300 shadow-lg'
                  : 'bg-[#07328c] border-blue-400/30 hover:border-amber-300/50'
              }`}
            >
              <div className="w-11 h-11 rounded-lg bg-[#042366] border border-amber-400/70 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 flex items-center justify-between pr-2">
                <span className="font-display font-bold text-base text-white">{t.classic}</span>
                <span
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    gameType === 'classic' ? 'bg-amber-400 border-amber-200 text-slate-950' : 'border-amber-400/60'
                  }`}
                >
                  {gameType === 'classic' && <Check className="w-4 h-4 stroke-[3]" />}
                </span>
              </div>
            </button>

            {/* Classic Team Up */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setGameType('team_up');
                setPlayerCount(4);
              }}
              className={`w-full flex items-center gap-3 rounded-xl p-2 border-2 transition-all ${
                gameType === 'team_up'
                  ? 'bg-[#0e4bc0] border-amber-300 shadow-lg'
                  : 'bg-[#07328c] border-blue-400/30 hover:border-amber-300/50'
              }`}
            >
              <div className="w-11 h-11 rounded-lg bg-[#042366] border border-amber-400/70 flex items-center justify-center shrink-0">
                <Swords className="w-6 h-6 text-amber-300" />
              </div>
              <div className="flex-1 flex items-center justify-between pr-2">
                <span className="font-display font-bold text-base text-white">{t.classicTeamUp}</span>
                <span
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    gameType === 'team_up' ? 'bg-amber-400 border-amber-200 text-slate-950' : 'border-amber-400/60'
                  }`}
                >
                  {gameType === 'team_up' && <Check className="w-4 h-4 stroke-[3]" />}
                </span>
              </div>
            </button>

            {/* Quick */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setGameType('quick');
              }}
              className={`w-full flex items-center gap-3 rounded-xl p-2 border-2 transition-all ${
                gameType === 'quick'
                  ? 'bg-[#16a34a] border-amber-300 shadow-lg'
                  : 'bg-[#0c6838] border-emerald-400/40 hover:border-amber-300/60'
              }`}
            >
              <div className="w-11 h-11 rounded-lg bg-[#053b20] border border-amber-400/70 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-amber-300" />
              </div>
              <div className="flex-1 flex items-center justify-between pr-2">
                <span className="font-display font-black text-base text-white tracking-wide">
                  {t.quick}
                </span>
                <span
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    gameType === 'quick' ? 'bg-amber-400 border-amber-200 text-slate-950' : 'border-amber-400/60'
                  }`}
                >
                  {gameType === 'quick' && <Check className="w-4 h-4 stroke-[3]" />}
                </span>
              </div>
            </button>
          </div>

          {/* Player Count / Color / Friends Room Controls */}
          {gameType !== 'team_up' && (
            <div className="pt-2 border-t border-blue-400/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-100">Players</span>
                <div className="flex gap-1.5">
                  {([2, 3, 4] as const).map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setPlayerCount(cnt);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                        playerCount === cnt
                          ? 'bg-amber-400 text-slate-950 border-amber-200'
                          : 'bg-[#031e59] text-blue-100 border-blue-400/30'
                      }`}
                    >
                      {cnt}P
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(initialMode === 'computer' || initialMode === 'pass_n_play') && (
            <div className="space-y-2 pt-1">
              {initialMode === 'computer' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-100">Your Color</span>
                  <div className="flex gap-2">
                    {(['blue', 'red', 'green', 'yellow'] as PlayerColor[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setHumanColor(c)}
                        aria-label={`Select ${c}`}
                        className={`w-7 h-7 rounded-full border-2 ${
                          humanColor === c ? 'border-white scale-110 ring-2 ring-amber-300' : 'border-white/40 opacity-75'
                        }`}
                        style={{
                          backgroundColor:
                            c === 'red' ? '#ef4444' : c === 'green' ? '#22c55e' : c === 'yellow' ? '#eab308' : '#3b82f6',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {initialMode === 'pass_n_play' && (
                <div className="grid grid-cols-2 gap-2">
                  {(effectivePlayerCount === 2
                    ? (['blue', 'green'] as PlayerColor[])
                    : effectivePlayerCount === 3
                    ? (['blue', 'red', 'green'] as PlayerColor[])
                    : (['blue', 'red', 'green', 'yellow'] as PlayerColor[])
                  ).map((c) => (
                    <input
                      key={c}
                      type="text"
                      value={names[c]}
                      maxLength={18}
                      onChange={(e) => setNames((prev) => ({ ...prev, [c]: e.target.value }))}
                      placeholder={c}
                      className="rounded-lg bg-[#031a4d] border border-blue-400/35 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {(initialMode === 'online' || initialMode === 'team_up') && (
            <div className="pt-2 border-t border-blue-400/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-100">Match Entry</span>
                <div className="flex gap-1.5">
                  {[0, 500, 2500].map((stake) => (
                    <button
                      key={stake}
                      type="button"
                      onClick={() => setStakeCoins(stake)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono-num font-bold border ${
                        stakeCoins === stake
                          ? 'bg-amber-400 text-slate-950 border-amber-200'
                          : 'bg-[#031e59] text-blue-100 border-blue-400/30'
                      }`}
                    >
                      {stake === 0 ? 'Free' : `${stake}`}
                    </button>
                  ))}
                </div>
              </div>
              {publicRooms.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] font-bold text-amber-300">Open Rooms Ready to Join:</p>
                  {publicRooms.slice(0, 2).map((room) => (
                    <div
                      key={room.roomId}
                      className="flex items-center justify-between rounded-lg bg-[#031c54] border border-blue-400/30 px-2.5 py-1.5 text-xs"
                    >
                      <span className="truncate font-semibold text-white">
                        {room.hostName} ({room.currentPlayers}/{room.maxPlayers})
                      </span>
                      <button
                        type="button"
                        onClick={() => onJoinRoomDirect(room.roomId)}
                        className="green-try-btn px-2.5 py-0.5 rounded-md text-[11px] font-bold"
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {initialMode === 'friends' && (
            <div className="pt-2 border-t border-blue-400/20 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFriendAction('create')}
                  className={`py-2 rounded-lg text-xs font-bold border ${
                    friendAction === 'create'
                      ? 'bg-amber-400 text-slate-950 border-amber-200'
                      : 'bg-[#031e59] text-blue-100 border-blue-400/30'
                  }`}
                >
                  Create Room
                </button>
                <button
                  type="button"
                  onClick={() => setFriendAction('join')}
                  className={`py-2 rounded-lg text-xs font-bold border ${
                    friendAction === 'join'
                      ? 'bg-amber-400 text-slate-950 border-amber-200'
                      : 'bg-[#031e59] text-blue-100 border-blue-400/30'
                  }`}
                >
                  Join Code
                </button>
              </div>
              {friendAction === 'join' && (
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-char room code"
                  maxLength={8}
                  className="w-full rounded-lg bg-[#031a4d] border border-amber-400/50 px-3 py-2 text-sm font-mono-num text-center text-white uppercase tracking-widest focus:outline-none"
                />
              )}
            </div>
          )}
        </div>

        {/* Next CTA */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onBack();
            }}
            aria-label="Back"
            className="w-12 h-12 rounded-xl gold-btn flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-6 h-6 text-slate-900" />
          </button>
          <button
            type="button"
            disabled={initialMode === 'friends' && friendAction === 'join' && joinCode.trim().length < 4}
            onClick={handleNext}
            className="flex-1 h-12 rounded-full royal-btn font-display font-black text-xl tracking-wide disabled:opacity-50"
          >
            {t.next}
          </button>
        </div>
      </div>
    </div>
  );
};
