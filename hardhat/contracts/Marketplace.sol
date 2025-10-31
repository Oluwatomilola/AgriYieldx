// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Hedera HTS precompile imports - using interface for now
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Hedera Token Service interface
interface IHederaTokenService {
    function transferToken(
        address token,
        address from,
        address to,
        int64 amount
    ) external returns (int);
    function isKyc(
        address token,
        address account
    ) external view returns (int, bool);
}

// Hedera Response Codes
library HederaResponseCodes {
    int constant SUCCESS = 22;
}

interface IAgriYield {
    /// Returns farm tuple. status returned as uint8 (enum index)
    function getFarm(
        uint256 farmId
    )
        external
        view
        returns (
            address farmer,
            uint256 fundingGoal,
            uint256 raised,
            uint256 proceeds,
            uint256 shareSupply,
            uint256 sharePrice,
            uint8 status,
            string memory metaCID
        );
}

contract Marketplace is ReentrancyGuard {
    // Hedera HTS precompile address and instance
    address constant HTS_PRECOMPILE_ADDR = address(uint160(0x167));
    IHederaTokenService constant HTS = IHederaTokenService(HTS_PRECOMPILE_ADDR);
    address public immutable stableToken; // HTS token EVM address (HUSDT/hUSDT)
    IAgriYield public immutable agriYield;

    enum OrderStatus {
        Created,
        Shipped,
        Received,
        Completed,
        Disputed,
        Resolved
    }

    struct Listing {
        uint256 farmId;
        address farmer;
        uint256 price; // price per unit (in smallest token units)
        uint256 quantity;
        uint256 quantityRemaining;
        string metadataCID;
        bool isActive;
    }

    struct Order {
        uint256 listingId;
        address buyer;
        address seller;
        uint256 price; // total price (price * qty)
        uint256 quantity;
        string shippingCID;
        string proofCID;
        OrderStatus status;
        bool isDisputed;
        string disputeReasonCID;
    }

    uint256 public nextListingId = 1;
    uint256 public nextOrderId = 1;

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Order) public orders;

    // Events
    event ListingCreated(
        uint256 indexed listingId,
        uint256 indexed farmId,
        address indexed farmer,
        uint256 price,
        uint256 quantity,
        string metadataCID
    );
    event ListingUpdated(
        uint256 indexed listingId,
        uint256 price,
        uint256 quantity
    );
    event ListingDeactivated(uint256 indexed listingId);
    event OrderCreated(
        uint256 indexed orderId,
        uint256 indexed listingId,
        address indexed buyer,
        address seller,
        uint256 price,
        uint256 quantity
    );
    event OrderShipped(uint256 indexed orderId, string shippingCID);
    event OrderReceived(uint256 indexed orderId, string proofCID);
    event FundsReleased(
        uint256 indexed orderId,
        address indexed seller,
        uint256 amount
    );
    event DisputeOpened(uint256 indexed orderId, string reasonCID);
    event DisputeResolved(uint256 indexed orderId, bool sellerFavor);

    constructor(address _stableToken, address _agriYield) {
        require(_stableToken != address(0), "Marketplace: zero token");
        require(_agriYield != address(0), "Marketplace: zero agriYield");
        stableToken = _stableToken;
        agriYield = IAgriYield(_agriYield);
    }

    // -------------------------
    // Helpers
    // -------------------------
    function _toI64(uint256 x) internal pure returns (int64) {
        // max int64 = 9223372036854775807
        require(x <= 9223372036854775807, "Marketplace: amount too large");
        return int64(int256(x));
    }

    function _isKyc(address account) internal view returns (int, bool) {
        // Calls IHederaTokenService.isKyc(tokenAddress, account)
        (int rc, bool enabled) = HTS.isKyc(stableToken, account);
        return (rc, enabled);
    }

    // Listing management

    function listItem(
        uint256 farmId,
        uint256 price,
        uint256 quantity,
        string calldata metadataCID
    ) external returns (uint256) {
        require(price > 0, "Marketplace: price>0");
        require(quantity > 0, "Marketplace: qty>0");

        // validate caller is farmer of the farmId via AgriYield
        (address farmer, , , , , , , ) = agriYield.getFarm(farmId);
        require(msg.sender == farmer, "Marketplace: only farm owner");

        uint256 listingId = nextListingId++;
        listings[listingId] = Listing({
            farmId: farmId,
            farmer: msg.sender,
            price: price,
            quantity: quantity,
            quantityRemaining: quantity,
            metadataCID: metadataCID,
            isActive: true
        });

        emit ListingCreated(
            listingId,
            farmId,
            msg.sender,
            price,
            quantity,
            metadataCID
        );
        return listingId;
    }

    function updateListing(
        uint256 listingId,
        uint256 price,
        uint256 quantity
    ) external {
        Listing storage l = listings[listingId];
        require(l.isActive, "Marketplace: inactive");
        require(msg.sender == l.farmer, "Marketplace: only farmer");
        require(price > 0 && quantity > 0, "Marketplace: invalid args");

        l.price = price;
        l.quantity = quantity;
        l.quantityRemaining = quantity;

        emit ListingUpdated(listingId, price, quantity);
    }

    function deactivateListing(uint256 listingId) external {
        Listing storage l = listings[listingId];
        require(l.isActive, "Marketplace: already inactive");
        require(msg.sender == l.farmer, "Marketplace: only farmer");
        l.isActive = false;
        emit ListingDeactivated(listingId);
    }

    // -------------------------
    // Purchase / Order flow
    // -------------------------
    function purchase(
        uint256 listingId,
        uint256 quantity
    ) external nonReentrant returns (uint256) {
        Listing storage l = listings[listingId];
        require(l.isActive, "Marketplace: listing inactive");
        require(
            quantity > 0 && quantity <= l.quantityRemaining,
            "Marketplace: invalid qty"
        );

        // KYC check: buyer must be KYC-enabled on HTS token
        (int rcK, bool enabled) = _isKyc(msg.sender);
        require(
            rcK == HederaResponseCodes.SUCCESS && enabled,
            "Marketplace: buyer KYC required"
        );

        uint256 totalPrice = l.price * quantity;

        // Transfer HTS token from buyer to this contract (escrow)
        int transferRc = HTS.transferToken(
            stableToken,
            msg.sender,
            address(this),
            _toI64(totalPrice)
        );
        require(
            transferRc == HederaResponseCodes.SUCCESS,
            "Marketplace: token transfer failed"
        );

        // Update listing and create order
        l.quantityRemaining -= quantity;
        if (l.quantityRemaining == 0) l.isActive = false;

        uint256 orderId = nextOrderId++;
        orders[orderId] = Order({
            listingId: listingId,
            buyer: msg.sender,
            seller: l.farmer,
            price: totalPrice,
            quantity: quantity,
            shippingCID: "",
            proofCID: "",
            status: OrderStatus.Created,
            isDisputed: false,
            disputeReasonCID: ""
        });

        emit OrderCreated(
            orderId,
            listingId,
            msg.sender,
            l.farmer,
            totalPrice,
            quantity
        );
        return orderId;
    }

    function shipOrder(uint256 orderId, string calldata shippingCID) external {
        Order storage o = orders[orderId];
        require(msg.sender == o.seller, "Marketplace: only seller");
        require(
            o.status == OrderStatus.Created,
            "Marketplace: not in created state"
        );
        require(!o.isDisputed, "Marketplace: disputed");

        o.status = OrderStatus.Shipped;
        o.shippingCID = shippingCID;
        emit OrderShipped(orderId, shippingCID);
    }

    function confirmReceived(
        uint256 orderId,
        string calldata proofCID
    ) external {
        Order storage o = orders[orderId];
        require(msg.sender == o.buyer, "Marketplace: only buyer");
        require(o.status == OrderStatus.Shipped, "Marketplace: not shipped");
        require(!o.isDisputed, "Marketplace: disputed");

        o.status = OrderStatus.Received;
        o.proofCID = proofCID;
        emit OrderReceived(orderId, proofCID);
    }

    /// Buyer releases funds to seller (escrow -> seller)
    function releaseFunds(uint256 orderId) external nonReentrant {
        Order storage o = orders[orderId];
        require(msg.sender == o.buyer, "Marketplace: only buyer");
        require(o.status == OrderStatus.Received, "Marketplace: not received");
        require(!o.isDisputed, "Marketplace: disputed");
        o.status = OrderStatus.Completed;
        int rc = HTS.transferToken(
            stableToken,
            address(this),
            o.seller,
            _toI64(o.price)
        );
        require(
            rc == HederaResponseCodes.SUCCESS,
            "Marketplace: release failed"
        );

        emit FundsReleased(orderId, o.seller, o.price);
    }

    function openDispute(uint256 orderId, string calldata reasonCID) external {
        Order storage o = orders[orderId];
        require(msg.sender == o.buyer, "Marketplace: only buyer");
        require(
            o.status == OrderStatus.Shipped || o.status == OrderStatus.Received,
            "Marketplace: cannot dispute now"
        );
        require(!o.isDisputed, "Marketplace: already disputed");

        o.isDisputed = true;
        o.disputeReasonCID = reasonCID;
        o.status = OrderStatus.Disputed;
        emit DisputeOpened(orderId, reasonCID);
    }

    function resolveDispute(
        uint256 orderId,
        bool sellerFavor
    ) external nonReentrant {
        Order storage o = orders[orderId];
        require(o.isDisputed, "Marketplace: no dispute");
        require(o.status == OrderStatus.Disputed, "Marketplace: not disputed");

        o.status = OrderStatus.Resolved;

        if (sellerFavor) {
            int rc = HTS.transferToken(
                stableToken,
                address(this),
                o.seller,
                _toI64(o.price)
            );
            require(
                rc == HederaResponseCodes.SUCCESS,
                "Marketplace: seller transfer failed"
            );
        } else {
            int rc = HTS.transferToken(
                stableToken,
                address(this),
                o.buyer,
                _toI64(o.price)
            );
            require(
                rc == HederaResponseCodes.SUCCESS,
                "Marketplace: refund failed"
            );
        }

        emit DisputeResolved(orderId, sellerFavor);
    }

    // -------------------------
    // View helpers
    // -------------------------
    function getListing(
        uint256 listingId
    ) external view returns (Listing memory) {
        return listings[listingId];
    }

    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }
}
