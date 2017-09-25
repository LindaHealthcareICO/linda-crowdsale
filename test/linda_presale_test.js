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
const LindaPresale = artifacts.require('./LindaPresale.sol')

contract('LindaPresale', function([_, owner, investor, purchaser1, purchaser2, wallet]) {

  const rate = new BigNumber(2346); //rate must be integer
  const cap = ether(3581.17);
  const lessThanCap = ether(10);
  const discount = new BigNumber(10);
  const goal = ether(42.63);
  const value = ether(5);
  const totalTokenAmount = rate.mul(value);
  const discountedAmount = totalTokenAmount.div(discount);
  const expectedTokenAmount = totalTokenAmount.add(discountedAmount);


  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  })

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1);
    this.endTime =   this.startTime + duration.weeks(1);
    this.afterEndTime = this.endTime + duration.seconds(1)


    this.crowdsale = await LindaPresale.new(this.startTime, this.endTime, rate, goal, cap, discount, wallet, {from: owner})

    this.token = LindaToken.at(await this.crowdsale.token())
  })

  describe('creating a valid crowdsale', function () {

    it('should fail with zero cap', async function () {
      await LindaPresale.new(this.startTime, this.endTime, rate, goal, 0, discount, wallet, {from: owner}).should.be.rejectedWith(EVMThrow);
    })

  });

  describe('accepting payments', function () {

    beforeEach(async function () {
      await increaseTimeTo(this.startTime)
    })

    it('should accept payments within cap', async function () {
      await this.crowdsale.send(cap.minus(lessThanCap)).should.be.fulfilled
      await this.crowdsale.send(lessThanCap).should.be.fulfilled
    })

    it('should reject payments outside cap', async function () {
      await this.crowdsale.send(cap)
      await this.crowdsale.send(1).should.be.rejectedWith(EVMThrow)
    })

    it('should reject payments that exceed cap', async function () {
      await this.crowdsale.send(cap.plus(1)).should.be.rejectedWith(EVMThrow)
    })

  })

  describe('ending', function () {

    beforeEach(async function () {
      await increaseTimeTo(this.startTime)
    })

    it('should not be ended if under cap', async function () {
      let hasEnded = await this.crowdsale.hasEnded()
      hasEnded.should.equal(false)
      await this.crowdsale.send(lessThanCap)
      hasEnded = await this.crowdsale.hasEnded()
      hasEnded.should.equal(false)
    })

    it('should not be ended if just under cap', async function () {
      await this.crowdsale.send(cap.minus(1))
      let hasEnded = await this.crowdsale.hasEnded()
      hasEnded.should.equal(false)
    })

    it('should be ended if cap reached', async function () {
      await this.crowdsale.send(cap)
      let hasEnded = await this.crowdsale.hasEnded()
      hasEnded.should.equal(true)
    })

  })

  it('should be token owner', async function () {
    const owner = await this.token.owner()
    owner.should.equal(this.crowdsale.address)
  })

  it('should be ended too after end', async function () {
    let ended = await this.crowdsale.hasEnded()
    ended.should.equal(false)
    await increaseTimeTo(this.afterEndTime)
    ended = await this.crowdsale.hasEnded()
    ended.should.equal(true)
  })

  describe('accepting payments', function () {

    it('should reject payments before start', async function () {
      await this.crowdsale.send(value).should.be.rejectedWith(EVMThrow)
      await this.crowdsale.buyTokens(investor, {from: purchaser1, value: value}).should.be.rejectedWith(EVMThrow)
    })

    it('should accept payments after start', async function () {
      await increaseTimeTo(this.startTime)
      await this.crowdsale.send(value).should.be.fulfilled
      await this.crowdsale.buyTokens(investor, {value: value, from: purchaser1}).should.be.fulfilled
    })

    it('should reject payments after end', async function () {
      await increaseTimeTo(this.afterEndTime)
      await this.crowdsale.send(value).should.be.rejectedWith(EVMThrow)
      await this.crowdsale.buyTokens(investor, {value: value, from: purchaser1}).should.be.rejectedWith(EVMThrow)
    })

  })

  describe('high-level purchase', function () {

    beforeEach(async function() {
      await increaseTimeTo(this.startTime)
    })

    it('should log purchase', async function () {
      const {logs} = await this.crowdsale.sendTransaction({value: value, from: investor})

      const event = logs.find(e => e.event === 'TokenPurchase')

      should.exist(event)
      event.args.purchaser.should.equal(investor)
      event.args.beneficiary.should.equal(investor)
      event.args.value.should.be.bignumber.equal(value)
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount)
    })


    it('should increase totalSupply', async function () {
      await this.crowdsale.send(value)
      const totalSupply = await this.token.totalSupply()
      totalSupply.should.be.bignumber.equal(expectedTokenAmount)
    })

       it('should assign tokens to sender', async function () {
         await this.crowdsale.sendTransaction({value: value, from: investor})
         await increaseTimeTo(this.afterEndTime)
         let balance = await this.token.balanceOf(investor);
         balance.should.be.bignumber.equal(expectedTokenAmount)
       })

       it('should forward funds to wallet', async function () {
         const pre = web3.eth.getBalance(wallet)
         await this.crowdsale.sendTransaction({value: goal, from: investor})
         await increaseTimeTo(this.afterEndTime)
         await this.crowdsale.finalize({from: owner})
         const post = web3.eth.getBalance(wallet)
         post.minus(pre).should.be.bignumber.equal(goal)
       })


  })





})