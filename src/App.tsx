import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CalendarCheck,
  Crown,
  Dices,
  Globe2,
  Home,
  Inbox,
  Monitor,
  Settings,
  ShoppingCart,
  Sparkles,
  Swords,
  Trophy,
  Users,
  HeartHandshake,
} from 'lucide-react';
import {
  AVATAR_LIST,
  BOARD_THEMES,
  DICE_STYLES,
  HERO_EMBLEM_SRC,
  TOKEN_STYLES,
  TRANSLATIONS,
} from './data/catalog';
import {
  generateTransferCode,
  loadCloudSave,
  redeemTransferCode,
  saveCloudProfile,
  searchPublicFriends,
  signInWithGoogle,
  signOutGoogle,
  subscribeAuth,
  testConnection,
} from './firebase/client';
import {
  applyDiceRoll,
  applyTokenMove,
  createInitialGameState,
  CreateGamePlayerInput,
  getCurrentPlayerColor,
  pickBestAiMove,
} from './game/ludoEngine';
import {
  AppSettings,
  BoardThemeId,
  ChatMessage,
  DiceStyleId,
  GameState,
  OnlineRoomSummary,
  PlayerColor,
  TokenStyleId,
  UserProfile,
} from './types/game';
import { soundEngine } from './utils/sound';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SplashScreen, LoginScreen } from './components/SplashAndLogin';
import { GameModeModal, StartGameConfig } from './components/GameModeModal';
import { LudoBoard } from './components/LudoBoard';
import { InventoryView } from './components/InventoryView';
import { SettingsModal } from './components/SettingsModal';
import {
  AddCoinsQuickBadge,
  DailySpinModal,
  EventsView,
  InboxModal,
  OnlineWaitingLobby,
  PrivacyModal,
  ProfileModal,
  RoomSnapshot,
  SocialView,
  StoreModal,
  TournamentModal,
} from './components/SecondaryViews';

const STORAGE_PROFILE_KEY = 'ramadan_dev_profile_v1';
const STORAGE_SETTINGS_KEY = 'ramadan_dev_settings_v1';
const STORAGE_SESSION_KEY = 'ramadan_dev_has_entered_v1';

const DEFAULT_PROFILE: UserProfile = {
  uid: null,
  isGuest: true,
  displayName: 'Guest Player',
  email: null,
  coins: 2550,
  diamonds: 50,
  level: 1,
  xp: 0,
  wins: 0,
  gamesPlayed: 0,
  captures: 0,
  sixesRolled: 0,
  selectedTheme: 'default',
  selectedToken: 'pin',
  selectedDice: 'default',
  selectedAvatar: 'royal_player',
  unlockedThemes: ['default'],
  unlockedTokens: ['pin'],
  unlockedDice: ['default'],
  unlockedAvatars: ['royal_player'],
  dailyClaimedAt: '',
  claimedQuests: [],
  claimedInbox: [],
  friends: [],
};

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  musicEnabled: false,
  vibrationEnabled: true,
  notificationsEnabled: true,
  searchPrivacy: 'Public',
  language: 'en',
};

function loadInitialProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function loadInitialSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

type AppScreen = 'splash' | 'login' | 'main' | 'lobby' | 'playing';
type MainTab = 'home' | 'event' | 'inventory' | 'social';

