const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleSwap", function () {
  let simpleSwap;
  let tokenA;
  let tokenB;
  let owner;
  let user1;
  let user2;
  let tokenAAddress;
  let tokenBAddress;
  let simpleSwapAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy TokenA
    const TokenA = await ethers.getContractFactory("TokenA");
    tokenA = await TokenA.deploy(1000000);
    await tokenA.waitForDeployment();
    tokenAAddress = await tokenA.getAddress();

    // Deploy TokenB
    const TokenB = await ethers.getContractFactory("TokenB");
    tokenB = await TokenB.deploy(1000000);
    await tokenB.waitForDeployment();
    tokenBAddress = await tokenB.getAddress();

    // Deploy SimpleSwap
    const SimpleSwap = await ethers.getContractFactory("SimpleSwap");
    simpleSwap = await SimpleSwap.deploy();
    await simpleSwap.waitForDeployment();
    simpleSwapAddress = await simpleSwap.getAddress();

    // Mint tokens to users
    const userBalance = ethers.parseEther("10000");
    await tokenA.mint(user1.address, userBalance);
    await tokenA.mint(user2.address, userBalance);
    await tokenB.mint(user1.address, userBalance);
    await tokenB.mint(user2.address, userBalance);
  });

  describe("Deployment", function () {
    it("Should deploy all contracts successfully", async function () {
      expect(await tokenA.name()).to.equal("Token A");
      expect(await tokenB.name()).to.equal("Token B");
      expect(simpleSwapAddress).to.be.properAddress;
    });
  });

  describe("Liquidity Management", function () {
    it("Should add initial liquidity successfully", async function () {
      const amountA = ethers.parseEther("1000");
      const amountB = ethers.parseEther("2000");
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      // Approve tokens
      await tokenA.connect(user1).approve(simpleSwapAddress, amountA);
      await tokenB.connect(user1).approve(simpleSwapAddress, amountB);

      // Add liquidity
      await expect(
        simpleSwap.connect(user1).addLiquidity(
          tokenAAddress,
          tokenBAddress,
          amountA,
          amountB,
          amountA,
          amountB,
          user1.address,
          deadline
        )
      ).to.emit(simpleSwap, "LiquidityAdded");

      // Check reserves
      const reserveA = await simpleSwap.reserves(tokenAAddress, tokenBAddress);
      const reserveB = await simpleSwap.reserves(tokenBAddress, tokenAAddress);
      expect(reserveA).to.equal(amountA);
      expect(reserveB).to.equal(amountB);
    });

    it("Should remove liquidity successfully", async function () {
      const amountA = ethers.parseEther("1000");
      const amountB = ethers.parseEther("2000");
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      // Add liquidity first
      await tokenA.connect(user1).approve(simpleSwapAddress, amountA);
      await tokenB.connect(user1).approve(simpleSwapAddress, amountB);
      
      await simpleSwap.connect(user1).addLiquidity(
        tokenAAddress,
        tokenBAddress,
        amountA,
        amountB,
        amountA,
        amountB,
        user1.address,
        deadline
      );

      // Get liquidity balance
      const liquidityBalance = await simpleSwap.getLiquidityBalance(
        tokenAAddress,
        tokenBAddress,
        user1.address
      );

      // Remove half of the liquidity
      const liquidityToRemove = liquidityBalance / BigInt(2);
      
      await expect(
        simpleSwap.connect(user1).removeLiquidity(
          tokenAAddress,
          tokenBAddress,
          liquidityToRemove,
          0,
          0,
          user1.address,
          deadline
        )
      ).to.emit(simpleSwap, "LiquidityRemoved");
    });
  });

  describe("Token Swapping", function () {
    beforeEach(async function () {
      // Add initial liquidity for swapping tests
      const amountA = ethers.parseEther("10000");
      const amountB = ethers.parseEther("20000");
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      await tokenA.connect(user1).approve(simpleSwapAddress, amountA);
      await tokenB.connect(user1).approve(simpleSwapAddress, amountB);
      
      await simpleSwap.connect(user1).addLiquidity(
        tokenAAddress,
        tokenBAddress,
        amountA,
        amountB,
        amountA,
        amountB,
        user1.address,
        deadline
      );
    });

    it("Should swap tokens successfully", async function () {
      const swapAmount = ethers.parseEther("100");
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      // Approve swap amount
      await tokenA.connect(user2).approve(simpleSwapAddress, swapAmount);

      // Get expected output
      const reserveA = await simpleSwap.reserves(tokenAAddress, tokenBAddress);
      const reserveB = await simpleSwap.reserves(tokenBAddress, tokenAAddress);
      const expectedOutput = await simpleSwap.getAmountOut(swapAmount, reserveA, reserveB);

      const initialBalanceB = await tokenB.balanceOf(user2.address);

      // Execute swap
      await expect(
        simpleSwap.connect(user2).swapExactTokensForTokens(
          swapAmount,
          0,
          [tokenAAddress, tokenBAddress],
          user2.address,
          deadline
        )
      ).to.emit(simpleSwap, "TokensSwapped");

      // Check balance change
      const finalBalanceB = await tokenB.balanceOf(user2.address);
      expect(finalBalanceB - initialBalanceB).to.equal(expectedOutput);
    });

    it("Should get correct price", async function () {
      const price = await simpleSwap.getPrice(tokenAAddress, tokenBAddress);
      expect(price).to.be.gt(0);
      
      // Price should be around 2 (since we added 10k A and 20k B)
      const expectedPrice = ethers.parseEther("2");
      expect(price).to.be.closeTo(expectedPrice, ethers.parseEther("0.1"));
    });

    it("Should calculate correct output amount", async function () {
      const inputAmount = ethers.parseEther("100");
      const reserveIn = ethers.parseEther("10000");
      const reserveOut = ethers.parseEther("20000");
      
      const outputAmount = await simpleSwap.getAmountOut(inputAmount, reserveIn, reserveOut);
      
      // Using formula: (inputAmount * reserveOut) / (reserveIn + inputAmount)
      const expectedOutput = (inputAmount * reserveOut) / (reserveIn + inputAmount);
      expect(outputAmount).to.equal(expectedOutput);
    });
  });

  describe("Error Cases", function () {
    it("Should revert when adding liquidity with expired deadline", async function () {
      const amountA = ethers.parseEther("1000");
      const amountB = ethers.parseEther("2000");
      const expiredDeadline = Math.floor(Date.now() / 1000) - 60; // 1 minute ago

      await tokenA.connect(user1).approve(simpleSwapAddress, amountA);
      await tokenB.connect(user1).approve(simpleSwapAddress, amountB);

      await expect(
        simpleSwap.connect(user1).addLiquidity(
          tokenAAddress,
          tokenBAddress,
          amountA,
          amountB,
          amountA,
          amountB,
          user1.address,
          expiredDeadline
        )
      ).to.be.revertedWith("SimpleSwap: EXPIRED");
    });

    it("Should revert when swapping with insufficient liquidity", async function () {
      const swapAmount = ethers.parseEther("100");
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      await tokenA.connect(user2).approve(simpleSwapAddress, swapAmount);

      await expect(
        simpleSwap.connect(user2).swapExactTokensForTokens(
          swapAmount,
          0,
          [tokenAAddress, tokenBAddress],
          user2.address,
          deadline
        )
      ).to.be.revertedWith("SimpleSwap: INSUFFICIENT_LIQUIDITY");
    });

    it("Should revert when getting price with no liquidity", async function () {
      await expect(
        simpleSwap.getPrice(tokenAAddress, tokenBAddress)
      ).to.be.revertedWith("SimpleSwap: INSUFFICIENT_LIQUIDITY");
    });

    it("Should revert with identical token addresses", async function () {
      const amountA = ethers.parseEther("1000");
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      await expect(
        simpleSwap.connect(user1).addLiquidity(
          tokenAAddress,
          tokenAAddress, // Same address
          amountA,
          amountA,
          amountA,
          amountA,
          user1.address,
          deadline
        )
      ).to.be.revertedWith("SimpleSwap: IDENTICAL_ADDRESSES");
    });
  });

  describe("Utility Functions", function () {
    beforeEach(async function () {
      const amountA = ethers.parseEther("1000");
      const amountB = ethers.parseEther("2000");
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      await tokenA.connect(user1).approve(simpleSwapAddress, amountA);
      await tokenB.connect(user1).approve(simpleSwapAddress, amountB);
      
      await simpleSwap.connect(user1).addLiquidity(
        tokenAAddress,
        tokenBAddress,
        amountA,
        amountB,
        amountA,
        amountB,
        user1.address,
        deadline
      );
    });

    it("Should get total liquidity correctly", async function () {
      const totalLiquidity = await simpleSwap.getTotalLiquidity(tokenAAddress, tokenBAddress);
      expect(totalLiquidity).to.be.gt(0);
    });

    it("Should get user liquidity balance correctly", async function () {
      const liquidityBalance = await simpleSwap.getLiquidityBalance(
        tokenAAddress,
        tokenBAddress,
        user1.address
      );
      expect(liquidityBalance).to.be.gt(0);
      
      const zeroBalance = await simpleSwap.getLiquidityBalance(
        tokenAAddress,
        tokenBAddress,
        user2.address
      );
      expect(zeroBalance).to.equal(0);
    });

    it("Should handle getAmountOut edge cases", async function () {
      await expect(
        simpleSwap.getAmountOut(0, 1000, 2000)
      ).to.be.revertedWith("SimpleSwap: INSUFFICIENT_INPUT_AMOUNT");

      await expect(
        simpleSwap.getAmountOut(100, 0, 2000)
      ).to.be.revertedWith("SimpleSwap: INSUFFICIENT_LIQUIDITY");
    });
  });

  describe("Token Contracts", function () {
    it("Should have correct token properties", async function () {
      expect(await tokenA.symbol()).to.equal("TKNA");
      expect(await tokenB.symbol()).to.equal("TKNB");
      expect(await tokenA.decimals()).to.equal(18);
      expect(await tokenB.decimals()).to.equal(18);
    });

    it("Should allow token transfers", async function () {
      const transferAmount = ethers.parseEther("100");
      
      await tokenA.connect(user1).transfer(user2.address, transferAmount);
      const balance = await tokenA.balanceOf(user2.address);
      expect(balance).to.be.gte(transferAmount);
    });
  });
});
