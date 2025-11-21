import { useState } from 'react';
import { ethers } from 'ethers';

export default function InvestmentModal({ farm, onClose, onInvest }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');

  const steps = [
    { title: 'Enter Amount', description: 'Specify how much HUSDT you want to invest' },
    { title: 'Approve Tokens', description: 'Approve AgriYield to spend your HUSDT' },
    { title: 'Invest', description: 'Transfer tokens and receive farm shares' },
  ];

  const handleInvest = async () => {
    try {
      setError('');
      setLoading(true);

      // Validate farm data
      if (!farm.sharePrice || farm.sharePrice === null) {
        setError('Invalid farm data. Please try again later.');
        setLoading(false);
        return;
      }

      // Validate amount
      const investAmount = parseFloat(amount);
      if (!investAmount || investAmount <= 0) {
        setError('Please enter a valid amount');
        setLoading(false);
        return;
      }

      // Check if amount is multiple of share price using 6-decimal integer math
      const sharePriceBigInt = BigInt(farm.sharePrice);
      const amount6 = ethers.parseUnits(amount, 6);
      if (sharePriceBigInt === 0n || amount6 % sharePriceBigInt !== 0n) {
        const sharePriceDisplay = ethers.formatUnits(farm.sharePrice, 6);
        setError(`Amount must be a multiple of ${sharePriceDisplay} HUSDT (share price)`);
        setLoading(false);
        return;
      }

      // Convert to smallest units (6 decimals for HUSDT)
      const amountInSmallestUnits = ethers.parseUnits(amount, 6);

      // Move to step 2 (Authenticate)
      setCurrentStep(1);

      // Call the invest function which handles authentication and backend processing
      const result = await onInvest(farm.id, amountInSmallestUnits);

      // Move to step 3 (Processing) - backend handles token transfer and share minting
      setCurrentStep(2);

      // Success!
      let tokenId = "";
      let serial = 0;
      let transferTxId = "";
      try {
        const apiBase = (import.meta.env.VITE_RECEIPTS_API_URL && String(import.meta.env.VITE_RECEIPTS_API_URL)) || (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/receipts` : "http://localhost:4000/api/receipts");
        try {
          await fetch(`${apiBase}/reprocess/tx/${result.transactionHash}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
        } catch {}
        try {
          let userAddr = '';
          try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            userAddr = accounts && accounts.length ? accounts[0] : '';
          } catch {}
          if (userAddr) {
            await fetch(`${apiBase}/mapping`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ evm: userAddr }) });
            const amountStr = String(Number(investAmount) * 10 ** 6);
            const sharePriceCalc = BigInt(farm.sharePrice || 0);
            const sharesNum = sharePriceCalc ? Number(amountInSmallestUnits / sharePriceCalc) : 0;
            const farmIdNum = Number(farm?.id || farm?.farmId || selectedFarmId || 0);
            if (farmIdNum && sharesNum) {
              await fetch(`${apiBase}/simulate/invest`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ farmId: farmIdNum, investor: userAddr, amount: amountStr, shares: sharesNum, txHash: result.transactionHash }) });
            }
          }
        } catch {}
      } catch {}
      try {
        const api = (import.meta.env.VITE_RECEIPTS_API_URL && String(import.meta.env.VITE_RECEIPTS_API_URL)) || (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/receipts` : "http://localhost:4000/api/receipts");
        for (let i = 0; i < 20; i++) {
          const resp = await fetch(`${api}/receipts/tx/${result.transactionHash}`);
          if (resp.ok) {
            const rec = await resp.json();
            if (rec && rec.status === "MINTED" && rec.tokenId) {
              tokenId = String(rec.tokenId);
              serial = Number(rec.serial || 0);
              transferTxId = String(rec.transferTxId || "");
              break;
            }
          }
          await new Promise(r => setTimeout(r, 3000));
        }
      } catch {}
      const tokenUrl = tokenId ? `https://hashscan.io/testnet/token/${tokenId}` : "";
      const nftUrl = tokenId && serial ? `https://hashscan.io/testnet/nft/${tokenId}/${serial}` : tokenUrl;
      const transferUrl = transferTxId ? `https://hashscan.io/testnet/transaction/${transferTxId}` : "";
      const sharePriceCalc = BigInt(farm.sharePrice || 0);
      let sharesMinted = sharePriceCalc ? Number(amountInSmallestUnits / sharePriceCalc) : 0;
      try {
        const api = (import.meta.env.VITE_RECEIPTS_API_URL && String(import.meta.env.VITE_RECEIPTS_API_URL)) || (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/receipts` : "http://localhost:4000/api/receipts");
        const r2 = await fetch(`${api}/receipts/tx/${result.transactionHash}`);
        if (r2.ok) {
          const jr2 = await r2.json();
          if (jr2?.metadata?.shares) sharesMinted = Number(jr2.metadata.shares);
        }
      } catch {}
      onClose();
      alert(`Investment successful!\n\nTransaction Hash: ${result.transactionHash}\nShares Minted: ${sharesMinted}${tokenId ? `\n\nReceipt NFT: ${tokenId} #${serial}\nHashscan (NFT): ${nftUrl}${transferUrl ? `\nHashscan (Transfer): ${transferUrl}` : ""}` : ""}`);

    } catch (err) {
      console.error('Investment error:', err);
      setError(err.message || 'Investment failed. Please try again.');
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  const calculateShares = () => {
    if (!amount || !farm.sharePrice || farm.sharePrice === null || farm.sharePrice === '0') return 0;
    try {
      const investAmount6 = ethers.parseUnits(amount, 6);
      const sharePriceBigInt = BigInt(farm.sharePrice);
      if (sharePriceBigInt === 0n) return 0;
      return Number(investAmount6 / sharePriceBigInt);
    } catch {
      return 0;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 my-4 max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <div className="flex-1 pr-2">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
              Invest in {farm.name || 'Farm'}
            </h2>
            {farm.description && (
              <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                {farm.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl flex-shrink-0"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* Progress Steps */}
        <div className="mb-4 sm:mb-6">
          <div className="flex justify-between mb-2 gap-1">
            {steps.map((step, index) => (
              <div key={index} className="flex-1 text-center">
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${index <= currentStep
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                    }`}
                >
                  {index + 1}
                </div>
                <p className="text-[10px] sm:text-xs mt-1 text-gray-600">{step.title}</p>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Farm Details */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
          <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
            <div>
              <p className="text-gray-600">Share Price:</p>
              <p className="font-semibold">{farm.sharePrice && farm.sharePrice !== null ? ethers.formatUnits(farm.sharePrice, 6) : '0'} HUSDT</p>
            </div>
            <div>
              <p className="text-gray-600">Available Shares:</p>
              <p className="font-semibold">{farm.sharePrice && farm.sharePrice !== null && BigInt(farm.sharePrice) !== 0n ? Number(farm.shareSupply) - Number(BigInt(farm.raised || 0) / BigInt(farm.sharePrice)) : Number(farm.shareSupply || 0)}</p>
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Investment Amount (HUSDT)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={loading}
            step={farm.sharePrice && farm.sharePrice !== null ? ethers.formatUnits(farm.sharePrice, 6) : '1'}
          />
          {amount && (
            <p className="text-sm text-gray-600 mt-1">
              You will receive <span className="font-semibold">{calculateShares()} shares</span>
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleInvest}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={loading || !amount}
          >
            {loading ? (currentStep === 1 ? 'Transferring...' : currentStep === 2 ? 'Claiming...' : 'Processing...') : 'Invest Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

