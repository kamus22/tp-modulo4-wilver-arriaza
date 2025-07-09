// SimpleSwap DEX - Vanilla JavaScript Implementation
// Contract addresses on Sepolia testnet
const CONTRACTS = {
    SIMPLE_SWAP: '0x071251ee45b08f0b6d978b87b6a1350aa4d22ef4',
    TOKEN_A: '0xb2386ba07061960efff179939b620d345400a446',
    TOKEN_B: '0x7d0f0051a7d02aa6cc870254cf94b9735a43d092'
};

// Contract ABIs
const SIMPLE_SWAP_ABI = [
    "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external",
    "function getPrice(address tokenA, address tokenB) external view returns (uint256 price)",
    "function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256 amountOut)",
    "function reserves(address tokenA, address tokenB) public view returns (uint256)"
];

const TOKEN_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)"
];

// Global state
let state = {
    account: null,
    provider: null,
    signer: null,
    contracts: {
        simpleSwap: null,
        tokenA: null,
        tokenB: null
    },
    balances: {
        tokenA: '0',
        tokenB: '0'
    },
    currentPrice: '0',
    isLoading: false
};

// DOM elements
const elements = {
    connectSection: null,
    connectBtn: null,
    appContent: null,
    accountDisplay: null,
    balanceA: null,
    balanceB: null,
    refreshBalancesBtn: null,
    currentPrice: null,
    fromToken: null,
    swapAmount: null,
    toToken: null,
    expectedOutput: null,
    swapBtn: null,
    errorMessage: null,
    successMessage: null
};

// Initialize DOM elements when page loads
function initializeElements() {
    elements.connectSection = document.getElementById('connect-section');
    elements.connectBtn = document.getElementById('connect-btn');
    elements.appContent = document.getElementById('app-content');
    elements.accountDisplay = document.getElementById('account-display');
    elements.balanceA = document.getElementById('balance-a');
    elements.balanceB = document.getElementById('balance-b');
    elements.refreshBalancesBtn = document.getElementById('refresh-balances');
    elements.currentPrice = document.getElementById('current-price');
    elements.fromToken = document.getElementById('from-token');
    elements.swapAmount = document.getElementById('swap-amount');
    elements.toToken = document.getElementById('to-token');
    elements.expectedOutput = document.getElementById('expected-output');
    elements.swapBtn = document.getElementById('swap-btn');
    elements.errorMessage = document.getElementById('error-message');
    elements.successMessage = document.getElementById('success-message');
}

