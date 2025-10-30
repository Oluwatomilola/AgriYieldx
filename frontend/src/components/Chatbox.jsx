import { useState, useEffect } from "react";
import { hcsService } from "../services/hcsService";

export default function ChatBox({ topicId, signer }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!topicId) return;

    const ws = hcsService.subscribeToTopic(topicId, (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      if (ws && ws.close) ws.close();
    };
  }, [topicId]);

  const handleSend = async () => {
    if (!input || !topicId || !signer) return;
    try {
      await hcsService.sendMessage(topicId, input, signer);
      setInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-md h-96">
      <div className="bg-gray-50 rounded-t-lg p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Order Chat</h3>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m, i) => (
          <div key={i} className="flex">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg max-w-xs">
              <p className="text-sm">{m}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex p-4 border-t border-gray-200">
        <input
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button 
          className="ml-3 bg-green-600 text-white rounded-lg px-5 py-2 hover:bg-green-700 transition-all font-semibold"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
}
