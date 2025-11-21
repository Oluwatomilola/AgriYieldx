require("dotenv").config();
const { Client, AccountId, PrivateKey, TokenId, TokenGrantKycTransaction } = require("@hashgraph/sdk");

async function main() {
  const client = Client.forTestnet();
  const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
  const operatorKey = PrivateKey.fromStringED25519(process.env.OPERATOR_KEY);
  client.setOperator(operatorId, operatorKey);

  const target = process.argv[2] || process.env.TARGET_ACCOUNT_ID || process.env.TARGET_EVM_ADDRESS || process.env.AGRIYIELD_CONTRACT_ID;
  if (!target) throw new Error("Provide TARGET_ACCOUNT_ID or TARGET_EVM_ADDRESS env/CLI arg, or AGRIYIELD_CONTRACT_ID");

  let accountId;
  const isEvm = /^0x[0-9a-fA-F]{40}$/.test(target);
  if (isEvm) {
    try {
      const url = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${target}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Mirror Node lookup failed: ${res.status}`);
      const data = await res.json();
      if (!data.account) throw new Error("Mirror Node did not return numeric account id");
      accountId = AccountId.fromString(data.account);
    } catch (e) {
      // Fallback to alias-based AccountId if mirror node mapping fails
      accountId = AccountId.fromEvmAddress(0, 0, target);
    }
  } else {
    accountId = AccountId.fromString(target);
  }

  const tokenId = TokenId.fromString(process.env.HUSDT_TOKEN_ID);

  console.log("Granting KYC for", accountId.toString(), "on token", tokenId.toString());

  const tx = await new TokenGrantKycTransaction()
    .setAccountId(accountId)
    .setTokenId(tokenId)
    .freezeWith(client)
    .sign(operatorKey);

  const submit = await tx.execute(client);
  const receipt = await submit.getReceipt(client);
  console.log("Status:", receipt.status.toString());

  client.close();
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });