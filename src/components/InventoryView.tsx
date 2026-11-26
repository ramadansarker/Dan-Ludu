import React, { useState } from 'react';
import { Check, Lock, Music, Palette, Smartphone, UserCheck, Volume2, VolumeX } from 'lucide-react';
import { AVATAR_LIST, BOARD_THEMES, DICE_STYLES, TOKEN_STYLES } from '../data/catalog';
import {
  AppSettings,
  BoardThemeId,
  DiceStyleId,
  TokenStyleId,
  UserProfile,
} from '../types/game';
import { DiceView } from './DiceView';
import { TokenGraphic } from './TokenGraphic';
import { soundEngine } from '../utils/sound';

type InventoryTab = 'dice' | 'tokens' | 'themes' | 'avatars' | 'sound';

interface InventoryViewProps {
  profile: UserProfile;
  settings: AppSettings;
  initialSubTab?: InventoryTab;
  onSelectOrUnlockTheme: (id: BoardThemeId) => void;
  onSelectOrUnlockToken: (id: TokenStyleId) => void;
  onSelectOrUnlockDice: (id: DiceStyleId) => void;
  onSelectOrUnlockAvatar: (id: string) => void;
  onToggleSetting: (key: 'soundEnabled' | 'musicEnabled' | 'vibrationEnabled') => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  profile,
  settings,
  initialSubTab = 'themes',
  onSelectOrUnlockTheme,
  onSelectOrUnlockToken,
  onSelectOrUnlockDice,
  onSelectOrUnlockAvatar,
  onToggleSetting,
}) => {
  const [subTab, setSubTab] = useState<InventoryTab>(initialSubTab);

  const tabs: { id: InventoryTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dice', label: 'Dice', icon: <DiceView value={5} size={24} styleId={profile.selectedDice} disabled /> },
    { id: 'tokens', label: 'Tokens', icon: <TokenGraphic color="blue" styleId={profile.selectedToken} size={24} /> },
    { id: 'themes', label: 'Themes', icon: <Palette className="w-5 h-5 text-amber-300" /> },
    { id: 'avatars', label: 'Avatar', icon: <UserCheck className="w-5 h-5 text-cyan-300" /> },
    { id: 'sound', label: 'Sound', icon: <Volume2 className="w-5 h-5 text-emerald-300" /> },
  ];

  const renderPriceLabel = (coins: number, diamonds: number) => {
    if (coins === 0 && diamonds === 0) return 'FREE';
    if (diamonds > 0) return `💎 ${diamonds}`;
    return `🪙 ${coins.toLocaleString()}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-3 pt-2 pb-24 space-y-4">
      {/* Sub-navigation bar matching Inventory screenshots */}
      <div className="grid grid-cols-5 gap-1.5 rounded-2xl bg-[#042366] gold-frame p-1.5">
        {tabs.map((tab) => {
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setSubTab(tab.id);
              }}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all ${
                active
                  ? 'bg-[#1559c7] border border-amber-300 shadow-md'
                  : 'hover:bg-[#09358c] opacity-80'
              }`}
            >
              <div className="h-6 flex items-center justify-center">{tab.icon}</div>
              <span className="text-[11px] font-display font-bold text-white whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Themes Grid (All 9 requested themes: Default, Nature, Egypt, Disco, Marble, Candy, Christmas, Penguin, Battle) */}
      {subTab === 'themes' && (
        <div className="space-y-3">
          <div className="text-center">
            <span className="inline-block px-6 py-1 rounded-full bg-red-600 border border-amber-300 font-display font-black text-sm text-white shadow">
              Board Themes
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BOARD_THEMES.map((th) => {
              const unlocked = profile.unlockedThemes.includes(th.id);
              const selected = profile.selectedTheme === th.id;
              return (
                <div
                  key={th.id}
                  className={`rounded-2xl bg-[#062d7d] border-2 p-2.5 flex flex-col items-center gap-2 transition-all ${
                    selected ? 'border-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.35)]' : 'border-blue-400/35'
                  }`}
                >
                  <div className="flex items-center justify-between w-full px-1">
                    <span className="font-display font-black text-xs text-amber-300 uppercase tracking-wide">
                      {th.name}
                    </span>
                    {!unlocked && <Lock className="w-3.5 h-3.5 text-amber-200" />}
                  </div>

                  {/* Mini Board Preview */}
                  <div
                    className="w-full aspect-square rounded-xl border-2 p-1.5 grid grid-cols-3 grid-rows-3 gap-1 relative overflow-hidden"
                    style={{
                      backgroundColor: th.boardBg,
                      borderColor: th.borderColor,
                      backgroundImage: th.patternOverlay,
                    }}
                  >
                    <div className="rounded-sm" style={{ backgroundColor: th.yardColors.red }} />
                    <div className="rounded-sm" style={{ backgroundColor: th.trackAltBg }} />
                    <div className="rounded-sm" style={{ backgroundColor: th.yardColors.green }} />
                    <div className="rounded-sm" style={{ backgroundColor: th.trackBg }} />
                    <div className="rounded-sm border border-amber-400/60" style={{ backgroundColor: th.accentHex }} />
                    <div className="rounded-sm" style={{ backgroundColor: th.trackBg }} />
                    <div className="rounded-sm" style={{ backgroundColor: th.yardColors.blue }} />
                    <div className="rounded-sm" style={{ backgroundColor: th.trackAltBg }} />
                    <div className="rounded-sm" style={{ backgroundColor: th.yardColors.yellow }} />
                  </div>

                  <p className="text-[10px] text-blue-200">{th.badgeText}</p>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onSelectOrUnlockTheme(th.id);
                    }}
                    className={`w-full py-1.5 rounded-xl font-display font-bold text-xs flex items-center justify-center gap-1 ${
                      selected
                        ? 'bg-amber-400 text-slate-950'
                        : unlocked
                        ? 'royal-btn'
                        : 'green-try-btn'
                    }`}
                  >
                    {selected ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Equipped
                      </>
                    ) : unlocked ? (
                      'Equip'
                    ) : (
                      `Unlock · ${renderPriceLabel(th.priceCoins, th.priceDiamonds)}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dice Grid */}
      {subTab === 'dice' && (
        <div className="space-y-3">
          <div className="text-center">
            <span className="inline-block px-6 py-1 rounded-full bg-red-600 border border-amber-300 font-display font-black text-sm text-white shadow">
              Dice Collection
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DICE_STYLES.map((d) => {
              const unlocked = profile.unlockedDice.includes(d.id);
              const selected = profile.selectedDice === d.id;
              return (
                <div
                  key={d.id}
                  className={`rounded-2xl bg-[#062d7d] border-2 p-3 flex flex-col items-center gap-2.5 ${
                    selected ? 'border-amber-300' : 'border-blue-400/35'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-display font-bold text-xs text-amber-300 truncate">{d.name}</span>
                    {!unlocked && <Lock className="w-3.5 h-3.5 text-amber-200 shrink-0" />}
                  </div>
                  <div className="py-2">
                    <DiceView value={5} styleId={d.id} size={56} active={selected} disabled />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onSelectOrUnlockDice(d.id);
                    }}
                    className={`w-full py-1.5 rounded-xl font-display font-bold text-xs ${
                      selected ? 'bg-amber-400 text-slate-950' : unlocked ? 'royal-btn' : 'green-try-btn'
                    }`}
                  >
                    {selected
                      ? 'Equipped'
                      : unlocked
                      ? 'Equip'
                      : renderPriceLabel(d.priceCoins, d.priceDiamonds)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tokens Grid */}
      {subTab === 'tokens' && (
        <div className="space-y-3">
          <div className="text-center">
            <span className="inline-block px-6 py-1 rounded-full bg-red-600 border border-amber-300 font-display font-black text-sm text-white shadow">
              Board Tokens
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TOKEN_STYLES.map((tok) => {
              const unlocked = profile.unlockedTokens.includes(tok.id);
              const selected = profile.selectedToken === tok.id;
              return (
                <div
                  key={tok.id}
                  className={`rounded-2xl bg-[#062d7d] border-2 p-3 flex flex-col items-center gap-2.5 ${
                    selected ? 'border-amber-300' : 'border-blue-400/35'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-display font-bold text-xs text-amber-300">{tok.name}</span>
                    {!unlocked && <Lock className="w-3.5 h-3.5 text-amber-200" />}
                  </div>
                  <div className="flex items-center justify-center gap-1 py-2">
                    <TokenGraphic color="red" styleId={tok.id} size={28} />
                    <TokenGraphic color="green" styleId={tok.id} size={28} />
                    <TokenGraphic color="blue" styleId={tok.id} size={28} />
                    <TokenGraphic color="yellow" styleId={tok.id} size={28} />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onSelectOrUnlockToken(tok.id);
                    }}
                    className={`w-full py-1.5 rounded-xl font-display font-bold text-xs ${
                      selected ? 'bg-amber-400 text-slate-950' : unlocked ? 'royal-btn' : 'green-try-btn'
                    }`}
                  >
                    {selected
                      ? 'Equipped'
                      : unlocked
                      ? 'Equip'
                      : renderPriceLabel(tok.priceCoins, tok.priceDiamonds)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Player Avatars */}
      {subTab === 'avatars' && (
        <div className="space-y-3">
          <div className="text-center">
            <span className="inline-block px-6 py-1 rounded-full bg-red-600 border border-amber-300 font-display font-black text-sm text-white shadow">
              Player Avatars
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {AVATAR_LIST.map((av) => {
              const unlocked = profile.unlockedAvatars.includes(av.id);
              const selected = profile.selectedAvatar === av.id;
              return (
                <div
                  key={av.id}
                  className={`rounded-2xl bg-[#062d7d] border-2 p-2.5 flex flex-col items-center gap-2 ${
                    selected ? 'border-amber-300' : 'border-blue-400/35'
                  }`}
                >
                  <div className="flex items-center justify-between w-full px-0.5">
                    <span className="font-display font-bold text-[11px] text-amber-300 truncate">
                      {av.name}
                    </span>
                    {!unlocked && <Lock className="w-3.5 h-3.5 text-amber-200 shrink-0" />}
                  </div>
                  <img
                    src={av.src}
                    alt={av.name}
                    referrerPolicy="no-referrer"
                    className="w-24 h-24 rounded-xl object-cover border-2 border-amber-400/60"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onSelectOrUnlockAvatar(av.id);
                    }}
                    className={`w-full py-1.5 rounded-xl font-display font-bold text-xs ${
                      selected ? 'bg-amber-400 text-slate-950' : unlocked ? 'royal-btn' : 'green-try-btn'
                    }`}
                  >
                    {selected
                      ? 'Equipped'
                      : unlocked
                      ? 'Equip'
                      : renderPriceLabel(av.priceCoins, av.priceDiamonds)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sound Settings inside Inventory (Requirement 7) */}
      {subTab === 'sound' && (
        <div className="rounded-2xl bg-[#062d7d] gold-frame p-4 space-y-3">
          <h3 className="font-display font-black text-lg text-amber-300 text-center">
            Audio & Sound FX
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between rounded-xl bg-[#04215d] px-4 py-3 border border-blue-400/30">
              <div className="flex items-center gap-3">
                {settings.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-amber-300" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <p className="font-display font-bold text-sm text-white">Game Sound Effects</p>
                  <p className="text-[11px] text-blue-200">Dice roll, token hops & captures</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleSetting('soundEnabled')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                  settings.soundEnabled ? 'gold-btn' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {settings.soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#04215d] px-4 py-3 border border-blue-400/30">
              <div className="flex items-center gap-3">
                <Music className="w-5 h-5 text-amber-300" />
                <div>
                  <p className="font-display font-bold text-sm text-white">Background Music</p>
                  <p className="text-[11px] text-blue-200">Ambient classic board melody</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleSetting('musicEnabled')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                  settings.musicEnabled ? 'gold-btn' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {settings.musicEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#04215d] px-4 py-3 border border-blue-400/30">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-amber-300" />
                <div>
                  <p className="font-display font-bold text-sm text-white">Haptic Vibration</p>
                  <p className="text-[11px] text-blue-200">Tactile feedback on captures & sixes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleSetting('vibrationEnabled')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                  settings.vibrationEnabled ? 'gold-btn' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {settings.vibrationEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <button
              type="button"
              onClick={() => soundEngine.playDiceRoll()}
              className="royal-btn py-2 rounded-xl text-xs font-bold"
            >
              Test Dice
            </button>
            <button
              type="button"
              onClick={() => soundEngine.playCapture()}
              className="royal-btn py-2 rounded-xl text-xs font-bold"
            >
              Test Capture
            </button>
            <button
              type="button"
              onClick={() => soundEngine.playWinFanfare()}
              className="royal-btn py-2 rounded-xl text-xs font-bold"
            >
              Test Victory
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
