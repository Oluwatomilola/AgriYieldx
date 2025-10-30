import { useState } from "react";
import { uploadToIPFS } from "../services/ipfsService";
import { createFarm } from "../services/contractService";

export default function FarmerDashboard() {
  const [file, setFile] = useState(null);
  const [goal, setGoal] = useState("");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");

  const handleSubmit = async () => {
    try {
      const cid = await uploadToIPFS(file);
      await createFarm(goal, shares, price, cid);
      alert("Farm created successfully (or demo mode if contracts not deployed)");
    } catch (e) {
      console.error(e);
      alert("Failed to create farm. See console for details.")
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Farmer Dashboard</h1>
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">Create a New Farm Campaign</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm Image</label>
              <input 
                type="file" 
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funding Goal (in HBAR)</label>
              <input
                type="number"
                placeholder="e.g., 10000"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Share Supply</label>
                <input
                  type="number"
                  placeholder="e.g., 1000"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Share Price (in HBAR)</label>
                <input
                  type="number"
                  placeholder="e.g., 10"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="pt-4">
              <button
                onClick={handleSubmit}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
              >
                Create Farm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
