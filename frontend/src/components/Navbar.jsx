import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import WalletConnect from "./WalletConnect";
import { isAuthenticated, getCurrentUserAddress, logout } from "../services/authService";

export default function Navbar() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userAddress, setUserAddress] = useState('');

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = isAuthenticated();
      setAuthenticated(isAuth);
      if (isAuth) {
        const address = getCurrentUserAddress();
        setUserAddress(address || '');
      }
    };
    
    checkAuth();
    // Check auth status periodically
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setUserAddress('');
    setUserMenuOpen(false);
    navigate('/');
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-20 xl:px-28">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <Link to='/' className="text-xl sm:text-2xl font-bold text-green-600">
                🌱 AgriYield
              </Link>
            </div>
            <div className="hidden md:flex items-baseline space-x-4">
              <Link
                to="/farms"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                Farm Listings
              </Link>
              <Link
                to="/marketplace"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                Marketplace
              </Link>
              <Link
                to="/faucet"
                className="px-3 py-2 rounded-md text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 transition-colors border border-green-200"
              >
                💧 Faucet
              </Link>
              <Link
                to="/investor"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                Investor Dashboard
              </Link>
              <Link
                to="/farmer"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                Farmer Dashboard
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden md:flex items-center space-x-4">
              {authenticated ? (
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                  >
                    <span className="hidden sm:inline">{formatAddress(userAddress)}</span>
                    <svg className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <div className="px-4 py-2 text-xs text-gray-500 border-b">
                        Signed in as
                      </div>
                      <div className="px-4 py-2 text-sm font-mono text-gray-700 border-b truncate">
                        {userAddress}
                      </div>
                      <Link
                        to="/investor"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  Sign In / Sign Up
                </Link>
              )}
              <WalletConnect />
            </div>
            
            {/* Mobile wallet connect */}
            <div className="md:hidden">
              <WalletConnect />
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              to="/farms"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Farm Listings
            </Link>
            <Link
              to="/marketplace"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Marketplace
            </Link>
            <Link
              to="/faucet"
              className="block px-3 py-2 rounded-md text-base font-medium bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 transition-colors border border-green-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              💧 Faucet
            </Link>
            <Link
              to="/investor"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Investor Dashboard
            </Link>
            <Link
              to="/farmer"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Farmer Dashboard
            </Link>
            
            {authenticated ? (
              <div className="pt-2 border-t border-gray-200">
                <div className="px-3 py-2 text-xs text-gray-500">
                  Signed in as
                </div>
                <div className="px-3 py-1 text-sm font-mono text-gray-700 truncate">
                  {userAddress}
                </div>
                <Link
                  to="/investor"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 transition-colors mt-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="block px-3 py-2 rounded-md text-base font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transition-all shadow-md text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In / Sign Up
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
