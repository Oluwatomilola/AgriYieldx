require("dotenv").config();
const { Client, AccountId, PrivateKey, TokenAssociateTransaction } = require("@hashgraph/sdk");

async function main() {
  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(process.env.OPERATOR_ID),
    PrivateKey.fromString(process.env.OPERATOR_KEY)
  );

  const contractId = AccountId.fromEvmAddress(0, 0, process.env.AGRIYIELD_ADDRESS);
  const tokenId = AccountId.fromString(process.env.HUSDT_TOKEN_ID);

  console.log("Associating contract", contractId.toString(), "with token", tokenId.toString());

  try {
    const transaction = await new TokenAssociateTransaction()
      .setAccountId(contractId)
      .setTokenIds([tokenId])
      .freezeWith(client);

    const signedTx = await transaction.sign(PrivateKey.fromString(process.env.OPERATOR_KEY));
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    console.log("✅ Association successful!");
    console.log("Status:", receipt.status.toString());
  } catch (e) {
    console.log("❌ Association failed:", e.message);
  }

  client.close();
}

main().catch(console.error);
