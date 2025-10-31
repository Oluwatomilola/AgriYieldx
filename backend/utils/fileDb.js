import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "src/db/db.json");

// Ensure file exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], farms: [], faucetClaims: [], investments: [] }, null, 2));
}

export function readDb() {
  const raw = fs.readFileSync(DB_FILE, "utf8");
  return JSON.parse(raw);
}

export function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}
