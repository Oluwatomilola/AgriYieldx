require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const husdt = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", process.env.MOCK_USDT_ADDRESS);
  
  const workingContract = "0x49dA1619aA019a9d63d30A89e5fAAf405E32F1F7";
  const balance = await husdt.balanceOf(workingContract);
  console.log("Working contract HUSDT balance:", ethers.formatUnits(balance, 6));
}

main().catch(console.error);
