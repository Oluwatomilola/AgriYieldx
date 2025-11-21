const { ethers } = require("hardhat");

async function main() {
  const contracts = {
    MockUSDT: "0x00000000000000000000000000000000006d3eca",
    FarmShares: "0x661C2AbB83101dd1CDe57F5777C146862299416E",
    AgriYield: "0x380AAae7b3a9ec87Ff6A5CEd5e1a5110B591D7A5",
    Marketplace: "0x7CA91C3c6B9B9d9d2F29eb0c5840D0D789987D22"
  };

  console.log("Verifying contracts on Hedera Testnet...\n");

  for (const [name, address] of Object.entries(contracts)) {
    console.log(`${name}: ${address}`);
    console.log(`  HashScan: https://hashscan.io/testnet/contract/${address}`);
    
    try {
      const code = await ethers.provider.getCode(address);
      if (code === "0x") {
        console.log(`  ❌ No contract code found`);
      } else {
        console.log(`  ✅ Contract deployed (${code.length} bytes)`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
