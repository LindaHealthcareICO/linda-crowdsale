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
const RefundVault = artifacts.require('./zeppelin/crowdsale/RefundVault.sol')

contract('LindaCrowdsale', function([_, owner, investor, purchaser1, purchaser2, wallet, teamWallet]) {

  const rate = new BigNumber(2346); //rate must be integer
  const cap = ether(40288.20);
  const lessThanCap = ether(10);
  const goal = ether(42.63);
  const lessThanGoal = ether(30);
  const value = ether(5);
  const expectedTokenAmount = rate.mul(value)
  const value2 = ether(15);
  const teamLockedTime = duration.weeks(40);
  const unsoldLockedTime = latestTime() + duration.years(1);

  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  })

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1);
    this.endTime =   this.startTime + duration.weeks(1);
    this.afterEndTime = this.endTime + duration.seconds(1)
    this.token = await LindaToken.new({from: owner});

    this.crowdsale = await LindaCrowdsale.new(this.startTime, this.endTime, rate, goal, cap, wallet, teamWallet, this.token.address, owner,teamLockedTime, unsoldLockedTime, {from: owner})

    await this.token.transferOwnership(this.crowdsale.address, {from: owner})

    this.vault = RefundVault.at(await this.crowdsale.vault())
  })

  describe('creating a valid crowdsale', function () {

   it('should fail with zero goal', async function () {
      await LindaCrowdsale.new(this.startTime, this.endTime, rate, 0, cap, wallet, teamWallet, teamLockedTime, unsoldLockedTime, {from: owner}).should.be.rejectedWith(EVMThrow);
    })

  });

  it('should deny refunds before end', async function () {
    await this.crowdsale.claimRefund({from: investor}).should.be.rejectedWith(EVMThrow)
    await increaseTimeTo(this.startTime)
    await this.crowdsale.claimRefund({from: investor}).should.be.rejectedWith(EVMThrow)
  })

  it('should deny refunds after end if goal was reached', async function () {
    await increaseTimeTo(this.startTime)
    await this.crowdsale.sendTransaction({value: goal, from: investor})
    await increaseTimeTo(this.afterEndTime)
    await this.crowdsale.claimRefund({from: investor}).should.be.rejectedWith(EVMThrow)
  })

  it('should allow refunds after end if goal was not reached', async function () {
    await increaseTimeTo(this.startTime)
    await this.crowdsale.sendTransaction({value: lessThanGoal, from: investor})
    await increaseTimeTo(this.afterEndTime)

    await this.crowdsale.finalize({from: owner})

    const pre = web3.eth.getBalance(investor)
    await this.crowdsale.claimRefund({from: investor, gasPrice: 0})
      .should.be.fulfilled
    const post = web3.eth.getBalance(investor)

    post.minus(pre).should.be.bignumber.equal(lessThanGoal)
  })

  it('should forward funds to wallet after end if goal was reached', async function () {
    await increaseTimeTo(this.startTime)
    await this.crowdsale.sendTransaction({value: goal, from: investor})
    await increaseTimeTo(this.afterEndTime)

    const pre = web3.eth.getBalance(wallet)
    await this.crowdsale.finalize({from: owner})
    const post = web3.eth.getBalance(wallet)

    post.minus(pre).should.be.bignumber.equal(goal)
  })


})