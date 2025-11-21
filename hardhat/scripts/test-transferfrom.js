require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing HTS Token transferFrom...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  const HUSDT_ADDRESS = process.env.MOCK_USDT_ADDRESS;
  const AGRIYIELD_ADDRESS = process.env.AGRI_YIELD_ADDRESS;

  // Create HUSDT contract instance
  const ERC20_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)"
  ];
  
  const husdt = new ethers.Contract(HUSDT_ADDRESS, ERC20_ABI, deployer);

  // Check balance
  const balance = await husdt.balanceOf(deployer.address);
  console.log("Deployer balance:", ethers.formatUnits(balance, 6), "HUSDT\n");

  // Approve AgriYield
  console.log("Approving AgriYield for 100 HUSDT...");
  const approveTx = await husdt.approve(AGRIYIELD_ADDRESS, ethers.parseUnits("100", 6));
  await approveTx.wait();
  console.log("✅ Approved\n");

  // Check allowance
  const allowance = await husdt.allowance(deployer.address, AGRIYIELD_ADDRESS);
  console.log("Allowance:", ethers.formatUnits(allowance, 6), "HUSDT\n");

  // Try transferFrom from deployer to deployer (should work if transferFrom is supported)
  console.log("Trying transferFrom from deployer to deployer (10 HUSDT)...");
  try {
    const tx = await husdt.transferFrom(
      deployer.address,
      deployer.address,
      ethers.parseUnits("10", 6)
    );
    await tx.wait();
    console.log("✅ transferFrom successful!");
  } catch (error) {
    console.log("❌ transferFrom failed:", error.message);
    console.log("\nThis suggests HTS tokens don't support transferFrom even with approval.");
  }

  // Check final balance
  const finalBalance = await husdt.balanceOf(deployer.address);
  console.log("\nFinal balance:", ethers.formatUnits(finalBalance, 6), "HUSDT");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

