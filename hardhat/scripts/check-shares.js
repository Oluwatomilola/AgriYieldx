require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const farmShares = await ethers.getContractAt("FarmShares", process.env.FARM_SHARES_ADDRESS);
  const agriYieldAddress = process.env.AGRIYIELD_ADDRESS;
  
  console.log("Checking FarmShares balance...");
  console.log("AgriYield contract:", agriYieldAddress);
  
  const balance = await farmShares.balanceOf(agriYieldAddress, 1);
  console.log("Farm 1 shares held by AgriYield:", balance.toString());
  
  // Check if AgriYield is the controller
  const controller = await farmShares.controller();
  console.log("FarmShares controller:", controller);
  console.log("Is AgriYield the controller?", controller.toLowerCase() === agriYieldAddress.toLowerCase());
}

main().catch(console.error);
