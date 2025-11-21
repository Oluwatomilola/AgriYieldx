import dotenv from "dotenv";
import {
  Client,
  PrivateKey,
  AccountId
} from "@hashgraph/sdk";

dotenv.config();

const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromStringED25519(process.env.OPERATOR_KEY);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

export const hederaClient = {
  client,
  operatorId,
  operatorKey
};
