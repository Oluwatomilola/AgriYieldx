import { getDefaultConfig } from '@rainbow-me/rainbowkit';

const HEDERA_TESTNET_ID = 296;

const hederaTestnet = {
  id: HEDERA_TESTNET_ID,
  name: 'Hedera Testnet',
  nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet.hashio.io/api'] },
    public: { http: ['https://testnet.hashio.io/api'] },
  },
  blockExplorers: {
    default: { name: 'Hashscan', url: 'https://hashscan.io/testnet' },
  },
  testnet: true,
};

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

export const config = getDefaultConfig({
  appName: import.meta.env.VITE_APP_NAME ?? 'AgriYield Testnet',
  projectId,
  chains: [hederaTestnet],
  ssr: false,
});
