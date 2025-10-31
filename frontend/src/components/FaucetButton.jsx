import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { getTokenBalance } from '../common/contractServices';

const MOCK_USDT_ADDR = import.meta.env.VITE_MOCK_USDT_ADDRESS;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function FaucetButton() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [balance, setBalance] = useState('0');
  const faucetAmount = '1,000';

  const checkBalance = async () => {
    if (!address) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const userBalance = await getTokenBalance(provider, MOCK_USDT_ADDR, address);
      setBalance(ethers.formatUnits(userBalance, 6));
    } catch (err) {
      console.error('Balance error:', err);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      checkBalance();
      const interval = setInterval(checkBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address]);

  const handleClaim = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Step 1: Associate token (this will trigger MetaMask popup)
      setSuccess('Step 1/2: Please approve token association in MetaMask...');
      const tokenAddress = MOCK_USDT_ADDR;

      // Call associate function via smart contract
      const iface = new ethers.Interface([
        'function associate() external returns (int64)'
      ]);

      const associateTx = await signer.sendTransaction({
        to: tokenAddress,
        data: iface.encodeFunctionData('associate', []),
        gasLimit: 800000
      });

      await associateTx.wait();
      setSuccess('✅ Token associated! Step 2/2: Claiming tokens...');

      // Step 2: Call backend to mint and transfer
      const response = await fetch(`${API_URL}/faucet/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evmAddress: address }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim tokens');
      }

      setSuccess(`✅ Successfully claimed ${faucetAmount} hUSDT!`);
      setTimeout(() => checkBalance(), 2000);

    } catch (err) {
      console.error('Faucet error:', err);
      if (err.code === 'ACTION_REJECTED') {
        setError('Transaction rejected by user');
      } else if (err.message?.includes('already associated')) {
        // Token already associated, try claiming directly
        try {
          const response = await fetch(`${API_URL}/faucet/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ evmAddress: address }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          setSuccess(`✅ Successfully claimed ${faucetAmount} hUSDT!`);
          setTimeout(() => checkBalance(), 2000);
        } catch (claimErr) {
          setError(claimErr.message || 'Failed to claim tokens');
        }
      } else {
        setError(err.message || 'Failed to claim tokens');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">Connect your wallet to claim test tokens</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">hUSDT Faucet</h3>
          <span className="text-sm text-gray-500">Testnet</span>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Your Balance</p>
          <p className="text-2xl font-bold text-gray-900">{balance} hUSDT</p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Amount per claim:</span>
          <span className="font-semibold text-gray-900">{faucetAmount} hUSDT</span>
        </div>

        <button
          onClick={handleClaim}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {loading ? 'Claiming...' : `Claim ${faucetAmount} hUSDT`}
        </button>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-xs">
            <strong>Note:</strong> Claim once every 24h. Complete KYC to invest.
          </p>
        </div>
      </div>
    </div>
  );
}
