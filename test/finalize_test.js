import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import ether from './helpers/ether'
import EVMThrow from './helpers/EVMThrow'

const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const LindaToken = artifacts.require("./LindaToken.sol");
const LindaCrowdsale = artifacts.require('./LindaCrowdsale.sol')

contract('LindaCrowdsale', function ([_, owner, wallet, thirdparty, teamWallet]) {

  const cap = ether(40288.20);
  const rate = new BigNumber(2346);
  const goal = ether(42.63);
  const teamLockedTime = duration.weeks(40);
  const unsoldLockedTime = latestTime() + duration.years(1);

  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1)
    this.endTime =   this.startTime + duration.weeks(1)
    this.afterEndTime = this.endTime + duration.seconds(1)

    this.token = await LindaToken.new({from: owner});

    this.crowdsale = await LindaCrowdsale.new(this.startTime, this.endTime, rate, goal, cap, wallet, teamWallet, this.token.address, owner, teamLockedTime, unsoldLockedTime, {from: owner})

    await this.token.transferOwnership(this.crowdsale.address, {from: owner})

  })

  it('cannot be finalized before ending', async function () {
    await this.crowdsale.finalize({from: owner}).should.be.rejectedWith(EVMThrow)
  })

  it('cannot be finalized by third party after ending', async function () {
    await increaseTimeTo(this.afterEndTime)
    await this.crowdsale.finalize({from: thirdparty}).should.be.rejectedWith(EVMThrow)
  })

  it('can be finalized by owner after ending', async function () {
    await increaseTimeTo(this.afterEndTime)
    await this.crowdsale.finalize({from: owner}).should.be.fulfilled
  })

  it('cannot be finalized twice', async function () {
    await increaseTimeTo(this.afterEndTime)
    await this.crowdsale.finalize({from: owner})
    await this.crowdsale.finalize({from: owner}).should.be.rejectedWith(EVMThrow)
  })

  it('logs finalized', async function () {
    await increaseTimeTo(this.afterEndTime)
    const {logs} = await this.crowdsale.finalize({from: owner})
    const event = logs.find(e => e.event === 'Finalized')
    should.exist(event)
  })

  it('token owner changes after finalizing', async function () {
    var tokenOwner = await this.token.owner()
    tokenOwner.should.equal(this.crowdsale.address)
    await increaseTimeTo(this.afterEndTime)
    await this.crowdsale.finalize({from: owner}).should.be.fulfilled
    tokenOwner = await this.token.owner()
    tokenOwner.should.equal(owner)
  })

})
