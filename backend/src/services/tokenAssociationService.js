import {
  Client,
  AccountId,
  PrivateKey,
  ContractId,
  ContractExecuteTransaction,
  ContractFunctionParameters
} from "@hashgraph/sdk";
import dotenv from "dotenv";

dotenv.config();

// Initialize Hedera client
const client = Client.forTestnet();
client.setOperator(
  AccountId.fromString(process.env.OPERATOR_ID),
  PrivateKey.fromStringED25519(process.env.OPERATOR_KEY)
);

const HUSDT_TOKEN_ID = process.env.HUSDT_TOKEN_ID;

/**
 * Associate a token with a contract account
 * This is required before a contract can receive or transfer HTS tokens
 * 
 * @param {string} contractEvmAddress - EVM address of the contract (0x...)
 * @param {string} tokenId - Hedera token ID (0.0.XXXXX)
 * @returns {Promise<{success: boolean, message: string, receipt?: any}>}
 */
export async function associateTokenWithContract(contractEvmAddress, tokenId = HUSDT_TOKEN_ID) {
  try {
    // Convert EVM address to Hedera Account/Contract ID
    // For contracts deployed via EVM, we need to use the mirror node to get the contract ID
    const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/contracts/${contractEvmAddress}`;
    const response = await fetch(mirrorNodeUrl);
    
    if (!response.ok) {
      throw new Error(`Contract not found on Hedera testnet: ${contractEvmAddress}`);
    }
    
    const contractData = await response.json();
    const contractId = contractData.contract_id;
    
    console.log(`Associating token ${tokenId} with contract ${contractId} (${contractEvmAddress}) via contract call`);

    // Execute the AgriYield.associateToken() method on the contract.
    // This calls the HTS precompile inside the contract, which is the supported way
    // to associate a token with a contract account.
    const execTx = await new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(contractId))
      .setGas(300000)
      .setFunction("associateToken", new ContractFunctionParameters())
      .freezeWith(client)
      .sign(PrivateKey.fromStringED25519(process.env.OPERATOR_KEY));

    const execSubmit = await execTx.execute(client);
    const execReceipt = await execSubmit.getReceipt(client);

    console.log(`✅ Contract association tx status: ${execReceipt.status.toString()}`);

    return {
      success: true,
      message: `Contract ${contractId} executed associateToken() successfully`,
      receipt: execReceipt
    };
  } catch (error) {
    console.error("Token association error:", error);
    
    // Check if already associated
    if (error.message?.includes("TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT")) {
      return {
        success: true,
        message: "Token already associated with contract"
      };
    }
    
    return {
      success: false,
      message: error.message || "Token association failed"
    };
  }
}

/**
 * Associate HUSDT token with all deployed contracts
 * This should be run once after contract deployment
 */
export async function associateAllContracts() {
  const contracts = {
    AgriYield: process.env.AGRIYIELD_ADDRESS,
    Marketplace: process.env.MARKETPLACE_ADDRESS,
    MockUSDT: process.env.MOCK_USDT_ADDRESS,
    FarmShares: process.env.FARM_SHARES_ADDRESS
  };
  
  const results = {};
  
  for (const [name, address] of Object.entries(contracts)) {
    if (!address) {
      console.log(`⚠️  Skipping ${name}: No address configured`);
      continue;
    }
    
    console.log(`\nAssociating ${name} (${address})...`);
    const result = await associateTokenWithContract(address);
    results[name] = result;
    
    // Wait a bit between transactions to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
}

/**
 * Check if a contract is associated with a token
 * 
 * @param {string} contractEvmAddress - EVM address of the contract
 * @param {string} tokenId - Hedera token ID
 * @returns {Promise<boolean>}
 */
export async function isContractAssociated(contractEvmAddress, tokenId = HUSDT_TOKEN_ID) {
  try {
    // Query mirror node for contract's token relationships
    const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/contracts/${contractEvmAddress}`;
    const response = await fetch(mirrorNodeUrl);
    
    if (!response.ok) {
      return false;
    }
    
    const contractData = await response.json();
    const contractId = contractData.contract_id;
    
    // Check token relationships
    const tokenRelUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${contractId}/tokens?token.id=${tokenId}`;
    const tokenRelResponse = await fetch(tokenRelUrl);
    
    if (!tokenRelResponse.ok) {
      return false;
    }
    
    const tokenRelData = await tokenRelResponse.json();
    return tokenRelData.tokens && tokenRelData.tokens.length > 0;
  } catch (error) {
    console.error("Error checking association:", error);
    return false;
  }
}

/**
 * Get contract balance of HUSDT token
 * 
 * @param {string} contractEvmAddress - EVM address of the contract
 * @returns {Promise<string>} Balance in smallest units (6 decimals for HUSDT)
 */
export async function getContractTokenBalance(contractEvmAddress) {
  try {
    const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/contracts/${contractEvmAddress}`;
    const response = await fetch(mirrorNodeUrl);
    
    if (!response.ok) {
      throw new Error("Contract not found");
    }
    
    const contractData = await response.json();
    const contractId = contractData.contract_id;
    
    // Get token balance
    const balanceUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${contractId}/tokens?token.id=${HUSDT_TOKEN_ID}`;
    const balanceResponse = await fetch(balanceUrl);
    
    if (!balanceResponse.ok) {
      return "0";
    }
    
    const balanceData = await balanceResponse.json();
    if (balanceData.tokens && balanceData.tokens.length > 0) {
      return balanceData.tokens[0].balance.toString();
    }
    
    return "0";
  } catch (error) {
    console.error("Error getting balance:", error);
    return "0";
  }
}

export default {
  associateTokenWithContract,
  associateAllContracts,
  isContractAssociated,
  getContractTokenBalance
};

