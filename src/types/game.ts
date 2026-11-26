export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export type GameType = 'classic' | 'team_up' | 'quick';

export type PlayMode = 'online' | 'team_up' | 'friends' | 'computer' | 'pass_n_play' | 'tournament';

export type LanguageCode = 'en' | 'ar' | 'es' | 'fr' | 'hi';

export type BoardThemeId =
  | 'default'
  | 'nature'
  | 'egypt'
  | 'disco'
  | 'marble'
  | 'candy'
  | 'christmas'
  | 'penguin'
  | 'battle';

export type TokenStyleId = 'pin' | 'classic' | 'star' | 'hammer' | 'crown';

export type DiceStyleId =
  | 'default'
  | 'super_king'
  | 'dragon'
  | 'firework'
  | 'penguin'
  | 'mummy'
  | 'chocolate'
  | 'peace';

export interface TokenState {
  id: number;
  /** -1 = inside yard, 0..50 = outer track steps from player's start, 51..55 = colored home column, 56 = reached center goal */
  step: number;
}

export interface PlayerState {
  color: PlayerColor;
  name: string;
  avatarId: string;
  isAI: boolean;
  isRemote?: boolean;
  clientId?: string;
  teamId?: 1 | 2;
  tokens: TokenState[];
  finishedOrder: number | null; // 1 = 1st place, etc.
  hasCaptured: boolean;
}

export type TurnPhase = 'WAIT_ROLL' | 'ROLLING' | 'WAIT_MOVE' | 'GAME_OVER';

export interface GameState {
  id: string;
  gameType: GameType;
  playMode: PlayMode;
  players: Record<PlayerColor, PlayerState | null>;
  activeOrder: PlayerColor[];
  currentTurnIndex: number;
  diceValue: number | null;
  consecutiveSixes: number;
  phase: TurnPhase;
  movableTokens: number[];
  winnerColor: PlayerColor | null;
  winningTeam: 1 | 2 | null;
  rankings: PlayerColor[];
  lastEvent: string;
  turnStartedAt: number;
  stakeCoins: number;
}

export interface UserProfile {
  uid: string | null; // null when Guest
  isGuest: boolean;
  displayName: string;
  email: string | null;
  coins: number;
  diamonds: number;
  level: number;
  xp: number;
  wins: number;
  gamesPlayed: number;
  captures: number;
  sixesRolled: number;
  selectedTheme: BoardThemeId;
  selectedToken: TokenStyleId;
  selectedDice: DiceStyleId;
  selectedAvatar: string;
  unlockedThemes: BoardThemeId[];
  unlockedTokens: TokenStyleId[];
  unlockedDice: DiceStyleId[];
  unlockedAvatars: string[];
  dailyClaimedAt: string;
  claimedQuests: string[];
  claimedInbox: string[];
  friends: { uid: string; displayName: string; avatarId: string; level: number; wins: number }[];
  createdAt?: string;
}

export interface AppSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;
  searchPrivacy: 'Public' | 'Friends';
  language: LanguageCode;
}

export interface ChatMessage {
  id: string;
  sender: string;
  color?: PlayerColor;
  text: string;
  timestamp: number;
}

export interface OnlineRoomSummary {
  roomId: string;
  hostName: string;
  gameType: GameType;
  maxPlayers: number;
  currentPlayers: number;
  stakeCoins: number;
  isPrivate: boolean;
}
