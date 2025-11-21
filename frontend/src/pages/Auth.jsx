import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider } from 'ethers';
import { authenticateWithMetaMask, isAuthenticated, getCurrentUserAddress } from '../services/authService';

export default function Auth() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/investor');
    }
  }, [navigate]);

  const handleMetaMaskAuth = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (!isConnected || !walletClient) {
        setError('Please connect your wallet first');
        setLoading(false);
        return;
      }

      // Convert wagmi walletClient to ethers signer
      const provider = new BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      // Authenticate with MetaMask
      const result = await authenticateWithMetaMask(signer);

      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setSuccess('Authentication successful! Redirecting...');
      
      // Redirect to investor dashboard after 1 second
      setTimeout(() => {
        navigate('/investor');
      }, 1000);

    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              Welcome to AgriYield
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Sign in with your MetaMask wallet to get started
            </p>
          </div>

          {/* Wallet Status */}
          {isConnected && address && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium mb-1">
                Wallet Connected
              </p>
              <p className="text-xs text-green-600 font-mono break-all">
                {address}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Authentication Button */}
          <button
            onClick={handleMetaMaskAuth}
            disabled={loading || !isConnected}
            className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold text-white transition-all duration-300 text-sm sm:text-base ${
              loading || !isConnected
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </span>
            ) : !isConnected ? (
              'Connect Wallet First'
            ) : (
              'Sign In with MetaMask'
            )}
          </button>

          {/* Info Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              How it works:
            </h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="font-bold text-green-600 mr-2">1.</span>
                <span>Connect your MetaMask wallet using the button in the top right</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-green-600 mr-2">2.</span>
                <span>Click "Sign In with MetaMask" to authenticate</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-green-600 mr-2">3.</span>
                <span>Sign the message in MetaMask to prove ownership</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-green-600 mr-2">4.</span>
                <span>Start investing in farms and supporting agricultural projects!</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

