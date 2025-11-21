import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Suppress WalletConnect and Coinbase Analytics warnings that are not critical
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  const message = args[0]?.toString() || '';
  const stack = args[0]?.stack || '';
  const hasAnalyticsContext = args.some(
    (a) => typeof a === 'object' && a && a.context === 'AnalyticsSDKApiError'
  );
  
  // Suppress WalletConnect session_request errors and browser extension errors (these are harmless)
  if (message.includes('session_request') || 
      message.includes('without any listeners') ||
      message.includes('AnalyticsSDK') || // some SDKs log without space
      message.includes('Analytics SDK') || // others include a space
      hasAnalyticsContext ||
      message.includes('sendButton is not defined') ||
      stack.includes('content.js')) {
    return;
  }
  originalError.apply(console, args);
};

console.warn = (...args) => {
  const message = args[0]?.toString() || '';
  // Suppress analytics and wallet connection warnings
  if (message.includes('Analytics') || 
      message.includes('cca-lite.coinbase.com')) {
    return;
  }
  originalWarn.apply(console, args);
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
