//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICryptoDevs {

    // Returns a token ID owned by 'owner' at a  given 'index' of its token list.
    function tokenOfOwnerByIndex(address owner, uint256 index)
        external
        view
        returns (uint256 tokenId);

    // Returns the number of tokens in "Owner's" account
    function balanceOf(address owner) external view returns (uint256 balance);
}