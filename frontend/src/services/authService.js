import { ethers } from 'ethers';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Get authentication token from localStorage
 * @returns {string|null} - JWT token or null
 */
export function getAuthToken() {
  return localStorage.getItem('agriyield_auth_token');
}

/**
 * Set authentication token in localStorage
 * @param {string} token - JWT token
 */
export function setAuthToken(token) {
  localStorage.setItem('agriyield_auth_token', token);
}

/**
 * Remove authentication token from localStorage
 */
export function clearAuthToken() {
  localStorage.removeItem('agriyield_auth_token');
  localStorage.removeItem('agriyield_user_address');
}

/**
 * Get current user address from localStorage
 * @returns {string|null} - User address or null
 */
export function getCurrentUserAddress() {
  return localStorage.getItem('agriyield_user_address');
}

/**
 * Set current user address in localStorage
 * @param {string} address - User address
 */
export function setCurrentUserAddress(address) {
  localStorage.setItem('agriyield_user_address', address);
}

/**
 * Authenticate with MetaMask
 * @param {Object} signer - Ethers signer from wallet
 * @returns {Object} - Authentication result
 */
export async function authenticateWithMetaMask(signer) {
  try {
    const address = await signer.getAddress();
    
    // Step 1: Request nonce from backend
    const nonceResponse = await fetch(`${API_URL}/auth/nonce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    });
    
    if (!nonceResponse.ok) {
      throw new Error('Failed to get nonce from server');
    }
    
    const { nonce, message } = await nonceResponse.json();
    
    // Step 2: Sign the message with MetaMask
    const signature = await signer.signMessage(message);
    
    // Step 3: Verify signature with backend
    const verifyResponse = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, signature })
    });
    
    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      throw new Error(error.error || 'Authentication failed');
    }
    
    const result = await verifyResponse.json();
    
    // Store token and address
    setAuthToken(result.token);
    setCurrentUserAddress(result.address);
    
    return {
      success: true,
      token: result.token,
      address: result.address
    };
  } catch (error) {
    console.error('MetaMask authentication error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} - True if authenticated
 */
export function isAuthenticated() {
  const token = getAuthToken();
  const address = getCurrentUserAddress();
  return !!(token && address);
}

/**
 * Logout user
 */
export function logout() {
  clearAuthToken();
}

/**
 * Get current user info from backend
 * @returns {Object} - User info or error
 */
export async function getCurrentUser() {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      clearAuthToken();
      return { success: false, error: 'Session expired' };
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get current user error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Make authenticated API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch response
 */
export async function authenticatedFetch(endpoint, options = {}) {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };
  
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });
}

