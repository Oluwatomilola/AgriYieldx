import { faucetClaim } from "./tokenService.js";

// ✅ Claim from faucet with 24h cooldown
export async function claimFaucet(accountId, amount, db) {
  const lastClaim = db.faucetClaims?.[accountId] || 0;
  const now = Date.now();

  if (now - lastClaim < 24 * 60 * 60 * 1000) {
    throw new Error("Faucet can only be claimed once every 24h");
  }

  const result = await faucetClaim(accountId, amount);

  db.faucetClaims = db.faucetClaims || {};
  db.faucetClaims[accountId] = now;

  return result;
}
