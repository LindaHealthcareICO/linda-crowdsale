'use strict';
require('babel-polyfill');
import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'
const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const LindaToken = artifacts.require("./LindaToken.sol");
const LindaCrowdsale = artifacts.require('./LindaCrowdsale.sol');


const assertJump = require('./helpers/assertJump');


contract('LindaCrowdsale', function([_, owner, investor, purchaser1, purchaser2, wallet, teamWallet]) {

  const rate = new BigNumber(2346); //rate must be integer
  const cap = ether(40288.20);
  const lessThanCap = ether(10);
  const goal = ether(42.63);
  const value = ether(5);
  const expectedTokenAmount = rate.mul(value)
  const teamLockedTime = duration.weeks(40);
  const unsoldLockedTime = latestTime() + duration.years(1);
  const teamPercentage = new BigNumber(20);
  const salePercentage = new BigNumber(45);
  const ecosystemPercentage = new BigNumber(31);

  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  })

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1);
    this.endTime =   this.startTime + duration.weeks(1);
    this.afterEndTime = this.endTime + duration.seconds(1)


    this.crowdsale = await LindaCrowdsale.new(this.startTime, this.endTime, rate, goal, cap, wallet, teamWallet, teamLockedTime, unsoldLockedTime, teamPercentage, salePercentage, ecosystemPercentage,  {from: owner})

    this.token = LindaToken.at(await this.crowdsale.token())
  })

  it('can accept payments in non-pause', async function() {

    await increaseTimeTo(this.startTime)
    await this.crowdsale.buyTokens(investor, {value: value, from: purchaser1}).should.be.fulfilled

  });

  it('can not accept payments in pause', async function() {
    await increaseTimeTo(this.startTime);
    await this.crowdsale.pause({from: owner});
    try {
      await this.crowdsale.buyTokens(investor, {value: value, from: purchaser1})
      assert.fail('should have thrown before');
    } catch(error) {
      assertJump(error);
    }
  });

  it('can claim refund in pause', async function() {
    await increaseTimeTo(this.startTime);
    await this.crowdsale.sendTransaction({value: lessThanCap, from: investor})
    await this.crowdsale.pause({from: owner});
    await increaseTimeTo(this.afterEndTime)
    await this.crowdsale.finalize({from: owner})
    await this.crowdsale.claimRefund({from: investor, gasPrice: 0})
      .should.be.fulfilled


  });

  it('should resume accepting payments after pause is over', async function() {
    await increaseTimeTo(this.startTime);
    await this.crowdsale.pause({from: owner});
    await this.crowdsale.unpause({from: owner});
    await this.crowdsale.buyTokens(investor, {value: value, from: purchaser1}).should.be.fulfilled
  });


});
