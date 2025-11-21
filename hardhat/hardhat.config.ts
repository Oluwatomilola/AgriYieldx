// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();


const { OPERATOR_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {},
    hederaTestnet: {
      url: "https://testnet.hashio.io/api", // example RPC
      chainId: 296, // Hedera testnet EVM
      accounts: OPERATOR_KEY && OPERATOR_KEY.length > 10 ? [OPERATOR_KEY.startsWith('0x') ? OPERATOR_KEY : `0x${OPERATOR_KEY}`] : [],
    },
  },
};

export default config;
