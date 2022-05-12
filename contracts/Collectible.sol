// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "./ERC721B.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

error MaxWhitelistMintLimitExceeded();
error NotWhitelistedOrAlreadyMinted();
error EthValueTooLow();
error NotAuthorized();
error TransferFailed();
error UserListNotEqualToSlotList();

//TODO: OPTIONAL MISSING PROPERTIES
// hasPublicMintStarted -> Also check in mint methods and add a setter for this property and add tests
// hasWhitelistMintStarted -> Also check in whitelist mint method and add a setter for this property and add tests
// isRevealed -> Also check in tokenUri method and add a setter for this property and add tests
// whitelistPrice -> If it differ from the public mint price

contract Collectible is ERC721B {
    using Strings for uint256;
    uint256 public constant PUBLIC_PRICE = 0.05 ether;
    address public owner;

    mapping(address => uint256) public whiteList;

    constructor() {
        owner = _msgSender();
        baseUri = "[YOUR IPFS URL]";
        _safeMint(msg.sender, 1);
        unchecked {
            ownerIdToBalanceOfTokens[msg.sender]++;
        }
    }

    function publicBatchMint_Kh1x(uint256 quantity) external payable {
        if (quantity == 0) revert ZeroQuantity();

        _safeMint(_msgSender(), quantity);

        unchecked {
            ownerIdToBalanceOfTokens[_msgSender()] += quantity;
        }

        refundIfOver(PUBLIC_PRICE * quantity);
    }

    function publicSingleMint_Eq() external payable {
        _safeMint(_msgSender(), 1);

        unchecked {
            ownerIdToBalanceOfTokens[_msgSender()]++;
        }

        refundIfOver(PUBLIC_PRICE);
    }

    function refundIfOver(uint256 price) private {
        if (msg.value < price) revert EthValueTooLow();
        if (msg.value > price) {
            payable(_msgSender()).transfer(msg.value - price);
        }
    }

    function whitelistBatchMint(uint256 quantity) external payable {
        if (quantity == 0) revert ZeroQuantity();
        if (whiteList[_msgSender()] == 0)
            revert NotWhitelistedOrAlreadyMinted();
        if (quantity > whiteList[_msgSender()])
            revert MaxWhitelistMintLimitExceeded();

        unchecked {
            whiteList[_msgSender()] -= quantity;
        }

        _safeMint(_msgSender(), quantity);
        refundIfOver(PUBLIC_PRICE * quantity);
    }

    function whitelistSingleMint() external payable {
        if(whiteList[_msgSender()] == 0) revert NotWhitelistedOrAlreadyMinted();
        unchecked {
            whiteList[_msgSender()]--;
        }

        _safeMint(_msgSender(), 1);
        refundIfOver(PUBLIC_PRICE);
    }

    function withdrawMoney() external onlyOwner {
        (bool success, ) = _msgSender().call{value: address(this).balance}("");
        if (!success) revert TransferFailed();
    }

    // MODIFIER SECTION -----------------------------------------------------------------
    modifier onlyOwner() {
        isAuthorized();
        _;
    }

    function isAuthorized() internal view {
        if (_msgSender() != owner) revert NotAuthorized();
    }

    // EXTERNAL SETTER SECTION ------------------------------------------------------------
    function setBaseURI(string calldata _baseUri) external onlyOwner {
        baseUri = _baseUri;
    }

    function setWhiteListUsers(
        address[] calldata users,
        uint256[] calldata mintSlots
    ) external onlyOwner {
        if (users.length != mintSlots.length)
            revert UserListNotEqualToSlotList();
        for (uint256 i = 0; i < users.length; i++) {
            unchecked {
                whiteList[users[i]] = mintSlots[i];
            }
        }
    }
}
