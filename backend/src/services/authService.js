import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';

// JWT secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '7d'; // Token expires in 7 days

// In-memory storage for nonces (in production, use Redis or database)
const nonces = new Map();

/**
 * Generate a random nonce for wallet authentication
 * @param {string} address - Ethereum address
 * @returns {string} - Random nonce
 */
export function generateNonce(address) {
  const nonce = Math.floor(Math.random() * 1000000).toString();
  nonces.set(address.toLowerCase(), {
    nonce,
    timestamp: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  });
  return nonce;
}

/**
 * Get nonce for an address
 * @param {string} address - Ethereum address
 * @returns {string|null} - Nonce or null if not found/expired
 */
export function getNonce(address) {
  const data = nonces.get(address.toLowerCase());
  if (!data) return null;
  
  // Check if nonce has expired
  if (Date.now() > data.expiresAt) {
    nonces.delete(address.toLowerCase());
    return null;
  }
  
  return data.nonce;
}

/**
 * Verify a signed message from MetaMask
 * @param {string} address - Ethereum address that signed the message
 * @param {string} signature - Signature from MetaMask
 * @param {string} message - Original message that was signed
 * @returns {boolean} - True if signature is valid
 */
export function verifySignature(address, signature, message) {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Authenticate user with MetaMask signature
 * @param {string} address - Ethereum address
 * @param {string} signature - Signature from MetaMask
 * @returns {Object|null} - Auth result with JWT token or null if failed
 */
export function authenticateWithMetaMask(address, signature) {
  const nonce = getNonce(address);
  
  if (!nonce) {
    return {
      success: false,
      error: 'Nonce not found or expired. Please request a new nonce.'
    };
  }
  
  // Create the message that should have been signed
  const message = `Sign this message to authenticate with AgriYield.\n\nNonce: ${nonce}\nAddress: ${address}`;
  
  // Verify the signature
  const isValid = verifySignature(address, signature, message);
  
  if (!isValid) {
    return {
      success: false,
      error: 'Invalid signature'
    };
  }
  
  // Clear the used nonce
  nonces.delete(address.toLowerCase());
  
  // Generate JWT token
  const token = jwt.sign(
    {
      address: address.toLowerCase(),
      timestamp: Date.now()
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
  
  return {
    success: true,
    token,
    address: address.toLowerCase()
  };
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded token data or null if invalid
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Middleware to protect routes with JWT authentication
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  // Attach user info to request
  req.user = {
    address: decoded.address
  };
  
  next();
}

