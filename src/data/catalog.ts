import { BoardThemeId, DiceStyleId, LanguageCode, TokenStyleId } from '../types/game';

export interface ThemeMeta {
  id: BoardThemeId;
  name: string;
  priceCoins: number;
  priceDiamonds: number;
  boardBg: string;
  trackBg: string;
  trackAltBg: string;
  borderColor: string;
  accentHex: string;
  yardColors: {
    red: string;
    green: string;
    yellow: string;
    blue: string;
  };
  patternOverlay: string;
  badgeText: string;
}

export const BOARD_THEMES: ThemeMeta[] = [
  {
    id: 'default',
    name: 'Default',
    priceCoins: 0,
    priceDiamonds: 0,
    boardBg: '#FFFFFF',
    trackBg: '#FFFFFF',
    trackAltBg: '#F1F5F9',
    borderColor: '#1E293B',
    accentHex: '#F5B700',
    yardColors: { red: '#DC2626', green: '#16A34A', yellow: '#EAB308', blue: '#2563EB' },
    patternOverlay: 'none',
    badgeText: 'Classic Studio',
  },
  {
    id: 'nature',
    name: 'Nature',
    priceCoins: 800,
    priceDiamonds: 0,
    boardBg: '#DCFCE7',
    trackBg: '#F0FDF4',
    trackAltBg: '#BBF7D0',
    borderColor: '#14532D',
    accentHex: '#22C55E',
    yardColors: { red: '#BE123C', green: '#15803D', yellow: '#CA8A04', blue: '#0284C7' },
    patternOverlay: 'radial-gradient(circle at 20% 20%, rgba(34,197,94,0.16), transparent 60%)',
    badgeText: 'Forest Meadow',
  },
  {
    id: 'egypt',
    name: 'Egypt',
    priceCoins: 1200,
    priceDiamonds: 0,
    boardBg: '#FEF3C7',
    trackBg: '#FFFBEB',
    trackAltBg: '#FDE68A',
    borderColor: '#78350F',
    accentHex: '#D97706',
    yardColors: { red: '#B91C1C', green: '#047857', yellow: '#D97706', blue: '#1D4ED8' },
    patternOverlay: 'repeating-linear-gradient(45deg, rgba(217,119,6,0.08) 0 12px, transparent 12px 24px)',
    badgeText: 'Pharaoh Gold',
  },
  {
    id: 'disco',
    name: 'Disco',
    priceCoins: 1500,
    priceDiamonds: 0,
    boardBg: '#0F172A',
    trackBg: '#1E293B',
    trackAltBg: '#334155',
    borderColor: '#38BDF8',
    accentHex: '#FACC15',
    yardColors: { red: '#F43F5E', green: '#22C55E', yellow: '#FACC15', blue: '#3B82F6' },
    patternOverlay: 'radial-gradient(circle at 50% 50%, rgba(56,189,248,0.14), transparent 70%)',
    badgeText: 'Midnight Groove',
  },
  {
    id: 'marble',
    name: 'Marble',
    priceCoins: 1800,
    priceDiamonds: 0,
    boardBg: '#F5F5F4',
    trackBg: '#FAFAF9',
    trackAltBg: '#E7E5E4',
    borderColor: '#57534E',
    accentHex: '#A8A29E',
    yardColors: { red: '#C2410C', green: '#15803D', yellow: '#B45309', blue: '#1E40AF' },
    patternOverlay: 'linear-gradient(135deg, rgba(168,162,158,0.15) 25%, transparent 25%)',
    badgeText: 'Travertine Stone',
  },
  {
    id: 'candy',
    name: 'Candy',
    priceCoins: 0,
    priceDiamonds: 25,
    boardBg: '#FFF1F2',
    trackBg: '#FFFFFF',
    trackAltBg: '#FCE7F3',
    borderColor: '#BE185D',
    accentHex: '#EC4899',
    yardColors: { red: '#EC4899', green: '#34D399', yellow: '#FBBF24', blue: '#38BDF8' },
    patternOverlay: 'radial-gradient(circle at 80% 20%, rgba(244,114,182,0.16), transparent 55%)',
    badgeText: 'Sugar Rush',
  },
  {
    id: 'christmas',
    name: 'Christmas',
    priceCoins: 0,
    priceDiamonds: 30,
    boardBg: '#ECFDF5',
    trackBg: '#FFFFFF',
    trackAltBg: '#FEE2E2',
    borderColor: '#991B1B',
    accentHex: '#EF4444',
    yardColors: { red: '#DC2626', green: '#15803D', yellow: '#EAB308', blue: '#0284C7' },
    patternOverlay: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.6), transparent 60%)',
    badgeText: 'Winter Pine',
  },
  {
    id: 'penguin',
    name: 'Penguin',
    priceCoins: 2000,
    priceDiamonds: 0,
    boardBg: '#E0F2FE',
    trackBg: '#F0F9FF',
    trackAltBg: '#BAE6FD',
    borderColor: '#0369A1',
    accentHex: '#0EA5E9',
    yardColors: { red: '#E11D48', green: '#0D9488', yellow: '#F59E0B', blue: '#0284C7' },
    patternOverlay: 'linear-gradient(180deg, rgba(186,230,253,0.45), transparent)',
    badgeText: 'Arctic Glacier',
  },
  {
    id: 'battle',
    name: 'Battle',
    priceCoins: 0,
    priceDiamonds: 40,
    boardBg: '#292524',
    trackBg: '#44403C',
    trackAltBg: '#57534E',
    borderColor: '#D97706',
    accentHex: '#F59E0B',
    yardColors: { red: '#B91C1C', green: '#15803D', yellow: '#CA8A04', blue: '#1D4ED8' },
    patternOverlay: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 4px, transparent 4px 8px)',
    badgeText: 'Iron Citadel',
  },
];

