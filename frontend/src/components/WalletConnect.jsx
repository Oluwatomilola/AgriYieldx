import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';

export default function WalletConnect() {
  const { address, isConnecting, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (!isConnected) {
    return (
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openConnectModal,
          openChainModal,
          openAccountModal,
          mounted,
        }) => {
          const ready = mounted;
          if (!ready) {
            return (
              <button 
                className="bg-gray-400 text-white font-medium rounded-lg px-4 py-2 cursor-not-allowed opacity-50"
                disabled
              >
                Loading...
              </button>
            );
          }
          return (
            <button
              onClick={openConnectModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 transition-all cursor-pointer"
            >
              Connect Wallet
            </button>
          );
        }}
      </ConnectButton.Custom>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="px-3 py-1 bg-white/10 text-white rounded-full text-sm border border-white/30">
        {`${address.slice(0, 4)}...${address.slice(-4)}`}
      </div>
      <button 
        onClick={() => disconnect()}
        className="px-4 py-2 hover:scale-105 bg-red-400 text-white dark:hover:bg-error/20 hover:text-error font-medium rounded-full transition-all duration-300 text-sm"
      >
        Disconnect
      </button>
    </div>
  );
}