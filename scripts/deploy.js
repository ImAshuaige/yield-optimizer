const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy DepositToken
  const DepositToken = await hre.ethers.getContractFactory("DepositToken");
  const depositToken = await DepositToken.deploy();
  await depositToken.waitForDeployment();
  console.log("DepositToken deployed to:", await depositToken.getAddress());

  // 2. Deploy ReceiptToken
  const ReceiptToken = await hre.ethers.getContractFactory("ReceiptToken");
  const receiptToken = await ReceiptToken.deploy();
  await receiptToken.waitForDeployment();
  console.log("ReceiptToken deployed to:", await receiptToken.getAddress());

  // 3. Deploy Stake contract
  const Stake = await hre.ethers.getContractFactory("Stake");
  const stake = await Stake.deploy(await depositToken.getAddress());
  await stake.waitForDeployment();
  console.log("Stake contract deployed to:", await stake.getAddress());

  // 4. Deploy YieldOptimizer
  const YieldOptimizer = await hre.ethers.getContractFactory("YieldOptimizer");
  const yieldOptimizer = await YieldOptimizer.deploy(
    await depositToken.getAddress(),
    await stake.getAddress(),
    await receiptToken.getAddress()
  );
  await yieldOptimizer.waitForDeployment();
  console.log("YieldOptimizer deployed to:", await yieldOptimizer.getAddress());

  // 5. Transfer ownership of ReceiptToken to YieldOptimizer
  await receiptToken.transferOwnership(await yieldOptimizer.getAddress());
  console.log("Transferred ownership of ReceiptToken to YieldOptimizer");

  // 6. Transfer ownership of the Stake contract to YieldOptimizer
  await stake.transferOwnership(await yieldOptimizer.getAddress());
  console.log("Transferred ownership of Stake contract to YieldOptimizer");

  // 7. Mint some initial DepositTokens to the deployer for testing
  // Assuming DepositToken has a mint function
  if (typeof depositToken.mint === 'function') {
    await depositToken.mint(deployer.address, hre.ethers.parseEther("10000"));
    console.log("Minted 10,000 DepositTokens to deployer for testing");
  } else {
    console.log("Note: DepositToken doesn't have a mint function or it's not accessible");
  }

  console.log("Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});