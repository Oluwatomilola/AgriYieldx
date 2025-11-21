require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const HUSDT_ADDRESS = process.env.MOCK_USDT_ADDRESS;
  const AGRIYIELD_ADDRESS = process.env.AGRI_YIELD_ADDRESS;

  const [deployer] = await ethers.getSigners();
  
  console.log("Checking balances...\n");
  console.log("Deployer:", deployer.address);
  console.log("AgriYield:", AGRIYIELD_ADDRESS);
  console.log("HUSDT:", HUSDT_ADDRESS);
  console.log();

  // Load HUSDT contract
  const husdt = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", HUSDT_ADDRESS);
  
  // Check balances
  const deployerBalance = await husdt.balanceOf(deployer.address);
  const agriYieldBalance = await husdt.balanceOf(AGRIYIELD_ADDRESS);
  
  console.log("Deployer HUSDT balance:", ethers.formatUnits(deployerBalance, 6), "HUSDT");
  console.log("AgriYield HUSDT balance:", ethers.formatUnits(agriYieldBalance, 6), "HUSDT");
  
  // Load AgriYield contract
  const agriYield = await ethers.getContractAt("AgriYield", AGRIYIELD_ADDRESS);
  
  // Check farm count and details
  const farmCount = await agriYield.farmCount();
  console.log("\nTotal farms:", farmCount.toString());
  
  for (let i = 1; i <= farmCount; i++) {
    const farm = await agriYield.getFarm(i);
    console.log(`\nFarm ${i}:`);
    console.log("  Raised:", ethers.formatUnits(farm.raised, 6), "HUSDT");
    console.log("  Status:", farm.status.toString());
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

