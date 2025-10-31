import { ethers } from "ethers";
import { publishMessage } from "./hcsService.js";
import dotenv from "dotenv";

dotenv.config();

const AGRIYIELD_ADDRESS = process.env.AGRIYIELD_ADDRESS;
const AGRIYIELD_ABI = [
  "function createFarm(uint256 fundingGoal, string metaCID) external returns (uint256)",
  "function invest(uint256 farmId, uint256 amount) external",
  "function disburseFunds(uint256 farmId) external",
  "function depositProceeds(uint256 farmId, uint256 amount) external",
  "function claimInvestorPayout(uint256 farmId) external",
  "function getFarm(uint256 farmId) external view returns (tuple(address farmer, uint256 fundingGoal, uint256 raised, uint256 proceeds, bool disbursed, string metaCID))",
  "function getInvestment(uint256 farmId, address investor) external view returns (uint256)",
  "function farmCount() external view returns (uint256)",
  "event FarmCreated(uint256 indexed farmId, address indexed farmer, uint256 fundingGoal, string metaCID)",
  "event Invested(uint256 indexed farmId, address indexed investor, uint256 amount)",
  "event FundsDisbursed(uint256 indexed farmId, uint256 amount)",
  "event ProceedsDeposited(uint256 indexed farmId, uint256 amount)",
  "event PayoutClaimed(uint256 indexed farmId, address indexed investor, uint256 amount)"
];

const provider = new ethers.JsonRpcProvider(process.env.HEDERA_NETWORK);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(AGRIYIELD_ADDRESS, AGRIYIELD_ABI, wallet);

export const agriYieldService = {
  /**
   * Get all farms
   */
  async getAllFarms() {
    try {
      const farmCount = await contract.farmCount();
      const farms = [];

      for (let i = 1; i <= farmCount; i++) {
        const farm = await contract.getFarm(i);
        farms.push({
          id: i,
          farmer: farm.farmer,
          fundingGoal: ethers.formatUnits(farm.fundingGoal, 6),
          raised: ethers.formatUnits(farm.raised, 6),
          proceeds: ethers.formatUnits(farm.proceeds, 6),
          disbursed: farm.disbursed,
          metaCID: farm.metaCID,
          percentFunded: (Number(farm.raised) / Number(farm.fundingGoal)) * 100
        });
      }

      return farms;
    } catch (error) {
      console.error("Error fetching farms:", error);
      throw error;
    }
  },

  /**
   * Get single farm by ID
   */
  async getFarm(farmId) {
    try {
      const farm = await contract.getFarm(farmId);
      return {
        id: farmId,
        farmer: farm.farmer,
        fundingGoal: ethers.formatUnits(farm.fundingGoal, 6),
        raised: ethers.formatUnits(farm.raised, 6),
        proceeds: ethers.formatUnits(farm.proceeds, 6),
        disbursed: farm.disbursed,
        metaCID: farm.metaCID,
        percentFunded: (Number(farm.raised) / Number(farm.fundingGoal)) * 100
      };
    } catch (error) {
      console.error("Error fetching farm:", error);
      throw error;
    }
  },

  /**
   * Get investor's investment in a farm
   */
  async getInvestment(farmId, investorAddress) {
    try {
      const investment = await contract.getInvestment(farmId, investorAddress);
      return ethers.formatUnits(investment, 6);
    } catch (error) {
      console.error("Error fetching investment:", error);
      throw error;
    }
  },

  /**
   * Create new farm (farmer only)
   * Note: This should be called from frontend with user's wallet
   */
  async createFarm(fundingGoal, metaCID) {
    try {
      const fundingGoalInSmallestUnit = ethers.parseUnits(fundingGoal.toString(), 6);
      const tx = await contract.createFarm(fundingGoalInSmallestUnit, metaCID);
      const receipt = await tx.wait();

      // Log to HCS
      const hcsMessage = JSON.stringify({
        type: "FARM_CREATED",
        farmId: receipt.logs[0].topics[1],
        fundingGoal,
        metaCID,
        timestamp: new Date().toISOString(),
        txHash: receipt.hash
      });

      if (process.env.HCS_TOPIC_ID) {
        await publishMessage(process.env.HCS_TOPIC_ID, hcsMessage);
      }

      return receipt;
    } catch (error) {
      console.error("Error creating farm:", error);
      throw error;
    }
  },

  /**
   * Disburse funds to farmer (farmer only)
   */
  async disburseFunds(farmId) {
    try {
      const tx = await contract.disburseFunds(farmId);
      const receipt = await tx.wait();

      // Log to HCS
      const hcsMessage = JSON.stringify({
        type: "FUNDS_DISBURSED",
        farmId,
        timestamp: new Date().toISOString(),
        txHash: receipt.hash
      });

      if (process.env.HCS_TOPIC_ID) {
        await publishMessage(process.env.HCS_TOPIC_ID, hcsMessage);
      }

      return receipt;
    } catch (error) {
      console.error("Error disbursing funds:", error);
      throw error;
    }
  },

  /**
   * Deposit harvest proceeds (farmer only)
   */
  async depositProceeds(farmId, amount) {
    try {
      const amountInSmallestUnit = ethers.parseUnits(amount.toString(), 6);
      const tx = await contract.depositProceeds(farmId, amountInSmallestUnit);
      const receipt = await tx.wait();

      // Log to HCS
      const hcsMessage = JSON.stringify({
        type: "PROCEEDS_DEPOSITED",
        farmId,
        amount,
        timestamp: new Date().toISOString(),
        txHash: receipt.hash
      });

      if (process.env.HCS_TOPIC_ID) {
        await publishMessage(process.env.HCS_TOPIC_ID, hcsMessage);
      }

      return receipt;
    } catch (error) {
      console.error("Error depositing proceeds:", error);
      throw error;
    }
  },

  /**
   * Claim investor payout (investor only)
   */
  async claimInvestorPayout(farmId) {
    try {
      const tx = await contract.claimInvestorPayout(farmId);
      const receipt = await tx.wait();

      // Log to HCS
      const hcsMessage = JSON.stringify({
        type: "PAYOUT_CLAIMED",
        farmId,
        timestamp: new Date().toISOString(),
        txHash: receipt.hash
      });

      if (process.env.HCS_TOPIC_ID) {
        await publishMessage(process.env.HCS_TOPIC_ID, hcsMessage);
      }

      return receipt;
    } catch (error) {
      console.error("Error claiming payout:", error);
      throw error;
    }
  }
};
