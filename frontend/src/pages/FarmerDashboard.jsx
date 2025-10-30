import { useState, useEffect } from "react";
import { uploadToIPFS } from "../services/ipfsService";
import { contractService } from "../services/contractService";
import { useAccount } from 'wagmi';

export default function FarmerDashboard() {
  const { address: userAccountId } = useAccount();
  const [file, setFile] = useState(null);
  const [goal, setGoal] = useState("");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [myFarms, setMyFarms] = useState([]);

  useEffect(() => {
    async function fetchFarms() {
      if (userAccountId) {
        try {
          const allFarms = await contractService.getFarms();
          const userFarms = allFarms.filter(farm => farm.farmer.toLowerCase() === userAccountId.toLowerCase());
          setMyFarms(userFarms);
        } catch (err) {
          console.error('Failed to fetch farms:', err);
          // If the error indicates the wallet is not connected or user rejected access,
          // show a friendly alert and clear farms list.
          alert(err?.message || 'Failed to fetch farms. Please ensure your wallet is connected.');
          setMyFarms([]);
        }
      }
    }
    fetchFarms();
  }, [userAccountId]);

  const handleCreateFarm = async () => {
    try {
      const cid = await uploadToIPFS(file);
      await contractService.createFarm(goal, shares, price, cid);
      alert("Farm created successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to create farm. See console for details.")
    }
  };

  const handleDisburse = async (farmId) => {
    try {
      await contractService.disburseFunds(farmId);
      alert("Funds disbursed successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to disburse funds. See console for details.")
    }
  };

  const handleDeposit = async (farmId, amount) => {
    try {
      await contractService.depositProceeds(farmId, amount);
      alert("Proceeds deposited successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to deposit proceeds. See console for details.")
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Farmer Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Create a New Farm Campaign</h2>
            <div className="space-y-6">
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
                  onClick={handleCreateFarm}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
                >
                  Create Farm
                </button>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">My Farms</h2>
            <div className="space-y-4">
              {myFarms.map(farm => (
                <div key={farm.id} className="border p-4 rounded-lg">
                  <h3 className="font-semibold">{farm.metaCID}</h3>
                  <p>Status: {farm.status.toString()}</p>
                  {farm.status === 1 && ( // Funded
                    <button 
                      onClick={() => handleDisburse(farm.id)}
                      className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Disburse Funds
                    </button>
                  )}
                  {farm.status === 2 && ( // PaidOut
                    <div>
                      <input type="number" placeholder="Amount" id={`deposit-${farm.id}`} className="border rounded px-2 py-1" />
                      <button 
                        onClick={() => {
                          const amount = document.getElementById(`deposit-${farm.id}`).value;
                          handleDeposit(farm.id, amount);
                        }}
                        className="mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                      >
                        Deposit Proceeds
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
