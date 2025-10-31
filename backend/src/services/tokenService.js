import {
  TokenMintTransaction,
  TokenAssociateTransaction,
  TokenGrantKycTransaction,
  TokenRevokeKycTransaction,
  TransferTransaction,
  AccountBalanceQuery
} from "@hashgraph/sdk";
import { hederaClient } from "./hederaClient.js";

const TOKEN_ID = process.env.HUSDT_TOKEN_ID;

//  Check balance of hUSDT for an account
export async function getHusdtBalance(accountId) {
  const client = hederaClient.client;
  const balance = await new AccountBalanceQuery()
    .setAccountId(accountId)
    .execute(client);

  return balance.tokens._map.get(TOKEN_ID)?.toNumber() || 0;
}

//  Transfer hUSDT (deduct from investor, credit farmer)
export async function transferHusdt(fromAccountId, toAccountId, amount) {
  const client = hederaClient.client;

  const tx = await new TransferTransaction()
    .addTokenTransfer(TOKEN_ID, fromAccountId, -amount)
    .addTokenTransfer(TOKEN_ID, toAccountId, amount)
    .freezeWith(client)
    .sign(hederaClient.operatorKey);

  const submit = await tx.execute(client);
  const receipt = await submit.getReceipt(client);

  return receipt.status.toString();
}

// Associates a token with a given account
export async function associateToken(accountId, tokenId = TOKEN_ID) {
  const client = hederaClient.client;

  const tx = await new TokenAssociateTransaction()
    .setAccountId(accountId)
    .setTokenIds([tokenId])
    .freezeWith(client)
    .sign(hederaClient.operatorKey);

  const submit = await tx.execute(client);
  const receipt = await submit.getReceipt(client);

  return receipt.status.toString();
}

// Grants KYC for an account
export async function grantKyc(accountId, tokenId = TOKEN_ID) {
  const client = hederaClient.client;

  const tx = await new TokenGrantKycTransaction()
    .setAccountId(accountId)
    .setTokenId(tokenId)
    .freezeWith(client)
    .sign(hederaClient.operatorKey);

  const submit = await tx.execute(client);
  const receipt = await submit.getReceipt(client);

  return receipt.status.toString();
}

//  Revokes KYC for an account
export async function revokeKyc(accountId, tokenId = TOKEN_ID) {
  const client = hederaClient.client;

  const tx = await new TokenRevokeKycTransaction()
    .setAccountId(accountId)
    .setTokenId(tokenId)
    .freezeWith(client)
    .sign(hederaClient.operatorKey);

  const submit = await tx.execute(client);
  const receipt = await submit.getReceipt(client);

  return receipt.status.toString();
}

// ✅ Faucet: Mint new supply and transfer to user
export async function faucetClaim(toAddress, amount) {
  const client = hederaClient.client;

  // Convert EVM address to Hedera AccountId if needed
  let toAccountId;
  if (toAddress.startsWith('0x')) {
    // EVM address - use directly for HTS
    toAccountId = toAddress;
  } else {
    // Already Hedera format
    toAccountId = toAddress;
  }

  // Mint
  const mintTx = await new TokenMintTransaction()
    .setTokenId(TOKEN_ID)
    .setAmount(amount)
    .freezeWith(client)
    .sign(hederaClient.operatorKey);

  const mintSubmit = await mintTx.execute(client);
  const mintReceipt = await mintSubmit.getReceipt(client);

  // Transfer from treasury (operator) to user
  const transferTx = await new TransferTransaction()
    .addTokenTransfer(TOKEN_ID, hederaClient.operatorId, -amount)
    .addTokenTransfer(TOKEN_ID, toAccountId, amount)
    .freezeWith(client)
    .sign(hederaClient.operatorKey);

  const transferSubmit = await transferTx.execute(client);
  const transferReceipt = await transferSubmit.getReceipt(client);

  return {
    mintStatus: mintReceipt.status.toString(),
    transferStatus: transferReceipt.status.toString(),
    amount: amount
  };
}
