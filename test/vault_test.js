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
const LindaCrowdsale = artifacts.require('./LindaCrowdsale.sol')
const TokenTimelock = artifacts.require('./zeppelin/token/TokenTimelock.sol')

contract('LindaCrowdsale', function([_, owner, investor, purchaser1, purchaser2, wallet, teamWallet]) {

  const rate = new BigNumber(2346); //rate must be integer
  const cap = ether(40288.20);
  const goal = ether(42.63);
  const value = ether(5);
  const teamLockTime =  duration.weeks(40);
  const unsoldLockTime = duration.years(10);
  const teamPercentage = new BigNumber(20);
  const salePercentage = new BigNumber(45);
  const ecosystemPercentage = new BigNumber(31);
  const maximumSaleTokenSupply = cap.mul(rate);
  const ecosystemTokens = (maximumSaleTokenSupply.mul(ecosystemPercentage)).dividedBy(salePercentage);
  //TODO add to unsold tokens ecosystem tokens



  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  })

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1);
    this.endTime =   this.startTime + duration.weeks(1);
    this.afterEndTime = this.endTime + duration.seconds(1)
    this.token = await LindaToken.new({from: owner});

    this.crowdsale = await LindaCrowdsale.new(this.startTime, this.endTime, rate, goal, cap, wallet, teamWallet, this.token.address, owner, teamLockTime, unsoldLockTime, {from: owner})
    await this.token.transferOwnership(this.crowdsale.address, {from: owner})
  })

  describe('team vault', function () {

    beforeEach(async function() {

      await increaseTimeTo(this.startTime)
      await this.crowdsale.sendTransaction({value: goal, from: investor})
      await increaseTimeTo(this.afterEndTime)
      await this.crowdsale.finalize({from: owner})
      this.teamVault = TokenTimelock.at(await this.crowdsale.teamVault())
    })

    it('cannot be released before time limit', async function () {

      await this.teamVault.release().should.be.rejected
    })

    it('cannot be released just before time limit', async function () {
      await increaseTimeTo(latestTime() + teamLockTime - duration.seconds(3))
      await this.teamVault.release().should.be.rejected
    })


    it('can be released just after limit', async function () {
      await increaseTimeTo(latestTime() + teamLockTime + duration.seconds(1))
      await this.teamVault.release().should.be.fulfilled
      const balance = await this.token.balanceOf(teamWallet)
      var amount =  await this.crowdsale.teamTokens.call()
      balance.should.be.bignumber.equal(amount)
    })

    it('can be released after time limit', async function () {
      await increaseTimeTo(latestTime() + teamLockTime + duration.years(1))
      await this.teamVault.release().should.be.fulfilled
      const balance = await this.token.balanceOf(teamWallet)
      var amount =  await this.crowdsale.teamTokens.call()
      balance.should.be.bignumber.equal(amount)
    })

  })

  describe('unsold vault', function () {

    beforeEach(async function() {

      await increaseTimeTo(this.startTime)
      await this.crowdsale.sendTransaction({value: goal, from: investor})
      await increaseTimeTo(this.afterEndTime)
      await this.crowdsale.finalize({from: owner})
      this.unsoldVault = TokenTimelock.at(await this.crowdsale.unsoldVault())
    })

    it('cannot be released before time limit', async function () {

      await this.unsoldVault.release().should.be.rejected
    })

    it('cannot be released just before time limit', async function () {
      await increaseTimeTo(latestTime() + unsoldLockTime - duration.seconds(3))
      await this.unsoldVault.release().should.be.rejected
    })


    it('can be released just after limit', async function () {
      await increaseTimeTo(latestTime() + unsoldLockTime + duration.seconds(1))

      await this.unsoldVault.release().should.be.fulfilled

      const balance = await this.token.balanceOf(wallet)
      var amount =  await this.crowdsale.unsoldTokens.call()
      amount = amount.add(ecosystemTokens)
      balance.should.be.bignumber.equal(amount)
    })

    it('can be released after time limit', async function () {
      await increaseTimeTo(latestTime() + unsoldLockTime + duration.years(1))
      await this.unsoldVault.release().should.be.fulfilled
      const balance = await this.token.balanceOf(wallet)
      var amount =  await this.crowdsale.unsoldTokens.call()
      amount = amount.add(ecosystemTokens)
      balance.should.be.bignumber.equal(amount)
    })

  })

})