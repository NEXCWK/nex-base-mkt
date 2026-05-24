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

export function readUsers(): User[] {
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return SEED_USERS;
  }
}

function writeUsers(users: User[]): void {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
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
