require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Checking HUSDT Balance...\n");

  const HUSDT_ADDRESS = process.env.MOCK_USDT_ADDRESS;
  const DEPLOYER_ADDRESS = process.env.ADMIN_EVM_ADDRESS;

  console.log("HUSDT Token:", HUSDT_ADDRESS);
  console.log("Deployer:", DEPLOYER_ADDRESS);

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("Signer address:", deployer.address);

  // Load IERC20 interface
  const husdt = await ethers.getContractAt("IERC20", HUSDT_ADDRESS);

  try {
    const balance = await husdt.balanceOf(deployer.address);
    console.log("\n✅ Balance:", ethers.formatUnits(balance, 6), "HUSDT");
    console.log("   Raw balance:", balance.toString());
  } catch (error) {
    console.log("\n❌ Error checking balance:", error.message);
  }

  // Also check via provider
  try {
    const code = await ethers.provider.getCode(HUSDT_ADDRESS);
    console.log("\n📝 Contract code length:", code.length);
  } catch (error) {
    console.log("\n❌ Error checking contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

