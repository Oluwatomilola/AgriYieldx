require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const agriYield = await ethers.getContractAt("AgriYield", process.env.AGRIYIELD_ADDRESS);
  
  console.log("Trying to associate token again...");
  try {
    const tx = await agriYield.associateToken();
    console.log("TX:", tx.hash);
    await tx.wait();
    console.log("✅ Association successful");
  } catch (e) {
    console.log("Error:", e.message);
    if (e.message.includes("TOKEN_ALREADY_ASSOCIATED") || e.message.includes("-239")) {
      console.log("✅ Token already associated (this is good!)");
    }
  }
}

main().catch(console.error);