export interface TokenMeta {
  id: TokenStyleId;
  name: string;
  priceCoins: number;
  priceDiamonds: number;
}

export const TOKEN_STYLES: TokenMeta[] = [
  { id: 'pin', name: 'Classic Pin', priceCoins: 0, priceDiamonds: 0 },
  { id: 'classic', name: 'Royal Disc', priceCoins: 500, priceDiamonds: 0 },
  { id: 'star', name: 'Star Crest', priceCoins: 1000, priceDiamonds: 0 },
  { id: 'hammer', name: 'Storm Hammer', priceCoins: 0, priceDiamonds: 20 },
  { id: 'crown', name: 'Grand Crown', priceCoins: 0, priceDiamonds: 35 },
];

export interface DiceMeta {
  id: DiceStyleId;
  name: string;
  priceCoins: number;
  priceDiamonds: number;
  bgGradient: string;
  pipColor: string;
  borderColor: string;
  badge?: string;
}

export const DICE_STYLES: DiceMeta[] = [
  {
    id: 'default',
    name: 'Classic Ivory',
    priceCoins: 0,
    priceDiamonds: 0,
    bgGradient: 'linear-gradient(145deg, #ffffff 0%, #e2e8f0 100%)',
    pipColor: '#0f172a',
    borderColor: '#cbd5e1',
  },
  {
    id: 'super_king',
    name: 'Royal Gold',
    priceCoins: 750,
    priceDiamonds: 0,
    bgGradient: 'linear-gradient(145deg, #1d4ed8 0%, #1e3a8a 100%)',
    pipColor: '#fde047',
    borderColor: '#f5b700',
  },
  {
    id: 'dragon',
    name: 'Ember Dragon',
    priceCoins: 1200,
    priceDiamonds: 0,
    bgGradient: 'linear-gradient(145deg, #7f1d1d 0%, #1c1917 100%)',
    pipColor: '#fb923c',
    borderColor: '#f97316',
  },
  {
    id: 'firework',
    name: 'Starlight',
    priceCoins: 0,
    priceDiamonds: 15,
    bgGradient: 'linear-gradient(145deg, #312e81 0%, #0f172a 100%)',
    pipColor: '#facc15',
    borderColor: '#818cf8',
  },
  {
    id: 'penguin',
    name: 'Frost Cube',
    priceCoins: 900,
    priceDiamonds: 0,
    bgGradient: 'linear-gradient(145deg, #bae6fd 0%, #0284c7 100%)',
    pipColor: '#ffffff',
    borderColor: '#e0f2fe',
  },
  {
    id: 'mummy',
    name: 'Sandstone',
    priceCoins: 1100,
    priceDiamonds: 0,
    bgGradient: 'linear-gradient(145deg, #fef3c7 0%, #b45309 100%)',
    pipColor: '#451a03',
    borderColor: '#f59e0b',
  },
  {
    id: 'chocolate',
    name: 'Cocoa Gold',
    priceCoins: 0,
    priceDiamonds: 20,
    bgGradient: 'linear-gradient(145deg, #78350f 0%, #451a03 100%)',
    pipColor: '#fde68a',
    borderColor: '#d97706',
  },
  {
    id: 'peace',
    name: 'Emerald Jade',
    priceCoins: 1000,
    priceDiamonds: 0,
    bgGradient: 'linear-gradient(145deg, #16a34a 0%, #14532d 100%)',
    pipColor: '#fef08a',
    borderColor: '#4ade80',
  },
];

