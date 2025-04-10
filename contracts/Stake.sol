// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DepositToken.sol";
import "./ReceiptToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Stake is Ownable {
    DepositToken public depositToken;

    uint256 public REWARD_PER_BLOCK = 10 * 1e18; // 10 DT per block
    uint256 public lastRewardBlock;
    uint256 public accRewardPerShare;
    uint256 public totalStaked;


    struct UserInfo {
        uint256 amount; //user DT balance
        uint256 rewardDebt;
    }

    mapping(address => UserInfo) public userInfo;

    constructor(address _depositToken) Ownable(msg.sender) {
        depositToken = DepositToken(_depositToken);
        lastRewardBlock = block.number;
    }

    function updatePool() internal {
        if (totalStaked == 0) {
            lastRewardBlock = block.number;
            return;
        }
        uint256 blocks = block.number - lastRewardBlock;
        uint256 reward = blocks * REWARD_PER_BLOCK;

        accRewardPerShare += (reward * 1e12) / totalStaked;
        lastRewardBlock = block.number;
    }

    function stake(uint256 _amount, address _user) external onlyOwner() {
        updatePool();

        UserInfo storage user = userInfo[_user];
        depositToken.transferFrom(msg.sender, address(this), _amount); 
        user.amount += _amount;
        user.rewardDebt = (user.amount * accRewardPerShare) / 1e12;
        totalStaked += _amount;
    }

    function withdraw(uint256 _amount, address _user) external  onlyOwner(){
        updatePool();
        UserInfo storage user = userInfo[_user];
        uint256 pending = (user.amount * accRewardPerShare) / 1e12 - user.rewardDebt;
        user.amount -= _amount;
        user.rewardDebt = (user.amount * accRewardPerShare) / 1e12;
        totalStaked -= _amount;
        depositToken.transfer(_user, _amount + pending);
    }

    function topUpDTBalance(uint256 _amount, address _user) external onlyOwner(){
        updatePool();
        UserInfo storage user = userInfo[_user];
        user.amount += _amount;
        user.rewardDebt = (user.amount * accRewardPerShare) / 1e12;
        totalStaked += _amount;
    }

    function pendingRewards(address _user) external view returns (uint256) {
        UserInfo storage user = userInfo[_user];
        return (user.amount * accRewardPerShare) / 1e12 - user.rewardDebt;
    }

}
