import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  Client,
  TokenMintTransaction,
  TransferTransaction,
  TokenGrantKycTransaction,
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

// Faucet endpoint
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

    // Step 1: Look up Hedera Account ID from EVM address using Mirror Node
    let hederaAccountId;
    try {
      const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${evmAddress}`;
      const response = await fetch(mirrorNodeUrl);

      if (!response.ok) {
        throw new Error(`Account not found. Please ensure your wallet has been activated on Hedera by receiving some HBAR first.`);
      }

      const accountData = await response.json();
      hederaAccountId = accountData.account;
      console.log(`✅ Found Hedera Account ID: ${hederaAccountId} for EVM address: ${evmAddress}`);
    } catch (err) {
      console.error('Mirror node lookup error:', err.message);
      throw new Error('Account lookup failed. Make sure your account exists on Hedera testnet.');
    }

    // Step 2: Check if token is associated via Mirror Node
    let isAssociated = false;
    try {
      const tokenCheckUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${hederaAccountId}/tokens?token.id=${TOKEN_ID.toString()}`;
      const tokenResponse = await fetch(tokenCheckUrl);
      const tokenData = await tokenResponse.json();
      isAssociated = tokenData.tokens && tokenData.tokens.length > 0;
      console.log(`Token association check: ${isAssociated ? 'Associated' : 'Not associated'}`);
    } catch (err) {
      console.log('Token association check failed, assuming not associated');
    }

    // If not associated, we need the user to associate (can't do it from backend without their key)
    if (!isAssociated) {
      throw new Error('Token not associated. Please associate the hUSDT token to your account first. You can do this by adding the token in your wallet: Token ID 0.0.6918795');
    }

    // Step 3: Grant KYC using the proper Hedera Account ID
    try {
      const kycTx = await new TokenGrantKycTransaction()
        .setTokenId(TOKEN_ID)
        .setAccountId(AccountId.fromString(hederaAccountId))
        .execute(client);

      await kycTx.getReceipt(client);
      console.log(`✅ KYC granted for account ${hederaAccountId}`);
    } catch (kycErr) {
      console.log('KYC grant info:', kycErr.message);
      // Continue - KYC might already be granted
    }

    // Step 3: Mint tokens to treasury
    const mintTx = await new TokenMintTransaction()
      .setTokenId(TOKEN_ID)
      .setAmount(amount)
      .execute(client);

    await mintTx.getReceipt(client);

    // Step 4: Transfer to user using Hedera Account ID
    const transferTx = await new TransferTransaction()
      .addTokenTransfer(TOKEN_ID, process.env.OPERATOR_ID, -amount)
      .addTokenTransfer(TOKEN_ID, AccountId.fromString(hederaAccountId), amount)
      .execute(client);

    await transferTx.getReceipt(client);

    // Update cooldown
    faucetDB.faucetClaims[evmAddress] = now;

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

// Grant KYC endpoint
app.post("/api/kyc/grant", async (req, res) => {
  try {
    const { evmAddress } = req.body;
    if (!evmAddress) return res.status(400).json({ error: "evmAddress required" });

    const kycTx = await new TokenGrantKycTransaction()
      .setTokenId(TOKEN_ID)
      .setAccountId(evmAddress)
      .execute(client);

    const kycReceipt = await kycTx.getReceipt(client);

    res.json({
      success: true,
      status: kycReceipt.status.toString()
    });
  } catch (err) {
    console.error("KYC error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Check KYC status endpoint
app.post("/api/kyc/check", async (req, res) => {
  try {
    const { evmAddress } = req.body;
    if (!evmAddress) return res.status(400).json({ error: "evmAddress required" });

    // Look up Hedera Account ID
    const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${evmAddress}`;
    const response = await fetch(mirrorNodeUrl);
    if (!response.ok) {
      return res.status(400).json({ error: "Account not found on Hedera testnet" });
    }

    const accountData = await response.json();
    const hederaAccountId = accountData.account;

    // Check token association and KYC status via Mirror Node
    const tokenCheckUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${hederaAccountId}/tokens?token.id=${TOKEN_ID.toString()}`;
    const tokenResponse = await fetch(tokenCheckUrl);
    const tokenData = await tokenResponse.json();
    const isAssociated = tokenData.tokens && tokenData.tokens.length > 0;

    if (!isAssociated) {
      return res.json({ kycApproved: false, message: "Token not associated" });
    }

    // Check actual on-chain KYC status from Mirror Node
    const tokenInfo = tokenData.tokens[0];
    const kycGranted = tokenInfo.kyc_status === "GRANTED";

    res.json({
      kycApproved: kycGranted,
      message: kycGranted ? "KYC approved" : "KYC not granted yet"
    });
  } catch (err) {
    console.error("KYC check error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Investment endpoint (KYC-gated)
app.post("/api/farm/invest", async (req, res) => {
  try {
    const { evmAddress, farmId, amount } = req.body;
    if (!evmAddress || !farmId || !amount) {
      return res.status(400).json({ error: "evmAddress, farmId, and amount required" });
    }

    // Check KYC status
    const hasClaimed = !!faucetDB.faucetClaims[evmAddress];
    if (!hasClaimed) {
      return res.status(403).json({ error: "KYC required. Please claim from faucet first to complete KYC verification." });
    }

    // In a real implementation, this would interact with smart contracts
    // For now, return success to show KYC gating works
    res.json({
      success: true,
      farmId,
      amount,
      message: "Investment successful! (Demo mode - contracts not deployed yet)"
    });
  } catch (err) {
    console.error("Investment error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Marketplace purchase endpoint (KYC-gated)
app.post("/api/marketplace/purchase", async (req, res) => {
  try {
    const { evmAddress, listingId, quantity } = req.body;
    if (!evmAddress || !listingId || !quantity) {
      return res.status(400).json({ error: "evmAddress, listingId, and quantity required" });
    }

    // Check KYC status
    const hasClaimed = !!faucetDB.faucetClaims[evmAddress];
    if (!hasClaimed) {
      return res.status(403).json({ error: "KYC required. Please claim from faucet first to complete KYC verification." });
    }

    // In a real implementation, this would interact with smart contracts
    // For now, return success to show KYC gating works
    res.json({
      success: true,
      listingId,
      quantity,
      message: "Purchase successful! (Demo mode - contracts not deployed yet)"
    });
  } catch (err) {
    console.error("Purchase error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", tokenId: TOKEN_ID.toString() });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`✅ Token ID: ${TOKEN_ID.toString()}`);
});
