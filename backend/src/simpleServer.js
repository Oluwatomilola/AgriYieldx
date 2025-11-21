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
import associationRoutes from "./routes/associationRoutes.js";
import ipfsRoutes from "./routes/ipfsRoutes.js";
import tokenRoutes from "./routes/tokenRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import receipts from "./receipts/index.cjs";
import {
  generateNonce,
  authenticateWithMetaMask,
  authMiddleware
} from "./services/authService.js";
import {
  transferTokens,
  getTokenBalance,
  callInvestFunction,
  evmAddressToAccountId,
  preflightTokenTransfer
} from "./services/hederaService.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/association", associationRoutes);
app.use("/api/ipfs", ipfsRoutes);
app.use("/api/token", tokenRoutes);
app.use("/api/admin", adminRoutes);
receipts.attachReceiptsRoutes(app, "/api/receipts");
receipts.initReceiptListeners();

let client = Client.forTestnet();
if (process.env.OPERATOR_ID && process.env.OPERATOR_KEY) {
  client.setOperator(
    AccountId.fromString(process.env.OPERATOR_ID),
    PrivateKey.fromStringED25519(process.env.OPERATOR_KEY)
  );
}
let TOKEN_ID = process.env.HUSDT_TOKEN_ID ? TokenId.fromString(process.env.HUSDT_TOKEN_ID) : undefined;
const faucetDB = { faucetClaims: {} };

