import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  applyDiceRoll,
  applyTokenMove,
  createInitialGameState,
  getCurrentPlayerColor,
  pickBestAiMove,
} from './src/game/ludoEngine.ts';
import type { ChatMessage, GameState, GameType, PlayerColor, PlayMode } from './src/types/game.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RoomPlayer {
  clientId: string;
  name: string;
  avatarId: string;
  color: PlayerColor;
  isAI: boolean;
}

interface MultiplayerRoom {
  roomId: string;
  hostClientId: string;
  hostName: string;
  gameType: GameType;
  playMode: PlayMode;
  maxPlayers: number;
  stakeCoins: number;
  isPrivate: boolean;
  players: RoomPlayer[];
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  gameState: GameState | null;
  chat: ChatMessage[];
  aiTimer?: NodeJS.Timeout;
}

interface ConnectedClient {
  clientId: string;
  ws: WebSocket;
  name: string;
  avatarId: string;
  roomId: string | null;
}

const ALL_SEAT_ORDER: Record<number, PlayerColor[]> = {
  2: ['blue', 'green'],
  3: ['blue', 'red', 'green'],
  4: ['blue', 'red', 'green', 'yellow'],
};

const clients = new Map<string, ConnectedClient>();
const rooms = new Map<string, MultiplayerRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function sendToClient(client: ConnectedClient, payload: unknown) {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(payload));
  }
}

function broadcastRoom(room: MultiplayerRoom, payload: unknown) {
  for (const client of clients.values()) {
    if (client.roomId === room.roomId) {
      sendToClient(client, payload);
    }
  }
}

function broadcastLobbyStats() {
  const publicRooms = Array.from(rooms.values())
    .filter((r) => !r.isPrivate && r.status === 'WAITING')
    .map((r) => ({
      roomId: r.roomId,
      hostName: r.hostName,
      gameType: r.gameType,
      maxPlayers: r.maxPlayers,
      currentPlayers: r.players.length,
      stakeCoins: r.stakeCoins,
      isPrivate: r.isPrivate,
    }));

  const payload = {
    type: 'lobby:stats',
    onlineCount: clients.size,
    publicRooms,
  };

  for (const client of clients.values()) {
    sendToClient(client, payload);
  }
}

function emitRoomState(room: MultiplayerRoom) {
  broadcastRoom(room, {
    type: 'room:update',
    room: {
      roomId: room.roomId,
      hostClientId: room.hostClientId,
      hostName: room.hostName,
      gameType: room.gameType,
      playMode: room.playMode,
      maxPlayers: room.maxPlayers,
      stakeCoins: room.stakeCoins,
      isPrivate: room.isPrivate,
      players: room.players,
      status: room.status,
      gameState: room.gameState,
      chat: room.chat.slice(-40),
    },
  });
}

function scheduleAiIfNeeded(room: MultiplayerRoom) {
  if (room.aiTimer) {
    clearTimeout(room.aiTimer);
    room.aiTimer = undefined;
  }
  if (!room.gameState || room.gameState.phase === 'GAME_OVER') return;

  const currentColor = getCurrentPlayerColor(room.gameState);
  const currentPlayer = room.gameState.players[currentColor];
  if (!currentPlayer || !currentPlayer.isAI) return;

  room.aiTimer = setTimeout(() => {
    if (!room.gameState || room.gameState.phase === 'GAME_OVER') return;
    if (room.gameState.phase === 'WAIT_ROLL') {
      const rolled = Math.floor(Math.random() * 6) + 1;
      room.gameState = applyDiceRoll(room.gameState, rolled);
      emitRoomState(room);
      scheduleAiIfNeeded(room);
    } else if (room.gameState.phase === 'WAIT_MOVE') {
      const tokenId = pickBestAiMove(room.gameState, currentColor);
      const outcome = applyTokenMove(room.gameState, tokenId);
      room.gameState = outcome.nextState;
      if (outcome.gameFinished) {
        room.status = 'FINISHED';
      }
      emitRoomState(room);
      scheduleAiIfNeeded(room);
    }
  }, 650);
}

