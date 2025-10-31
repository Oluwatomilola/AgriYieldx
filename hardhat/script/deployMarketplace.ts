import { ethers } from "hardhat";

async function main() {
  const network = await ethers.provider.getNetwork();
  console.log("Deploying Marketplace to network:", network.name);

  const deployer = (await ethers.getSigners())[0];
  console.log("Deployer address:", deployer.address);

  const tokenAddr = process.env.MOCK_USDT_ADDRESS as string | undefined;
  const agriYieldAddr = process.env.AGRI_YIELD_ADDRESS as string | undefined;

  
  if (!agriYieldAddr || !tokenAddr) {
    throw new Error(
      "Missing env vars. Please set AGRI_YIELD_ADDRESS, MOCK_USDT_ADDRESS before running this script."
    );
  }

  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(tokenAddr, agriYieldAddr);
  await marketplace.waitForDeployment();

  console.log("Marketplace deployed at:", await marketplace.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
