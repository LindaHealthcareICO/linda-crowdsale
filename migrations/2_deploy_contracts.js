//var LindaCrowdsale = artifacts.require("./LindaCrowdsale.sol")

var LindaCrowdsale = artifacts.require('../contracts/LindaCrowdsale.sol')
var LindaPresale = artifacts.require('../contracts/LindaPresale.sol')

const duration = {
  seconds: function (val) { return val},
  minutes: function (val) { return val * this.seconds(60) },
  hours: function (val) { return val * this.minutes(60) },
  days: function (val) { return val * this.hours(24) },
  weeks: function (val) { return val * this.days(7) },
  years: function (val) { return val * this.days(365)}
}

module.exports = function (deployer, network, accounts) {

  // WARNING: these parameters are for testing purposes.
  // The real values of the ICO should be set at deployment time.

  // common parameters
  const startTime = web3.eth.getBlock('latest').timestamp + duration.minutes(5) // in time units
  const endTime = startTime + duration.minutes(10)
  const rate = new web3.BigNumber(2346) //rate at the moment of deployment
  const goal = new web3.BigNumber(web3.toWei(5, 'ether')) // minimum ether to raise
  //replace wallet addresses by real ones
  const wallet = '0x5a1779bf0764623ad070b6d53571b293f1c06469' // wallet to get all the ether
  const tokenOwner = '0xB8CBAe47F750889E31E9d243F49E424DD0DAA99C' // address of the token owner once the presale and the ico end

  // presale
  const presaleCap = new web3.BigNumber(web3.toWei(3581.17, 'ether')) // maximum for the presale

  // ico
  const cap = new web3.BigNumber(web3.toWei(43862.77, 'ether')) // maximum for the ico
  //replace wallet addresses by real ones
  const teamWallet = '0x5bdf1446a54142c0fa62c782b24bdcef6e901dae' // wallet that will hold the team tokens once the ico is finished
  const tokenAddress ='0x07245299493b43bf455f3d9357bfc02b4aafc876' // wallet address of the presale-created token
  const teamLockTime = duration.minutes(5) // freezing time for the team tokens (9 months)
  const unsoldLockTime = duration.minutes(8) // freezing time for the unsold tokens (10 years)

  //deployer.deploy(LindaCrowdsale, startTime, endTime, rate, goal, cap, wallet, teamWallet, tokenAddress, tokenOwner, teamLockTime, unsoldLockTime)

  deployer.deploy(LindaPresale, startTime, endTime, rate, goal, presaleCap, tokenOwner, wallet)
}
