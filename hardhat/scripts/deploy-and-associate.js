const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚀 Starting deployment and token association...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const HUSDT_TOKEN_ADDRESS = process.env.MOCK_USDT_ADDRESS || "0x00000000000000000000000000000000006d3eca";
  const ADMIN_ADDRESS = process.env.ADMIN_EVM_ADDRESS || deployer.address;

  console.log("\n📋 Configuration:");
  console.log("HUSDT Token Address:", HUSDT_TOKEN_ADDRESS);
  console.log("Admin Address:", ADMIN_ADDRESS);

  // Step 1: Deploy FarmShares
  console.log("\n1️⃣ Deploying FarmShares...");
  const FarmShares = await ethers.getContractFactory("FarmShares");
  const farmShares = await FarmShares.deploy("ipfs://");
  await farmShares.waitForDeployment();
  const farmSharesAddress = await farmShares.getAddress();
  console.log("✅ FarmShares deployed at:", farmSharesAddress);

  // Step 2: Deploy AgriYield
  console.log("\n2️⃣ Deploying AgriYield...");
  const AgriYield = await ethers.getContractFactory("AgriYield");
  const agriYield = await AgriYield.deploy(
    farmSharesAddress,
    HUSDT_TOKEN_ADDRESS,
    ADMIN_ADDRESS
  );
  await agriYield.waitForDeployment();
  const agriYieldAddress = await agriYield.getAddress();
  console.log("✅ AgriYield deployed at:", agriYieldAddress);

  // Step 3: Set AgriYield as controller of FarmShares
  console.log("\n3️⃣ Setting AgriYield as FarmShares controller...");
  const tx1 = await farmShares.setAgriYield(agriYieldAddress);
  await tx1.wait();
  console.log("✅ FarmShares controller set");

  // Step 4: Deploy Marketplace
  console.log("\n4️⃣ Deploying Marketplace...");
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(
    HUSDT_TOKEN_ADDRESS,
    agriYieldAddress
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ Marketplace deployed at:", marketplaceAddress);

  // Step 5: Associate AgriYield with HUSDT token
  console.log("\n5️⃣ Associating AgriYield with HUSDT token...");
  const tx2 = await agriYield.associateToken();
  await tx2.wait();
  console.log("✅ AgriYield associated with HUSDT");

  // Step 6: Associate Marketplace with HUSDT token
  console.log("\n6️⃣ Associating Marketplace with HUSDT token...");
  try {
    const tx3 = await marketplace.associateToken();
    await tx3.wait();
    console.log("✅ Marketplace associated with HUSDT");
  } catch (error) {
    console.log("⚠️  Marketplace association:", error.message);
    if (error.message.includes("TOKEN_ALREADY_ASSOCIATED")) {
      console.log("   (Token already associated - this is OK)");
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📝 Contract Addresses:");
  console.log("FarmShares:  ", farmSharesAddress);
  console.log("AgriYield:   ", agriYieldAddress);
  console.log("Marketplace: ", marketplaceAddress);
  console.log("HUSDT Token: ", HUSDT_TOKEN_ADDRESS);

  console.log("\n🔗 HashScan Links:");
  console.log("FarmShares:  ", `https://hashscan.io/testnet/contract/${farmSharesAddress}`);
  console.log("AgriYield:   ", `https://hashscan.io/testnet/contract/${agriYieldAddress}`);
  console.log("Marketplace: ", `https://hashscan.io/testnet/contract/${marketplaceAddress}`);

  console.log("\n📋 Update your .env files with these addresses:");
  console.log(`FARM_SHARES_ADDRESS=${farmSharesAddress}`);
  console.log(`AGRIYIELD_ADDRESS=${agriYieldAddress}`);
  console.log(`MARKETPLACE_ADDRESS=${marketplaceAddress}`);
  console.log(`MOCK_USDT_ADDRESS=${HUSDT_TOKEN_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

