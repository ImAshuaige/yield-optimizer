import deployed from "./contracts/deployed.json";
import StakeABI from "./contracts/StakeABI.json";
import YieldOptimizerABI from "./contracts/YieldOptimizerABI.json";
import DepositTokenABI from "./contracts/DepositTokenABI.json";
import ReceiptTokenABI from "./contracts/ReceiptTokenABI.json";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";

// Contract addresses - replace with your deployed contract addresses
const YIELD_OPTIMIZER_ADDRESS = deployed.yieldOptimizer;
const DEPOSIT_TOKEN_ADDRESS = deployed.depositToken;
const RECEIPT_TOKEN_ADDRESS = deployed.receiptToken;
const STAKE_ADDRESS = deployed.stake;

function App() {
  // State variables
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [yieldOptimizerContract, setYieldOptimizerContract] = useState(null);
  const [depositTokenContract, setDepositTokenContract] = useState(null);
  const [receiptTokenContract, setReceiptTokenContract] = useState(null);
  const [stakeContract, setStakeContract] = useState(null);
  
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  
  const [depositTokenBalance, setDepositTokenBalance] = useState("0");
  const [receiptTokenBalance, setReceiptTokenBalance] = useState("0");
  const [pendingRewards, setPendingRewards] = useState("0");
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Connect to wallet
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const web3Signer = await web3Provider.getSigner();
        const userAddress = await web3Signer.getAddress();
        
        setProvider(web3Provider);
        setSigner(web3Signer);
        setAccount(userAddress);
        
        console.log("Connected to wallet:", userAddress);

        setupContracts(web3Provider, web3Signer, userAddress);
      } else {
        setErrorMessage("Please install MetaMask to use this dApp");
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      setErrorMessage("Failed to connect wallet: " + error.message);
    }
  };

  // Setup contract instances
  const setupContracts = async (provider, signer, userAddress) => {
    try {
      const optimizerContract = new ethers.Contract(
        YIELD_OPTIMIZER_ADDRESS,
        YieldOptimizerABI.abi,
        signer
      );
      
      const depTokenContract = new ethers.Contract(
        DEPOSIT_TOKEN_ADDRESS,
        DepositTokenABI.abi,
        signer
      );
      
      const rcptTokenContract = new ethers.Contract(
        RECEIPT_TOKEN_ADDRESS,
        ReceiptTokenABI.abi,
        signer
      );
      
      const stakingContract = new ethers.Contract(
        STAKE_ADDRESS,
        StakeABI.abi,
        signer
      );
      
      setYieldOptimizerContract(optimizerContract);
      setDepositTokenContract(depTokenContract);
      setReceiptTokenContract(rcptTokenContract);
      setStakeContract(stakingContract);
      
      // Load user data
      await loadUserData(userAddress, depTokenContract, rcptTokenContract, stakingContract);
    } catch (error) {
      console.error("Error setting up contracts:", error);
      setErrorMessage("Failed to setup contracts: " + error.message);
    }
  };

  // Load user balances and data
  const loadUserData = async (userAddress, depToken, rcptToken, stakeContract) => {
    try {
      setLoading(true);
      
      // Get deposit token balance
      const depBalance = await depToken.balanceOf(userAddress);
      setDepositTokenBalance(ethers.formatUnits(depBalance, 18));
      
      // Get receipt token balance
      const rcptBalance = await rcptToken.balanceOf(userAddress);
      setReceiptTokenBalance(ethers.formatUnits(rcptBalance, 18));
      
      // Get pending rewards
      const rewards = await stakeContract.pendingRewards(userAddress);
      setPendingRewards(ethers.formatUnits(rewards, 18));
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading user data:", error);
      setLoading(false);
      setErrorMessage("Failed to load user data: " + error.message);
    }
  };

  // Handle deposit
  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setErrorMessage("Please enter a valid deposit amount");
      return;
    }
    
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      
      const amount = ethers.parseUnits(depositAmount, 18);
      
      // First approve spending
      const approveTx = await depositTokenContract.approve(YIELD_OPTIMIZER_ADDRESS, amount);
      await approveTx.wait();
      console.log("Approval confirmed");
      
      // Then deposit
      const depositTx = await yieldOptimizerContract.deposit(amount);
      await depositTx.wait();
      console.log("Deposit successful");
      
      setSuccessMessage("Deposit successful!");
      setDepositAmount("");
      
      // Refresh user data
      await loadUserData(account, depositTokenContract, receiptTokenContract, stakeContract);
      setLoading(false);
    } catch (error) {
      console.error("Error during deposit:", error);
      setLoading(false);
      setErrorMessage("Deposit failed: " + error.message);
    }
  };

  // Handle withdraw
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setErrorMessage("Please enter a valid withdraw amount");
      return;
    }
    
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      
      const amount = ethers.parseUnits(withdrawAmount, 18);

      const receiptBalance = await receiptTokenContract.balanceOf(account);
      console.log("Receipt token balance:", ethers.formatUnits(receiptBalance, 18));

      const stakeDTBalance = await depositTokenContract.balanceOf(STAKE_ADDRESS);
      console.log("Stake contract DT balance:", ethers.formatUnits(stakeDTBalance, 18));


      const userInfo = await stakeContract.userInfo(account);
      console.log("User staked amount:", ethers.formatUnits(userInfo.amount, 18));
      
      //const withdrawTx = await yieldOptimizerContract.withdraw(amount);

      const withdrawTx = await yieldOptimizerContract.withdraw(amount, {
        gasLimit: 500000, // or try a higher value depending on your contract
      });
      await withdrawTx.wait();
      console.log("Withdrawal successful");
      
      setSuccessMessage("Withdrawal successful!");
      setWithdrawAmount("");
      
      // Refresh user data
      await loadUserData(account, depositTokenContract, receiptTokenContract, stakeContract);
      setLoading(false);
    } catch (error) {
      console.error("Error during withdrawal:", error);
      setLoading(false);
      setErrorMessage("Withdrawal failed: " + error.message);
    }
  };

  // Handle compound
  const handleCompound = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      
      const compoundTx = await yieldOptimizerContract.compound();
      await compoundTx.wait();
      console.log("Compound successful");
      
      setSuccessMessage("Rewards compounded successfully!");
      
      // Refresh user data
      await loadUserData(account, depositTokenContract, receiptTokenContract, stakeContract);
      setLoading(false);
    } catch (error) {
      console.error("Error during compound:", error);
      setLoading(false);
      setErrorMessage("Compound failed: " + error.message);
    }
  };

  // Refresh data
  const refreshData = async () => {
    if (account && depositTokenContract && receiptTokenContract && stakeContract) {
      await loadUserData(account, depositTokenContract, receiptTokenContract, stakeContract);
    }
  };

  // Effect to detect account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          if (signer && depositTokenContract && receiptTokenContract && stakeContract) {
            loadUserData(accounts[0], depositTokenContract, receiptTokenContract, stakeContract);
          }
        } else {
          setAccount("");
        }
      });
    }
  }, [depositTokenContract, receiptTokenContract, stakeContract, signer]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Yield Optimizer</h1>
        
        {!account ? (
          <button 
            onClick={connectWallet} 
            className="connect-button"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="wallet-info">
            <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
            <button onClick={refreshData} className="refresh-button">
              Refresh Data
            </button>
          </div>
        )}
      </header>

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
      
      {loading && (
        <div className="loading-message">
          Loading...
        </div>
      )}

      {account && (
        <div className="container">
          <div className="balances-container">
            <h2>Your Balances</h2>
            <div className="balance-item">
              <p>Deposit Token Balance:</p>
              <p>{depositTokenBalance} DT</p>
            </div>
            <div className="balance-item">
              <p>Receipt Token Balance:</p>
              <p>{receiptTokenBalance} RT</p>
            </div>
            <div className="balance-item">
              <p>Pending Rewards:</p>
              <p>{pendingRewards} Rewards</p>
            </div>
          </div>

          <div className="actions-container">
            <div className="action-box">
              <h3>Deposit</h3>
              <input
                type="number"
                placeholder="Amount to deposit"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="input-field"
              />
              <button 
                onClick={handleDeposit} 
                disabled={loading}
                className="action-button"
              >
                Deposit
              </button>
            </div>

            <div className="action-box">
              <h3>Withdraw</h3>
              <input
                type="number"
                placeholder="Amount to withdraw"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="input-field"
              />
              <button 
                onClick={handleWithdraw} 
                disabled={loading}
                className="action-button"
              >
                Withdraw
              </button>
            </div>

            <div className="action-box">
              <h3>Compound Rewards</h3>
              <p>Current pending rewards: {pendingRewards}</p>
              <button 
                onClick={handleCompound} 
                disabled={loading || parseFloat(pendingRewards) <= 0}
                className="action-button compound-button"
              >
                Compound
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;