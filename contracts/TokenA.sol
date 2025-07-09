// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * Author: Wilver Arriaza
 * @title TokenA
 * @notice Simple ERC20 token for testing SimpleSwap functionality
 * @dev Implements basic ERC20 with minting capability for testing
 */
contract TokenA {
    string public name = "Token A";
    string public symbol = "TKNA";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    /**
     * @notice Constructor that mints initial supply to deployer
     * @param _initialSupply Initial supply of tokens to mint
     */
    constructor(uint256 _initialSupply) {
        totalSupply = _initialSupply * 10**decimals;
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    /**
     * @notice Transfer tokens to a specified address
     * @param _to The address to transfer to
     * @param _value The amount to be transferred
     * @return success True if transfer successful
     */
    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        require(_to != address(0), "Invalid address");
        
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    /**
     * @notice Approve spender to spend tokens on behalf of owner
     * @param _spender The address authorized to spend
     * @param _value The max amount they can spend
     * @return success True if approval successful
     */
    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    /**
     * @notice Transfer tokens from one address to another using allowance
     * @param _from The address to transfer from
     * @param _to The address to transfer to
     * @param _value The amount to transfer
     * @return success True if transfer successful
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Insufficient allowance");
        require(_to != address(0), "Invalid address");
        
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        
        emit Transfer(_from, _to, _value);
        return true;
    }
    
    /**
     * @notice Mint new tokens (for testing purposes)
     * @param _to Address to mint tokens to
     * @param _amount Amount of tokens to mint
     */
    function mint(address _to, uint256 _amount) public {
        totalSupply += _amount;
        balanceOf[_to] += _amount;
        emit Transfer(address(0), _to, _amount);
    }
}
