require("dotenv").config();
const {
  Client,
  AccountId,
  PrivateKey,
  TokenId,
  TokenAssociateTransaction,
  TokenGrantKycTransaction,
  TransferTransaction,
  AccountBalanceQuery,
} = require("@hashgraph/sdk");

async function main() {
  console.log("🔧 Setting up HTS token for deployer account...\n");

  // Setup client
  const client = Client.forTestnet();
  const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
  const operatorKey = PrivateKey.fromStringED25519(process.env.OPERATOR_KEY);
  client.setOperator(operatorId, operatorKey);

  const tokenId = TokenId.fromString(process.env.HUSDT_TOKEN_ID);
  const deployerEvmAddress = process.env.ADMIN_EVM_ADDRESS;

  console.log("📋 Configuration:");
  console.log("Operator Account:", operatorId.toString());
  console.log("Token ID:", tokenId.toString());
  console.log("Deployer EVM Address:", deployerEvmAddress);

  // Step 1: Associate operator account with token
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Associate Operator Account with Token");
  console.log("=".repeat(60));

  try {
    const associateTx = await new TokenAssociateTransaction()
      .setAccountId(operatorId)
      .setTokenIds([tokenId])
      .freezeWith(client)
      .sign(operatorKey);

    const associateSubmit = await associateTx.execute(client);
    const associateReceipt = await associateSubmit.getReceipt(client);

    console.log("✅ Association successful!");
    console.log("   Status:", associateReceipt.status.toString());
  } catch (error) {
    if (error.message.includes("TOKEN_ALREADY_ASSOCIATED")) {
      console.log("✅ Already associated");
    } else {
      console.log("❌ Association failed:", error.message);
      throw error;
    }
  }

  // Step 2: Grant KYC to operator account (if token has KYC)
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Grant KYC to Operator Account");
  console.log("=".repeat(60));

  try {
    // Note: This will only work if the operator key is also the KYC key
    const kycTx = await new TokenGrantKycTransaction()
      .setAccountId(operatorId)
      .setTokenId(tokenId)
      .freezeWith(client)
      .sign(operatorKey);

    const kycSubmit = await kycTx.execute(client);
    const kycReceipt = await kycSubmit.getReceipt(client);

    console.log("✅ KYC granted!");
    console.log("   Status:", kycReceipt.status.toString());
  } catch (error) {
    if (error.message.includes("INVALID_SIGNATURE")) {
      console.log("⚠️  Cannot grant KYC - operator key is not the KYC key");
      console.log("   You'll need to use the account that has the KYC key");
    } else {
      console.log("❌ KYC grant failed:", error.message);
    }
  }

  // Step 3: Check balance
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Check Token Balance");
  console.log("=".repeat(60));

  const balance = await new AccountBalanceQuery()
    .setAccountId(operatorId)
    .execute(client);

  const tokenBalance = balance.tokens.get(tokenId);
  console.log("✅ Current balance:", tokenBalance ? tokenBalance.toString() : "0", "tokens");

  console.log("\n🎉 Setup complete!");
  console.log("\nNote: If you need tokens, you'll need to:");
  console.log("1. Have KYC granted by the account with the KYC key");
  console.log("2. Receive a transfer from the treasury or another account");

  client.close();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