function startRoomGame(room: MultiplayerRoom, fillWithBots = false) {
  if (room.status === 'PLAYING') return;
  const seatColors = ALL_SEAT_ORDER[room.maxPlayers] || ALL_SEAT_ORDER[4];

  if (fillWithBots) {
    const botNames = ['Orion Bot', 'Atlas Bot', 'Nova Bot', 'Zenith Bot'];
    const botAvatars = ['golden_knight', 'desert_explorer', 'astro_scholar', 'royal_player'];
    for (let i = 0; i < seatColors.length; i++) {
      const c = seatColors[i];
      if (!room.players.find((p) => p.color === c)) {
        room.players.push({
          clientId: `ai-${c}-${room.roomId}`,
          name: botNames[i % botNames.length],
          avatarId: botAvatars[i % botAvatars.length],
          color: c,
          isAI: true,
        });
      }
    }
  }

  room.status = 'PLAYING';
  room.gameState = createInitialGameState({
    id: room.roomId,
    gameType: room.gameType,
    playMode: room.playMode,
    stakeCoins: room.stakeCoins,
    playerConfigs: room.players.map((p) => ({
      color: p.color,
      name: p.name,
      avatarId: p.avatarId,
      isAI: p.isAI,
      isRemote: !p.isAI,
      clientId: p.clientId,
    })),
  });

  emitRoomState(room);
  broadcastLobbyStats();
  scheduleAiIfNeeded(room);
}

function leaveCurrentRoom(client: ConnectedClient) {
  if (!client.roomId) return;
  const room = rooms.get(client.roomId);
  client.roomId = null;
  if (!room) return;

  room.players = room.players.filter((p) => p.clientId !== client.clientId);

  if (room.players.filter((p) => !p.isAI).length === 0) {
    if (room.aiTimer) clearTimeout(room.aiTimer);
    rooms.delete(room.roomId);
  } else {
    if (room.hostClientId === client.clientId) {
      const nextHuman = room.players.find((p) => !p.isAI);
      if (nextHuman) {
        room.hostClientId = nextHuman.clientId;
        room.hostName = nextHuman.name;
      }
    }
    // If game was running and a player left, convert their seat to AI so remaining players aren't stuck
    if (room.status === 'PLAYING' && room.gameState) {
      for (const c of room.gameState.activeOrder) {
        const p = room.gameState.players[c];
        if (p && p.clientId === client.clientId) {
          p.isAI = true;
          p.name = `${p.name} (Auto)`;
        }
      }
      scheduleAiIfNeeded(room);
    }
    emitRoomState(room);
  }
  broadcastLobbyStats();
}