function RamadanDevApp() {
  const [screen, setScreen] = useState<AppScreen>('splash');
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [inventoryStartTab, setInventoryStartTab] = useState<'dice' | 'tokens' | 'themes' | 'avatars' | 'sound'>('themes');

  const [profile, setProfile] = useState<UserProfile>(loadInitialProfile);
  const [settings, setSettings] = useState<AppSettings>(loadInitialSettings);

  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Modals
  const [modeSelectionFor, setModeSelectionFor] = useState<StartGameConfig['playMode'] | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSpin, setShowSpin] = useState(false);
  const [showTournament, setShowTournament] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Local Game State
  const [localGameState, setLocalGameState] = useState<GameState | null>(null);
  const [lastLocalConfig, setLastLocalConfig] = useState<StartGameConfig | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const rewardGrantedForGameRef = useRef<string | null>(null);

  // Real-time WebSocket Online State
  const wsRef = useRef<WebSocket | null>(null);
  const [wsClientId, setWsClientId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [publicRooms, setPublicRooms] = useState<OnlineRoomSummary[]>([]);
  const [activeRoom, setActiveRoom] = useState<(RoomSnapshot & { gameState: GameState | null }) | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Configure sound engine whenever settings change
  useEffect(() => {
    soundEngine.configure({
      sound: settings.soundEnabled,
      music: settings.musicEnabled,
      vibration: settings.vibrationEnabled,
    });
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [settings]);

  // Persist profile locally & sync to Firestore if Google-authenticated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore storage errors
    }
  }, [profile]);

  // Test Firestore connection + subscribe Firebase Auth
  useEffect(() => {
    testConnection();
    const unsub = subscribeAuth(async (user) => {
      if (!user) return;
      try {
        const cloud = await loadCloudSave(user.uid);
        if (cloud) {
          setProfile((prev) => ({
            ...prev,
            ...cloud,
            uid: user.uid,
            isGuest: false,
            email: user.email || prev.email,
          }));
        } else {
          // First time linking Google: reward +100 diamonds & save
          setProfile((prev) => {
            const upgraded: UserProfile = {
              ...prev,
              uid: user.uid,
              isGuest: false,
              email: user.email || null,
              displayName: prev.isGuest && user.displayName ? user.displayName.slice(0, 24) : prev.displayName,
              diamonds: prev.isGuest ? prev.diamonds + 100 : prev.diamonds,
            };
            saveCloudProfile(upgraded, settings.searchPrivacy === 'Public').catch(() => {});
            return upgraded;
          });
        }
      } catch {
        // Ignore transient sync error
      }
    });
    return () => unsub();
  }, [settings.searchPrivacy]);

  // Helper to update profile and sync to cloud if authenticated
  const updateProfile = useCallback(
    (updater: (prev: UserProfile) => UserProfile) => {
      setProfile((prev) => {
        const next = updater(prev);
        if (!next.isGuest && next.uid) {
          saveCloudProfile(next, settings.searchPrivacy === 'Public').catch(() => {});
        }
        return next;
      });
    },
    [settings.searchPrivacy]
  );

  // Connect WebSocket for live player count, matchmaking, Team Up & Friends rooms
  useEffect(() => {
    let closedByCleanup = false;
    let reconnectTimer: number | null = null;

    const connectWs = () => {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'lobby:subscribe',
            name: profile.displayName,
            avatarId: profile.selectedAvatar,
          })
        );
      };

      ws.onmessage = (ev) => {
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(String(ev.data));
        } catch {
          return;
        }
        if (msg.type === 'session:init') {
          setWsClientId(String(msg.clientId));
        } else if (msg.type === 'lobby:stats') {
          setOnlineCount(Number(msg.onlineCount) || 1);
          setPublicRooms((msg.publicRooms as OnlineRoomSummary[]) || []);
        } else if (msg.type === 'room:update') {
          const room = msg.room as RoomSnapshot & { gameState: GameState | null };
          setActiveRoom(room);
          if (room.status === 'WAITING') {
            setScreen('lobby');
          } else if (room.status === 'PLAYING' || room.status === 'FINISHED') {
            setScreen('playing');
          }
        } else if (msg.type === 'room:left') {
          setActiveRoom(null);
          setScreen('main');
        } else if (msg.type === 'room:error') {
          showToast(String(msg.message || 'Room error'));
        }
      };

      ws.onclose = () => {
        if (!closedByCleanup) {
          reconnectTimer = window.setTimeout(connectWs, 2500);
        }
      };
    };

    connectWs();
    return () => {
      closedByCleanup = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [showToast]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendWs = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          ...payload,
          name: profile.displayName,
          avatarId: profile.selectedAvatar,
        })
      );
      return true;
    }
    showToast('Reconnecting to multiplayer server...');
    return false;
  }, [profile.displayName, profile.selectedAvatar, showToast]);

  // Splash completion handler
  const handleSplashComplete = useCallback(() => {
    const hasEntered = localStorage.getItem(STORAGE_SESSION_KEY) === 'true';
    setScreen(hasEntered ? 'main' : 'login');
  }, []);

  const handleGuestLogin = () => {
    localStorage.setItem(STORAGE_SESSION_KEY, 'true');
    setScreen('main');
  };

  const handleGoogleLogin = async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const user = await signInWithGoogle();
      localStorage.setItem(STORAGE_SESSION_KEY, 'true');
      const cloud = await loadCloudSave(user.uid);
      if (cloud) {
        setProfile((prev) => ({
          ...prev,
          ...cloud,
          uid: user.uid,
          isGuest: false,
          email: user.email || null,
        }));
        showToast('Cloud save restored!');
      } else {
        const nextProf: UserProfile = {
          ...profile,
          uid: user.uid,
          isGuest: false,
          email: user.email || null,
          displayName: user.displayName ? user.displayName.slice(0, 24) : profile.displayName,
          diamonds: profile.diamonds + 100,
        };
        setProfile(nextProf);
        await saveCloudProfile(nextProf, settings.searchPrivacy === 'Public');
        showToast('Google account linked! +100 Diamonds');
      }
      setScreen('main');
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : 'Google Sign-In failed or was cancelled.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleRedeemTransfer = async (code: string) => {
    const data = await redeemTransferCode(code);
    if (!data) {
      throw new Error('Transfer code not found.');
    }
    updateProfile((prev) => ({ ...prev, ...data }));
    showToast('Device progress restored!');
  };

  // Start Local or Online Match from Mode Selection
  const handleStartFromConfig = (cfg: StartGameConfig) => {
    setModeSelectionFor(null);
    rewardGrantedForGameRef.current = null;

    if (cfg.playMode === 'online' || cfg.playMode === 'team_up') {
      if (cfg.stakeCoins > 0 && profile.coins < cfg.stakeCoins) {
        showToast('Not enough coins for this stake! Switching to Free match.');
      }
      sendWs({
        type: 'room:matchmake',
        gameType: cfg.gameType,
        playMode: cfg.playMode,
        maxPlayers: cfg.playerCount,
        stakeCoins: profile.coins >= cfg.stakeCoins ? cfg.stakeCoins : 0,
      });
      return;
    }

    if (cfg.playMode === 'friends') {
      if (cfg.friendAction === 'join' && cfg.joinCode) {
        sendWs({ type: 'room:join', roomId: cfg.joinCode });
      } else {
        sendWs({
          type: 'room:create',
          isPrivate: true,
          gameType: cfg.gameType,
          playMode: 'friends',
          maxPlayers: cfg.playerCount,
          stakeCoins: 0,
        });
      }
      return;
    }

    // Local Game (Computer, Pass N Play, Tournament)
    const seatOrder: PlayerColor[] =
      cfg.playerCount === 2
        ? ['blue', 'green']
        : cfg.playerCount === 3
        ? ['blue', 'red', 'green']
        : ['blue', 'red', 'green', 'yellow'];

    // Ensure humanColor is included for Computer mode
    const colors =
      cfg.playMode === 'computer' && !seatOrder.includes(cfg.humanColor)
        ? [cfg.humanColor, ...seatOrder.slice(0, cfg.playerCount - 1)]
        : seatOrder;

    const botNames = ['Orion Bot', 'Atlas Bot', 'Nova Bot', 'Zenith Bot'];
    const botAvatars = ['golden_knight', 'desert_explorer', 'astro_scholar', 'royal_player'];

    const playerConfigs: CreateGamePlayerInput[] = colors.map((c, idx) => {
      const isHuman =
        cfg.playMode === 'pass_n_play'
          ? true
          : c === (cfg.playMode === 'computer' || cfg.playMode === 'tournament' ? cfg.humanColor : 'blue');
      return {
        color: c,
        name: isHuman
          ? cfg.playMode === 'pass_n_play'
            ? cfg.playerNames[c] || `Player ${idx + 1}`
            : profile.displayName
          : botNames[idx % botNames.length],
        avatarId: isHuman ? profile.selectedAvatar : botAvatars[idx % botAvatars.length],
        isAI: !isHuman,
      };
    });

    setLastLocalConfig(cfg);
    setLocalGameState(
      createInitialGameState({
        id: `local_${Date.now()}`,
        gameType: cfg.gameType,
        playMode: cfg.playMode,
        playerConfigs,
        stakeCoins: cfg.playMode === 'tournament' ? 2500 : 0,
      })
    );
    setActiveRoom(null);
    setScreen('playing');
  };

  // Current active GameState (either Online Room or Local)
  const currentGameState = activeRoom?.gameState || localGameState;

  // Reward progression once when a match hits GAME_OVER
  useEffect(() => {
    if (!currentGameState || currentGameState.phase !== 'GAME_OVER') return;
    if (rewardGrantedForGameRef.current === currentGameState.id) return;
    rewardGrantedForGameRef.current = currentGameState.id;

    soundEngine.playWinFanfare();
    const winner = currentGameState.winnerColor;
    const isOnline = Boolean(activeRoom);
    let playerWon = false;

    if (isOnline && wsClientId) {
      const mySeat = currentGameState.activeOrder.find(
        (c) => currentGameState.players[c]?.clientId === wsClientId
      );
      if (mySeat) {
        if (currentGameState.gameType === 'team_up') {
          playerWon =
            currentGameState.players[mySeat]?.teamId === currentGameState.winningTeam;
        } else {
          playerWon = mySeat === winner;
        }
      }
    } else if (lastLocalConfig) {
      if (lastLocalConfig.playMode === 'pass_n_play') {
        playerWon = true;
      } else {
        const myColor = lastLocalConfig.humanColor;
        if (currentGameState.gameType === 'team_up') {
          playerWon =
            currentGameState.players[myColor]?.teamId === currentGameState.winningTeam;
        } else {
          playerWon = myColor === winner;
        }
      }
    }

    const coinBonus = playerWon
      ? currentGameState.playMode === 'tournament'
        ? 2500
        : 500
      : 100;
    const diamondBonus = playerWon
      ? currentGameState.playMode === 'tournament'
        ? 20
        : 5
      : 0;
    const xpGain = playerWon ? 120 : 45;

    updateProfile((prev) => {
      const nextXp = prev.xp + xpGain;
      const nextLevel = 1 + Math.floor(nextXp / 250);
      return {
        ...prev,
        coins: prev.coins + coinBonus,
        diamonds: prev.diamonds + diamondBonus,
        xp: nextXp,
        level: nextLevel,
        gamesPlayed: prev.gamesPlayed + 1,
        wins: playerWon ? prev.wins + 1 : prev.wins,
      };
    });
  }, [currentGameState, activeRoom, wsClientId, lastLocalConfig, updateProfile]);

  // Local AI Turn Loop
  useEffect(() => {
    if (screen !== 'playing' || activeRoom || !localGameState || localGameState.phase === 'GAME_OVER') {
      return;
    }
    const curColor = getCurrentPlayerColor(localGameState);
    const curPlayer = localGameState.players[curColor];
    if (!curPlayer || !curPlayer.isAI) return;

    const timer = window.setTimeout(() => {
      if (localGameState.phase === 'WAIT_ROLL') {
        soundEngine.playDiceRoll();
        setIsRolling(true);
        window.setTimeout(() => {
          setIsRolling(false);
          const rolled = Math.floor(Math.random() * 6) + 1;
          setLocalGameState((prev) => (prev ? applyDiceRoll(prev, rolled) : prev));
        }, 300);
      } else if (localGameState.phase === 'WAIT_MOVE') {
        const tokId = pickBestAiMove(localGameState, curColor);
        const outcome = applyTokenMove(localGameState, tokId);
        if (outcome.captured) soundEngine.playCapture();
        else if (outcome.reachedHome) soundEngine.playHomeFanfare();
        else soundEngine.playTokenHop();
        setLocalGameState(outcome.nextState);
      }
    }, 580);

    return () => window.clearTimeout(timer);
  }, [screen, activeRoom, localGameState]);

  // Local / Online Roll Dice Handler
  const handleRollDice = () => {
    if (isRolling) return;
    if (activeRoom) {
      soundEngine.playDiceRoll();
      setIsRolling(true);
      window.setTimeout(() => setIsRolling(false), 320);
      sendWs({ type: 'game:roll' });
      return;
    }
    if (!localGameState || localGameState.phase !== 'WAIT_ROLL') return;

    soundEngine.playDiceRoll();
    setIsRolling(true);
    window.setTimeout(() => {
      setIsRolling(false);
      const rolled = Math.floor(Math.random() * 6) + 1;
      if (rolled === 6) {
        updateProfile((p) => ({ ...p, sixesRolled: p.sixesRolled + 1 }));
      }
      setLocalGameState((prev) => (prev ? applyDiceRoll(prev, rolled) : prev));
    }, 320);
  };

  // Local / Online Token Move Handler
  const handleSelectToken = (tokenId: number) => {
    if (activeRoom) {
      soundEngine.playTokenHop();
      sendWs({ type: 'game:move', tokenId });
      return;
    }
    if (!localGameState || localGameState.phase !== 'WAIT_MOVE') return;
    const outcome = applyTokenMove(localGameState, tokenId);
    if (outcome.captured) {
      soundEngine.playCapture();
      updateProfile((p) => ({ ...p, captures: p.captures + 1 }));
    } else if (outcome.reachedHome) {
      soundEngine.playHomeFanfare();
    } else {
      soundEngine.playTokenHop();
    }
    setLocalGameState(outcome.nextState);
  };

  // Inventory Unlock / Equip Handlers
  const handleThemeSelectOrUnlock = (id: BoardThemeId) => {
    if (profile.unlockedThemes.includes(id)) {
      updateProfile((p) => ({ ...p, selectedTheme: id }));
      showToast('Board theme equipped!');
      return;
    }
    const meta = BOARD_THEMES.find((t) => t.id === id);
    if (!meta) return;
    if (meta.priceDiamonds > 0) {
      if (profile.diamonds < meta.priceDiamonds) {
        showToast(`Need ${meta.priceDiamonds} Diamonds to unlock ${meta.name}.`);
        return;
      }
      updateProfile((p) => ({
        ...p,
        diamonds: p.diamonds - meta.priceDiamonds,
        unlockedThemes: [...p.unlockedThemes, id],
        selectedTheme: id,
      }));
    } else {
      if (profile.coins < meta.priceCoins) {
        showToast(`Need ${meta.priceCoins.toLocaleString()} Coins to unlock ${meta.name}.`);
        return;
      }
      updateProfile((p) => ({
        ...p,
        coins: p.coins - meta.priceCoins,
        unlockedThemes: [...p.unlockedThemes, id],
        selectedTheme: id,
      }));
    }
    soundEngine.playHomeFanfare();
    showToast(`${meta.name} theme unlocked & equipped!`);
  };

  const handleTokenSelectOrUnlock = (id: TokenStyleId) => {
    if (profile.unlockedTokens.includes(id)) {
      updateProfile((p) => ({ ...p, selectedToken: id }));
      showToast('Token style equipped!');
      return;
    }
    const meta = TOKEN_STYLES.find((t) => t.id === id);
    if (!meta) return;
    if (meta.priceDiamonds > 0) {
      if (profile.diamonds < meta.priceDiamonds) {
        showToast(`Need ${meta.priceDiamonds} Diamonds.`);
        return;
      }
      updateProfile((p) => ({
        ...p,
        diamonds: p.diamonds - meta.priceDiamonds,
        unlockedTokens: [...p.unlockedTokens, id],
        selectedToken: id,
      }));
    } else {
      if (profile.coins < meta.priceCoins) {
        showToast(`Need ${meta.priceCoins.toLocaleString()} Coins.`);
        return;
      }
      updateProfile((p) => ({
        ...p,
        coins: p.coins - meta.priceCoins,
        unlockedTokens: [...p.unlockedTokens, id],
        selectedToken: id,
      }));
    }
    soundEngine.playHomeFanfare();
    showToast(`${meta.name} unlocked!`);
  };

  const handleDiceSelectOrUnlock = (id: DiceStyleId) => {
    if (profile.unlockedDice.includes(id)) {
      updateProfile((p) => ({ ...p, selectedDice: id }));
      showToast('Dice equipped!');
      return;
    }
    const meta = DICE_STYLES.find((d) => d.id === id);
    if (!meta) return;
    if (meta.priceDiamonds > 0) {
      if (profile.diamonds < meta.priceDiamonds) {
        showToast(`Need ${meta.priceDiamonds} Diamonds.`);
        return;
      }
      updateProfile((p) => ({
        ...p,
        diamonds: p.diamonds - meta.priceDiamonds,
        unlockedDice: [...p.unlockedDice, id],
        selectedDice: id,
      }));
    } else {
      if (profile.coins < meta.priceCoins) {
        showToast(`Need ${meta.priceCoins.toLocaleString()} Coins.`);
        return;
      }
      updateProfile((p) => ({
        ...p,
        coins: p.coins - meta.priceCoins,
        unlockedDice: [...p.unlockedDice, id],
        selectedDice: id,
      }));
    }
    soundEngine.playHomeFanfare();
    showToast(`${meta.name} dice unlocked!`);
  };

  const handleAvatarSelectOrUnlock = (id: string) => {
    if (profile.unlockedAvatars.includes(id)) {
      updateProfile((p) => ({ ...p, selectedAvatar: id }));
      showToast('Avatar equipped!');
      return;
    }
    const meta = AVATAR_LIST.find((a) => a.id === id);
    if (!meta) return;
    if (meta.priceDiamonds > 0) {
      if (profile.diamonds < meta.priceDiamonds) {
        showToast(`Need ${meta.priceDiamonds} Diamonds.`);
        return;
      }
      updateProfile((p) => ({
        ...p,
        diamonds: p.diamonds - meta.priceDiamonds,
        unlockedAvatars: [...p.unlockedAvatars, id],
        selectedAvatar: id,
      }));
    } else {
      if (profile.coins < meta.priceCoins) {
        showToast(`Need ${meta.priceCoins.toLocaleString()} Coins.`);
        return;
      }
      updateProfile((p) => ({
        ...p,
        coins: p.coins - meta.priceCoins,
        unlockedAvatars: [...p.unlockedAvatars, id],
        selectedAvatar: id,
      }));
    }
    soundEngine.playHomeFanfare();
    showToast(`${meta.name} unlocked!`);
  };

  const currentAvatarSrc =
    AVATAR_LIST.find((a) => a.id === profile.selectedAvatar)?.src || AVATAR_LIST[0].src;
  const t = TRANSLATIONS[settings.language];
  const unreadInboxCount = 2 - profile.claimedInbox.length;

  return (
    <ErrorBoundary>
      {screen === 'splash' && <SplashScreen onComplete={handleSplashComplete} />}

      {screen === 'login' && (
        <>
          <LoginScreen
            onGuestLogin={handleGuestLogin}
            onGoogleLogin={handleGoogleLogin}
            onOpenTransfer={handleRedeemTransfer}
            onOpenPrivacy={() => setShowPrivacy(true)}
            authBusy={authBusy}
            authError={authError}
          />
          {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
        </>
      )}

      {screen === 'lobby' && activeRoom && wsClientId && (
        <OnlineWaitingLobby
          room={activeRoom}
          localClientId={wsClientId}
          onStartMatch={(fillWithBots) => sendWs({ type: 'room:start', fillWithBots })}
          onSendChat={(text) => sendWs({ type: 'room:chat', text })}
          onLeave={() => sendWs({ type: 'room:leave' })}
        />
      )}

      {screen === 'playing' && currentGameState && (
        <LudoBoard
          gameState={currentGameState}
          themeId={profile.selectedTheme}
          tokenStyleId={profile.selectedToken}
          diceStyleId={profile.selectedDice}
          settings={settings}
          localClientId={wsClientId}
          isRolling={isRolling}
          chatMessages={activeRoom?.chat as ChatMessage[] | undefined}
          onRollDice={handleRollDice}
          onSelectToken={handleSelectToken}
          onSendChat={
            activeRoom ? (text) => sendWs({ type: 'room:chat', text }) : undefined
          }
          onToggleSetting={(key) =>
            setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
          }
          onQuitGame={() => {
            if (activeRoom) {
              sendWs({ type: 'room:leave' });
              setActiveRoom(null);
            }
            setLocalGameState(null);
            setScreen('main');
          }}
          onPlayAgain={() => {
            if (activeRoom) {
              sendWs({ type: 'room:leave' });
              setActiveRoom(null);
              setScreen('main');
            } else if (lastLocalConfig) {
              handleStartFromConfig(lastLocalConfig);
            }
          }}
        />
      )}

      {screen === 'main' && (
        <div className="min-h-screen w-full ludo-bg-pattern flex flex-col">
          {/* Top Bar (matching Reference Screenshot 10) */}
          <header className="sticky top-0 z-30 bg-[#031c54]/90 backdrop-blur-md border-b border-amber-400/35 px-2.5 sm:px-4 py-2">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
              {/* Profile Avatar + Level + Name */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setShowProfile(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-[#072f87] border border-amber-400/60 pr-2.5 pl-1 py-1 hover:bg-[#0a3ca8] transition-colors shrink-0"
              >
                <div className="relative">
                  <img
                    src={currentAvatarSrc}
                    alt={profile.displayName}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-lg object-cover border border-amber-300"
                  />
                  <span className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-amber-400 text-[9px] font-mono-num font-black text-slate-950 flex items-center justify-center border border-amber-100">
                    {profile.level}
                  </span>
                </div>
                <span className="hidden xs:inline sm:inline font-display font-bold text-xs text-white max-w-[80px] truncate">
                  {profile.displayName}
                </span>
              </button>

              {/* Settings & Inbox */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setShowSettings(true);
                  }}
                  aria-label="Settings"
                  className="w-9 h-9 rounded-xl bg-[#072f87] border border-blue-400/40 flex items-center justify-center text-blue-100 hover:text-amber-300"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setShowInbox(true);
                  }}
                  aria-label="Inbox"
                  className="relative w-9 h-9 rounded-xl bg-[#072f87] border border-blue-400/40 flex items-center justify-center text-amber-300 hover:text-amber-200"
                >
                  <Inbox className="w-5 h-5" />
                  {unreadInboxCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center">
                      {unreadInboxCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Diamond & Coin Balances + Store */}
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex items-center gap-1.5 rounded-lg bg-[#021236] border border-amber-400/50 px-2 py-1">
                  <span className="text-xs" aria-hidden="true">💎</span>
                  <span className="font-mono-num font-bold text-xs text-cyan-200">
                    {profile.diamonds}
                  </span>
                  <AddCoinsQuickBadge onClick={() => setShowStore(true)} />
                </div>

                <div className="flex items-center gap-1.5 rounded-lg bg-[#021236] border border-amber-400/50 px-2 py-1">
                  <span className="text-xs" aria-hidden="true">🪙</span>
                  <span className="font-mono-num font-bold text-xs text-amber-300">
                    {profile.coins.toLocaleString()}
                  </span>
                  <AddCoinsQuickBadge onClick={() => setShowStore(true)} />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setShowStore(true);
                  }}
                  aria-label="Store"
                  className="hidden sm:flex w-9 h-9 rounded-xl gold-btn items-center justify-center shrink-0"
                >
                  <ShoppingCart className="w-4 h-4 text-slate-900" />
                </button>
              </div>
            </div>
          </header>

          {/* Main Scrollable Content */}
          <main className="flex-1 flex flex-col">
            {activeTab === 'home' && (
              <div className="w-full max-w-xl mx-auto px-3 pt-4 pb-24 flex flex-col items-center space-y-5">
                {/* Original RAMADAN DEV Centerpiece Emblem */}
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="relative w-56 h-40 sm:w-64 sm:h-46 rounded-2xl overflow-hidden gold-frame shadow-2xl">
                    <img
                      src={HERO_EMBLEM_SRC}
                      alt="RAMADAN DEV Classic Ludo Emblem"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-300" />
                    <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 drop-shadow-[0_2px_0_rgba(120,53,15,0.85)]">
                      RAMADAN DEV
                    </h1>
                  </div>
                </div>

                {/* Primary 3 Mode Buttons: ONLINE, TEAM UP, FRIENDS (Zero Mic Icon!) */}
                <div className="w-full grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setModeSelectionFor('online');
                    }}
                    className="group flex flex-col items-center"
                  >
                    <div className="w-full rounded-2xl royal-btn p-2.5 flex flex-col items-center gap-2 group-hover:brightness-110 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-[#04215e] border border-amber-400/50 flex items-center justify-center">
                        <Globe2 className="w-7 h-7 text-emerald-400" />
                      </div>
                      <span className="w-full py-1 rounded-lg bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 font-display font-black text-xs sm:text-sm tracking-wide shadow">
                        {t.online}
                      </span>
                    </div>
                    <span className="mt-1 text-[11px] font-mono-num font-semibold text-emerald-300">
                      Live: {onlineCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setModeSelectionFor('team_up');
                    }}
                    className="group flex flex-col items-center"
                  >
                    <div className="w-full rounded-2xl royal-btn p-2.5 flex flex-col items-center gap-2 group-hover:brightness-110 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-[#04215e] border border-amber-400/50 flex items-center justify-center">
                        <Swords className="w-7 h-7 text-amber-300" />
                      </div>
                      <span className="w-full py-1 rounded-lg bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 font-display font-black text-xs sm:text-sm tracking-wide shadow">
                        {t.teamUp}
                      </span>
                    </div>
                    <span className="mt-1 text-[11px] font-semibold text-blue-200">2v2 Match</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setModeSelectionFor('friends');
                    }}
                    className="group flex flex-col items-center"
                  >
                    <div className="w-full rounded-2xl royal-btn p-2.5 flex flex-col items-center gap-2 group-hover:brightness-110 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-[#04215e] border border-amber-400/50 flex items-center justify-center">
                        <HeartHandshake className="w-7 h-7 text-rose-400" />
                      </div>
                      <span className="w-full py-1 rounded-lg bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 font-display font-black text-xs sm:text-sm tracking-wide shadow">
                        {t.friends}
                      </span>
                    </div>
                    <span className="mt-1 text-[11px] font-semibold text-blue-200">Room Code</span>
                  </button>
                </div>

                {/* Secondary 2 Mode Buttons: COMPUTER & PASS N PLAY */}
                <div className="w-full grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setModeSelectionFor('computer');
                    }}
                    className="rounded-2xl royal-btn p-3 flex flex-col items-center gap-2 hover:brightness-110 transition-all"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#04215e] border border-amber-400/50 flex items-center justify-center">
                      <Monitor className="w-6 h-6 text-amber-300" />
                    </div>
                    <span className="font-display font-black text-sm tracking-wide text-white">
                      {t.computer}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setModeSelectionFor('pass_n_play');
                    }}
                    className="rounded-2xl royal-btn p-3 flex flex-col items-center gap-2 hover:brightness-110 transition-all"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#04215e] border border-amber-400/50 flex items-center justify-center">
                      <Users className="w-6 h-6 text-amber-300" />
                    </div>
                    <span className="font-display font-black text-sm tracking-wide text-white">
                      {t.passNPlay}
                    </span>
                  </button>
                </div>

                {/* Tournament, Events & Lucky Spin Strip */}
                <div className="w-full grid grid-cols-3 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setActiveTab('event');
                    }}
                    className="rounded-2xl bg-[#062d7d] border-2 border-amber-400/70 p-3 flex flex-col items-center gap-1 hover:bg-[#0b3e9f] transition-colors"
                  >
                    <CalendarCheck className="w-6 h-6 text-emerald-300" />
                    <span className="font-display font-bold text-xs text-white">EVENTS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setShowTournament(true);
                    }}
                    className="rounded-2xl bg-gradient-to-b from-[#0e4bc0] to-[#05266c] gold-frame p-3 flex flex-col items-center gap-1 hover:brightness-110 transition-all"
                  >
                    <Trophy className="w-7 h-7 text-amber-300" />
                    <span className="font-display font-black text-xs text-amber-300">
                      {t.tournament}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setShowSpin(true);
                    }}
                    className="rounded-2xl bg-[#062d7d] border-2 border-amber-400/70 p-3 flex flex-col items-center gap-1 hover:bg-[#0b3e9f] transition-colors"
                  >
                    <Sparkles className="w-6 h-6 text-amber-300" />
                    <span className="font-display font-bold text-xs text-white">SPIN</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'event' && (
              <EventsView
                profile={profile}
                onClaimDaily={() => {
                  const today = new Date().toISOString().slice(0, 10);
                  updateProfile((p) => ({
                    ...p,
                    dailyClaimedAt: today,
                    coins: p.coins + 500,
                    diamonds: p.diamonds + 10,
                  }));
                  showToast('+500 Coins & +10 Diamonds claimed!');
                }}
                onClaimQuest={(qid, coins, diamonds) => {
                  updateProfile((p) => ({
                    ...p,
                    claimedQuests: [...p.claimedQuests, qid],
                    coins: p.coins + coins,
                    diamonds: p.diamonds + diamonds,
                  }));
                  showToast(`Quest reward claimed: +${coins} Coins!`);
                }}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryView
                profile={profile}
                settings={settings}
                initialSubTab={inventoryStartTab}
                onSelectOrUnlockTheme={handleThemeSelectOrUnlock}
                onSelectOrUnlockToken={handleTokenSelectOrUnlock}
                onSelectOrUnlockDice={handleDiceSelectOrUnlock}
                onSelectOrUnlockAvatar={handleAvatarSelectOrUnlock}
                onToggleSetting={(key) =>
                  setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
                }
              />
            )}

            {activeTab === 'social' && (
              <SocialView
                profile={profile}
                onSearchPlayers={searchPublicFriends}
                onAddFriend={(f) => {
                  updateProfile((p) => ({
                    ...p,
                    friends: [...p.friends, f],
                  }));
                  showToast(`${f.displayName} added to friends!`);
                }}
                onCreateFriendRoom={() =>
                  sendWs({
                    type: 'room:create',
                    isPrivate: true,
                    gameType: 'classic',
                    playMode: 'friends',
                    maxPlayers: 4,
                    stakeCoins: 0,
                  })
                }
                onJoinFriendRoom={(code) => sendWs({ type: 'room:join', roomId: code })}
              />
            )}
          </main>

          {/* Bottom Navigation Bar (4 Tabs: HOME, EVENT, INVENTORY, SOCIAL — ZERO VOICE ROOM) */}
          <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#03194a]/95 backdrop-blur-md border-t-2 border-amber-400/50">
            <div className="max-w-2xl mx-auto grid grid-cols-4 h-16">
              {(
                [
                  { id: 'home', label: t.home, icon: Home },
                  { id: 'event', label: t.events, icon: CalendarCheck },
                  { id: 'inventory', label: t.inventory, icon: Dices },
                  { id: 'social', label: t.social, icon: Users },
                ] as const
              ).map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setActiveTab(id);
                    }}
                    className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                      active
                        ? 'bg-[#0e49b8] text-amber-300 border-t-2 border-amber-300'
                        : 'text-blue-200 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[11px] font-display font-bold tracking-wide">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Modals */}
          {modeSelectionFor && (
            <GameModeModal
              initialMode={modeSelectionFor}
              selectedToken={profile.selectedToken}
              unlockedTokens={profile.unlockedTokens}
              playerName={profile.displayName}
              language={settings.language}
              publicRooms={publicRooms}
              onSelectToken={(id) => updateProfile((p) => ({ ...p, selectedToken: id }))}
              onOpenThemes={() => {
                setModeSelectionFor(null);
                setInventoryStartTab('themes');
                setActiveTab('inventory');
              }}
              onBack={() => setModeSelectionFor(null)}
              onStart={handleStartFromConfig}
              onJoinRoomDirect={(roomId) => {
                setModeSelectionFor(null);
                sendWs({ type: 'room:join', roomId });
              }}
            />
          )}

          {showSettings && (
            <SettingsModal
              settings={settings}
              profile={profile}
              onUpdateSettings={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
              onOpenThemes={() => {
                setInventoryStartTab('themes');
                setActiveTab('inventory');
              }}
              onOpenStore={() => setShowStore(true)}
              onOpenPrivacy={() => setShowPrivacy(true)}
              onGoogleLogin={handleGoogleLogin}
              onSaveCloudNow={async () => {
                await saveCloudProfile(profile, settings.searchPrivacy === 'Public');
              }}
              onGenerateTransferCode={() => generateTransferCode(profile)}
              onRedeemTransferCode={handleRedeemTransfer}
              onSignOut={async () => {
                await signOutGoogle();
                setProfile((p) => ({ ...p, uid: null, isGuest: true, email: null }));
                setShowSettings(false);
                setScreen('login');
              }}
              onClose={() => setShowSettings(false)}
            />
          )}

          {showStore && (
            <StoreModal
              profile={profile}
              onExchangeDiamonds={(dCost, cGain) => {
                updateProfile((p) => ({
                  ...p,
                  diamonds: p.diamonds - dCost,
                  coins: p.coins + cGain,
                }));
                showToast(`Added +${cGain.toLocaleString()} Coins!`);
              }}
              onClose={() => setShowStore(false)}
            />
          )}

          {showInbox && (
            <InboxModal
              profile={profile}
              onClaimInbox={(id, coins, diamonds) => {
                updateProfile((p) => ({
                  ...p,
                  claimedInbox: [...p.claimedInbox, id],
                  coins: p.coins + coins,
                  diamonds: p.diamonds + diamonds,
                }));
                showToast(`Claimed +${coins} Coins & +${diamonds} Diamonds!`);
              }}
              onClose={() => setShowInbox(false)}
            />
          )}

          {showProfile && (
            <ProfileModal
              profile={profile}
              onUpdateName={(name) => {
                updateProfile((p) => ({ ...p, displayName: name }));
                showToast('Profile name updated!');
              }}
              onClose={() => setShowProfile(false)}
            />
          )}

          {showSpin && (
            <DailySpinModal
              onReward={(coins, diamonds) =>
                updateProfile((p) => ({
                  ...p,
                  coins: p.coins + coins,
                  diamonds: p.diamonds + diamonds,
                }))
              }
              onClose={() => setShowSpin(false)}
            />
          )}

          {showTournament && (
            <TournamentModal
              wins={profile.wins}
              onStartTournamentMatch={() => {
                setShowTournament(false);
                handleStartFromConfig({
                  playMode: 'tournament',
                  gameType: 'quick',
                  playerCount: 4,
                  humanColor: 'blue',
                  playerNames: {
                    blue: profile.displayName,
                    red: 'Champion Bot',
                    green: 'Master Bot',
                    yellow: 'Grand Bot',
                  },
                  stakeCoins: 2500,
                });
              }}
              onClose={() => setShowTournament(false)}
            />
          )}

          {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
        </div>
      )}

      {/* Non-intrusive Toast Banner */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full bg-[#041d54] gold-frame text-xs font-display font-bold text-amber-200 shadow-2xl whitespace-nowrap">
          {toast}
        </div>
      )}
    </ErrorBoundary>
  );
}

export default RamadanDevApp;