export interface AvatarMeta {
  id: string;
  name: string;
  src: string;
  priceCoins: number;
  priceDiamonds: number;
}

export const AVATAR_LIST: AvatarMeta[] = [
  {
    id: 'royal_player',
    name: 'Royal Captain',
    src: '/src/assets/images/avatar_royal_player_1795707413795.jpg',
    priceCoins: 0,
    priceDiamonds: 0,
  },
  {
    id: 'desert_explorer',
    name: 'Sky Explorer',
    src: '/src/assets/images/avatar_desert_explorer_1795707413856.jpg',
    priceCoins: 600,
    priceDiamonds: 0,
  },
  {
    id: 'golden_knight',
    name: 'Lion Guardian',
    src: '/src/assets/images/avatar_golden_knight_1795707414381.jpg',
    priceCoins: 1000,
    priceDiamonds: 0,
  },
  {
    id: 'astro_scholar',
    name: 'Star Scholar',
    src: '/src/assets/images/avatar_astro_scholar_1795707414313.jpg',
    priceCoins: 0,
    priceDiamonds: 20,
  },
];

export const HERO_EMBLEM_SRC = '/src/assets/images/ramadan_dev_hero_emblem_1795707413447.jpg';

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  target: number;
  metric: 'gamesPlayed' | 'wins' | 'captures' | 'sixesRolled';
  rewardCoins: number;
  rewardDiamonds: number;
}

export const SEASON_QUESTS: QuestDefinition[] = [
  {
    id: 'q_first_match',
    title: 'First Match',
    description: 'Complete 1 Ludo game in any mode',
    target: 1,
    metric: 'gamesPlayed',
    rewardCoins: 500,
    rewardDiamonds: 5,
  },
  {
    id: 'q_capture_3',
    title: 'Board Hunter',
    description: 'Capture 3 opponent tokens',
    target: 3,
    metric: 'captures',
    rewardCoins: 800,
    rewardDiamonds: 10,
  },
  {
    id: 'q_roll_sixes',
    title: 'Lucky Sixes',
    description: 'Roll a 6 five times',
    target: 5,
    metric: 'sixesRolled',
    rewardCoins: 650,
    rewardDiamonds: 8,
  },
  {
    id: 'q_champion',
    title: 'Royal Champion',
    description: 'Win 3 Ludo matches',
    target: 3,
    metric: 'wins',
    rewardCoins: 2000,
    rewardDiamonds: 25,
  },
];

export const TRANSLATIONS: Record<
  LanguageCode,
  {
    online: string;
    teamUp: string;
    friends: string;
    computer: string;
    passNPlay: string;
    tournament: string;
    home: string;
    events: string;
    inventory: string;
    social: string;
    settings: string;
    next: string;
    selectToken: string;
    selectGame: string;
    classic: string;
    classicTeamUp: string;
    quick: string;
    quitGame: string;
    yes: string;
    no: string;
    yourTurn: string;
    rollDice: string;
  }
