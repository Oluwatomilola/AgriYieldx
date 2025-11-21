# Smart Contract Changes for HTS Token Association

## Overview

Both `AgriYield.sol` and `Marketplace.sol` have been modified to support Hedera Token Service (HTS) token association. This is required for contracts deployed via EVM tools (Hardhat) to interact with HTS tokens.

---

## AgriYield.sol Changes

### 1. Updated IHederaTokenService Interface

Added the `associateToken` function to the interface:

```solidity
interface IHederaTokenService {
    function associateToken(address account, address token) external returns (int responseCode);
    // ... other functions
}
```

### 2. Added TokenAssociated Event

```solidity
event TokenAssociated(address indexed token);
```

### 3. Added associateToken() Function

```solidity
/// @notice Associate this contract with the HTS token
/// @dev Must be called after deployment to enable token transfers
/// @dev Only admin can call this function
function associateToken() external onlyAdmin {
    int response = HTS.associateToken(address(this), tokenAddress);
    require(
        response == HederaResponseCodes.SUCCESS,
        "AgriYield: token association failed"
    );
    emit TokenAssociated(tokenAddress);
}
```

**Location**: Lines 277-289 in `AgriYield.sol`

**Purpose**: Allows the contract to associate with the HUSDT token so it can receive and transfer tokens.

**Access Control**: Only the admin (set in constructor) can call this function.

**Usage**: Call once after deployment:
```javascript
const agriYield = await ethers.getContractAt("AgriYield", AGRIYIELD_ADDRESS);
await agriYield.associateToken();
```

---

## Marketplace.sol Changes

### 1. Updated IHederaTokenService Interface

Added the `associateToken` function to the interface:

```solidity
interface IHederaTokenService {
    function associateToken(address account, address token) external returns (int responseCode);
    // ... other functions
}
```

### 2. Added State Variable

```solidity
address public admin;
```

### 3. Added TokenAssociated Event

```solidity
event TokenAssociated(address indexed token);
```

### 4. Updated Constructor

```solidity
constructor(address _stableToken, address _agriYield) {
    require(_stableToken != address(0), "Marketplace: zero token");
    require(_agriYield != address(0), "Marketplace: zero agriYield");
    stableToken = _stableToken;
    agriYield = IAgriYield(_agriYield);
    admin = msg.sender;  // NEW LINE
}
```

### 5. Added onlyAdmin Modifier

```solidity
modifier onlyAdmin() {
    require(msg.sender == admin, "Marketplace: only admin");
    _;
}
```

### 6. Added associateToken() Function

```solidity
/// @notice Associate this contract with the HTS token
/// @dev Must be called after deployment to enable token transfers
/// @dev Only admin can call this function
function associateToken() external onlyAdmin {
    int response = HTS.associateToken(address(this), stableToken);
    require(
        response == HederaResponseCodes.SUCCESS,
        "Marketplace: token association failed"
    );
    emit TokenAssociated(stableToken);
}
```

**Location**: Lines 394-409 in `Marketplace.sol`

**Purpose**: Allows the contract to associate with the HUSDT token so it can receive and transfer tokens.

**Access Control**: Only the admin (deployer) can call this function.

**Usage**: Call once after deployment:
```javascript
const marketplace = await ethers.getContractAt("Marketplace", MARKETPLACE_ADDRESS);
await marketplace.associateToken();
```

---

## Why These Changes Are Necessary

### The Problem

On Hedera, contracts deployed via EVM tools (like Hardhat) cannot interact with HTS tokens by default. They must explicitly associate with each token before they can:
- Receive tokens
- Transfer tokens
- Check token balances

### The Solution

The `associateToken()` function calls the HTS precompile at address `0x167` to create an association between the contract and the HUSDT token.

### HTS Precompile

```solidity
address constant HTS_PRECOMPILE = address(0x167);
```

The precompile provides native Hedera functionality accessible from Solidity contracts.

---

## Deployment Flow

### 1. Deploy Contracts

```bash
npx hardhat run scripts/deploy-and-associate.js --network hederaTestnet
```

This script:
1. Deploys FarmShares
2. Deploys AgriYield
3. Deploys Marketplace
4. Calls `agriYield.associateToken()`
5. Calls `marketplace.associateToken()`

### 2. Verify Association

Check on HashScan or via backend API:

```bash
curl http://localhost:4000/api/association/check/0xCONTRACT_ADDRESS
```

### 3. Test Token Transfers

After association, the contracts can:
- Accept HUSDT deposits from investors
- Transfer HUSDT to farmers
- Process marketplace payments

---

## Error Handling

### Common Errors

**"TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT"**
- This is OK! It means the contract is already associated.
- No action needed.

**"INVALID_SIGNATURE"**
- Check that the caller is the admin address
- Verify the private key matches the admin account

**"INSUFFICIENT_TX_FEE"**
- The account needs more HBAR for gas
- Get testnet HBAR from https://portal.hedera.com/

---

## Testing

### Manual Test

```javascript
// 1. Deploy contracts
const agriYield = await AgriYield.deploy(farmShares, husdt, admin);
const marketplace = await Marketplace.deploy(husdt, agriYield);

// 2. Associate with token
await agriYield.associateToken();
await marketplace.associateToken();

// 3. Verify by attempting a transfer
const amount = ethers.parseUnits("100", 6);
await husdt.transfer(agriYield.address, amount);
// Should succeed if association worked
```

### Automated Test

See `hardhat/scripts/associate-existing-contracts.js` for a complete example.

---

## Contract Addresses (Current Deployment)

- **AgriYield**: `0x380AAae7b3a9ec87Ff6A5CEd5e1a5110B591D7A5`
- **Marketplace**: `0x7CA91C3c6B9B9d9d2F29eb0c5840D0D789987D22`
- **FarmShares**: `0x661C2AbB83101dd1CDe57F5777C146862299416E`
- **HUSDT Token**: `0x00000000000000000000000000000000006d3eca` (Token ID: 0.0.6918795)

---

## Next Steps After Association

1. ✅ Contracts can now receive HUSDT
2. ✅ Contracts can now transfer HUSDT
3. 🔄 Update frontend to handle token approvals
4. 🔄 Implement authentication for investment/withdrawal
5. 🔄 Add comprehensive testing

---

## References

- [Hedera Token Service Documentation](https://docs.hedera.com/hedera/sdks-and-apis/sdks/token-service)
- [HTS Precompile Reference](https://docs.hedera.com/hedera/core-concepts/smart-contracts/hedera-token-service-system-contract)
- [HashScan Explorer](https://hashscan.io/testnet)

