import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { BoardThemeId, DiceStyleId, TokenStyleId, UserProfile } from '../types/game';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    return true;
  }
}

export function subscribeAuth(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export async function signInWithGoogle(): Promise<User> {
  const res = await signInWithPopup(auth, googleProvider);
  return res.user;
}

export async function signOutGoogle(): Promise<void> {
  await signOut(auth);
}

export async function loadCloudSave(uid: string): Promise<Partial<UserProfile> | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      uid: d.uid,
      isGuest: false,
      displayName: d.displayName,
      coins: d.coins,
      diamonds: d.diamonds,
      level: d.level,
      xp: d.xp,
      wins: d.wins,
      gamesPlayed: d.gamesPlayed,
      selectedTheme: d.selectedTheme as BoardThemeId,
      selectedToken: d.selectedToken as TokenStyleId,
      selectedDice: d.selectedDice as DiceStyleId,
      selectedAvatar: d.selectedAvatar,
      unlockedThemes: d.unlockedThemes as BoardThemeId[],
      unlockedTokens: d.unlockedTokens as TokenStyleId[],
      unlockedDice: d.unlockedDice as DiceStyleId[],
      unlockedAvatars: d.unlockedAvatars,
      dailyClaimedAt: d.dailyClaimedAt || '',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveCloudProfile(profile: UserProfile, isPublic = true): Promise<void> {
  const current = auth.currentUser;
  if (!current || profile.isGuest) return;

  const uid = current.uid;
  const userPath = `users/${uid}`;

  const safeName = (profile.displayName || 'Player').trim().slice(0, 40) || 'Player';
  const safeThemes = profile.unlockedThemes.slice(0, 30);
  const safeTokens = profile.unlockedTokens.slice(0, 30);
  const safeDice = profile.unlockedDice.slice(0, 30);
  const safeAvatars = profile.unlockedAvatars.slice(0, 30);

  try {
    const existing = await getDoc(doc(db, 'users', uid));
    if (!existing.exists()) {
      await setDoc(doc(db, 'users', uid), {
        uid,
        displayName: safeName,
        coins: Math.max(0, Math.min(10000000, Math.floor(profile.coins))),
        diamonds: Math.max(0, Math.min(1000000, Math.floor(profile.diamonds))),
        level: Math.max(1, Math.min(500, Math.floor(profile.level))),
        xp: Math.max(0, Math.min(10000000, Math.floor(profile.xp))),
        wins: Math.max(0, Math.min(1000000, Math.floor(profile.wins))),
        gamesPlayed: Math.max(0, Math.min(1000000, Math.floor(profile.gamesPlayed))),
        selectedTheme: profile.selectedTheme.slice(0, 32),
        selectedToken: profile.selectedToken.slice(0, 32),
        selectedDice: profile.selectedDice.slice(0, 32),
        selectedAvatar: profile.selectedAvatar.slice(0, 64),
        unlockedThemes: safeThemes.length ? safeThemes : ['default'],
        unlockedTokens: safeTokens.length ? safeTokens : ['pin'],
        unlockedDice: safeDice.length ? safeDice : ['default'],
        unlockedAvatars: safeAvatars.length ? safeAvatars : ['royal_player'],
        dailyClaimedAt: (profile.dailyClaimedAt || '').slice(0, 40),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'users', uid), {
        displayName: safeName,
        coins: Math.max(0, Math.min(10000000, Math.floor(profile.coins))),
        diamonds: Math.max(0, Math.min(1000000, Math.floor(profile.diamonds))),
        level: Math.max(1, Math.min(500, Math.floor(profile.level))),
        xp: Math.max(0, Math.min(10000000, Math.floor(profile.xp))),
        wins: Math.max(0, Math.min(1000000, Math.floor(profile.wins))),
        gamesPlayed: Math.max(0, Math.min(1000000, Math.floor(profile.gamesPlayed))),
        selectedTheme: profile.selectedTheme.slice(0, 32),
        selectedToken: profile.selectedToken.slice(0, 32),
        selectedDice: profile.selectedDice.slice(0, 32),
        selectedAvatar: profile.selectedAvatar.slice(0, 64),
        unlockedThemes: safeThemes.length ? safeThemes : ['default'],
        unlockedTokens: safeTokens.length ? safeTokens : ['pin'],
        unlockedDice: safeDice.length ? safeDice : ['default'],
        unlockedAvatars: safeAvatars.length ? safeAvatars : ['royal_player'],
        dailyClaimedAt: (profile.dailyClaimedAt || '').slice(0, 40),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }

  // Sync non-PII public friend directory profile
  const pubPath = `friendProfiles/${uid}`;
  try {
    const pubSnap = await getDoc(doc(db, 'friendProfiles', uid));
    if (!pubSnap.exists()) {
      await setDoc(doc(db, 'friendProfiles', uid), {
        uid,
        displayName: safeName,
        avatarId: profile.selectedAvatar.slice(0, 64),
        level: Math.max(1, Math.min(500, Math.floor(profile.level))),
        wins: Math.max(0, Math.min(1000000, Math.floor(profile.wins))),
        isPublic,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'friendProfiles', uid), {
        displayName: safeName,
        avatarId: profile.selectedAvatar.slice(0, 64),
        level: Math.max(1, Math.min(500, Math.floor(profile.level))),
        wins: Math.max(0, Math.min(1000000, Math.floor(profile.wins))),
        isPublic,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pubPath);
  }
}

export async function generateTransferCode(profile: UserProfile): Promise<string> {
  const current = auth.currentUser;
  if (!current) {
    throw new Error('Sign in with Google first to generate a device transfer code.');
  }
  const code = `RD${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const path = `transferCodes/${code}`;
  try {
    await setDoc(doc(db, 'transferCodes', code), {
      ownerUid: current.uid,
      displayName: (profile.displayName || 'Player').slice(0, 40),
      coins: Math.max(0, Math.floor(profile.coins)),
      diamonds: Math.max(0, Math.floor(profile.diamonds)),
      level: Math.max(1, Math.floor(profile.level)),
      wins: Math.max(0, Math.floor(profile.wins)),
      selectedTheme: profile.selectedTheme.slice(0, 32),
      selectedToken: profile.selectedToken.slice(0, 32),
      selectedDice: profile.selectedDice.slice(0, 32),
      selectedAvatar: profile.selectedAvatar.slice(0, 64),
      createdAt: serverTimestamp(),
    });
    return code;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function redeemTransferCode(rawCode: string): Promise<Partial<UserProfile> | null> {
  const code = rawCode.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{6,16}$/.test(code)) {
    throw new Error('Enter a valid 6–16 character transfer code.');
  }
  const path = `transferCodes/${code}`;
  try {
    const snap = await getDoc(doc(db, 'transferCodes', code));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      displayName: d.displayName,
      coins: d.coins,
      diamonds: d.diamonds,
      level: d.level,
      wins: d.wins,
      selectedTheme: d.selectedTheme as BoardThemeId,
      selectedToken: d.selectedToken as TokenStyleId,
      selectedDice: d.selectedDice as DiceStyleId,
      selectedAvatar: d.selectedAvatar,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function searchPublicFriends(): Promise<
  { uid: string; displayName: string; avatarId: string; level: number; wins: number }[]
> {
  if (!auth.currentUser) return [];
  const path = 'friendProfiles';
  try {
    const q = query(collection(db, 'friendProfiles'), where('isPublic', '==', true), limit(15));
    const snap = await getDocs(q);
    return snap.docs
      .map((docSnap) => {
        const d = docSnap.data();
        return {
          uid: String(d.uid),
          displayName: String(d.displayName),
          avatarId: String(d.avatarId || 'royal_player'),
          level: Number(d.level || 1),
          wins: Number(d.wins || 0),
        };
      })
      .filter((u) => u.uid !== auth.currentUser?.uid);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
