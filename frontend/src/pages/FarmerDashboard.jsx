import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { uploadToIPFS } from "../services/ipfsService";
import { contractService } from "../services/contractService";
import { useAccount } from 'wagmi';

export default function FarmerDashboard() {
  const { address: userAccountId } = useAccount();
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [myFarms, setMyFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchFarms() {
      if (userAccountId) {
        try {
          setLoading(true);
          const allFarms = await contractService.getFarms();
          const userFarms = allFarms.filter(farm => 
            farm && 
            farm.farmer && 
            typeof farm.farmer === 'string' && 
            farm.farmer.toLowerCase() === userAccountId.toLowerCase()
          );
          setMyFarms(userFarms);
        } catch (err) {
          console.error('Failed to fetch farms:', err);
          // If the error indicates the wallet is not connected or user rejected access,
          // don't show alert, just log it
          setMyFarms([]);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    fetchFarms();
  }, [userAccountId]);

  const handleCreateFarm = async () => {
    try {
      // Validate inputs
      if (!name || name.trim() === "") {
        alert("Please enter a farm name");
        return;
      }
      if (!description || description.trim() === "") {
        alert("Please enter a farm description");
        return;
      }
      if (!file) {
        alert("Please select a farm image");
        return;
      }
      if (!goal || parseFloat(goal) <= 0) {
        alert("Please enter a valid funding goal");
        return;
      }
      if (!shares || parseInt(shares) <= 0) {
        alert("Please enter a valid share supply");
        return;
      }
      if (!price || parseFloat(price) <= 0) {
        alert("Please enter a valid share price");
        return;
      }

      // Upload image to IPFS first
      const imageCid = await uploadToIPFS(file);
      
      if (!imageCid) {
        throw new Error("Failed to upload image to IPFS");
      }

      // Create metadata JSON and upload to IPFS
      const metadata = {
        name: name.trim(),
        description: description.trim(),
        // Use ipfs:// scheme for broad compatibility with NFT metadata consumers
        image: `ipfs://${imageCid}`,
        imageCid: imageCid
      };

      // Convert metadata to blob and upload
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      const metadataFile = new File([metadataBlob], 'metadata.json', { type: 'application/json' });
      const metadataCid = await uploadToIPFS(metadataFile);

      if (!metadataCid) {
        throw new Error("Failed to upload metadata to IPFS");
      }

      // Validate funding goal == shareSupply * sharePrice (using 6-decimal smallest units)
      const goalInUnits = ethers.parseUnits(goal.toString(), 6);
      const priceInUnits = ethers.parseUnits(price.toString(), 6);
      const expectedGoal = BigInt(shares) * priceInUnits;

      if (goalInUnits !== expectedGoal) {
        alert(`Funding goal must equal share supply × share price.\nExpected: ${ethers.formatUnits(expectedGoal, 6)} HUSDT\nYou entered: ${ethers.formatUnits(goalInUnits, 6)} HUSDT`);
        return;
      }

      // Create farm on blockchain with metadata CID
      await contractService.createFarm(goal, shares, price, metadataCid);
      
      alert("Farm created successfully!");
      
      // Reset form
      setName("");
      setDescription("");
      setFile(null);
      setGoal("");
      setShares("");
      setPrice("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Refresh farms list
      const allFarms = await contractService.getFarms();
      const userFarms = allFarms.filter(farm => 
        farm && 
        farm.farmer && 
        typeof farm.farmer === 'string' && 
        farm.farmer.toLowerCase() === userAccountId.toLowerCase()
      );
      setMyFarms(userFarms);
    } catch (e) {
      console.error(e);
      alert(`Failed to create farm: ${e.message || 'Unknown error'}`);
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
      const amt6 = ethers.parseUnits(amount.toString(), 6);
      await contractService.depositProceeds(farmId, amt6);
      alert("Proceeds deposited successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to deposit proceeds. See console for details.")
    }
  };

  const [listFarmId, setListFarmId] = useState("");
  const [listName, setListName] = useState("");
  const [listDesc, setListDesc] = useState("");
  const [listImage, setListImage] = useState(null);
  const [listPrice, setListPrice] = useState("");
  const [listQty, setListQty] = useState("");

  const handleCreateListing = async () => {
    try {
      if (!listFarmId || !listPrice || !listQty || !listName) {
        alert("Please fill all required listing fields");
        return;
      }

      let imageCid = "";
      if (listImage) {
        imageCid = await uploadToIPFS(listImage);
      }

      const metadata = {
        name: listName.trim(),
        description: (listDesc || "").trim(),
        image: imageCid ? `ipfs://${imageCid}` : ""
      };
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      const metadataFile = new File([metadataBlob], 'metadata.json', { type: 'application/json' });
      const metadataCid = await uploadToIPFS(metadataFile);

      const priceUnits = ethers.parseUnits(listPrice.toString(), 6);
      const qtyUnits = BigInt(listQty);

      await contractService.listItem(Number(listFarmId), priceUnits, qtyUnits, metadataCid);
      alert("Listing created successfully!");

      setListFarmId("");
      setListName("");
      setListDesc("");
      setListImage(null);
      setListPrice("");
      setListQty("");
    } catch (e) {
      console.error(e);
      alert(`Failed to create listing: ${e.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">Farmer Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 md:p-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4 sm:mb-6">Create a New Farm Campaign</h2>
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
                <input
                  type="text"
                  placeholder="e.g., Organic Rice Farm 2024"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm Description</label>
                <textarea
                  placeholder="Describe your farm, location, crops, and investment opportunity..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm Image</label>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-xs sm:text-sm text-gray-700 file:mr-2 sm:file:mr-4 file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Funding Goal (in HUSDT)</label>
                <input
                  type="number"
                  placeholder="e.g., 10000"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Share Price (in HUSDT)</label>
                  <input
                    type="number"
                    placeholder="e.g., 10"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="pt-2 sm:pt-4">
                <button
                  onClick={handleCreateFarm}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition duration-300 text-sm sm:text-base"
                >
                  Create Farm
                </button>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 md:p-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4 sm:mb-6">My Farms</h2>
            <div className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <svg className="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm text-gray-600">Loading your farms...</p>
                </div>
              ) : myFarms.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-8">You haven't created any farms yet.</p>
              ) : (
                myFarms.map(farm => (
                  <div key={farm.id} className="border p-3 sm:p-4 rounded-lg">
                    <h3 className="font-semibold text-sm sm:text-base break-all">{farm.metaCID}</h3>
                    <p className="text-sm">Status: {farm.status.toString()}</p>
                    {farm.status === 1 && ( // Funded
                      <button 
                        onClick={() => handleDisburse(farm.id)}
                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm"
                      >
                        Disburse Funds
                      </button>
                    )}
                    {farm.status === 2 && ( // PaidOut
                      <div>
                        <input type="number" placeholder="Amount" id={`deposit-${farm.id}`} className="border rounded px-2 py-1 text-sm w-full" />
                        <button 
                          onClick={() => {
                            const amount = document.getElementById(`deposit-${farm.id}`).value;
                            handleDeposit(farm.id, amount);
                          }}
                          className="mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm w-full sm:w-auto"
                        >
                          Deposit Proceeds
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 bg-white rounded-lg shadow-md p-4 sm:p-6 md:p-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4 sm:mb-6">List a Product</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm</label>
              <select value={listFarmId} onChange={(e) => setListFarmId(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                <option value="">Select farm</option>
                {myFarms.map(f => (
                  <option key={f.id} value={f.id}>{f.metaCID}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input type="text" value={listName} onChange={(e) => setListName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={listDesc} onChange={(e) => setListDesc(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
              <input type="file" accept="image/*" onChange={(e) => setListImage(e.target.files[0])} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (HUSDT)</label>
              <input type="number" value={listPrice} onChange={(e) => setListPrice(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" value={listQty} onChange={(e) => setListQty(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="pt-4">
            <button onClick={handleCreateListing} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
              Create Listing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
