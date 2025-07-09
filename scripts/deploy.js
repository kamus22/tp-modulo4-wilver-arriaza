const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy TokenA
  const TokenA = await ethers.getContractFactory("TokenA");
  const tokenA = await TokenA.deploy(1000000); // 1M tokens
  await tokenA.waitForDeployment();
  console.log("TokenA deployed to:", await tokenA.getAddress());

  // Deploy TokenB
  const TokenB = await ethers.getContractFactory("TokenB");
  const tokenB = await TokenB.deploy(1000000); // 1M tokens
  await tokenB.waitForDeployment();
  console.log("TokenB deployed to:", await tokenB.getAddress());

  // Deploy SimpleSwap
  const SimpleSwap = await ethers.getContractFactory("SimpleSwap");
  const simpleSwap = await SimpleSwap.deploy();
  await simpleSwap.waitForDeployment();
  console.log("SimpleSwap deployed to:", await simpleSwap.getAddress());

  // Approve and add initial liquidity
  const tokenAAddress = await tokenA.getAddress();
  const tokenBAddress = await tokenB.getAddress();
  const simpleSwapAddress = await simpleSwap.getAddress();

  const liquidityAmountA = ethers.parseEther("100000"); // 100k tokens
  const liquidityAmountB = ethers.parseEther("100000"); // 100k tokens

  // Approve SimpleSwap to spend tokens
  console.log("Approving tokens for liquidity...");
  await tokenA.approve(simpleSwapAddress, liquidityAmountA);
  await tokenB.approve(simpleSwapAddress, liquidityAmountB);

  // Add initial liquidity
  console.log("Adding initial liquidity...");
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
  await simpleSwap.addLiquidity(
    tokenAAddress,
    tokenBAddress,
    liquidityAmountA,
    liquidityAmountB,
    liquidityAmountA,
    liquidityAmountB,
    deployer.address,
    deadline
  );

  console.log("Initial liquidity added successfully!");
  console.log("Deployment Summary:");
  console.log("==================");
  console.log("TokenA:", tokenAAddress);
  console.log("TokenB:", tokenBAddress);
  console.log("SimpleSwap:", simpleSwapAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
