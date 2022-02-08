//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "./Token.sol";

contract EthSwap {
    string public name = "EthSwap Instant Exchange";
    Token public token;
    uint256 private rate = 100;
    bool private flag;

    event TokensPurchased(
        address account,
        address token,
        uint256 amount,
        uint256 rate
    );

    event TokensSold(
        address account,
        address token,
        uint256 amount,
        uint256 rate
    );

    constructor(Token _token) {
        token = _token;
    }

    function buyTokens() public payable {
        //calculate the number of tokens to buy
        uint256 tokenAmount = msg.value * rate;

        //check that contract has enough tokens to sell
        require(token.balanceOf(address(this)) >= tokenAmount && !flag);

        //transfer the tokens
        flag = true;
        token.transfer(msg.sender, tokenAmount);

        //Emit an event
        emit TokensPurchased(msg.sender, address(token), tokenAmount, rate);
        flag = false;
    }

    function sellTokens(uint256 _amount) public {
        //
        // require(token.balanceOf(msg.sender) >= _amount);

        //Calculate the amount of ether to redeem
        uint256 etherAmount = _amount / rate;

        //
        require(address(this).balance >= etherAmount);

        //Perform sale
        token.transferFrom(msg.sender, address(this), _amount);
        payable(msg.sender).transfer(etherAmount);

        //Emit an event
        emit TokensSold(msg.sender, address(token), _amount, rate);
    }
}
