import fs from "fs";
import path from "path";

const USERS_FILE = path.join(process.cwd(), "data/users.json");

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "member";
}

const SEED_USERS: User[] = [
  { id: "1", email: "larissa@nexcoworking.com.br", name: "Larissa", role: "member" },
  { id: "2", email: "leticia@nexcoworking.com.br", name: "Leticia", role: "member" },
  { id: "3", email: "felipe@nexcoworking.com.br", name: "Felipe", role: "admin" },
  { id: "4", email: "bruna@nexcoworking.com.br", name: "Bruna", role: "member" },
  { id: "5", email: "luiza@nexcoworking.com.br", name: "Luiza", role: "member" },
];

export function readUsers(): User[] {
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw) as User[];
  } catch {
    return SEED_USERS;
  }
}

export function findUserByEmail(email: string): User | undefined {
  return readUsers().find((u) => u.email === email);
}
