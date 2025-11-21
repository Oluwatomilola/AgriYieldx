require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const agriYield = await ethers.getContractAt("AgriYield", "0x56C9f679f6f7c273C8Bc22f71D4d4A51C17acc64");
  
  console.log("Testing association on new contract...");
  try {
    const tx = await agriYield.associateToken();
    console.log("TX:", tx.hash);
    await tx.wait();
    console.log("✅ Association successful");
  } catch (e) {
    console.log("Error:", e.message);
    if (e.message.includes("239")) {
      console.log("✅ Token already associated!");
    }
  }
}

main().catch(console.error);
