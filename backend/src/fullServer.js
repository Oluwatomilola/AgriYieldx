import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  Client,
  TokenMintTransaction,
  TransferTransaction,
  TokenGrantKycTransaction,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  PrivateKey,
  TokenId,
  AccountId
} from "@hashgraph/sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Hedera client
const client = Client.forTestnet();
client.setOperator(
  AccountId.fromString(process.env.OPERATOR_ID),
  PrivateKey.fromStringED25519(process.env.OPERATOR_KEY)
);

const TOKEN_ID = TokenId.fromString(process.env.HUSDT_TOKEN_ID);
const faucetDB = { faucetClaims: {} };

// HCS Topic for transaction logging
let HCS_TOPIC_ID = process.env.HCS_TOPIC_ID;

// Initialize HCS Topic if not exists
async function initializeHCSTopic() {
  if (!HCS_TOPIC_ID) {
    console.log("Creating new HCS topic for transaction logging...");
    const topicTx = await new TopicCreateTransaction()
      .setTopicMemo("AgriYield Transaction Log")
      .execute(client);
    const receipt = await topicTx.getReceipt(client);
    HCS_TOPIC_ID = receipt.topicId.toString();
    console.log(`✅ HCS Topic created: ${HCS_TOPIC_ID}`);
    console.log(`Add this to your .env file: HCS_TOPIC_ID=${HCS_TOPIC_ID}`);
  } else {
    console.log(`✅ Using HCS Topic: ${HCS_TOPIC_ID}`);
  }
}

// Log transaction to HCS
async function logToHCS(eventType, data) {
  try {
    const message = JSON.stringify({
      timestamp: new Date().toISOString(),
      eventType,
      data
    });

    await new TopicMessageSubmitTransaction()
      .setTopicId(HCS_TOPIC_ID)
      .setMessage(message)
      .execute(client);

    console.log(`📝 Logged to HCS: ${eventType}`);
  } catch (error) {
    console.error("HCS logging error:", error.message);
  }
}

// ==================== FAUCET ENDPOINTS ====================

app.post("/api/faucet/claim", async (req, res) => {
  try {
    const { evmAddress } = req.body;
    if (!evmAddress) return res.status(400).json({ error: "evmAddress required" });

    // Check cooldown
    const lastClaim = faucetDB.faucetClaims[evmAddress] || 0;
    const now = Date.now();
    if (now - lastClaim < 24 * 60 * 60 * 1000) {
      return res.status(400).json({ error: "Faucet can only be claimed once every 24h" });
    }

    const amount = 1000 * 1000000; // 1,000 tokens with 6 decimals

    // Step 1: Look up Hedera Account ID
    let hederaAccountId;
    try {
      const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${evmAddress}`;
      const response = await fetch(mirrorNodeUrl);
      if (!response.ok) {
        throw new Error(`Account not found`);
      }
      const accountData = await response.json();
      hederaAccountId = accountData.account;
    } catch (err) {
      return res.status(400).json({ error: "Account not found on Hedera testnet" });
    }

    // Step 2: Check token association
    const tokenCheckUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${hederaAccountId}/tokens?token.id=${TOKEN_ID.toString()}`;
    const tokenResponse = await fetch(tokenCheckUrl);
    const tokenData = await tokenResponse.json();
    const isAssociated = tokenData.tokens && tokenData.tokens.length > 0;

    if (!isAssociated) {
      return res.status(400).json({ error: "Token not associated. Please associate token 0.0.6918795 first" });
    }

    // Step 3: Grant KYC
    try {
      const kycTx = await new TokenGrantKycTransaction()
        .setTokenId(TOKEN_ID)
        .setAccountId(AccountId.fromString(hederaAccountId))
        .execute(client);
      await kycTx.getReceipt(client);
    } catch (kycErr) {
      console.log('KYC already granted or error:', kycErr.message);
    }

    // Step 4: Mint and transfer tokens
    const mintTx = await new TokenMintTransaction()
      .setTokenId(TOKEN_ID)
      .setAmount(amount)
      .execute(client);
    await mintTx.getReceipt(client);

    const transferTx = await new TransferTransaction()
      .addTokenTransfer(TOKEN_ID, process.env.OPERATOR_ID, -amount)
      .addTokenTransfer(TOKEN_ID, AccountId.fromString(hederaAccountId), amount)
      .execute(client);
    await transferTx.getReceipt(client);

    // Update cooldown
    faucetDB.faucetClaims[evmAddress] = now;

    // Log to HCS
    await logToHCS("FAUCET_CLAIM", {
      evmAddress,
      hederaAccountId,
      amount: 1000,
      transactionId: transferTx.transactionId.toString()
    });

    res.json({
      success: true,
      amount: 1000,
      transactionId: transferTx.transactionId.toString()
    });
  } catch (err) {
    console.error("Faucet error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== KYC ENDPOINTS ====================

app.post("/api/kyc/check", async (req, res) => {
  try {
    const { evmAddress } = req.body;
    if (!evmAddress) return res.status(400).json({ error: "evmAddress required" });

    const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${evmAddress}`;
    const response = await fetch(mirrorNodeUrl);
    if (!response.ok) {
      return res.status(400).json({ error: "Account not found" });
    }

    const accountData = await response.json();
    const hederaAccountId = accountData.account;

    const tokenCheckUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${hederaAccountId}/tokens?token.id=${TOKEN_ID.toString()}`;
    const tokenResponse = await fetch(tokenCheckUrl);
    const tokenData = await tokenResponse.json();
    const isAssociated = tokenData.tokens && tokenData.tokens.length > 0;

    if (!isAssociated) {
      return res.json({ kycApproved: false, message: "Token not associated" });
    }

    const hasClaimed = !!faucetDB.faucetClaims[evmAddress];
    res.json({
      kycApproved: hasClaimed,
      message: hasClaimed ? "KYC approved" : "Claim faucet first to complete KYC"
    });
  } catch (err) {
    console.error("KYC check error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== HEALTH CHECK ====================

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    tokenId: TOKEN_ID.toString(),
    hcsTopic: HCS_TOPIC_ID || "Not initialized",
    contracts: {
      agriYield: process.env.AGRIYIELD_ADDRESS,
      marketplace: process.env.MARKETPLACE_ADDRESS,
      farmShares: process.env.FARM_SHARES_ADDRESS
    }
  });
});

// ==================== SERVER INITIALIZATION ====================

const PORT = process.env.PORT || 4000;

async function startServer() {
  await initializeHCSTopic();
  app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
    console.log(`✅ Token ID: ${TOKEN_ID.toString()}`);
    console.log(`✅ Contracts:`);
    console.log(`   - AgriYield: ${process.env.AGRIYIELD_ADDRESS}`);
    console.log(`   - Marketplace: ${process.env.MARKETPLACE_ADDRESS}`);
    console.log(`   - FarmShares: ${process.env.FARM_SHARES_ADDRESS}`);
  });
}

startServer().catch(console.error);
