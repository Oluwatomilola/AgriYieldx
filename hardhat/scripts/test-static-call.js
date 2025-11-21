require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  const agriYield = await ethers.getContractAt("AgriYield", process.env.AGRIYIELD_ADDRESS);
  
  console.log("Testing with staticCall (simulation)...");
  try {
    await agriYield.invest.staticCall(1, ethers.parseUnits("10", 6));
    console.log("✅ Static call succeeded - transaction should work");
  } catch (e) {
    console.log("❌ Static call failed:", e.message);
    console.log("Error code:", e.code);
    console.log("Error data:", e.data);
    
    // Try to decode the error
    if (e.data && e.data !== "0x") {
      try {
        const iface = new ethers.Interface([
          "error Error(string)",
          "function invest(uint256,uint256)"
        ]);
        const decoded = iface.parseError(e.data);
        console.log("Decoded error:", decoded);
      } catch (decodeError) {
        console.log("Could not decode error");
      }
    }
  }
}

main().catch(console.error);
