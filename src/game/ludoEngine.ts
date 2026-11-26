import { GameState, GameType, PlayerColor, PlayerState, PlayMode } from '../types/game';

/** 52-cell clockwise outer track coordinates [row, col] on a 15x15 grid */
export const TRACK_COORDS: [number, number][] = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], // 0..4 (Red start at 0)
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], // 5..10 (Star at 8)
  [0, 7], // 11 (Green home turn-in)
  [0, 8], // 12
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], // 13..17 (Green start at 13)
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], // 18..23 (Star at 21)
  [7, 14], // 24 (Yellow home turn-in)
  [8, 14], // 25
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], // 26..30 (Yellow start at 26)
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], // 31..36 (Star at 34)
  [14, 7], // 37 (Blue home turn-in)
  [14, 6], // 38
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], // 39..43 (Blue start at 39)
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], // 44..49 (Star at 47)
  [7, 0], // 50 (Red home turn-in)
  [6, 0], // 51
];

export const START_TRACK_INDEX: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

/** Safe squares on the 52-cell track: 4 start squares + 4 star squares */
export const SAFE_TRACK_INDICES = new Set<number>([0, 8, 13, 21, 26, 34, 39, 47]);
export const STAR_TRACK_INDICES = new Set<number>([8, 21, 34, 47]);

