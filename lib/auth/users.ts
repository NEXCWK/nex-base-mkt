import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const USERS_FILE = path.join(process.cwd(), "data/users.json");

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  firstAccess: boolean;
  role: "admin" | "member";
}

// Senha inicial: Nex@2026
const INITIAL_HASH = "$2b$10$ixJ.MOpRPYn90.INcSmMou/RA7.nJf5lCWxeshP9.BFTjF3YbIBPW";

const SEED_USERS: User[] = [
  { id: "1", email: "larissa@nexcoworking.com.br", name: "Larissa", password: INITIAL_HASH, firstAccess: true, role: "member" },
  { id: "2", email: "leticia@nexcoworking.com.br", name: "Leticia", password: INITIAL_HASH, firstAccess: true, role: "member" },
  { id: "3", email: "felipe@nexcoworking.com.br", name: "Felipe", password: INITIAL_HASH, firstAccess: true, role: "admin" },
  { id: "4", email: "bruna@nexcoworking.com.br", name: "Bruna", password: INITIAL_HASH, firstAccess: true, role: "member" },
  { id: "5", email: "luiza@nexcoworking.com.br", name: "Luiza", password: INITIAL_HASH, firstAccess: true, role: "member" },
];

// In-memory cache survives within a process (persists password changes across
// requests until the container restarts). USERS_JSON env var provides the
// initial state that survives across Railway redeploys.
let memoryCache: User[] | null = null;

function loadInitialUsers(): User[] {
  // 1. Try USERS_JSON env var (set via Railway dashboard — survives redeploys)
  if (process.env.USERS_JSON) {
    try {
      return JSON.parse(process.env.USERS_JSON) as User[];
    } catch {
      console.error("[auth] USERS_JSON env var is invalid JSON");
    }
  }
  // 2. Try data/users.json file
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw) as User[];
  } catch {
    return SEED_USERS;
  }
}

export function readUsers(): User[] {
  if (!memoryCache) {
    memoryCache = loadInitialUsers();
  }
  return memoryCache;
}

function writeUsers(users: User[]): void {
  // Update in-memory cache immediately (keeps changes alive within this process)
  memoryCache = users;
  // Also persist to file (best-effort; helps if Railway keeps the same container)
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch {
    // File write may fail in read-only deployments; memory cache is the fallback
  }
}

export function findUserByEmail(email: string): User | undefined {
  return readUsers().find((u) => u.email === email);
}

export async function validateCredentials(
  email: string,
  password: string
): Promise<User | null> {
  const user = findUserByEmail(email);
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password);
  return valid ? user : null;
}

export async function updatePassword(
  userId: string,
  newPassword: string
): Promise<void> {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error("User not found");
  const hashed = await bcrypt.hash(newPassword, 10);
  users[idx].password = hashed;
  users[idx].firstAccess = false;
  writeUsers(users);
}

/** Returns the current users list as a JSON string for copying to USERS_JSON env var. */
export function exportUsersJson(): string {
  return JSON.stringify(readUsers(), null, 2);
}
