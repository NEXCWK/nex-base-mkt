import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const SEEDS_DIR = path.join(process.cwd(), "lib/seeds");

export function readFile(name: string): unknown[] {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
    // File missing (e.g. fresh persistent volume) — seed from lib/seeds/ if available
    const seedPath = path.join(SEEDS_DIR, `${name}.json`);
    const seed: unknown[] = fs.existsSync(seedPath)
      ? JSON.parse(fs.readFileSync(seedPath, "utf-8"))
      : [];
    writeFile(name, seed);
    return seed;
  } catch {
    return [];
  }
}

export function writeFile(name: string, data: unknown[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(DATA_DIR, `${name}.json`),
    JSON.stringify(data, null, 2)
  );
}
