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

export function readUsers(): User[] {
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
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
