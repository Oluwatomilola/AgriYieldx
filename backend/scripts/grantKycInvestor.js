// Grant KYC to an investor account for the configured hUSDT token
// Usage:
//   node backend/scripts/grantKycInvestor.js --account=0.0.xxxxx
//   node backend/scripts/grantKycInvestor.js --account=0xYourEvmAddress
// Or set env vars INVESTOR_ACCOUNT or INVESTOR_EVM

import dotenv from "dotenv";
import {
  Client,
  AccountId,
  TokenId,
  PrivateKey,
  TokenGrantKycTransaction,
} from "@hashgraph/sdk";

dotenv.config();

function getArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function isEvmAddress(str) {
  return /^0x[0-9a-fA-F]{40}$/.test(str || "");
}

async function resolveAccountId(evmOrAccountId) {
  if (!evmOrAccountId) throw new Error("No account input provided");
  if (isEvmAddress(evmOrAccountId)) {
    const url = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${evmOrAccountId}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Mirror Node lookup failed: ${resp.status}`);
    const data = await resp.json();
    const accountId = data?.account;
    if (!accountId) throw new Error("Account ID not found for EVM address");
    return accountId;
  }
  return evmOrAccountId;
}

async function main() {
  try {
    const operatorId = process.env.OPERATOR_ID;
    const operatorKeyStr = process.env.OPERATOR_KEY;
    const tokenIdStr = process.env.HUSDT_TOKEN_ID || process.env.TOKEN_ID;

    if (!operatorId || !operatorKeyStr || !tokenIdStr) {
      throw new Error(
        "Missing env: OPERATOR_ID, OPERATOR_KEY, and HUSDT_TOKEN_ID/TOKEN_ID are required"
      );
    }

    const inputAccount =
      getArg("account") ||
      process.env.INVESTOR_ACCOUNT ||
      process.env.INVESTOR_EVM;

    if (!inputAccount) {
      throw new Error(
        "Provide --account=<hederaId|evmAddress> or set INVESTOR_ACCOUNT / INVESTOR_EVM"
      );
    }

    console.log("Resolving account...", inputAccount);
    const hederaAccountIdStr = await resolveAccountId(inputAccount);
    console.log("Resolved Hedera Account ID:", hederaAccountIdStr);

    const client = Client.forTestnet();
    const operatorKey = PrivateKey.fromStringED25519(operatorKeyStr);
    client.setOperator(operatorId, operatorKey);

    const tokenId = TokenId.fromString(tokenIdStr);
    const accountId = AccountId.fromString(hederaAccountIdStr);

    console.log("Granting KYC...", { tokenId: tokenId.toString(), accountId: accountId.toString() });
    const tx = await new TokenGrantKycTransaction()
      .setTokenId(tokenId)
      .setAccountId(accountId)
      .execute(client);

    const receipt = await tx.getReceipt(client);
    console.log("KYC grant status:", receipt.status.toString());
  } catch (err) {
    console.error("Grant KYC error:", err.message || err);
    process.exitCode = 1;
  }
}

main();