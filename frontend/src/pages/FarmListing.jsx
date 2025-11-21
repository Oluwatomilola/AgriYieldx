
import { useEffect, useState } from "react";
import FarmCard from "../components/FarmCard";
import InvestmentModal from "../components/InvestmentModal";
import { contractService } from "../services/contractService";
import { useAccount } from 'wagmi';

export default function FarmListing() {
  const { address: userAccountId } = useAccount();
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await contractService.getFarms();
        if (mounted) setFarms(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load farms:", err);
        if (mounted) {
          setError(err.message || "Failed to load farm listings");
          setFarms([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [userAccountId]);

  const handleInvestClick = (farm) => {
    if (!userAccountId) {
      alert("Please connect your wallet to invest.");
      return;
    }
    setSelectedFarm(farm);
    setShowModal(true);
  };

  const handleInvest = async (farmId, amount) => {
    try {
      if (!userAccountId) {
        throw new Error("Please connect your wallet to invest");
      }
      
      const result = await contractService.invest(farmId, amount);
      
      // Reload farms to show updated data
      const updatedFarms = await contractService.getFarms();
      setFarms(Array.isArray(updatedFarms) ? updatedFarms : []);
      
      return result;
    } catch (e) {
      console.error('Investment error:', e);
      throw new Error(e.message || 'Investment failed. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Farm Listings</h1>
      
      {!userAccountId ? (
        <div className="text-center bg-white p-6 sm:p-8 rounded-lg shadow-md">
          <p className="text-base sm:text-lg text-gray-700">Please connect your wallet to view farm listings.</p>
        </div>
      ) : loading ? (
        <div className="text-center bg-white p-6 sm:p-8 rounded-lg shadow-md">
          <p className="text-base sm:text-lg text-gray-700">Loading farm listings...</p>
        </div>
      ) : error ? (
        <div className="text-center bg-white p-6 sm:p-8 rounded-lg shadow-md">
          <p className="text-base sm:text-lg text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      ) : farms.length === 0 ? (
        <div className="text-center bg-white p-6 sm:p-8 rounded-lg shadow-md">
          <p className="text-base sm:text-lg text-gray-700">No farms available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {farms.map((farm) => (
            <FarmCard
              key={farm.id}
              farm={farm}
              onInvest={() => handleInvestClick(farm)}
            />
          ))}
        </div>
      )}

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
