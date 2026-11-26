import React, { useState } from 'react';
import {
  Bell,
  CloudUpload,
  KeyRound,
  LogOut,
  Music,
  ShieldCheck,
  Smartphone,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { AppSettings, LanguageCode, UserProfile } from '../types/game';
import { TRANSLATIONS } from '../data/catalog';
import { soundEngine } from '../utils/sound';

interface SettingsModalProps {
  settings: AppSettings;
  profile: UserProfile;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onOpenThemes: () => void;
  onOpenStore: () => void;
  onOpenPrivacy: () => void;
  onGoogleLogin: () => Promise<void>;
  onSaveCloudNow: () => Promise<void>;
  onGenerateTransferCode: () => Promise<string>;
  onRedeemTransferCode: (code: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  profile,
  onUpdateSettings,
  onOpenThemes,
  onOpenStore,
  onOpenPrivacy,
  onGoogleLogin,
  onSaveCloudNow,
  onGenerateTransferCode,
  onRedeemTransferCode,
  onSignOut,
  onClose,
}) => {
  const t = TRANSLATIONS[settings.language];
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [transferCodeInput, setTransferCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSaveCloud = async () => {
    setBusy(true);
    setStatusMsg(null);
    try {
      await onSaveCloudNow();
      setStatusMsg('Game data synced to cloud!');
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : 'Sync failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleGenCode = async () => {
    setBusy(true);
    setStatusMsg(null);
    try {
      const code = await onGenerateTransferCode();
      setGeneratedCode(code);
      setStatusMsg(`Transfer code ${code} created!`);
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : 'Could not create transfer code.');
    } finally {
      setBusy(false);
    }
  };

  const handleRedeem = async () => {
    if (!transferCodeInput.trim()) return;
    setBusy(true);
    setStatusMsg(null);
    try {
      await onRedeemTransferCode(transferCodeInput);
      setStatusMsg('Device data restored successfully!');
      setTransferCodeInput('');
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : 'Code not found.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-b from-[#073693] to-[#031b52] gold-frame p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-blue-400/25 pb-3">
          <span className="w-8" />
          <h2 className="font-display font-black text-2xl text-amber-300">{t.settings}</h2>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            aria-label="Close settings"
            className="w-8 h-8 rounded-full bg-[#04215e] text-blue-100 hover:text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio, Music, Vibration, Notifications */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between py-1">
            <span className="font-display font-bold text-sm text-white">Game Sound</span>
            <button
              type="button"
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`w-10 h-10 rounded-full gold-frame flex items-center justify-center ${
                settings.soundEnabled ? 'bg-[#0e4ec7] text-amber-300' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="font-display font-bold text-sm text-white">Background Music</span>
            <button
              type="button"
              onClick={() => onUpdateSettings({ musicEnabled: !settings.musicEnabled })}
              className={`w-10 h-10 rounded-full gold-frame flex items-center justify-center ${
                settings.musicEnabled ? 'bg-[#0e4ec7] text-amber-300' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Music className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="font-display font-bold text-sm text-white">Vibration</span>
            <button
              type="button"
              onClick={() => onUpdateSettings({ vibrationEnabled: !settings.vibrationEnabled })}
              className={`w-10 h-10 rounded-full gold-frame flex items-center justify-center ${
                settings.vibrationEnabled ? 'bg-[#0e4ec7] text-amber-300' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Smartphone className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="font-display font-bold text-sm text-white">Notifications</span>
            <button
              type="button"
              onClick={() => onUpdateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
              className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                settings.notificationsEnabled ? 'royal-btn text-amber-300' : 'bg-slate-700 text-slate-300'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{settings.notificationsEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="font-display font-bold text-sm text-white">Language</span>
            <select
              value={settings.language}
              onChange={(e) => onUpdateSettings({ language: e.target.value as LanguageCode })}
              className="rounded-full bg-[#0b42ac] border-2 border-amber-400 px-3.5 py-1.5 text-xs font-bold text-white focus:outline-none"
            >
              <option value="en">English</option>
              <option value="ar">العربية (Arabic)</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="font-display font-bold text-sm text-white">Search Privacy</span>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({
                  searchPrivacy: settings.searchPrivacy === 'Public' ? 'Friends' : 'Public',
                })
              }
              className="royal-btn px-4 py-1.5 rounded-full text-xs font-bold"
            >
              {settings.searchPrivacy}
            </button>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="font-display font-bold text-sm text-white">Themes</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenThemes();
              }}
              className="royal-btn px-5 py-1.5 rounded-full text-xs font-bold"
            >
              Select
            </button>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="font-display font-bold text-sm text-white">Store</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenStore();
              }}
              className="royal-btn px-5 py-1.5 rounded-full text-xs font-bold"
            >
              View
            </button>
          </div>
        </div>

        {/* Account & Change Device Section */}
        <div className="rounded-xl bg-[#041d54] border border-blue-400/35 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-sm text-amber-300">Account Settings</p>
              <p className="text-[11px] text-blue-200">
                {profile.isGuest
                  ? 'Playing as Guest (Local Save)'
                  : `Signed in: ${profile.email || profile.displayName}`}
              </p>
            </div>
            {!profile.isGuest && (
              <button
                type="button"
                onClick={onSignOut}
                className="px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 border border-red-400/40 text-xs font-bold text-red-100 flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            )}
          </div>

          {profile.isGuest ? (
            <button
              type="button"
              onClick={onGoogleLogin}
              className="w-full py-2.5 rounded-xl bg-white text-slate-900 font-display font-bold text-xs flex items-center justify-center gap-2"
            >
              Link Google Account (+100 Diamonds)
            </button>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleSaveCloud}
                  className="royal-btn py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <CloudUpload className="w-3.5 h-3.5 text-emerald-300" />
                  Save Data
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleGenCode}
                  className="royal-btn py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                  Change Device
                </button>
              </div>
              {generatedCode && (
                <div className="rounded-lg bg-[#021236] border border-amber-400/50 p-2 text-center">
                  <p className="text-[10px] text-blue-200">Your Device Transfer Code:</p>
                  <p className="font-mono-num font-bold text-base text-amber-300 tracking-widest">
                    {generatedCode}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={transferCodeInput}
                  onChange={(e) => setTransferCodeInput(e.target.value.toUpperCase())}
                  placeholder="Enter transfer code"
                  className="flex-1 min-w-0 rounded-lg bg-[#021236] border border-blue-400/35 px-2.5 py-1.5 text-xs font-mono-num text-white"
                />
                <button
                  type="button"
                  disabled={busy || !transferCodeInput.trim()}
                  onClick={handleRedeem}
                  className="gold-btn px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  Restore
                </button>
              </div>
            </div>
          )}

          {statusMsg && <p className="text-xs text-emerald-300 text-center font-medium">{statusMsg}</p>}
        </div>

        {/* Privacy Policy */}
        <div className="flex items-center justify-between pt-1 border-t border-blue-400/20">
          <span className="text-xs text-blue-200 font-semibold">RAMADAN DEV</span>
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="text-xs font-bold text-amber-300 hover:underline flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
};
