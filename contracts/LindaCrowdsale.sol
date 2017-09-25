pragma solidity ^0.4.11;

import "./zeppelin/crowdsale/CappedCrowdsale.sol";
import "./zeppelin/crowdsale/RefundableCrowdsale.sol";
import "./zeppelin/token/TokenTimelock.sol";
import "./LindaToken.sol";

contract LindaCrowdsale is CappedCrowdsale, RefundableCrowdsale {

    // time for tokens to be locked in their respective vaults

    uint64 public unsoldLockTime;
    uint64 public teamLockTime;

    // address where team funds are collected
    address public teamWallet;

    // how many token in percentage will correspond to team and sale
    uint256 public teamPercentage;
    uint256 public salePercentage;
    uint256 public ecosystemPercentage;

    uint256 public maximumSaleTokenSupply;
    uint256 public teamTokens;
    uint256 public unsoldTokens;
    uint256 public ecosystemTokens;


    TokenTimelock public teamVault;
    TokenTimelock public unsoldVault;


    function LindaCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, uint256 _goal, uint256 _cap, address _wallet, address _teamWallet, uint64 _teamLockTime, uint64 _unsoldLockTime, uint256 _teamPercentage, uint256 _salePercentage, uint256 _ecosystemPercentage)
    CappedCrowdsale(_cap)
    FinalizableCrowdsale()
    RefundableCrowdsale(_goal)
    Crowdsale(_startTime, _endTime, _rate, _wallet)
    {
        //As goal needs to be met for a successful crowdsale
        //the value needs to less or equal than a cap which is limit for accepted funds
        require(_goal <= _cap);

        maximumSaleTokenSupply = _cap.mul(_rate);
        teamWallet = _teamWallet;
        wallet = _wallet;
        teamLockTime = _teamLockTime;
        unsoldLockTime = _unsoldLockTime;
        teamPercentage = _teamPercentage;
        salePercentage = _salePercentage;
        ecosystemPercentage = _ecosystemPercentage;

    }

    function createTokenContract() internal returns (MintableToken) {
        return new LindaToken();
    }

    function finalization() internal {

        require(teamWallet != 0x0);
        require(wallet != 0x0);

        // freeze tokens
        teamVault = new TokenTimelock(token, teamWallet, uint64(now) + teamLockTime);
        unsoldVault = new TokenTimelock(token, wallet, uint64(now) + unsoldLockTime);

        teamTokens = (maximumSaleTokenSupply.mul(teamPercentage)).div(salePercentage);
        unsoldTokens = maximumSaleTokenSupply.sub(token.totalSupply());
        ecosystemTokens = (maximumSaleTokenSupply.mul(ecosystemPercentage)).div(salePercentage);

        token.mint(teamVault, teamTokens);
        token.mint(unsoldVault, unsoldTokens);
        token.mint(wallet, ecosystemTokens);


        token.finishMinting();
        super.finalization();


    }

}