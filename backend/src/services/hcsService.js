import {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction
} from "@hashgraph/sdk";
import { hederaClient } from "./hederaClient.js";

// ✅ Create new topic
export async function createTopic() {
  const client = hederaClient.client;

  const tx = await new TopicCreateTransaction()
    .freezeWith(client)
    .sign(hederaClient.operatorKey);

  const submit = await tx.execute(client);
  const receipt = await submit.getReceipt(client);

  return receipt.topicId.toString();
}

// ✅ Publish message to topic
export async function publishMessage(topicId, message) {
  const client = hederaClient.client;

  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(message)
    .freezeWith(client)
    .sign(hederaClient.operatorKey);

  const submit = await tx.execute(client);
  const receipt = await submit.getReceipt(client);

  return receipt.status.toString();
}
