// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DepositToken is ERC20, Ownable {
    constructor() ERC20("Deposit Token", "DT") Ownable(msg.sender) { }
    
    // For testing purposes, allow minting more tokens
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}