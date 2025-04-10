// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DepositToken.sol";
import "./Stake.sol";
import "./ReceiptToken.sol";

contract YieldOptimizer {
    DepositToken public depositToken;
    Stake public stakingContract;
    ReceiptToken public receiptToken;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Compound(address indexed user, uint256 rewardsAmount);



    constructor(
        address _depositToken,
        address _stakingContract,
        address _receiptToken
    ) {
        depositToken = DepositToken(_depositToken);
        stakingContract = Stake(_stakingContract);
        receiptToken = ReceiptToken(_receiptToken);
    }


    function deposit(uint256 _amount) external {
        depositToken.transferFrom(msg.sender, address(this), _amount);
        depositToken.approve(address(stakingContract), _amount);
        stakingContract.stake(_amount, msg.sender);
        receiptToken.mint(msg.sender, _amount);
        emit Deposit(msg.sender, _amount);
    }


    function withdraw(uint256 _amount) external {
        uint256 receiptBalance = receiptToken.balanceOf(msg.sender);
        require(receiptBalance >= _amount, "Not enough balance");
        receiptToken.burn(msg.sender, _amount);
        stakingContract.withdraw(_amount, msg.sender);
        emit Withdraw(msg.sender, _amount); 
    }

    function compound() external {
        uint256 pendingRewards = stakingContract.pendingRewards(msg.sender);
        // Mint 1:1 RT to user
        receiptToken.mint(msg.sender, pendingRewards);
        stakingContract.topUpDTBalance(pendingRewards,msg.sender);
        emit Compound(msg.sender, pendingRewards); 
    }

    function userRTBalance(address user) external view returns (uint256) {
        return receiptToken.balanceOf(user);
    }
}