// Faucet endpoint
app.post("/api/faucet/claim", async (req, res) => {
  try {
    const { evmAddress } = req.body;
    if (!evmAddress) return res.status(400).json({ error: "evmAddress required" });
    if (!TOKEN_ID || !process.env.OPERATOR_ID || !process.env.OPERATOR_KEY) return res.status(500).json({ error: "Server configuration missing" });

    // Check cooldown
    const lastClaim = faucetDB.faucetClaims[evmAddress] || 0;
    const now = Date.now();
    if (now - lastClaim < 24 * 60 * 60 * 1000) {
      return res.status(400).json({ error: "Faucet can only be claimed once every 24h" });
    }

    const amount = 1000 * 1000000; // 1,000 tokens with 6 decimals

   // Look up Hedera Account ID from EVM address using Mirror Node
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

    // Check if token is associated via Mirror Node
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
    if (!TOKEN_ID) return res.status(500).json({ error: "Token not configured" });

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
    if (!TOKEN_ID) return res.status(500).json({ error: "Token not configured" });

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

// 
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

    // The actual investment is handled by the frontend calling:
    // 1. HTS precompile cryptoTransfer (0x167)
    // 2. AgriYield contract invest() function
    // This endpoint can be used for logging/validation if needed
    res.json({
      success: true,
      farmId,
      amount,
      message: "Investment process validated. Frontend will handle HTS token transfer and share claiming.",
      instructions: {
        step1: "Call HTS precompile cryptoTransfer to send HUSDT to AgriYield contract",
        step2: "Call AgriYield.invest() to claim farm shares"
      }
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

// ============================================================
// AUTHENTICATION ENDPOINTS (MetaMask)
// ============================================================

// Request nonce for MetaMask authentication
app.post("/api/auth/nonce", (req, res) => {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: "Address required" });
    }

    const nonce = generateNonce(address);
    const message = `Sign this message to authenticate with AgriYield.\n\nNonce: ${nonce}\nAddress: ${address}`;

    res.json({
      success: true,
      nonce,
      message
    });
  } catch (err) {
    console.error("Nonce generation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Verify signature and login/signup
app.post("/api/auth/verify", (req, res) => {
  try {
    const { address, signature } = req.body;
    if (!address || !signature) {
      return res.status(400).json({ error: "Address and signature required" });
    }

    const result = authenticateWithMetaMask(address, signature);

    if (!result.success) {
      return res.status(401).json(result);
    }

    // Mark user as KYC approved (since they connected wallet)
    faucetDB.faucetClaims[address.toLowerCase()] = Date.now();

    res.json({
      success: true,
      token: result.token,
      address: result.address,
      message: "Authentication successful"
    });
  } catch (err) {
    console.error("Authentication error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get current user info (protected route)
app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json({
    success: true,
    address: req.user.address
  });
});

// ============================================================
// INVESTMENT ENDPOINTS (Backend-Managed Token Transfers)
// ============================================================

// Invest in a farm (protected route)
app.post("/api/farm/invest-backend", authMiddleware, async (req, res) => {
  try {
    const { farmId, amount } = req.body;
    const investorAddress = req.user.address;

    if (!farmId || !amount) {
      return res.status(400).json({ error: "farmId and amount required" });
    }

    // Convert EVM addresses to Hedera Account IDs
    if (!process.env.HUSDT_TOKEN_ID || !process.env.AGRIYIELD_ADDRESS) {
      return res.status(500).json({ error: "Server configuration missing" });
    }
    const investorAccountId = await evmAddressToAccountId(investorAddress);
    const contractAccountId = await evmAddressToAccountId(process.env.AGRIYIELD_ADDRESS);
    const tokenId = process.env.HUSDT_TOKEN_ID;

    console.log(`Investment request:
      Investor: ${investorAddress} (${investorAccountId})
      Farm ID: ${farmId}
      Amount: ${amount}
      Contract: ${process.env.AGRIYIELD_ADDRESS} (${contractAccountId})
    `);

    // Step 1: Preflight checks
    console.log("Step 1: Preflight checks...");
    const preflight = await preflightTokenTransfer(
      investorAccountId,
      contractAccountId,
      tokenId,
      parseInt(amount)
    );

    if (!preflight.success) {
      // Attempt KYC remediation if required
      if (preflight.reason === "SENDER_KYC_REQUIRED" || preflight.reason === "RECEIVER_KYC_REQUIRED") {
        try {
          const { grantKyc } = await import("./services/tokenService.js");
          if (preflight.reason === "SENDER_KYC_REQUIRED") {
            console.log(`Granting KYC to sender ${investorAccountId} for token ${tokenId}...`);
            await grantKyc(investorAccountId, tokenId);
          }
          if (preflight.reason === "RECEIVER_KYC_REQUIRED") {
            console.log(`Granting KYC to receiver ${contractAccountId} for token ${tokenId}...`);
            await grantKyc(contractAccountId, tokenId);
          }
          // Re-run preflight after KYC grant
          const retry = await preflightTokenTransfer(
            investorAccountId,
            contractAccountId,
            tokenId,
            parseInt(amount)
          );
          if (!retry.success) {
            return res.status(400).json({
              error: "Token transfer preflight failed after KYC grant",
              reason: retry.reason,
              message: retry.message,
              details: retry.details ?? undefined
            });
          }
        } catch (kycErr) {
          console.error("KYC remediation error:", kycErr);
          return res.status(400).json({
            error: "KYC remediation failed",
            reason: preflight.reason,
            message: preflight.message,
            details: preflight.details ?? undefined
          });
        }
      } else {
        return res.status(400).json({
          error: "Token transfer preflight failed",
          reason: preflight.reason,
          message: preflight.message,
          details: preflight.details ?? undefined
        });
      }
    }

    // Step 2: Transfer tokens from investor to contract
    console.log("Step 1: Transferring tokens...");
    const transferResult = await transferTokens(
      investorAccountId,
      contractAccountId,
      tokenId,
      parseInt(amount)
    );

  if (!transferResult.success) {
      // If the error is INVALID_SIGNATURE, the backend cannot sign on behalf of the user.
      if (transferResult.reason === "INVALID_SIGNATURE" || String(transferResult.error || "").includes("INVALID_SIGNATURE")) {
        return res.status(400).json({
          error: "Token transfer requires user signature",
          reason: "INVALID_SIGNATURE",
          message: "Please perform the HUSDT transfer from your wallet (frontend) or use token allowances.",
          instructions: {
            option1: "Use frontend to call HTS precompile cryptoTransfer (0x167) sending HUSDT to AgriYield contract",
            option2: "Approve allowance to backend/contract and use approved token transfer flow",
            note: "After funds arrive at the contract, call AgriYield.invest(farmId, amount) from your wallet"
          }
        });
      }
      return res.status(500).json({
        error: "Token transfer failed",
        details: transferResult.error
      });
    }

    console.log("✅ Tokens transferred:", transferResult.transactionId);

    // Step 3: Call contract's invest function
    console.log("Step 2: Calling invest function...");
    const investResult = await callInvestFunction(farmId, amount, investorAddress);

    if (!investResult.success) {
      return res.status(500).json({
        error: "Investment contract call failed",
        details: investResult.error,
        note: "Tokens were transferred but shares were not minted. Please contact support."
      });
    }

    console.log("✅ Investment complete:", investResult.transactionId);

    res.json({
      success: true,
      transferTxId: transferResult.transactionId,
      investTxId: investResult.transactionId,
      message: "Investment successful! You have received your farm shares."
    });
  } catch (err) {
    console.error("Investment error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get token balance (protected route)
app.get("/api/token/balance", authMiddleware, async (req, res) => {
  try {
    const address = req.user.address;
    const accountId = await evmAddressToAccountId(address);
    if (!process.env.HUSDT_TOKEN_ID) return res.status(500).json({ error: "Token not configured" });
    const tokenId = process.env.HUSDT_TOKEN_ID;

    const result = await getTokenBalance(accountId, tokenId);

    res.json({
      success: true,
      balance: result.balance,
      address,
      accountId
    });
  } catch (err) {
    console.error("Balance query error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", tokenId: TOKEN_ID ? TOKEN_ID.toString() : null });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  if (TOKEN_ID) console.log(`✅ Token ID: ${TOKEN_ID.toString()}`);
  console.log(`✅ MetaMask authentication enabled`);
  console.log(`✅ Backend-managed token transfers enabled`);
});
