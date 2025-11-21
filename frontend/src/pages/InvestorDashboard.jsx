import { useEffect, useState } from "react";
import { ethers } from "ethers";
import FarmCard from "../components/FarmCard";
import InvestmentModal from "../components/InvestmentModal";
import { contractService } from "../services/contractService";
import { useAccount } from 'wagmi';

export default function InvestorDashboard() {
  const { address: userAccountId } = useAccount();
  const [allFarms, setAllFarms] = useState([]);
  const [myInvestments, setMyInvestments] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchFarmsAndInvestments() {
      if (userAccountId) {
        try {
          setLoading(true);
          setError('');
          const farms = await contractService.getFarms();
          
          // Filter out any invalid farm data
          const validFarms = farms.filter(farm => farm && farm.id !== undefined);
          setAllFarms(validFarms);

          const investments = [];
          for (const farm of validFarms) {
            try {
              const shares = await contractService.getInvestorShares(farm.id, userAccountId);
              if (shares > 0) {
                investments.push({ ...farm, shares });
              }
            } catch (err) {
              console.error(`Error fetching shares for farm ${farm.id}:`, err);
            }
          }
          setMyInvestments(investments);
        } catch (err) {
          console.error('Failed to fetch farms:', err);
          setError('Failed to load farms. Please ensure your wallet is connected and try again.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    fetchFarmsAndInvestments();
  }, [userAccountId]);

  const handleInvestClick = (farm) => {
    if (!userAccountId) {
      alert("Please connect your wallet before investing.");
      return;
    }
    setSelectedFarm(farm);
    setShowModal(true);
  };

  const handleInvest = async (farmId, amount) => {
    try {
      const result = await contractService.invest(farmId, amount);
      // Reload farms and investments
      const farms = await contractService.getFarms();
      
      // Filter out any invalid farm data
      const validFarms = farms.filter(farm => farm && farm.id !== undefined);
      setAllFarms(validFarms);

      const investments = [];
      for (const farm of validFarms) {
        try {
          const shares = await contractService.getInvestorShares(farm.id, userAccountId);
          if (shares > 0) {
            investments.push({ ...farm, shares });
          }
        } catch (err) {
          console.error(`Error fetching shares for farm ${farm.id}:`, err);
        }
      }
      setMyInvestments(investments);

      return result;
    } catch (err) {
      console.error(err);
      throw err;
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
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">Investor Dashboard</h1>
        
        {!userAccountId ? (
          <div className="text-center bg-white p-6 sm:p-8 rounded-lg shadow-md">
            <p className="text-base sm:text-lg text-gray-700">Please connect your wallet to view available farms and manage your investments.</p>
          </div>
        ) : loading ? (
          <div className="text-center bg-white p-6 sm:p-8 rounded-lg shadow-md">
            <div className="flex flex-col items-center justify-center space-y-4">
              <svg className="animate-spin h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-base sm:text-lg text-gray-700">Loading farms...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center bg-red-50 border border-red-200 p-6 sm:p-8 rounded-lg shadow-md">
            <p className="text-base sm:text-lg text-red-700 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-8 sm:mb-12">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4 sm:mb-6">My Investments</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {myInvestments.length > 0 ? (
                  myInvestments.map((farm) => (
                    <div key={farm.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 break-all">{farm.metaCID}</h3>
                      <p className="text-sm sm:text-base">Shares: {farm.shares.toString()}</p>
                      <p className="text-sm sm:text-base">Status: {farm.status.toString()}</p>
                      {(() => {
                        try {
                          const proceeds = BigInt(farm.proceeds || '0');
                          const shares = BigInt(farm.shares || 0);
                          const totalShares = BigInt(farm.shareSupply || '0');
                          if (totalShares === 0n) return null;
                          const entitlement = (proceeds * shares) / totalShares;
                          const display = ethers.formatUnits(entitlement, 6);
                          return (
                            <p className="text-sm sm:text-base">Claimable: {display} hUSDT</p>
                          );
                        } catch {
                          return null;
                        }
                      })()}
                      {farm.status === 3 && ( // Settled
                        <button 
                          onClick={() => handleClaimPayout(farm.id)}
                          className="mt-3 sm:mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 text-sm sm:text-base"
                        >
                          Claim Payout
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm sm:text-base text-gray-600">You have not invested in any farms yet.</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4 sm:mb-6">Available Farm Campaigns</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {allFarms.length > 0 ? (
                  allFarms.map((farm) => (
                    <FarmCard
                      key={farm.id}
                      farm={farm}
                      onInvest={() => handleInvestClick(farm)}
                    />
                  ))
                ) : (
                  <p className="text-sm sm:text-base text-gray-600">No farm campaigns available at the moment.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && selectedFarm && (
        <InvestmentModal
          farm={selectedFarm}
          onClose={() => {
            setShowModal(false);
            setSelectedFarm(null);
          }}
          onInvest={handleInvest}
        />
      )}
    </div>
  );
}
