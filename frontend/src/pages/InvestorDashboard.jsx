import { useEffect, useState } from "react";
import FarmCard from "../components/FarmCard";
import { contractService } from "../services/contractService";
import { useAccount } from 'wagmi';

export default function InvestorDashboard() {
  const { address: userAccountId } = useAccount();
  const [allFarms, setAllFarms] = useState([]);
  const [myInvestments, setMyInvestments] = useState([]);

  useEffect(() => {
    async function fetchFarmsAndInvestments() {
      if (userAccountId) {
        const farms = await contractService.getFarms();
        setAllFarms(farms);

        const investments = [];
        for (const farm of farms) {
          const shares = await contractService.getInvestorShares(farm.id, userAccountId);
          if (shares > 0) {
            investments.push({ ...farm, shares });
          }
        }
        setMyInvestments(investments);
      }
    }
    fetchFarmsAndInvestments();
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

  const handleClaimPayout = async (farmId) => {
    try {
      await contractService.claimInvestorPayout(farmId);
      alert("Payout claimed successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to claim payout. See console for details.");
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
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-700 mb-6">My Investments</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {myInvestments.length > 0 ? (
                  myInvestments.map((farm) => (
                    <div key={farm.id} className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{farm.metaCID}</h3>
                      <p>Shares: {farm.shares.toString()}</p>
                      <p>Status: {farm.status.toString()}</p>
                      {farm.status === 3 && ( // Settled
                        <button 
                          onClick={() => handleClaimPayout(farm.id)}
                          className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300"
                        >
                          Claim Payout
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p>You have not invested in any farms yet.</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-6">Available Farm Campaigns</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {allFarms.length > 0 ? (
                  allFarms.map((farm) => (
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
          </div>
        )}
      </div>
    </div>
  );
}