/** 5 colored home column squares + final center triangle goal (index 56 -> pos 5) */
export const HOME_COLUMN_COORDS: Record<PlayerColor, [number, number][]> = {
  red: [
    [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6.2],
  ],
  green: [
    [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6.2, 7],
  ],
  yellow: [
    [7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 7.8],
  ],
  blue: [
    [13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [7.8, 7],
  ],
};

/** Yard visual centers [row, col] for tokens -1 */
export const YARD_TOKEN_COORDS: Record<PlayerColor, [number, number][]> = {
  red: [
    [1.8, 1.8], [1.8, 3.2], [3.2, 1.8], [3.2, 3.2],
  ],
  green: [
    [1.8, 10.8], [1.8, 12.2], [3.2, 10.8], [3.2, 12.2],
  ],
  yellow: [
    [10.8, 10.8], [10.8, 12.2], [12.2, 10.8], [12.2, 12.2],
  ],
  blue: [
    [10.8, 1.8], [10.8, 3.2], [12.2, 1.8], [12.2, 3.2],
  ],
};

export const COLOR_LABELS: Record<PlayerColor, string> = {
  red: 'Red',
  green: 'Green',
  yellow: 'Yellow',
  blue: 'Blue',
};

export function getGlobalTrackIndex(color: PlayerColor, step: number): number | null {
  if (step < 0 || step > 50) return null;
  return (START_TRACK_INDEX[color] + step) % 52;
}

export function getTokenBoardCoord(
  color: PlayerColor,
  tokenId: number,
  step: number
): [number, number] {
  if (step < 0) {
    return YARD_TOKEN_COORDS[color][tokenId];
  }
  if (step <= 50) {
    const idx = (START_TRACK_INDEX[color] + step) % 52;
    return TRACK_COORDS[idx];
  }
  const homeIdx = Math.min(5, step - 51);
  return HOME_COLUMN_COORDS[color][homeIdx];
}

export interface CreateGamePlayerInput {
  color: PlayerColor;
  name: string;
  avatarId: string;
  isAI: boolean;
  isRemote?: boolean;
  clientId?: string;
}

export function createInitialGameState(params: {
  id: string;
  gameType: GameType;
  playMode: PlayMode;
  playerConfigs: CreateGamePlayerInput[];
  stakeCoins?: number;
}): GameState {
  const { id, gameType, playMode, playerConfigs, stakeCoins = 0 } = params;
  const players: Record<PlayerColor, PlayerState | null> = {
    red: null,
    green: null,
    yellow: null,
    blue: null,
  };

  // Clockwise order starting from blue (bottom-left)
  const clockwiseAll: PlayerColor[] = ['blue', 'red', 'green', 'yellow'];
  const activeOrder: PlayerColor[] = [];

  for (const c of clockwiseAll) {
    const cfg = playerConfigs.find((p) => p.color === c);
    if (cfg) {
      activeOrder.push(c);
      // In Quick mode, 1 token starts immediately on the start square (step 0)
      const tokens = [0, 1, 2, 3].map((tid) => ({
        id: tid,
        step: gameType === 'quick' && tid === 0 ? 0 : -1,
      }));
      // Opposite corners are teammates: Blue & Green = Team 1, Red & Yellow = Team 2
      const teamId: 1 | 2 | undefined =
        gameType === 'team_up' ? (c === 'blue' || c === 'green' ? 1 : 2) : undefined;

      players[c] = {
        color: c,
        name: cfg.name,
        avatarId: cfg.avatarId,
        isAI: cfg.isAI,
        isRemote: cfg.isRemote,
        clientId: cfg.clientId,
        teamId,
        tokens,
        finishedOrder: null,
        hasCaptured: false,
      };
    }
  }

  return {
    id,
    gameType,
    playMode,
    players,
    activeOrder,
    currentTurnIndex: 0,
    diceValue: null,
    consecutiveSixes: 0,
    phase: 'WAIT_ROLL',
    movableTokens: [],
    winnerColor: null,
    winningTeam: null,
    rankings: [],
    lastEvent: `${players[activeOrder[0]]?.name || 'Player 1'}'s turn to roll!`,
    turnStartedAt: Date.now(),
    stakeCoins,
  };
}

export function getCurrentPlayerColor(state: GameState): PlayerColor {
  return state.activeOrder[state.currentTurnIndex];
}

export function getRequiredHomeTokens(gameType: GameType): number {
  return gameType === 'quick' ? 2 : 4;
}

export function isPlayerFinished(player: PlayerState, gameType: GameType): boolean {
  const req = getRequiredHomeTokens(gameType);
  const homeCount = player.tokens.filter((t) => t.step === 56).length;
  return homeCount >= req;
}

export function getMovableTokenIds(
  state: GameState,
  color: PlayerColor,
  diceValue: number
): number[] {
  const player = state.players[color];
  if (!player) return [];
  const movable: number[] = [];

  for (const t of player.tokens) {
    if (t.step === 56) continue;
    if (t.step === -1) {
      if (diceValue === 6) {
        movable.push(t.id);
      }
      continue;
    }
    const nextStep = t.step + diceValue;
    if (nextStep <= 56) {
      movable.push(t.id);
    }
  }
  return movable;
}

export function advanceTurnIndex(state: GameState): number {
  const len = state.activeOrder.length;
  for (let offset = 1; offset <= len; offset++) {
    const idx = (state.currentTurnIndex + offset) % len;
    const c = state.activeOrder[idx];
    const p = state.players[c];
    if (p && !isPlayerFinished(p, state.gameType)) {
      return idx;
    }
  }
  return state.currentTurnIndex;
}

export function applyDiceRoll(state: GameState, rolled: number): GameState {
  if (state.phase !== 'WAIT_ROLL') return state;
  const color = getCurrentPlayerColor(state);
  const player = state.players[color];
  if (!player) return state;

  const nextSixes = rolled === 6 ? state.consecutiveSixes + 1 : 0;

  // Three consecutive 6s rule: forfeit turn!
  if (nextSixes >= 3) {
    const nextIdx = advanceTurnIndex(state);
    const nextColor = state.activeOrder[nextIdx];
    return {
      ...state,
      diceValue: rolled,
      consecutiveSixes: 0,
      phase: 'WAIT_ROLL',
      movableTokens: [],
      currentTurnIndex: nextIdx,
      lastEvent: `${player.name} rolled three 6s! Turn forfeited to ${state.players[nextColor]?.name}.`,
      turnStartedAt: Date.now(),
    };
  }

  const movable = getMovableTokenIds(state, color, rolled);
  if (movable.length === 0) {
    const nextIdx = advanceTurnIndex(state);
    const nextColor = state.activeOrder[nextIdx];
    return {
      ...state,
      diceValue: rolled,
      consecutiveSixes: 0,
      phase: 'WAIT_ROLL',
      movableTokens: [],
      currentTurnIndex: nextIdx,
      lastEvent: `${player.name} rolled ${rolled} — no valid moves.`,
      turnStartedAt: Date.now(),
    };
  }

  return {
    ...state,
    diceValue: rolled,
    consecutiveSixes: nextSixes,
    phase: 'WAIT_MOVE',
    movableTokens: movable,
    lastEvent: `${player.name} rolled ${rolled}! Select a highlighted token.`,
    turnStartedAt: Date.now(),
  };
}

export interface MoveOutcome {
  nextState: GameState;
  captured: boolean;
  reachedHome: boolean;
  exitedYard: boolean;
  gameFinished: boolean;
}

export function applyTokenMove(state: GameState, tokenId: number): MoveOutcome {
  const color = getCurrentPlayerColor(state);
  const player = state.players[color];
  const dice = state.diceValue;

  if (!player || dice === null || state.phase !== 'WAIT_MOVE' || !state.movableTokens.includes(tokenId)) {
    return {
      nextState: state,
      captured: false,
      reachedHome: false,
      exitedYard: false,
      gameFinished: false,
    };
  }

  const updatedPlayers: Record<PlayerColor, PlayerState | null> = { ...state.players };
  const clonedPlayer: PlayerState = {
    ...player,
    tokens: player.tokens.map((t) => ({ ...t })),
  };

  const token = clonedPlayer.tokens.find((t) => t.id === tokenId)!;
  const exitedYard = token.step === -1;
  const newStep = exitedYard ? 0 : token.step + dice;
  token.step = newStep;

  let captured = false;
  let capturedNames: string[] = [];
  const reachedHome = newStep === 56;

  // Check capture on outer track (0..50) if not a safe square
  if (newStep >= 0 && newStep <= 50) {
    const globalIdx = getGlobalTrackIndex(color, newStep);
    if (globalIdx !== null && !SAFE_TRACK_INDICES.has(globalIdx)) {
      for (const otherColor of state.activeOrder) {
        if (otherColor === color) continue;
        const other = updatedPlayers[otherColor];
        if (!other) continue;
        // In Team Up mode, teammates cannot capture each other
        if (state.gameType === 'team_up' && player.teamId && other.teamId === player.teamId) {
          continue;
        }
        let otherModified = false;
        const nextOtherTokens = other.tokens.map((ot) => {
          if (ot.step >= 0 && ot.step <= 50) {
            const otherIdx = getGlobalTrackIndex(otherColor, ot.step);
            if (otherIdx === globalIdx) {
              captured = true;
              otherModified = true;
              capturedNames.push(other.name);
              return { ...ot, step: -1 };
            }
          }
          return ot;
        });
        if (otherModified) {
          updatedPlayers[otherColor] = { ...other, tokens: nextOtherTokens };
        }
      }
    }
  }

  if (captured) {
    clonedPlayer.hasCaptured = true;
  }
  updatedPlayers[color] = clonedPlayer;

  const rankings = [...state.rankings];
  let winnerColor = state.winnerColor;
  let winningTeam = state.winningTeam;
  let gameFinished = false;

  if (isPlayerFinished(clonedPlayer, state.gameType) && !rankings.includes(color)) {
    clonedPlayer.finishedOrder = rankings.length + 1;
    rankings.push(color);
    updatedPlayers[color] = clonedPlayer;
  }

  if (state.gameType === 'team_up') {
    const team1Colors = state.activeOrder.filter((c) => updatedPlayers[c]?.teamId === 1);
    const team2Colors = state.activeOrder.filter((c) => updatedPlayers[c]?.teamId === 2);
    const team1Done =
      team1Colors.length > 0 &&
      team1Colors.every((c) => isPlayerFinished(updatedPlayers[c]!, state.gameType));
    const team2Done =
      team2Colors.length > 0 &&
      team2Colors.every((c) => isPlayerFinished(updatedPlayers[c]!, state.gameType));

    if (team1Done || team2Done) {
      gameFinished = true;
      winningTeam = team1Done ? 1 : 2;
      winnerColor = (team1Done ? team1Colors[0] : team2Colors[0]) || color;
      for (const c of state.activeOrder) {
        if (!rankings.includes(c)) rankings.push(c);
      }
    }
  } else {
    // Classic or Quick: first to finish wins immediately or when only 1 player remains
    const unfinished = state.activeOrder.filter(
      (c) => !isPlayerFinished(updatedPlayers[c]!, state.gameType)
    );
    if (rankings.length >= 1 && (state.activeOrder.length <= 2 || unfinished.length <= 1 || rankings.length === 1)) {
      // Standard mobile Ludo finishes when 1st winner completes (or let's finish on 1st winner so matches feel crisp!)
      gameFinished = true;
      winnerColor = rankings[0];
      for (const c of unfinished) {
        if (!rankings.includes(c)) rankings.push(c);
      }
    }
  }

  // Bonus turn if rolled 6, captured opponent, or reached center home (unless player just finished)
  const playerFinishedNow = isPlayerFinished(clonedPlayer, state.gameType);
  const bonusTurn = !gameFinished && !playerFinishedNow && (dice === 6 || captured || reachedHome);

  const nextStateDraft: GameState = {
    ...state,
    players: updatedPlayers,
    rankings,
    winnerColor,
    winningTeam,
    diceValue: null,
    movableTokens: [],
  };

  let nextIdx = state.currentTurnIndex;
  if (!bonusTurn && !gameFinished) {
    nextIdx = advanceTurnIndex(nextStateDraft);
  }

  let eventMsg = `${clonedPlayer.name} moved a token.`;
  if (exitedYard) eventMsg = `${clonedPlayer.name} deployed a token onto the board!`;
  if (captured) eventMsg = `${clonedPlayer.name} captured ${capturedNames[0]}! Bonus roll!`;
  else if (reachedHome) eventMsg = `${clonedPlayer.name} reached HOME!${bonusTurn ? ' Bonus roll!' : ''}`;
  else if (bonusTurn && dice === 6) eventMsg = `${clonedPlayer.name} rolled 6 — bonus roll!`;

  if (gameFinished) {
    eventMsg =
      state.gameType === 'team_up'
        ? `Team ${winningTeam} wins the match!`
        : `${updatedPlayers[winnerColor!]?.name} wins the match!`;
  }

  return {
    nextState: {
      ...nextStateDraft,
      currentTurnIndex: nextIdx,
      consecutiveSixes: bonusTurn ? state.consecutiveSixes : 0,
      phase: gameFinished ? 'GAME_OVER' : 'WAIT_ROLL',
      lastEvent: eventMsg,
      turnStartedAt: Date.now(),
    },
    captured,
    reachedHome,
    exitedYard,
    gameFinished,
  };
}

/** Smart AI heuristic to pick the best token move */
export function pickBestAiMove(state: GameState, aiColor: PlayerColor): number {
  const movable = state.movableTokens;
  if (movable.length === 0) return 0;
  if (movable.length === 1) return movable[0];

  const player = state.players[aiColor];
  const dice = state.diceValue || 1;
  if (!player) return movable[0];

  let bestId = movable[0];
  let bestScore = -Infinity;

  for (const tid of movable) {
    const token = player.tokens.find((t) => t.id === tid)!;
    let score = 0;

    if (token.step === -1) {
      // Entering board on 6 is strong
      score += 55;
    } else {
      const nextStep = token.step + dice;
      if (nextStep === 56) {
        score += 120; // Reaching center goal
      } else if (nextStep >= 51) {
        score += 75 + nextStep; // Safe home column
      } else {
        const nextGlobal = getGlobalTrackIndex(aiColor, nextStep);
        const curGlobal = getGlobalTrackIndex(aiColor, token.step);

        // Check capture opportunity
        if (nextGlobal !== null && !SAFE_TRACK_INDICES.has(nextGlobal)) {
          for (const oc of state.activeOrder) {
            if (oc === aiColor) continue;
            const other = state.players[oc];
            if (!other) continue;
            if (state.gameType === 'team_up' && player.teamId && other.teamId === player.teamId) {
              continue;
            }
            for (const ot of other.tokens) {
              if (ot.step >= 0 && ot.step <= 50 && getGlobalTrackIndex(oc, ot.step) === nextGlobal) {
                score += 140; // High priority capture
              }
            }
          }
        }

        // Landing on a safe zone
        if (nextGlobal !== null && SAFE_TRACK_INDICES.has(nextGlobal)) {
          score += 40;
        }
        // Leaving a safe zone has slight penalty unless capturing
        if (curGlobal !== null && SAFE_TRACK_INDICES.has(curGlobal)) {
          score -= 10;
        }
        // Prefer advancing further tokens
        score += nextStep * 0.8;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestId = tid;
    }
  }

  return bestId;
}
