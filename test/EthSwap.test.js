const { assert } = require("chai");

const Token = artifacts.require("Token");
const EthSwap = artifacts.require("EthSwap");

require("chai").use(require("chai-as-promised")).should();

const tokens = (n) => {
  return web3.utils.toWei(n, "ether").toString();
};

contract("EthSwap", ([deployer, investor]) => {
  let token, ethSwap;
  let totalSupply = "1000000";
  before(async () => {
    token = await Token.new();
    ethSwap = await EthSwap.new(token.address);
    await token.transfer(ethSwap.address, tokens(totalSupply));
  });

  describe("Token deployment", async () => {
    it("token has a name", async () => {
      const name = await token.name();
      assert.equal(name, "DApp Token");
    });
  });

  describe("EthSwap contract deployment", async () => {
    it("exchange has a name", async () => {
      const name = await ethSwap.name();
      assert.equal(name, "EthSwap Instant Exchange");
    });

    it("exchange has initial balance", async () => {
      const exchangeBalance = await token.balanceOf(ethSwap.address);
      assert.equal(exchangeBalance.toString(), tokens(totalSupply));
    });
  });

  describe("buyTokens()", async () => {
    before(async () => {
      result = await ethSwap.buyTokens({ from: investor, value: tokens("1") });
    });

    it("allows user to purchase tokens from EthSwap for a fixed price", async () => {
      let investorBalance = await token.balanceOf(investor);
      assert.equal(investorBalance.toString(), tokens("100"));

      let ethSwapBalance;
      ethSwapBalance = await token.balanceOf(ethSwap.address);
      assert.equal(ethSwapBalance.toString(), tokens("999900"));
      ethSwapBalance = await web3.eth.getBalance(ethSwap.address);
      assert.equal(ethSwapBalance.toString(), web3.utils.toWei("1", "ether"));

      //check log to ensure event was emitted with correct data
      const event = result.logs[0].args;
      assert.equal(event.account, investor);
      assert.equal(event.token, token.address);
      assert.equal(event.amount.toString(), tokens("100").toString());
      assert.equal(event.rate.toString(), "100");
    });
  });

  describe("sellTokens()", () => {
    let result;
    before(async () => {
      //investor must approve tokens before purchase
      await token.approve(ethSwap.address, tokens("100"), { from: investor });
      result = await ethSwap.sellTokens(tokens("100"), { from: investor });
    });

    it("allows user to sell tokens to EthSwap for a fixed price", async () => {
      let investorBalance = await token.balanceOf(investor);
      assert.equal(investorBalance.toString(), tokens("0"));

      let ethSwapBalance;
      ethSwapBalance = await token.balanceOf(ethSwap.address);
      assert.equal(ethSwapBalance.toString(), tokens("1000000"));
      ethSwapBalance = await web3.eth.getBalance(ethSwap.address);
      assert.equal(ethSwapBalance.toString(), web3.utils.toWei("0", "ether"));

      //check log to ensure event was emitted with correct data
      const event = result.logs[0].args;
      assert.equal(event.account, investor);
      assert.equal(event.token, token.address);
      assert.equal(event.amount.toString(), tokens("100").toString());
      assert.equal(event.rate.toString(), "100");

      //FAILURE: investor can't sell more tokens then they have
      await ethSwap.sellTokens(tokens("100000000"), { from: investor }).should
        .be.rejected;
    });
  });
});