async function bootstrap() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, onlinePlayers: clients.size, activeRooms: rooms.size });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    const clientId = `c_${Math.random().toString(36).slice(2, 10)}`;
    const client: ConnectedClient = {
      clientId,
      ws,
      name: 'Player',
      avatarId: 'royal_player',
      roomId: null,
    };
    clients.set(clientId, client);

    sendToClient(client, { type: 'session:init', clientId });
    broadcastLobbyStats();

    ws.on('message', (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }

      const type = String(msg.type || '');
      if (typeof msg.name === 'string' && msg.name.trim()) {
        client.name = msg.name.trim().slice(0, 24);
      }
      if (typeof msg.avatarId === 'string' && msg.avatarId.trim()) {
        client.avatarId = msg.avatarId.trim().slice(0, 48);
      }

      if (type === 'lobby:subscribe') {
        broadcastLobbyStats();
        return;
      }

      if (type === 'room:create' || type === 'room:matchmake') {
        leaveCurrentRoom(client);
        const gameType = (['classic', 'team_up', 'quick'].includes(String(msg.gameType))
          ? msg.gameType
          : 'classic') as GameType;
        const playMode = (String(msg.playMode || 'online')) as PlayMode;
        const maxPlayers = gameType === 'team_up' ? 4 : Math.min(4, Math.max(2, Number(msg.maxPlayers) || 4));
        const stakeCoins = Math.max(0, Number(msg.stakeCoins) || 0);
        const isPrivate = type === 'room:create' && Boolean(msg.isPrivate);

        // If matchmaking, look for an open waiting public room with matching parameters
        if (type === 'room:matchmake') {
          const openRoom = Array.from(rooms.values()).find(
            (r) =>
              !r.isPrivate &&
              r.status === 'WAITING' &&
              r.gameType === gameType &&
              r.maxPlayers === maxPlayers &&
              r.players.length < r.maxPlayers
          );
          if (openRoom) {
            const seatColors = ALL_SEAT_ORDER[openRoom.maxPlayers] || ALL_SEAT_ORDER[4];
            const freeColor = seatColors.find((c) => !openRoom.players.some((p) => p.color === c));
            if (freeColor) {
              openRoom.players.push({
                clientId: client.clientId,
                name: client.name,
                avatarId: client.avatarId,
                color: freeColor,
                isAI: false,
              });
              client.roomId = openRoom.roomId;
              emitRoomState(openRoom);
              if (openRoom.players.length === openRoom.maxPlayers) {
                startRoomGame(openRoom, false);
              } else {
                broadcastLobbyStats();
              }
              return;
            }
          }
        }

        const roomId = generateRoomCode();
        const seatColors = ALL_SEAT_ORDER[maxPlayers] || ALL_SEAT_ORDER[4];
        const newRoom: MultiplayerRoom = {
          roomId,
          hostClientId: client.clientId,
          hostName: client.name,
          gameType,
          playMode,
          maxPlayers,
          stakeCoins,
          isPrivate,
          players: [
            {
              clientId: client.clientId,
              name: client.name,
              avatarId: client.avatarId,
              color: seatColors[0],
              isAI: false,
            },
          ],
          status: 'WAITING',
          gameState: null,
          chat: [],
        };
        rooms.set(roomId, newRoom);
        client.roomId = roomId;
        emitRoomState(newRoom);
        broadcastLobbyStats();
        return;
      }

      if (type === 'room:join') {
        const roomId = String(msg.roomId || '').trim().toUpperCase();
        const target = rooms.get(roomId);
        if (!target) {
          sendToClient(client, { type: 'room:error', message: `Room ${roomId} not found.` });
          return;
        }
        if (target.status !== 'WAITING') {
          sendToClient(client, { type: 'room:error', message: 'This match has already started.' });
          return;
        }
        if (target.players.length >= target.maxPlayers) {
          sendToClient(client, { type: 'room:error', message: 'Room is already full.' });
          return;
        }
        leaveCurrentRoom(client);
        const seatColors = ALL_SEAT_ORDER[target.maxPlayers] || ALL_SEAT_ORDER[4];
        const freeColor = seatColors.find((c) => !target.players.some((p) => p.color === c));
        if (!freeColor) return;

        target.players.push({
          clientId: client.clientId,
          name: client.name,
          avatarId: client.avatarId,
          color: freeColor,
          isAI: false,
        });
        client.roomId = target.roomId;
        emitRoomState(target);
        if (target.players.length === target.maxPlayers) {
          startRoomGame(target, false);
        } else {
          broadcastLobbyStats();
        }
        return;
      }

      if (type === 'room:leave') {
        leaveCurrentRoom(client);
        sendToClient(client, { type: 'room:left' });
        return;
      }

      if (type === 'room:start') {
        if (!client.roomId) return;
        const room = rooms.get(client.roomId);
        if (!room || room.hostClientId !== client.clientId) return;
        const fillBots = Boolean(msg.fillWithBots);
        if (!fillBots && room.players.length < 2) {
          sendToClient(client, {
            type: 'room:error',
            message: 'Need at least 2 players to start, or choose Fill Empty Seats with Bots.',
          });
          return;
        }
        startRoomGame(room, fillBots);
        return;
      }

      if (type === 'game:roll') {
        if (!client.roomId) return;
        const room = rooms.get(client.roomId);
        if (!room || !room.gameState || room.gameState.phase !== 'WAIT_ROLL') return;
        const curColor = getCurrentPlayerColor(room.gameState);
        const curPlayer = room.gameState.players[curColor];
        if (!curPlayer || curPlayer.clientId !== client.clientId) return;

        const rolled = Math.floor(Math.random() * 6) + 1;
        room.gameState = applyDiceRoll(room.gameState, rolled);
        emitRoomState(room);
        scheduleAiIfNeeded(room);
        return;
      }

      if (type === 'game:move') {
        if (!client.roomId) return;
        const room = rooms.get(client.roomId);
        if (!room || !room.gameState || room.gameState.phase !== 'WAIT_MOVE') return;
        const curColor = getCurrentPlayerColor(room.gameState);
        const curPlayer = room.gameState.players[curColor];
        if (!curPlayer || curPlayer.clientId !== client.clientId) return;

        const tokenId = Number(msg.tokenId);
        const outcome = applyTokenMove(room.gameState, tokenId);
        room.gameState = outcome.nextState;
        if (outcome.gameFinished) {
          room.status = 'FINISHED';
        }
        emitRoomState(room);
        scheduleAiIfNeeded(room);
        return;
      }

      if (type === 'room:chat') {
        if (!client.roomId) return;
        const room = rooms.get(client.roomId);
        if (!room) return;
        const text = String(msg.text || '').trim().slice(0, 120);
        if (!text) return;
        const seat = room.players.find((p) => p.clientId === client.clientId);
        room.chat.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sender: client.name,
          color: seat?.color,
          text,
          timestamp: Date.now(),
        });
        emitRoomState(room);
      }
    });

    ws.on('close', () => {
      leaveCurrentRoom(client);
      clients.delete(clientId);
      broadcastLobbyStats();
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`RAMADAN DEV server listening on http://0.0.0.0:${port}`);
  });
}

bootstrap();
