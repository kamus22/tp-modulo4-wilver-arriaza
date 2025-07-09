// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * Author: Wilver Arriaza
 * @title IERC20
 * @notice Interface for ERC20 token standard
 */
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

/**
 * @title SimpleSwap
 * @notice A simple automated market maker (AMM) for token swapping
 * @dev Implements basic Uniswap V2 functionality without external dependencies
 */
contract SimpleSwap {
    
    // State variables for liquidity pools
    mapping(address => mapping(address => uint256)) public reserves;
    mapping(address => mapping(address => uint256)) public totalLiquidity;
    mapping(address => mapping(address => mapping(address => uint256))) public liquidityBalance;
    
    // Events
    event LiquidityAdded(address indexed user, address indexed tokenA, address indexed tokenB, uint256 amountA, uint256 amountB, uint256 liquidity);
    event LiquidityRemoved(address indexed user, address indexed tokenA, address indexed tokenB, uint256 amountA, uint256 amountB, uint256 liquidity);
    event TokensSwapped(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    
    /**
     * @notice Ensures transaction deadline has not passed
     * @param deadline The deadline timestamp for the transaction
     */
    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "SimpleSwap: EXPIRED");
        _;
    }
    
    /**
     * @notice Gets the pair key for two tokens (sorted)
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return token0 The lower address
     * @return token1 The higher address
     */
    function _sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, "SimpleSwap: IDENTICAL_ADDRESSES");
        require(tokenA != address(0) && tokenB != address(0), "SimpleSwap: ZERO_ADDRESS");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }
    
    /**
     * @notice Safely transfers tokens from user to this contract
     * @param token The token to transfer
     * @param from The address to transfer from
     * @param to The address to transfer to
     * @param amount The amount to transfer
     */
    function _safeTransferFrom(address token, address from, address to, uint256 amount) internal {
        require(IERC20(token).transferFrom(from, to, amount), "SimpleSwap: TRANSFER_FROM_FAILED");
    }
    
    /**
     * @notice Safely transfers tokens from this contract to user
     * @param token The token to transfer
     * @param to The address to transfer to
     * @param amount The amount to transfer
     */
    function _safeTransfer(address token, address to, uint256 amount) internal {
        require(IERC20(token).transfer(to, amount), "SimpleSwap: TRANSFER_FAILED");
    }
    
    /**
     * @notice Adds liquidity to a token pair pool
     * @param tokenA Address of the first token
     * @param tokenB Address of the second token  
     * @param amountADesired Desired amount of tokenA to add
     * @param amountBDesired Desired amount of tokenB to add
     * @param amountAMin Minimum amount of tokenA to add
     * @param amountBMin Minimum amount of tokenB to add
     * @param to Address to receive liquidity tokens
     * @param deadline Transaction deadline timestamp
     * @return amountA Actual amount of tokenA added
     * @return amountB Actual amount of tokenB added
     * @return liquidity Amount of liquidity tokens minted
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        (address token0, address token1) = _sortTokens(tokenA, tokenB);
        
        // Calculate optimal amounts
        if (reserves[token0][token1] == 0 && reserves[token1][token0] == 0) {
            // First liquidity provision
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            // Calculate based on current ratio
            uint256 optimalB = (amountADesired * reserves[token1][token0]) / reserves[token0][token1];
            if (optimalB <= amountBDesired) {
                require(optimalB >= amountBMin, "SimpleSwap: INSUFFICIENT_B_AMOUNT");
                (amountA, amountB) = (amountADesired, optimalB);
            } else {
                uint256 optimalA = (amountBDesired * reserves[token0][token1]) / reserves[token1][token0];
                require(optimalA <= amountADesired && optimalA >= amountAMin, "SimpleSwap: INSUFFICIENT_A_AMOUNT");
                (amountA, amountB) = (optimalA, amountBDesired);
            }
        }
        
        // Transfer tokens to this contract
        _safeTransferFrom(tokenA, msg.sender, address(this), amountA);
        _safeTransferFrom(tokenB, msg.sender, address(this), amountB);
        
        // Calculate and mint liquidity tokens
        if (totalLiquidity[token0][token1] == 0) {
            liquidity = _sqrt(amountA * amountB);
            require(liquidity > 0, "SimpleSwap: INSUFFICIENT_LIQUIDITY");
        } else {
            if (tokenA == token0) {
                liquidity = _min(
                    (amountA * totalLiquidity[token0][token1]) / reserves[token0][token1],
                    (amountB * totalLiquidity[token0][token1]) / reserves[token1][token0]
                );
            } else {
                liquidity = _min(
                    (amountA * totalLiquidity[token0][token1]) / reserves[token1][token0],
                    (amountB * totalLiquidity[token0][token1]) / reserves[token0][token1]
                );
            }
        }
        
        require(liquidity > 0, "SimpleSwap: INSUFFICIENT_LIQUIDITY_MINTED");
        
        // Update state
        liquidityBalance[token0][token1][to] += liquidity;
        totalLiquidity[token0][token1] += liquidity;
        
        if (tokenA == token0) {
            reserves[token0][token1] += amountA;
            reserves[token1][token0] += amountB;
        } else {
            reserves[token0][token1] += amountB;
            reserves[token1][token0] += amountA;
        }
        
        emit LiquidityAdded(to, tokenA, tokenB, amountA, amountB, liquidity);
    }
    
    /**
     * @notice Removes liquidity from a token pair pool
     * @param tokenA Address of the first token
     * @param tokenB Address of the second token
     * @param liquidity Amount of liquidity tokens to burn
     * @param amountAMin Minimum amount of tokenA to receive
     * @param amountBMin Minimum amount of tokenB to receive
     * @param to Address to receive the tokens
     * @param deadline Transaction deadline timestamp
     * @return amountA Amount of tokenA received
     * @return amountB Amount of tokenB received
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        (address token0, address token1) = _sortTokens(tokenA, tokenB);
        
        require(liquidityBalance[token0][token1][msg.sender] >= liquidity, "SimpleSwap: INSUFFICIENT_LIQUIDITY_BALANCE");
        require(totalLiquidity[token0][token1] > 0, "SimpleSwap: INSUFFICIENT_TOTAL_LIQUIDITY");
        
        // Calculate amounts to return directly
        if (tokenA == token0) {
            amountA = (liquidity * reserves[token0][token1]) / totalLiquidity[token0][token1];
            amountB = (liquidity * reserves[token1][token0]) / totalLiquidity[token0][token1];
        } else {
            amountA = (liquidity * reserves[token1][token0]) / totalLiquidity[token0][token1];
            amountB = (liquidity * reserves[token0][token1]) / totalLiquidity[token0][token1];
        }
        
        require(amountA >= amountAMin, "SimpleSwap: INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "SimpleSwap: INSUFFICIENT_B_AMOUNT");
        
        // Update state
        liquidityBalance[token0][token1][msg.sender] -= liquidity;
        totalLiquidity[token0][token1] -= liquidity;
        
        if (tokenA == token0) {
            reserves[token0][token1] -= amountA;
            reserves[token1][token0] -= amountB;
        } else {
            reserves[token0][token1] -= amountB;
            reserves[token1][token0] -= amountA;
        }
        
        // Transfer tokens back to user
        _safeTransfer(tokenA, to, amountA);
        _safeTransfer(tokenB, to, amountB);
        
        emit LiquidityRemoved(to, tokenA, tokenB, amountA, amountB, liquidity);
    }
    
    /**
     * @notice Swaps exact amount of input tokens for output tokens
     * @param amountIn Exact amount of input tokens to swap
     * @param amountOutMin Minimum amount of output tokens to receive
     * @param path Array of token addresses representing the swap path
     * @param to Address to receive output tokens
     * @param deadline Transaction deadline timestamp
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) {
        require(path.length == 2, "SimpleSwap: INVALID_PATH_LENGTH");
        require(amountIn > 0, "SimpleSwap: INSUFFICIENT_INPUT_AMOUNT");
        
        // Get reserves and validate liquidity
        uint256 reserveIn = reserves[path[0]][path[1]];
        uint256 reserveOut = reserves[path[1]][path[0]];
        require(reserveIn > 0 && reserveOut > 0, "SimpleSwap: INSUFFICIENT_LIQUIDITY");
        
        // Calculate and validate output amount
        uint256 amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        require(amountOut >= amountOutMin, "SimpleSwap: INSUFFICIENT_OUTPUT_AMOUNT");
        
        // Execute transfers and update state
        _safeTransferFrom(path[0], msg.sender, address(this), amountIn);
        reserves[path[0]][path[1]] += amountIn;
        reserves[path[1]][path[0]] -= amountOut;
        _safeTransfer(path[1], to, amountOut);
        
        emit TokensSwapped(msg.sender, path[0], path[1], amountIn, amountOut);
    }
    
    /**
     * @notice Gets the price of tokenA in terms of tokenB
     * @param tokenA Address of the first token
     * @param tokenB Address of the second token
     * @return price Price of tokenA in terms of tokenB (scaled by 1e18)
     */
    function getPrice(address tokenA, address tokenB) external view returns (uint256 price) {
        uint256 reserveA = reserves[tokenA][tokenB];
        uint256 reserveB = reserves[tokenB][tokenA];
        
        require(reserveA > 0 && reserveB > 0, "SimpleSwap: INSUFFICIENT_LIQUIDITY");
        
        // Price = reserveB * 1e18 / reserveA
        price = (reserveB * 1e18) / reserveA;
    }
    
    /**
     * @notice Calculates output amount for a given input using constant product formula
     * @param amountIn Amount of input tokens
     * @param reserveIn Reserve of input token in the pool
     * @param reserveOut Reserve of output token in the pool
     * @return amountOut Amount of output tokens to receive
     */
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) 
        public 
        pure 
        returns (uint256 amountOut) 
    {
        require(amountIn > 0, "SimpleSwap: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "SimpleSwap: INSUFFICIENT_LIQUIDITY");
        
        // Using constant product formula: (x + dx) * (y - dy) = x * y
        // Solving for dy: dy = (y * dx) / (x + dx)
        // For verification compatibility, using no fee version
        uint256 numerator = amountIn * reserveOut;
        uint256 denominator = reserveIn + amountIn;
        amountOut = numerator / denominator;
    }
    
    /**
     * @notice Returns the square root of a number using Babylonian method
     * @param x The number to calculate square root for
     * @return y The square root result
     */
    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
    
    /**
     * @notice Returns the minimum of two numbers
     * @param a First number
     * @param b Second number
     * @return The minimum value
     */
    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
    
    /**
     * @notice Gets the liquidity balance for a user in a specific pair
     * @param token0 First token address (sorted)
     * @param token1 Second token address (sorted)  
     * @param user User address
     * @return balance The liquidity balance
     */
    function getLiquidityBalance(address token0, address token1, address user) external view returns (uint256 balance) {
        (address tokenA, address tokenB) = _sortTokens(token0, token1);
        balance = liquidityBalance[tokenA][tokenB][user];
    }
    
    /**
     * @notice Gets the total liquidity for a specific pair
     * @param token0 First token address
     * @param token1 Second token address
     * @return total The total liquidity
     */
    function getTotalLiquidity(address token0, address token1) external view returns (uint256 total) {
        (address tokenA, address tokenB) = _sortTokens(token0, token1);
        total = totalLiquidity[tokenA][tokenB];
    }
}