// Utility functions
function formatAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatNumber(value, decimals = 4) {
    return parseFloat(value).toFixed(decimals);
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.style.display = 'block';
    elements.successMessage.style.display = 'none';
    setTimeout(() => {
        elements.errorMessage.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    elements.successMessage.textContent = message;
    elements.successMessage.style.display = 'block';
    elements.errorMessage.style.display = 'none';
    setTimeout(() => {
        elements.successMessage.style.display = 'none';
    }, 5000);
}

function setLoading(loading) {
    state.isLoading = loading;
    if (loading) {
        elements.swapBtn.innerHTML = '<span class="spinner"></span>Swapping...';
        elements.swapBtn.disabled = true;
    } else {
        elements.swapBtn.innerHTML = 'Swap Tokens';
        updateSwapButton();
    }
}

// Wallet connection functions
async function connectWallet() {
    try {
        // Check if MetaMask is installed
        if (typeof window.ethereum === 'undefined') {
            showError('MetaMask is not installed! Please install it to use this dApp.');
            return;
        }

        // Request account access
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        
        // Update state
        state.provider = provider;
        state.signer = signer;
        state.account = accounts[0];
        
        // Initialize contracts
        state.contracts.simpleSwap = new ethers.Contract(CONTRACTS.SIMPLE_SWAP, SIMPLE_SWAP_ABI, signer);
        state.contracts.tokenA = new ethers.Contract(CONTRACTS.TOKEN_A, TOKEN_ABI, signer);
        state.contracts.tokenB = new ethers.Contract(CONTRACTS.TOKEN_B, TOKEN_ABI, signer);
        
        // Update UI
        updateUI();
        
        // Load initial data
        await loadBalances();
        await loadPrice();
        
        showSuccess('Wallet connected successfully!');
        
    } catch (error) {
        console.error('Failed to connect wallet:', error);
        showError('Failed to connect wallet: ' + error.message);
    }
}

// Check network and switch to Sepolia if needed
async function checkNetwork() {
    try {
        const network = await state.provider.getNetwork();
        if (network.chainId !== 11155111n) { // Sepolia chainId
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xAA36A7' }], // Sepolia in hex
                });
            } catch (switchError) {
                showError('Please switch to Sepolia testnet');
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error('Network check failed:', error);
        return false;
    }
}

// Update UI after wallet connection
function updateUI() {
    elements.connectSection.style.display = 'none';
    elements.appContent.style.display = 'block';
    elements.accountDisplay.textContent = `Connected: ${formatAddress(state.account)}`;
}

// Load token balances
async function loadBalances() {
    try {
        if (!state.account || !state.contracts.tokenA || !state.contracts.tokenB) return;
        
        const balanceA = await state.contracts.tokenA.balanceOf(state.account);
        const balanceB = await state.contracts.tokenB.balanceOf(state.account);
        
        state.balances.tokenA = ethers.formatEther(balanceA);
        state.balances.tokenB = ethers.formatEther(balanceB);
        
        // Update UI
        elements.balanceA.textContent = formatNumber(state.balances.tokenA);
        elements.balanceB.textContent = formatNumber(state.balances.tokenB);
        
    } catch (error) {
        console.error('Failed to load balances:', error);
        showError('Failed to load balances');
    }
}

// Load current price
async function loadPrice() {
    try {
        if (!state.contracts.simpleSwap) return;
        
        const priceAtoB = await state.contracts.simpleSwap.getPrice(CONTRACTS.TOKEN_A, CONTRACTS.TOKEN_B);
        state.currentPrice = ethers.formatEther(priceAtoB);
        
        // Update UI
        elements.currentPrice.textContent = formatNumber(state.currentPrice, 6);
        
    } catch (error) {
        console.error('Failed to load price:', error);
        // Price might fail if no liquidity, don't show error for this
    }
}

// Calculate expected output for swap
async function calculateExpectedOutput() {
    try {
        const swapAmount = elements.swapAmount.value;
        if (!swapAmount || !state.contracts.simpleSwap || parseFloat(swapAmount) <= 0) {
            elements.expectedOutput.textContent = '0.000000';
            return;
        }
        
        const amountIn = ethers.parseEther(swapAmount);
        const fromToken = elements.fromToken.value;
        const tokenIn = fromToken === 'A' ? CONTRACTS.TOKEN_A : CONTRACTS.TOKEN_B;
        const tokenOut = fromToken === 'A' ? CONTRACTS.TOKEN_B : CONTRACTS.TOKEN_A;
        
        const reserveIn = await state.contracts.simpleSwap.reserves(tokenIn, tokenOut);
        const reserveOut = await state.contracts.simpleSwap.reserves(tokenOut, tokenIn);
        
        if (reserveIn > 0 && reserveOut > 0) {
            const output = await state.contracts.simpleSwap.getAmountOut(amountIn, reserveIn, reserveOut);
            const outputFormatted = ethers.formatEther(output);
            elements.expectedOutput.textContent = formatNumber(outputFormatted, 6);
        } else {
            elements.expectedOutput.textContent = '0.000000';
        }
        
    } catch (error) {
        console.error('Failed to calculate output:', error);
        elements.expectedOutput.textContent = '0.000000';
    }
}

// Perform token swap
async function performSwap() {
    if (state.isLoading) return;
    
    const swapAmount = elements.swapAmount.value;
    if (!swapAmount || !state.contracts.simpleSwap || parseFloat(swapAmount) <= 0) {
        showError('Please enter a valid swap amount');
        return;
    }
    
    setLoading(true);
    
    try {
        const amountIn = ethers.parseEther(swapAmount);
        const fromToken = elements.fromToken.value;
        const tokenIn = fromToken === 'A' ? CONTRACTS.TOKEN_A : CONTRACTS.TOKEN_B;
        const tokenOut = fromToken === 'A' ? CONTRACTS.TOKEN_B : CONTRACTS.TOKEN_A;
        const tokenContract = fromToken === 'A' ? state.contracts.tokenA : state.contracts.tokenB;
        
        // Check user balance
        const userBalance = fromToken === 'A' ? state.balances.tokenA : state.balances.tokenB;
        if (parseFloat(swapAmount) > parseFloat(userBalance)) {
            showError('Insufficient balance for this swap');
            setLoading(false);
            return;
        }
        
        // Check allowance
        const allowance = await tokenContract.allowance(state.account, CONTRACTS.SIMPLE_SWAP);
        
        if (allowance < amountIn) {
            showSuccess('Approving tokens... Please confirm in MetaMask');
            const approveTx = await tokenContract.approve(CONTRACTS.SIMPLE_SWAP, amountIn);
            await approveTx.wait();
            showSuccess('Tokens approved! Now performing swap...');
        }
        
        // Perform swap
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
        const path = [tokenIn, tokenOut];
        const expectedOutputValue = elements.expectedOutput.textContent;
        const amountOutMin = ethers.parseEther((parseFloat(expectedOutputValue) * 0.95).toString()); // 5% slippage
        
        const swapTx = await state.contracts.simpleSwap.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            state.account,
            deadline
        );
        
        showSuccess('Swap transaction sent! Waiting for confirmation...');
        await swapTx.wait();
        
        // Reload data
        await loadBalances();
        await loadPrice();
        
        // Reset form
        elements.swapAmount.value = '';
        elements.expectedOutput.textContent = '0.000000';
        
        showSuccess('Swap completed successfully!');
        
    } catch (error) {
        console.error('Swap failed:', error);
        let errorMessage = 'Swap failed: ';
        
        if (error.message.includes('user rejected')) {
            errorMessage += 'Transaction was rejected';
        } else if (error.message.includes('insufficient funds')) {
            errorMessage += 'Insufficient ETH for gas fees';
        } else {
            errorMessage += error.message;
        }
        
        showError(errorMessage);
    } finally {
        setLoading(false);
    }
}

