import React, { useState } from 'react';
import {
  Award,
  Check,
  Copy,
  Gift,
  Mail,
  Play,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { AVATAR_LIST, SEASON_QUESTS } from '../data/catalog';
import { ChatMessage, GameType, PlayerColor, PlayMode, UserProfile } from '../types/game';
import { soundEngine } from '../utils/sound';

/* ---------------- EVENTS VIEW ---------------- */
export const EventsView: React.FC<{
  profile: UserProfile;
  onClaimQuest: (questId: string, coins: number, diamonds: number) => void;
  onClaimDaily: () => void;
}> = ({ profile, onClaimQuest, onClaimDaily }) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const dailyClaimed = profile.dailyClaimedAt === todayStr;

  return (
    <div className="w-full max-w-2xl mx-auto px-3 pt-2 pb-24 space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-[#0d48b8] to-[#062873] gold-frame p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">RAMADAN DEV Season</p>
          <h2 className="font-display font-black text-xl text-white">Daily Check-In Bonus</h2>
          <p className="text-xs text-blue-100 mt-0.5">Claim 500 Coins & 10 Diamonds every day</p>
        </div>
        <button
          type="button"
          disabled={dailyClaimed}
          onClick={() => {
            soundEngine.playHomeFanfare();
            onClaimDaily();
          }}
          className={`px-4 py-2.5 rounded-xl font-display font-bold text-xs whitespace-nowrap ${
            dailyClaimed ? 'bg-slate-700 text-slate-300 cursor-default' : 'gold-btn'
          }`}
        >
          {dailyClaimed ? 'Claimed Today' : 'Claim Gift'}
        </button>
      </div>

      <div className="space-y-2.5">
        <h3 className="font-display font-black text-base text-amber-300 px-1">Season Challenges</h3>
        {SEASON_QUESTS.map((q) => {
          const currentVal = profile[q.metric] || 0;
          const pct = Math.min(100, Math.round((currentVal / q.target) * 100));
          const completed = currentVal >= q.target;
          const claimed = profile.claimedQuests.includes(q.id);

          return (
            <div
              key={q.id}
              className="rounded-2xl bg-[#052a7a] border border-blue-400/35 p-3.5 flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-white">{q.title}</h4>
                  <span className="font-mono-num text-xs font-bold text-amber-300">
                    {Math.min(currentVal, q.target)}/{q.target}
                  </span>
                </div>
                <p className="text-xs text-blue-200">{q.description}</p>
                <div className="h-2 rounded-full bg-[#021236] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono-num font-bold text-amber-200">
                  <span>+{q.rewardCoins} Coins</span>
                  <span>+{q.rewardDiamonds} Diamonds</span>
                </div>
              </div>
              <button
                type="button"
                disabled={!completed || claimed}
                onClick={() => {
                  soundEngine.playHomeFanfare();
                  onClaimQuest(q.id, q.rewardCoins, q.rewardDiamonds);
                }}
                className={`px-3.5 py-2 rounded-xl font-display font-bold text-xs whitespace-nowrap shrink-0 ${
                  claimed
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-400/30'
                    : completed
                    ? 'gold-btn'
                    : 'bg-[#03194a] text-blue-300/60 border border-blue-400/20'
                }`}
              >
                {claimed ? 'Claimed' : completed ? 'Claim' : 'In Progress'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------- SOCIAL VIEW (Text Chat & Friends ONLY — ZERO VOICE/CALL) ---------------- */
export const SocialView: React.FC<{
  profile: UserProfile;
  onSearchPlayers: () => Promise<{ uid: string; displayName: string; avatarId: string; level: number; wins: number }[]>;
  onAddFriend: (friend: { uid: string; displayName: string; avatarId: string; level: number; wins: number }) => void;
  onCreateFriendRoom: () => void;
  onJoinFriendRoom: (code: string) => void;
}> = ({ profile, onSearchPlayers, onAddFriend, onCreateFriendRoom, onJoinFriendRoom }) => {
  const [tab, setTab] = useState<'friends' | 'find' | 'room'>('friends');
  const [directory, setDirectory] = useState<
    { uid: string; displayName: string; avatarId: string; level: number; wins: number }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [roomCodeInput, setRoomCodeInput] = useState('');

  const handleLoadDirectory = async () => {
    setSearching(true);
    setSearchError(null);
    try {
      const list = await onSearchPlayers();
      setDirectory(list);
    } catch {
      setSearchError('Sign in with Google to browse online player profiles.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-3 pt-2 pb-24 space-y-4">
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#042366] gold-frame p-1.5">
        <button
          type="button"
          onClick={() => setTab('friends')}
          className={`py-2 rounded-xl font-display font-bold text-xs ${
            tab === 'friends' ? 'bg-amber-400 text-slate-950' : 'text-blue-100 hover:bg-[#09358c]'
          }`}
        >
          Friends ({profile.friends.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('find');
            handleLoadDirectory();
          }}
          className={`py-2 rounded-xl font-display font-bold text-xs ${
            tab === 'find' ? 'bg-amber-400 text-slate-950' : 'text-blue-100 hover:bg-[#09358c]'
          }`}
        >
          Find Players
        </button>
        <button
          type="button"
          onClick={() => setTab('room')}
          className={`py-2 rounded-xl font-display font-bold text-xs ${
            tab === 'room' ? 'bg-amber-400 text-slate-950' : 'text-blue-100 hover:bg-[#09358c]'
          }`}
        >
          Room Invite
        </button>
      </div>

      {tab === 'friends' && (
        <div className="rounded-2xl bg-[#052978] gold-frame p-4 space-y-3">
          {profile.friends.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <Users className="w-10 h-10 text-amber-300 mx-auto" />
              <p className="font-display font-bold text-base text-white">No Friends Added Yet</p>
              <p className="text-xs text-blue-200 max-w-xs mx-auto">
                Create a private Ludo room code to invite friends, or search public players to add them.
              </p>
              <button
                type="button"
                onClick={onCreateFriendRoom}
                className="gold-btn px-5 py-2.5 rounded-xl font-display font-bold text-xs"
              >
                Create Friend Room
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {profile.friends.map((f) => {
                const av = AVATAR_LIST.find((a) => a.id === f.avatarId)?.src || AVATAR_LIST[0].src;
                return (
                  <div
                    key={f.uid}
                    className="flex items-center justify-between rounded-xl bg-[#041d54] border border-blue-400/30 p-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={av}
                        alt={f.displayName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover border border-amber-400/60"
                      />
                      <div>
                        <p className="font-display font-bold text-sm text-white">{f.displayName}</p>
                        <p className="text-[11px] text-blue-200 font-mono-num">
                          Lvl {f.level} · {f.wins} Wins
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onCreateFriendRoom}
                      className="royal-btn px-3 py-1.5 rounded-lg text-xs font-bold"
                    >
                      Invite
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'find' && (
        <div className="rounded-2xl bg-[#052978] gold-frame p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-amber-300">Public Players</h3>
            <button
              type="button"
              onClick={handleLoadDirectory}
              className="text-xs font-bold text-blue-200 hover:text-white flex items-center gap-1"
            >
              <Search className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
          {searching ? (
            <p className="text-xs text-blue-200 text-center py-6">Loading players...</p>
          ) : searchError ? (
            <p className="text-xs text-amber-200 text-center py-6">{searchError}</p>
          ) : directory.length === 0 ? (
            <p className="text-xs text-blue-200 text-center py-6">
              {profile.isGuest
                ? 'Sign in with Google to search and add friends across devices.'
                : 'No other public players found yet.'}
            </p>
          ) : (
            <div className="space-y-2">
              {directory.map((p) => {
                const added = profile.friends.some((f) => f.uid === p.uid);
                const av = AVATAR_LIST.find((a) => a.id === p.avatarId)?.src || AVATAR_LIST[0].src;
                return (
                  <div
                    key={p.uid}
                    className="flex items-center justify-between rounded-xl bg-[#041d54] border border-blue-400/30 p-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={av}
                        alt={p.displayName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover border border-amber-400/50"
                      />
                      <div>
                        <p className="font-display font-bold text-sm text-white">{p.displayName}</p>
                        <p className="text-[11px] text-blue-200 font-mono-num">
                          Lvl {p.level} · {p.wins} Wins
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={added}
                      onClick={() => onAddFriend(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                        added ? 'bg-slate-700 text-slate-300' : 'gold-btn'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      {added ? 'Added' : 'Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'room' && (
        <div className="rounded-2xl bg-[#052978] gold-frame p-4 space-y-4">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-base text-amber-300">Private Match Invite</h3>
            <p className="text-xs text-blue-200">
              Create a 6-character room code to play Ludo online with friends, or enter a friend&apos;s code.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateFriendRoom}
            className="w-full gold-btn py-3 rounded-xl font-display font-bold text-sm"
          >
            Create Private Room
          </button>
          <div className="flex gap-2">
            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              maxLength={8}
              className="flex-1 min-w-0 rounded-xl bg-[#03194a] border border-blue-400/40 px-3 py-2.5 text-sm font-mono-num text-white uppercase tracking-widest"
            />
            <button
              type="button"
              disabled={roomCodeInput.trim().length < 4}
              onClick={() => onJoinFriendRoom(roomCodeInput.trim().toUpperCase())}
              className="royal-btn px-4 rounded-xl font-display font-bold text-sm disabled:opacity-50"
            >
              Join
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------- ONLINE WAITING ROOM LOBBY ---------------- */
export interface RoomSnapshot {
  roomId: string;
  hostClientId: string;
  hostName: string;
  gameType: GameType;
  playMode: PlayMode;
  maxPlayers: number;
  stakeCoins: number;
  isPrivate: boolean;
  players: { clientId: string; name: string; avatarId: string; color: PlayerColor; isAI: boolean }[];
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  chat: ChatMessage[];
}

export const OnlineWaitingLobby: React.FC<{
  room: RoomSnapshot;
  localClientId: string;
  onStartMatch: (fillWithBots: boolean) => void;
  onSendChat: (text: string) => void;
  onLeave: () => void;
}> = ({ room, localClientId, onStartMatch, onSendChat, onLeave }) => {
  const [copied, setCopied] = useState(false);
  const [chatText, setChatText] = useState('');
  const isHost = room.hostClientId === localClientId;

  const copyCode = () => {
    navigator.clipboard?.writeText(room.roomId).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="min-h-screen ludo-bg-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#052978] gold-frame p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-300 uppercase">
              {room.isPrivate ? 'Private Friends Room' : 'Online Matchmaking Room'}
            </p>
            <h2 className="font-display font-black text-xl text-white">
              {room.gameType.replace('_', ' ').toUpperCase()} · {room.players.length}/{room.maxPlayers}
            </h2>
          </div>
          <button
            type="button"
            onClick={onLeave}
            className="px-3 py-1.5 rounded-lg bg-red-900/60 border border-red-400/40 text-xs font-bold text-red-100"
          >
            Leave
          </button>
        </div>

        {/* Shareable Room Code */}
        <div className="rounded-xl bg-[#03194a] border border-amber-400/60 p-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-blue-200 uppercase font-semibold">Room Code</p>
            <p className="font-mono-num font-black text-2xl text-amber-300 tracking-widest">
              {room.roomId}
            </p>
          </div>
          <button
            type="button"
            onClick={copyCode}
            className="royal-btn px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy Code'}
          </button>
        </div>

        {/* Joined Players */}
        <div className="space-y-2">
          {Array.from({ length: room.maxPlayers }).map((_, idx) => {
            const p = room.players[idx];
            if (!p) {
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-dashed border-blue-400/35 bg-[#041d54]/50 px-3.5 py-2.5 text-xs text-blue-200/70"
                >
                  Waiting for player {idx + 1} to join...
                </div>
              );
            }
            const av = AVATAR_LIST.find((a) => a.id === p.avatarId)?.src || AVATAR_LIST[0].src;
            return (
              <div
                key={p.clientId}
                className="flex items-center justify-between rounded-xl bg-[#041d54] border border-blue-400/40 px-3 py-2"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={av}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-lg object-cover border border-amber-300"
                  />
                  <div>
                    <p className="font-display font-bold text-sm text-white">
                      {p.name} {p.clientId === localClientId ? '(You)' : ''}
                    </p>
                    <p className="text-[11px] text-blue-200 capitalize">{p.color} seat</p>
                  </div>
                </div>
                {p.clientId === room.hostClientId && (
                  <span className="text-[11px] font-bold text-amber-300">HOST</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Text Lobby Chat */}
        <div className="rounded-xl bg-[#021236] border border-blue-400/25 p-2.5 space-y-2">
          <div className="h-20 overflow-y-auto space-y-1 text-xs">
            {room.chat.length === 0 ? (
              <p className="text-blue-300/60 text-center py-5">Say hello to joined players!</p>
            ) : (
              room.chat.map((c) => (
                <div key={c.id}>
                  <span className="font-bold text-amber-300">{c.sender}: </span>
                  <span className="text-white">{c.text}</span>
                </div>
              ))
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!chatText.trim()) return;
              onSendChat(chatText);
              setChatText('');
            }}
            className="flex gap-1.5"
          >
            <input
              type="text"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Send text message..."
              className="flex-1 min-w-0 rounded-lg bg-[#041d54] border border-blue-400/35 px-2.5 py-1.5 text-xs text-white"
            />
            <button type="submit" className="gold-btn px-3 rounded-lg">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Host Start Controls */}
        {isHost ? (
          <div className="space-y-2">
            {room.players.length >= 2 && (
              <button
                type="button"
                onClick={() => onStartMatch(false)}
                className="w-full gold-btn py-3 rounded-xl font-display font-black text-sm flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Match ({room.players.length} Players)
              </button>
            )}
            <button
              type="button"
              onClick={() => onStartMatch(true)}
              className="w-full royal-btn py-2.5 rounded-xl font-display font-bold text-xs"
            >
              Start Now &amp; Fill Empty Seats with Bots
            </button>
          </div>
        ) : (
          <p className="text-center text-xs text-amber-200 font-medium">
            Waiting for host ({room.hostName}) to start the match...
          </p>
        )}
      </div>
    </div>
  );
};

/* ---------------- DAILY LUCKY SPIN MODAL ---------------- */
export const DailySpinModal: React.FC<{
  onReward: (coins: number, diamonds: number) => void;
  onClose: () => void;
}> = ({ onReward, onClose }) => {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ label: string; coins: number; diamonds: number } | null>(null);
  const [rotation, setRotation] = useState(0);

  const slices = [
    { label: '500 Coins', coins: 500, diamonds: 0 },
    { label: '10 Diamonds', coins: 0, diamonds: 10 },
    { label: '1,000 Coins', coins: 1000, diamonds: 0 },
    { label: '25 Diamonds', coins: 0, diamonds: 25 },
    { label: '250 Coins', coins: 250, diamonds: 0 },
    { label: '2,500 Coins', coins: 2500, diamonds: 0 },
  ];

  const handleSpin = () => {
    if (spinning || result) return;
    setSpinning(true);
    soundEngine.playDiceRoll();
    const pickIdx = Math.floor(Math.random() * slices.length);
    const targetRot = 1440 + pickIdx * 60 + 30;
    setRotation(targetRot);
    window.setTimeout(() => {
      const prize = slices[pickIdx];
      setResult(prize);
      setSpinning(false);
      soundEngine.playHomeFanfare();
      onReward(prize.coins, prize.diamonds);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#052978] gold-frame p-5 text-center space-y-4">
        <div className="flex items-center justify-between">
          <span className="w-6" />
          <h2 className="font-display font-black text-xl text-amber-300">ROYAL SPIN</h2>
          <button onClick={onClose} className="text-blue-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative w-52 h-52 mx-auto">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-amber-300" />
          <div
            style={{ transform: `rotate(${rotation}deg)` }}
            className="w-full h-full rounded-full border-4 border-amber-400 shadow-2xl transition-transform duration-[1800ms] ease-out overflow-hidden relative bg-[conic-gradient(#dc2626_0deg_60deg,#2563eb_60deg_120deg,#16a34a_120deg_180deg,#eab308_180deg_240deg,#9333ea_240deg_300deg,#f97316_300deg_360deg)]"
          >
            <div className="absolute inset-8 rounded-full bg-[#041d54] border-2 border-amber-300 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-amber-300" />
            </div>
          </div>
        </div>

        {result ? (
          <div className="space-y-3">
            <p className="font-display font-black text-lg text-emerald-300">
              You won {result.label}!
            </p>
            <button onClick={onClose} className="w-full gold-btn py-2.5 rounded-xl font-bold text-sm">
              Collect &amp; Close
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={spinning}
            onClick={handleSpin}
            className="w-full gold-btn py-3 rounded-xl font-display font-black text-base disabled:opacity-60"
          >
            {spinning ? 'Spinning...' : 'Spin Wheel'}
          </button>
        )}
      </div>
    </div>
  );
};

/* ---------------- TOURNAMENT MODAL ---------------- */
export const TournamentModal: React.FC<{
  wins: number;
  onStartTournamentMatch: () => void;
  onClose: () => void;
}> = ({ wins, onStartTournamentMatch, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="w-full max-w-md rounded-2xl bg-[#052978] gold-frame p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-300" />
          <h2 className="font-display font-black text-xl text-amber-300">ROYAL TOURNAMENT</h2>
        </div>
        <button onClick={onClose} className="text-blue-200 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="rounded-xl bg-[#03194a] border border-amber-400/40 p-4 space-y-2 text-center">
        <p className="text-xs text-blue-200 uppercase font-bold">Grand Championship Cup</p>
        <p className="font-display font-black text-2xl text-white">2,500 Coins + 20 Diamonds</p>
        <p className="text-xs text-blue-100">
          Compete in a high-stakes 4-player Quick Knockout Ludo match against elite Challengers!
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-blue-200 px-1">
        <span>Your Career Wins</span>
        <span className="font-mono-num font-bold text-amber-300">{wins}</span>
      </div>

      <button
        type="button"
        onClick={() => {
          soundEngine.playClick();
          onStartTournamentMatch();
        }}
        className="w-full gold-btn py-3 rounded-xl font-display font-black text-base"
      >
        Enter Championship Match
      </button>
    </div>
  </div>
);

/* ---------------- STORE & INBOX & PROFILE & PRIVACY MODALS ---------------- */
export const StoreModal: React.FC<{
  profile: UserProfile;
  onExchangeDiamonds: (diamondsCost: number, coinsGain: number) => void;
  onClose: () => void;
}> = ({ profile, onExchangeDiamonds, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="w-full max-w-md rounded-2xl bg-[#052978] gold-frame p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-black text-xl text-amber-300">RAMADAN DEV STORE</h2>
        <button onClick={onClose} className="text-blue-200 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex items-center justify-around rounded-xl bg-[#03194a] py-2.5 text-sm font-mono-num font-bold">
        <span className="text-cyan-200">💎 {profile.diamonds} Diamonds</span>
        <span className="text-amber-300">🪙 {profile.coins.toLocaleString()} Coins</span>
      </div>
      <div className="space-y-2.5">
        {[
          { coins: 1000, diamonds: 10, label: 'Starter Pouch' },
          { coins: 3000, diamonds: 25, label: 'Royal Chest' },
          { coins: 7500, diamonds: 50, label: 'Grand Vault' },
        ].map((pack) => (
          <div
            key={pack.label}
            className="flex items-center justify-between rounded-xl bg-[#041d54] border border-blue-400/30 p-3"
          >
            <div>
              <p className="font-display font-bold text-sm text-white">{pack.label}</p>
              <p className="text-xs font-mono-num text-amber-300">+{pack.coins.toLocaleString()} Coins</p>
            </div>
            <button
              type="button"
              disabled={profile.diamonds < pack.diamonds}
              onClick={() => {
                soundEngine.playHomeFanfare();
                onExchangeDiamonds(pack.diamonds, pack.coins);
              }}
              className="gold-btn px-4 py-2 rounded-xl text-xs font-mono-num font-bold disabled:opacity-45"
            >
              💎 {pack.diamonds}
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const InboxModal: React.FC<{
  profile: UserProfile;
  onClaimInbox: (id: string, coins: number, diamonds: number) => void;
  onClose: () => void;
}> = ({ profile, onClaimInbox, onClose }) => {
  const messages = [
    {
      id: 'welcome_gift',
      title: 'Welcome to RAMADAN DEV!',
      body: 'Thank you for playing Classic Ludo. Claim your starter gift!',
      coins: 1000,
      diamonds: 15,
    },
    {
      id: 'clean_play',
      title: 'Fair Play Season Notice',
      body: 'Enjoy pure classic Ludo gameplay across Online, Team Up, Friends, Computer, and Pass N Play.',
      coins: 250,
      diamonds: 5,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#052978] gold-frame p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-300" />
            <h2 className="font-display font-black text-xl text-amber-300">INBOX</h2>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {messages.map((m) => {
            const claimed = profile.claimedInbox.includes(m.id);
            return (
              <div
                key={m.id}
                className="rounded-xl bg-[#041d54] border border-blue-400/35 p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-white">{m.title}</h4>
                  <Gift className="w-4 h-4 text-amber-300" />
                </div>
                <p className="text-xs text-blue-200">{m.body}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-mono-num font-bold text-amber-300">
                    +{m.coins} Coins · +{m.diamonds} 💎
                  </span>
                  <button
                    type="button"
                    disabled={claimed}
                    onClick={() => {
                      soundEngine.playHomeFanfare();
                      onClaimInbox(m.id, m.coins, m.diamonds);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${
                      claimed ? 'bg-slate-700 text-slate-300' : 'gold-btn'
                    }`}
                  >
                    {claimed ? 'Claimed' : 'Claim'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ProfileModal: React.FC<{
  profile: UserProfile;
  onUpdateName: (name: string) => void;
  onClose: () => void;
}> = ({ profile, onUpdateName, onClose }) => {
  const [nameInput, setNameInput] = useState(profile.displayName);
  const av = AVATAR_LIST.find((a) => a.id === profile.selectedAvatar)?.src || AVATAR_LIST[0].src;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#052978] gold-frame p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-black text-xl text-amber-300">PLAYER PROFILE</h2>
          <button onClick={onClose} className="text-blue-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <img
            src={av}
            alt={profile.displayName}
            referrerPolicy="no-referrer"
            className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-300 shadow-lg"
          />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-300" />
              <span className="font-mono-num text-xs font-bold text-amber-200">
                Level {profile.level} · {profile.xp} XP
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={nameInput}
                maxLength={24}
                onChange={(e) => setNameInput(e.target.value)}
                className="flex-1 min-w-0 rounded-lg bg-[#03194a] border border-blue-400/40 px-2.5 py-1.5 text-sm font-bold text-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (nameInput.trim()) onUpdateName(nameInput.trim());
                  onClose();
                }}
                className="gold-btn px-3 py-1.5 rounded-lg text-xs font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-center">
          {[
            { label: 'Games Played', val: profile.gamesPlayed },
            { label: 'Total Wins', val: profile.wins },
            { label: 'Captures', val: profile.captures },
            { label: 'Sixes Rolled', val: profile.sixesRolled },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-[#03194a] border border-blue-400/25 p-3">
              <p className="font-mono-num font-black text-xl text-amber-300">{stat.val}</p>
              <p className="text-[11px] text-blue-200 font-semibold">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const PrivacyModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="w-full max-w-md rounded-2xl bg-[#052978] gold-frame p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-300" />
          <h2 className="font-display font-black text-lg text-amber-300">RAMADAN DEV Privacy Policy</h2>
        </div>
        <button onClick={onClose} className="text-blue-200 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="text-xs text-blue-100 space-y-2 leading-relaxed max-h-64 overflow-y-auto pr-1">
        <p>
          <strong>1. Guest Play:</strong> When playing as Guest, your coins, unlocked themes, and game statistics are saved locally on your device.
        </p>
        <p>
          <strong>2. Google Sign-In &amp; Cloud Save:</strong> If you choose Sign in with Google, RAMADAN DEV securely stores your player profile, currency balances, and inventory unlocks in Firebase Firestore so you can restore progress across devices using your Google account or a Change Device transfer code.
        </p>
        <p>
          <strong>3. No Audio or Microphone Access:</strong> RAMADAN DEV contains zero voice chat, zero voice rooms, and never requests microphone permissions.
        </p>
        <p>
          <strong>4. Online Multiplayer:</strong> Match state and optional text messages in online rooms are transmitted over secure WebSockets solely for active gameplay.
        </p>
      </div>
      <button onClick={onClose} className="w-full gold-btn py-2.5 rounded-xl font-display font-bold text-sm">
        Close
      </button>
    </div>
  </div>
);

export const AddCoinsQuickBadge: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Open store"
    className="w-5 h-5 rounded bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shrink-0"
  >
    <Plus className="w-3.5 h-3.5 stroke-[3]" />
  </button>
);
