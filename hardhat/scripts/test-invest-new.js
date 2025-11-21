require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  const agriYield = await ethers.getContractAt("AgriYield", process.env.AGRIYIELD_ADDRESS);
  const husdt = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", process.env.MOCK_USDT_ADDRESS);
  
  const balance = await husdt.balanceOf(signer.address);
  console.log("HUSDT Balance:", ethers.formatUnits(balance, 6));
  
  const allowance = await husdt.allowance(signer.address, process.env.AGRIYIELD_ADDRESS);
  console.log("Current Allowance:", ethers.formatUnits(allowance, 6));
  
  if (allowance < ethers.parseUnits("10", 6)) {
    console.log("\nApproving HUSDT...");
    const approveTx = await husdt.approve(process.env.AGRIYIELD_ADDRESS, ethers.parseUnits("1000", 6));
    await approveTx.wait();
    console.log("✅ Approved");
  }
  
  console.log("\nTrying to invest 10 HUSDT...");
  try {
    const tx = await agriYield.invest(1, ethers.parseUnits("10", 6));
    console.log("TX:", tx.hash);
    await tx.wait();
    console.log("✅ Investment successful!");
  } catch (e) {
    console.log("❌ Investment failed:", e.message);
  }
}

main().catch(console.error);