// Update "To" token display when "From" token changes
function updateToTokenDisplay() {
    const fromToken = elements.fromToken.value;
    const toTokenText = fromToken === 'A' ? 'Token B (TKNB)' : 'Token A (TKNA)';
    elements.toToken.textContent = toTokenText;
}

// Update swap button state
function updateSwapButton() {
    const swapAmount = elements.swapAmount.value;
    const hasAmount = swapAmount && parseFloat(swapAmount) > 0;
    const hasAccount = state.account !== null;
    
    elements.swapBtn.disabled = !hasAmount || !hasAccount || state.isLoading;
}

// Auto-connect if wallet was previously connected
async function autoConnect() {
    try {
        if (typeof window.ethereum !== 'undefined' && window.ethereum.selectedAddress) {
            await connectWallet();
        }
    } catch (error) {
        console.error('Auto-connect failed:', error);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Connect wallet button
    elements.connectBtn.addEventListener('click', connectWallet);
    
    // Refresh balances button
    elements.refreshBalancesBtn.addEventListener('click', async () => {
        await loadBalances();
        await loadPrice();
        showSuccess('Balances refreshed!');
    });
    
    // From token selector
    elements.fromToken.addEventListener('change', () => {
        updateToTokenDisplay();
        calculateExpectedOutput();
    });
    
    // Swap amount input with debounce
    let timeout;
    elements.swapAmount.addEventListener('input', () => {
        updateSwapButton();
        clearTimeout(timeout);
        timeout = setTimeout(calculateExpectedOutput, 500);
    });
    
    // Swap button
    elements.swapBtn.addEventListener('click', performSwap);
    
    // MetaMask account changes
    if (typeof window.ethereum !== 'undefined') {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                // User disconnected
                location.reload();
            } else if (accounts[0] !== state.account) {
                // User switched accounts
                location.reload();
            }
        });
        
        window.ethereum.on('chainChanged', () => {
            // User switched networks
            location.reload();
        });
    }
}

// Initialize the application
async function initApp() {
    // Initialize DOM elements
    initializeElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update initial UI state
    updateToTokenDisplay();
    updateSwapButton();
    
    // Try to auto-connect if user was previously connected
    await autoConnect();
    
    console.log('SimpleSwap DEX initialized successfully!');
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', initApp);

// Export functions for debugging (optional)
window.SimpleSwapDEX = {
    connectWallet,
    loadBalances,
    loadPrice,
    performSwap,
    state,
    CONTRACTS
};
