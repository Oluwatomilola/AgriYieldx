import { useEffect, useState } from "react";
import FarmCard from "../components/FarmCard";
import { contractService } from "../services/contractService";
import { useAccount } from 'wagmi';

export default function InvestorDashboard() {
  const { address: userAccountId } = useAccount();
  const [farms, setFarms] = useState([]);

  useEffect(() => {
    if (userAccountId) {
      contractService.getFarms().then(setFarms);
    }
  }, [userAccountId]);

  const handleInvest = async (farmId, amount) => {
    try {
      if (!userAccountId) {
        alert("Please connect your wallet before investing.");
        return;
      }
      await contractService.invest(farmId, amount);
      alert("Investment successful!");
    } catch (err) {
      console.error(err);
      alert("Investment failed.");
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Investor Dashboard</h1>
        {!userAccountId ? (
          <div className="text-center bg-white p-8 rounded-lg shadow-md">
            <p className="text-lg text-gray-700">Please connect your wallet to view available farms and manage your investments.</p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">Available Farm Campaigns</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {farms.length > 0 ? (
                farms.map((farm) => (
                  <FarmCard
                    key={farm.id}
                    farm={farm}
                    onInvest={(f) => handleInvest(f.id, 1)}
                  />
                ))
              ) : (
                <p>No farm campaigns available at the moment.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
