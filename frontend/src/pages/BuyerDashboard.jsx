import { useEffect, useState } from "react";
import ListCard from "../components/ListCard";
import { contractService } from "../services/contractService";
import { useAccount } from 'wagmi';

export default function BuyerDashboard() {
  const { address: userAccountId } = useAccount();
  const [listings, setListings] = useState([]);

  useEffect(() => {
    if (userAccountId) {
      contractService.getListings().then(setListings);
    }
  }, [userAccountId]);

  const handlePurchase = async (listingId, quantity) => {
    try {
      if (!userAccountId) {
        alert("Please connect your wallet before purchasing.");
        return;
      }
      await contractService.purchase(listingId, quantity);
      alert("Purchase successful!");
    } catch (err) {
      console.error(err);
      alert("Purchase failed.");
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Buyer Dashboard</h1>
        {!userAccountId ? (
          <div className="text-center bg-white p-8 rounded-lg shadow-md">
            <p className="text-lg text-gray-700">Please connect your wallet to browse the marketplace.</p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">Marketplace Listings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {listings.length > 0 ? (
                listings.map((listing) => (
                  <ListCard
                    key={listing.id}
                    listing={listing}
                    onBuy={(l) => handlePurchase(l.id, 1)}
                  />
                ))
              ) : (
                <p>No listings available at the moment.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
