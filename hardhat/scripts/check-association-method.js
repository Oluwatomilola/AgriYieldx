require("dotenv").config();
const { Client, AccountId, PrivateKey, TokenAssociateTransaction, ContractId } = require("@hashgraph/sdk");

async function main() {
  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(process.env.OPERATOR_ID),
    PrivateKey.fromString(process.env.OPERATOR_KEY)
  );

  // Convert EVM address to Hedera contract ID
  const evmAddress = process.env.AGRIYIELD_ADDRESS;
  console.log("EVM Address:", evmAddress);
  
  // We need to get the Hedera contract ID from the EVM address
  // This requires querying the mirror node or using the contract ID from deployment
  
  console.log("❌ Cannot associate via SDK - contracts deployed via EVM cannot be associated externally");
  console.log("The contract must associate itself using the HTS precompile during deployment or initialization");

  client.close();
}

main().catch(console.error);
