import {
  Client,
  AccountId,
  PrivateKey,
  TokenId,
  TransferTransaction,
  AccountBalanceQuery,
  ContractExecuteTransaction,
  ContractId,
  ContractFunctionParameters
} from '@hashgraph/sdk';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Hedera client
let client = null;

/**
 * Get or create Hedera client
 * @returns {Client} - Hedera client instance
 */
function getClient() {
  if (client) return client;
  
  const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
  const operatorKey = PrivateKey.fromString(process.env.OPERATOR_KEY);
  
  client = Client.forTestnet();
  client.setOperator(operatorId, operatorKey);
  
  return client;
}

/**
 * Convert EVM address to Hedera Account ID
 * @param {string} evmAddress - EVM address (0x...)
 * @returns {string} - Hedera Account ID (0.0.xxxxx)
 */
// Resolve an EVM address to a Hedera ID via Mirror Node.
// For wallet addresses, returns the `account` (e.g., 0.0.x).
// For contract addresses, falls back to `contract_id`.
export async function evmAddressToAccountId(evmAddress) {
  try {
    const addr = String(evmAddress).trim();
    if (!addr.startsWith("0x")) {
      // Already a Hedera ID like 0.0.x, return as-is
      return addr;
    }

    // Try accounts endpoint first
    const accountResp = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${addr}`);
    if (accountResp.ok) {
      const data = await accountResp.json();
      if (data && data.account) return data.account; // e.g. "0.0.12345"
    }

    // Fallback to contracts endpoint
    const contractResp = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/contracts/${addr}`);
    if (contractResp.ok) {
      const data = await contractResp.json();
      if (data && data.contract_id) return data.contract_id; // e.g. "0.0.54321"
    }

    throw new Error("Mirror Node lookup failed for EVM address");
  } catch (err) {
    console.error("evmAddressToAccountId error:", err);
    throw err;
  }
}

/**
 * Transfer HTS tokens from one account to another
 * @param {string} fromAccountId - Sender Hedera Account ID (0.0.xxxxx)
 * @param {string} toAccountId - Receiver Hedera Account ID (0.0.xxxxx)
 * @param {string} tokenId - Token ID (0.0.xxxxx)
 * @param {number} amount - Amount to transfer (in smallest units)
 * @returns {Object} - Transaction result
 */
export async function transferTokens(fromAccountId, toAccountId, tokenId, amount) {
  try {
    const client = getClient();
    
    // Create the transfer transaction
    const transaction = new TransferTransaction()
      .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(fromAccountId), -amount)
      .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(toAccountId), amount)
      .freezeWith(client);
    
    // Execute the transaction
    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    
    return {
      success: true,
      status: receipt.status.toString(),
      transactionId: txResponse.transactionId.toString()
    };
  } catch (error) {
    console.error('Token transfer error:', error);
    const isInvalidSignature = typeof error?.message === 'string' && error.message.includes('INVALID_SIGNATURE');
    return {
      success: false,
      reason: isInvalidSignature ? 'INVALID_SIGNATURE' : 'TRANSFER_ERROR',
      error: error.message
    };
  }
}

export async function checkTokenRelationship(accountId, tokenId) {
  try {
    // Use filtered token-relationship endpoint to avoid pagination issues on /accounts response
    const url = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/tokens?token.id=${tokenId}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Mirror Node token relationship lookup failed");
    const data = await resp.json();

    const tokens = data.tokens || [];
    const rel = tokens[0]; // filtered by token.id, so first (and only) match if associated
    const associated = tokens.length > 0;
    const kycGranted = rel?.kyc_status === "GRANTED" || rel?.kyc_status === undefined;

    return { associated, kycGranted, debug: { url, tokensCount: tokens.length, kyc_status: rel?.kyc_status } };
  } catch (err) {
    console.error("checkTokenRelationship error:", err);
    return { associated: false, kycGranted: false, error: err.message };
  }
}

export async function preflightTokenTransfer(fromAccountId, toAccountId, tokenId, amount) {
  try {
    const fromRel = await checkTokenRelationship(fromAccountId, tokenId);
    const toRel = await checkTokenRelationship(toAccountId, tokenId);

    console.log("Preflight debug:", {
      tokenId,
      fromAccountId,
      toAccountId,
      fromRel,
      toRel
    });

    if (!fromRel.associated) {
      return { success: false, reason: "SENDER_NOT_ASSOCIATED", message: "Token not associated with sender account", details: { tokenId, accountId: fromAccountId, rel: fromRel } };
    }
    if (!toRel.associated) {
      return { success: false, reason: "RECEIVER_NOT_ASSOCIATED", message: "Token not associated with receiver account", details: { tokenId, accountId: toAccountId, rel: toRel } };
    }
    if (!fromRel.kycGranted) {
      return { success: false, reason: "SENDER_KYC_REQUIRED", message: "KYC not granted for sender", details: { tokenId, accountId: fromAccountId, rel: fromRel } };
    }
    if (!toRel.kycGranted) {
      return { success: false, reason: "RECEIVER_KYC_REQUIRED", message: "KYC not granted for receiver", details: { tokenId, accountId: toAccountId, rel: toRel } };
    }

    const client = getClient();
    const balanceQuery = new AccountBalanceQuery().setAccountId(AccountId.fromString(fromAccountId));
    const balance = await balanceQuery.execute(client);
    const tokenBalance = balance.tokens.get(TokenId.fromString(tokenId)) || 0n;
    if (tokenBalance < BigInt(amount)) {
      return { success: false, reason: "INSUFFICIENT_BALANCE", message: "Insufficient HUSDT balance", details: { required: amount.toString(), available: tokenBalance.toString(), tokenId, accountId: fromAccountId } };
    }

    return { success: true };
  } catch (err) {
    console.error("preflightTokenTransfer error:", err);
    return { success: false, reason: "PREFLIGHT_ERROR", message: err.message };
  }
}

/**
 * Get token balance for an account
 * @param {string} accountId - Hedera Account ID (0.0.xxxxx)
 * @param {string} tokenId - Token ID (0.0.xxxxx)
 * @returns {Object} - Balance information
 */
export async function getTokenBalance(accountId, tokenId) {
  try {
    const client = getClient();
    
    const balanceQuery = new AccountBalanceQuery()
      .setAccountId(accountId);
    
    const balance = await balanceQuery.execute(client);
    const tokenBalance = balance.tokens.get(TokenId.fromString(tokenId));
    
    return {
      success: true,
      balance: tokenBalance ? tokenBalance.toString() : '0'
    };
  } catch (error) {
    console.error('Balance query error:', error);
    return {
      success: false,
      error: error.message,
      balance: '0'
    };
  }
}

/**
 * Call AgriYield contract's invest function after tokens are transferred
 * @param {string} farmId - Farm ID
 * @param {string} amount - Investment amount
 * @param {string} investorAddress - Investor's EVM address
 * @returns {Object} - Transaction result
 */
export async function callInvestFunction(farmId, amount, investorAddress) {
  try {
    const client = getClient();
    const contractId = ContractId.fromEvmAddress(0, 0, process.env.AGRIYIELD_ADDRESS);
    
    // Create contract function parameters
    const params = new ContractFunctionParameters()
      .addUint256(farmId)
      .addUint256(amount);
    
    // Execute contract function
    const transaction = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(300000)
      .setFunction('invest', params)
      .freezeWith(client);
    
    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    
    return {
      success: true,
      status: receipt.status.toString(),
      transactionId: txResponse.transactionId.toString()
    };
  } catch (error) {
    console.error('Contract call error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

