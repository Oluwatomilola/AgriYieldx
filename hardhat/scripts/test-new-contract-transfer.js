require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  const husdt = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", process.env.MOCK_USDT_ADDRESS);
  
  const newContract = "0x6B6354f3e3698cC51FA08098D51120B323712bdf";
  
  console.log("Trying to send 1 HUSDT to new AgriYield contract...");
  try {
    const tx = await husdt.transfer(newContract, ethers.parseUnits("1", 6));
    console.log("TX:", tx.hash);
    await tx.wait();
    console.log("✅ Transfer successful!");
    
    const balance = await husdt.balanceOf(newContract);
    console.log("AgriYield HUSDT balance:", ethers.formatUnits(balance, 6));
  } catch (e) {
    console.log("❌ Transfer failed:", e.message);
  }
}

main().catch(console.error);
