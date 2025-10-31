import * as hcsService from "../services/hcsService.js";

export async function createTopic(req, res) {
  try {
    const topicId = await hcsService.createTopic();
    res.status(201).json({ topicId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create topic" });
  }
}

export async function publishMessage(req, res) {
  try {
    const { topicId, message } = req.body;
    if (!topicId || !message) {
      return res.status(400).json({ error: "topicId and message required" });
    }

    const txId = await hcsService.publishMessage(topicId, message);
    res.status(200).json({ txId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to publish message" });
  }
}
