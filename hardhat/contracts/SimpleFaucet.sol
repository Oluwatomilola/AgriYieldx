// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract SimpleFaucet {
    address public immutable tokenAddress;
    address public owner;

    mapping(address => uint256) public lastClaim;
    uint256 public faucetAmount = 1_000 * 10 ** 6; // 1,000 tokens with 6 decimals
    uint256 public faucetCooldown = 24 hours;

    event FaucetClaimed(address indexed user, uint256 amount);

    constructor(address _tokenAddress) {
        tokenAddress = _tokenAddress;
        owner = msg.sender;
    }

    function faucet(address to) external {
        require(
            block.timestamp - lastClaim[to] >= faucetCooldown,
            "Cooldown active"
        );

        lastClaim[to] = block.timestamp;

        IERC20 token = IERC20(tokenAddress);
        require(
            token.transfer(to, faucetAmount),
            "Transfer failed"
        );

        emit FaucetClaimed(to, faucetAmount);
    }

    function updateFaucetAmount(uint256 newAmount) external {
        require(msg.sender == owner, "Only owner");
        faucetAmount = newAmount;
    }

    function getContractBalance() external view returns (uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }
}