> = {
  en: {
    online: 'ONLINE',
    teamUp: 'TEAM UP',
    friends: 'FRIENDS',
    computer: 'COMPUTER',
    passNPlay: 'PASS N PLAY',
    tournament: 'TOURNAMENT',
    home: 'HOME',
    events: 'EVENT',
    inventory: 'INVENTORY',
    social: 'SOCIAL',
    settings: 'Settings',
    next: 'Next',
    selectToken: 'SELECT TOKEN',
    selectGame: 'SELECT GAME',
    classic: 'Classic',
    classicTeamUp: 'Classic Team Up',
    quick: 'QUICK',
    quitGame: 'QUIT GAME?',
    yes: 'Yes',
    no: 'No',
    yourTurn: 'Your Turn',
    rollDice: 'Roll',
  },
  ar: {
    online: 'أونلاين',
    teamUp: 'فريق ضد فريق',
    friends: 'الأصدقاء',
    computer: 'الكمبيوتر',
    passNPlay: 'لعب محلي',
    tournament: 'البطولة',
    home: 'الرئيسية',
    events: 'الأحداث',
    inventory: 'المخزن',
    social: 'المجتمع',
    settings: 'الإعدادات',
    next: 'التالي',
    selectToken: 'اختر القطعة',
    selectGame: 'اختر النمط',
    classic: 'كلاسيك',
    classicTeamUp: 'فريق كلاسيك',
    quick: 'سريع',
    quitGame: 'إنهاء اللعبة؟',
    yes: 'نعم',
    no: 'لا',
    yourTurn: 'دورك',
    rollDice: 'ارمِ النرد',
  },
  es: {
    online: 'EN LÍNEA',
    teamUp: 'EQUIPOS',
    friends: 'AMIGOS',
    computer: 'COMPUTADORA',
    passNPlay: 'PASAR Y JUGAR',
    tournament: 'TORNEO',
    home: 'INICIO',
    events: 'EVENTOS',
    inventory: 'INVENTARIO',
    social: 'SOCIAL',
    settings: 'Ajustes',
    next: 'Siguiente',
    selectToken: 'ELEGIR FICHA',
    selectGame: 'ELEGIR JUEGO',
    classic: 'Clásico',
    classicTeamUp: 'Equipos 2v2',
    quick: 'RÁPIDO',
    quitGame: '¿SALIR DEL JUEGO?',
    yes: 'Sí',
    no: 'No',
    yourTurn: 'Tu Turno',
    rollDice: 'Tirar',
  },
  fr: {
    online: 'EN LIGNE',
    teamUp: 'ÉQUIPES',
    friends: 'AMIS',
    computer: 'ORDINATEUR',
    passNPlay: 'PASSE ET JOUE',
    tournament: 'TOURNOI',
    home: 'ACCUEIL',
    events: 'ÉVÉNEMENTS',
    inventory: 'INVENTAIRE',
    social: 'SOCIAL',
    settings: 'Paramètres',
    next: 'Suivant',
    selectToken: 'CHOISIR PION',
    selectGame: 'CHOISIR MODE',
    classic: 'Classique',
    classicTeamUp: 'Équipe 2v2',
    quick: 'RAPIDE',
    quitGame: 'QUITTER LA PARTIE ?',
    yes: 'Oui',
    no: 'Non',
    yourTurn: 'À vous',
    rollDice: 'Lancer',
  },
  hi: {
    online: 'ऑनलाइन',
    teamUp: 'टीम अप',
    friends: 'दोस्त',
    computer: 'कंप्यूटर',
    passNPlay: 'पास एन प्ले',
    tournament: 'टूर्नामेंट',
    home: 'होम',
    events: 'इवेंट्स',
    inventory: 'इन्वेंटरी',
    social: 'सोशल',
    settings: 'सेटिंग्स',
    next: 'आगे',
    selectToken: 'गोटी चुनें',
    selectGame: 'गेम चुनें',
    classic: 'क्लासिक',
    classicTeamUp: 'टीम अप',
    quick: 'क्विक',
    quitGame: 'गेम छोड़ें?',
    yes: 'हाँ',
    no: 'नहीं',
    yourTurn: 'आपकी बारी',
    rollDice: 'पासा फेंकें',
  },
};
