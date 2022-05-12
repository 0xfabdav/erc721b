// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

// @author 0xfabdav https://github.com/0xfabdav

/**
 * @dev gas efficient implementation of the ERC721 token standard
 * This ERC721 implementation is targeted to minimize gas cost for batch mints.
 * The same storage mechanism is used as in other well known ERC721 implementations
 * (e.g. ERC721A from Azuki). In detail this means that each ownership is stored 
 * only 1 time no matter if single or batch mint. to save a much larger amount of gas,
 * static variables like collection size and max mints per user are defined as constants
 * which makes the contract itself inflexible but a must as long as gas costs you half
 * your fortune.
 */

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

error ZeroAddress();
error ZeroQuantity();
error ApproveToCaller();
error CalledByContract();
error TokenAlreadyMinted();
error TotalAmountWasMinted();
error ApprovalToCurrentOwner();
error QueryForNonExistentToken();
error CallerNotOwnerNorApproved();
error MaxUserMintLimitWasReached();
error TransferFromIncorrectAddress();
error TransferToNonERC721ReceiverImplementer();

contract ERC721B is
    Context,
    ERC165,
    IERC721,
    IERC721Metadata {

    uint256 public tokenCounter = 0;

    uint256 public constant MAX_MINTS_PER_USER = 5;
    // adjust for production, only set on "26" to test "TotalAmountWasMinted" error
    uint256 public constant COLLECTION_SIZE = 26;
    string public constant COLLECTION_NAME = "Collectible";
    string public constant COLLECTION_SYMBOL = "TEST";

    string internal baseUri;
    mapping(address => mapping(address => bool)) internal ownerIdToOperatorApprovals;
    mapping(uint256 => address) internal tokenIdToApprovedAddress;
    mapping(address => uint256) internal ownerIdToBalanceOfTokens;
    address[COLLECTION_SIZE] internal ownerships;

    // External functions
    /**
    * @dev See {IERC721-ownerOf}.
    */
    function ownerOf(uint256 tokenId) external view returns (address) {
        return ownershipOf(tokenId);
    }

    /**
    * @dev See {IERC721-balanceOf}.
    */
    function balanceOf(address from) external view returns (uint256) {
        if (from == address(0)) revert ZeroAddress();
        return ownerIdToBalanceOfTokens[from];
    }

    /**
    * @dev See {IERC721-getApproved}.
    */
    function getApproved(uint256 tokenId) external view returns (address) {
        if (tokenId >= tokenCounter)
            revert QueryForNonExistentToken();
        return tokenIdToApprovedAddress[tokenId];
    }

    // Public functions
    /**
     * @dev See {IERC721Metadata-name}.
     */
    function name() public view virtual override returns (string memory) {
        return COLLECTION_NAME;
    }

    /**
     * @dev See {IERC721Metadata-symbol}.
     */
    function symbol() public view virtual override returns (string memory) {
        return COLLECTION_SYMBOL;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if (tokenId >= tokenCounter) revert QueryForNonExistentToken();
        return string(abi.encodePacked(baseUri, Strings.toString(tokenId), ".json"));
    }

    /**
    * @dev See {IERC721-transferFrom}.
    */
    function transferFrom(
        address from,
        address to,
        uint256 id
    ) public {
        address previousOwner = ownershipOf(id);

        bool isApprovedOrOwner = (_msgSender() == previousOwner ||
            isApprovedForAll(previousOwner, _msgSender()) ||
            tokenIdToApprovedAddress[id] == _msgSender());

        if (!isApprovedOrOwner)
            revert CallerNotOwnerNorApproved();
        
        if (from != previousOwner)
            revert TransferFromIncorrectAddress();
        
        if (to == address(0))
            revert ZeroAddress();

        unchecked {
            ownerIdToBalanceOfTokens[from]--;
            ownerIdToBalanceOfTokens[to]++;
            ownerships[id] = to;

            uint256 nextTokenId = id + 1;
            if (ownerships[nextTokenId] == address(0)) {
                if (nextTokenId < tokenCounter) {
                    ownerships[nextTokenId] = previousOwner;
                }
            }
        }

        // Clear approval
        _approve(previousOwner, address(0), id);

        emitTransfer(from, to, id, 1);
    }

    /**
    * @dev See {IERC721-safeTransferFrom}.
    */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id
    ) public {
        safeTransferFrom(from, to, id, "");
    }

    /**
    * @dev See {IERC721-safeTransferFrom}.
    */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        bytes memory data
    ) public {
        transferFrom(from, to, id);
        if (!calledByUser() || !_checkOnERC721Received(from, to, data))
            revert TransferToNonERC721ReceiverImplementer();
    }

    /**
    * @dev Approve `to` to operate on `tokenId`
    * Emits a {Approval} event.
    */
    function approve(
        address to,
        uint256 id
    ) public {
        address owner = ownershipOf(id);

        if (to == owner) revert ApprovalToCurrentOwner();

        if (_msgSender() != owner && !isApprovedForAll(owner, _msgSender()))
            revert CallerNotOwnerNorApproved();

        _approve(owner, to, id);
    }

    /**
    * @dev See {IERC721-setApprovalForAll}.
    */
    function setApprovalForAll(
        address operator,
        bool approved
    ) public {
        if (operator == _msgSender())
            revert ApproveToCaller();

        ownerIdToOperatorApprovals[_msgSender()][operator] = approved;

        emit ApprovalForAll(_msgSender(), operator, approved);
    }

    /**
    * @dev See {IERC165-supportsInterface}.
    */
    function supportsInterface(
        bytes4 interfaceId
    ) public pure override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || // ERC165
            interfaceId == 0x80ac58cd || // ERC721
            interfaceId == 0x5b5e139f; // ERC721Metadata
    }

    /**
    * @dev See {IERC721-isApprovedForAll}.
    */
    function isApprovedForAll(
        address owner, 
        address operator
    ) public view returns (bool) {
        return ownerIdToOperatorApprovals[owner][operator];
    }

    // Internal functions
    /**
    * @dev Mints `quantity` tokens and transfers them to `to`.
    *
    * Requirements:
    *
    * -there must be `quantity` tokens remaining unminted in the total collection.
    * -`to` cannot be the zero address nor a contract.
    * -`quantity` cannot be larger than the max batch size.
    *
    * Emits a {Transfer} event.
    */
    function _safeMint(
        address to,
        uint256 quantity
    ) internal {
        if (!calledByUser())
            revert CalledByContract();
        if (to == address(0))
            revert ZeroAddress();
        unchecked {
            if (ownerIdToBalanceOfTokens[_msgSender()] + quantity > MAX_MINTS_PER_USER)
                revert MaxUserMintLimitWasReached();
            
            uint256 _tokenCounter = tokenCounter;
            if (_tokenCounter + quantity > COLLECTION_SIZE)
                revert TotalAmountWasMinted();
            
            assembly {
                sstore(add(ownerships.slot, _tokenCounter), to)
            }
            emitTransfer(address(0), to, _tokenCounter, quantity);
            tokenCounter = _tokenCounter + quantity;
        }
    }

    /**
    * @dev Returns if the transaction sender is an user.
    */
    function calledByUser() internal view returns (bool) {
        return tx.origin == _msgSender();
    }

    function ownershipOf(
        uint256 tokenId
    ) internal view returns (address) {
        uint256 currentId = tokenId;

        unchecked {
            if (currentId < tokenCounter) {
                do {
                    address ownership = ownerships[currentId];
                    if (ownership != address(0)) {
                        return ownership;
                    }
                    currentId--;
                } while (true);
            }
        }

        revert QueryForNonExistentToken();
    }

    /**
    * @dev Emits quantity time the Transfer event
    */
    function emitTransfer(
        address from,
        address to,
        uint256 id,
        uint256 quantity
    ) private {
        assembly {
            for {
                let i := 0x0
            } lt(i, quantity) {
                i := add(i, 0x01)
            } {
                //Transfer(address,address,uint256)
                log4(
                    0x0,
                    0x0,
                    0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef,
                    from,
                    to,
                    add(id, i)
                )
            }
        }
    }

    /**
    * @dev See {IERC721-approve}.
    */
    function _approve(
        address owner,
        address to,
        uint256 id
    ) private {
        tokenIdToApprovedAddress[id] = to;
        emit Approval(owner, to, id);
    }

    /**
    * @dev Internal function to invoke {IERC721Receiver-onERC721Received} on a target address.
    * The call is not executed if the target address is not a contract.
    *
    * @param from address representing the previous owner of the given token ID
    * @param to target address that will receive the tokens
    * @param _data bytes optional data to send along with the call
    * @return bool whether the call correctly returned the expected magic value
    */
    function _checkOnERC721Received(
        address from,
        address to,
        bytes memory _data
    ) private returns (bool) {
        if (!calledByUser()) {
            try
                IERC721Receiver(to).onERC721Received(
                    _msgSender(),
                    from,
                    tokenCounter,
                    _data
                )
            returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert TransferToNonERC721ReceiverImplementer();
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }
}
