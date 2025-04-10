# DeFi Yield Optimizer

This project demonstrates a complete DeFi staking solution with auto-compounding capabilities.

## Overview

This project implements a yield optimization protocol that allows users to:

1. Stake deposit tokens (DT) and earn rewards
2. Automatically compound rewards to maximize yield
3. Withdraw tokens along with accumulated rewards

## Smart Contracts

### Architecture

The system consists of 4 main contracts:

1. **DepositToken.sol**: ERC20 token used for deposits and rewards
2. **ReceiptToken.sol**: ERC20 token representing user's stake in the protocol
3. **Stake.sol**: Core staking contract that manages deposits and calculates rewards
4. **YieldOptimizer.sol**: Vault contract that optimizes yield through auto-compounding

### Key Features

- **Reward Generation**: 10 DT tokens generated per block
- **Receipt Tokens**: 1:1 representation of user stake
- **Auto-compounding**: Restakes rewards to maximize returns
- **Direct Withdrawal**: Users receive original stake plus pending rewards on withdrawal

## Frontend

A simple and intuitive React-based UI allows users to:

1. Connect their wallet
2. View their token balances
3. Deposit tokens into the yield optimizer
4. Compound accumulated rewards
5. Withdraw tokens and rewards



## How It Works

1. **Deposit Flow**:
   - User deposits DT tokens through the YieldOptimizer contract
   - YieldOptimizer stakes tokens in the Stake contract
   - Receipt tokens (RT) are minted and sent to the user

2. **Compounding Flow**:
   - User triggers the compound function
   - Pending rewards are calculated and added to the user's stake
   - Additional receipt tokens are minted to reflect the increased stake

3. **Withdrawal Flow**:
   - User initiates a withdrawal
   - Receipt tokens are burned
   - Original stake plus accumulated rewards are returned to the user
