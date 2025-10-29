import { useEffect, useState } from "react";
// import WalletContext from "../context/WalletContext";
import FarmCard from "../components/FarmCard";
import { contractService } from "../services/contractService";
import { useAccount } from 'wagmi';

const demoFarms = [
  {
    id: 1,
    name: "Sunrise Maize Farm",
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=1200&auto=format&fit=crop",
    fundingGoal: 10000,
    raised: 2500,
    metaCID: "demo-maize-1"
  },
  {
    id: 2,
    name: "Green Valley Rice",
    image: "https://images.unsplash.com/photo-1500937287812-8f7f8e7a8c44?q=80&w=1200&auto=format&fit=crop",
    fundingGoal: 20000,
    raised: 12000,
    metaCID: "demo-rice-2"
  },
  {
    id: 3,
    name: "Highland Coffee Estate",
    image: "https://images.unsplash.com/photo-1492496913980-501348b61469?q=80&w=1200&auto=format&fit=crop",
    fundingGoal: 50000,
    raised: 38000,
    metaCID: "demo-coffee-3"
  }
];

export default function Home() {
  const { address: userAccountId } = useAccount();
  const [farms, setFarms] = useState([]);
  // console.log("UserAccount", userAccountId);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = userAccountId ? await contractService.getFarms() : [];
        if (mounted) setFarms(Array.isArray(data) && data.length ? data : demoFarms);
      } catch {
        if (mounted) setFarms(demoFarms);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleInvest = async (farmId, amount) => {
    try {
      if (userAccountId) {
        await contractService.invest(farmId, amount);
        alert("Investment successful!");
      } else {
        alert("Demo mode: connect wallet to invest when contracts are live.");
      }
    } catch (e) {
      console.error(e);
      alert("Investment failed.");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Farm Campaigns</h1>
      <p className="text-sm text-gray-700 dark:text-gray-400">Invest in farm campaigns to support farmers and earn returns.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {farms.map((farm) => (
          <FarmCard
            key={farm.id}
            farm={farm}
            onInvest={(f) => handleInvest(f.id, 1)}
          />
        ))}
      </div>
    </div>
  );
}
