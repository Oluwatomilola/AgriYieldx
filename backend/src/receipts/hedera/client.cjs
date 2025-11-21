"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = getClient;
const sdk_1 = require("@hashgraph/sdk");
let cached;
function getClient() {
    if (cached)
        return cached;
    const operatorId = (process.env.HEDERA_OPERATOR_ID || process.env.OPERATOR_ID);
    const operatorKey = (process.env.HEDERA_OPERATOR_KEY || process.env.OPERATOR_KEY);
    const client = sdk_1.Client.forTestnet();
    client.setOperator(sdk_1.AccountId.fromString(operatorId), sdk_1.PrivateKey.fromString(operatorKey));
    cached = client;
    return client;
}