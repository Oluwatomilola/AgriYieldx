// import { createContext, useContext, useState } from "react";

// const defaultValue = {
//   metamaskAccountAddress: '',
//   setMetamaskAccountAddress: () => { },
// }

// export const MetamaskContext = createContext(defaultValue)

// export const MetamaskContextProvider = (props) => {
//   const [metamaskAccountAddress, setMetamaskAccountAddress] = useState('')

//   return (
//     <MetamaskContext.Provider
//       value={{
//         metamaskAccountAddress,
//         setMetamaskAccountAddress
//       }}
//     >
//       {props.children}
//     </MetamaskContext.Provider>
//   )
// }

// export const useMetamaskWallet = () => {
//   const context = useContext(MetamaskContext);
//   if (!context) {
//       throw new Error('useMetamaskWallet must be used within a WalletProvider');
//   }
//   return context;
// };
