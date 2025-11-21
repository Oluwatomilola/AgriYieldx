const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🔗 Associating existing contracts with HUSDT token...\n");

  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // Contract addresses from .env
  const AGRI_YIELD_ADDRESS = process.env.AGRI_YIELD_ADDRESS || "0x380AAae7b3a9ec87Ff6A5CEd5e1a5110B591D7A5";
  const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS || "0x7CA91C3c6B9B9d9d2F29eb0c5840D0D789987D22";

  console.log("AgriYield Address:  ", AGRI_YIELD_ADDRESS);
  console.log("Marketplace Address:", MARKETPLACE_ADDRESS);

  // Load contract ABIs
  const AgriYieldABI = require("../artifacts/contracts/AgriYield.sol/AgriYield.json").abi;
  const MarketplaceABI = require("../artifacts/contracts/Marketplace.sol/Marketplace.json").abi;

  // Create contract instances
  const agriYield = new ethers.Contract(AGRI_YIELD_ADDRESS, AgriYieldABI, signer);
  const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MarketplaceABI, signer);

  // Associate AgriYield
  console.log("\n1️⃣ Associating AgriYield with HUSDT...");
  try {
    const tx1 = await agriYield.associateToken();
    console.log("   Transaction hash:", tx1.hash);
    const receipt1 = await tx1.wait();
    console.log("✅ AgriYield associated successfully!");
    console.log("   Gas used:", receipt1.gasUsed.toString());
  } catch (error) {
    if (error.message.includes("TOKEN_ALREADY_ASSOCIATED")) {
      console.log("✅ AgriYield already associated with token");
    } else {
      console.error("❌ Error associating AgriYield:", error.message);
    }
  }

  // Associate Marketplace
  console.log("\n2️⃣ Associating Marketplace with HUSDT...");
  try {
    const tx2 = await marketplace.associateToken();
    console.log("   Transaction hash:", tx2.hash);
    const receipt2 = await tx2.wait();
    console.log("✅ Marketplace associated successfully!");
    console.log("   Gas used:", receipt2.gasUsed.toString());
  } catch (error) {
    if (error.message.includes("TOKEN_ALREADY_ASSOCIATED")) {
      console.log("✅ Marketplace already associated with token");
    } else {
      console.error("❌ Error associating Marketplace:", error.message);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 Token association complete!");
  console.log("=".repeat(60));
  console.log("\nContracts can now receive and transfer HUSDT tokens.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

