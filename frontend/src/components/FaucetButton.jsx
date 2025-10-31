import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

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
      // Use Mirror Node API to get HTS token balance
      const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${address}`;
      const response = await fetch(mirrorNodeUrl);
      if (!response.ok) {
        setBalance('0');
        return;
      }
      const accountData = await response.json();
      const hederaAccountId = accountData.account;

      // Get token balance
      const tokenUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${hederaAccountId}/tokens?token.id=0.0.6918795`;
      const tokenResponse = await fetch(tokenUrl);
      const tokenData = await tokenResponse.json();

      if (tokenData.tokens && tokenData.tokens.length > 0) {
        const balance = tokenData.tokens[0].balance;
        setBalance((balance / 1000000).toFixed(2)); // Convert from smallest unit (6 decimals)
      } else {
        setBalance('0');
      }
    } catch (err) {
      console.error('Balance error:', err);
      setBalance('0');
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
      // Skip frontend association for now - will be done manually or via HashPack
      setSuccess('Checking token association and claiming tokens...');

      // Step 2: Call backend to grant KYC, mint and transfer
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
      } else if (err.message?.includes('TOKEN_ALREADY_ASSOCIATED') || err.message?.includes('already associated')) {
        // Token already associated, try claiming directly
        setSuccess('Token already associated. Claiming tokens...');
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
      } else if (err.message?.includes('Account lookup failed') || err.message?.includes('Account not found')) {
        setError('Your account needs to be activated on Hedera testnet first. Click "Get Test HBAR" below to activate your account.');
      } else if (err.message?.includes('Token not associated')) {
        setError(`First, you need to associate the hUSDT token with your account. Visit https://hashscan.io/testnet/token/0.0.6918795 and click "Associate Token", or use HashPack wallet to add token ID: 0.0.6918795`);
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

  const handleGetHBAR = () => {
    window.open('https://portal.hedera.com/faucet', '_blank');
  };

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
            {error.includes('activate') && (
              <button
                onClick={handleGetHBAR}
                className="mt-2 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
              >
                Get Test HBAR (Activate Account)
              </button>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-xs">
            <strong>Note:</strong> Your account must be activated on Hedera testnet first. If you haven't received HBAR yet, click below.
          </p>
          <button
            onClick={handleGetHBAR}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Get Test HBAR from Hedera Faucet
          </button>
        </div>
      </div>
    </div>
  );
}
