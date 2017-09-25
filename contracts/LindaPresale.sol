pragma solidity ^0.4.11;

import "./zeppelin/crowdsale/CappedCrowdsale.sol";
import "./zeppelin/crowdsale/RefundableCrowdsale.sol";
import "./LindaToken.sol";

contract LindaPresale is CappedCrowdsale, RefundableCrowdsale {


    uint256 public maximumTokenSupply;
    uint256 public discount;

    function LindaPresale(uint256 _startTime, uint256 _endTime, uint256 _rate, uint256 _goal, uint256 _cap, uint256 _discount, address _wallet)
    CappedCrowdsale(_cap)
    FinalizableCrowdsale()
    RefundableCrowdsale(_goal)
    Crowdsale(_startTime, _endTime, _rate, _wallet)
    {
        //As goal needs to be met for a successful crowdsale
        //the value needs to less or equal than a cap which is limit for accepted funds
        require(_goal <= _cap);
        discount = _discount;
        maximumTokenSupply = _cap.mul(_rate);


    }

    function createTokenContract() internal returns (MintableToken) {
        return new LindaToken();
    }

    function buyTokens(address beneficiary) payable {
        require(beneficiary != 0x0);
        require(validPurchase());

        uint256 weiAmount = msg.value;

        // calculate token amount to be created with discount
        uint256 tokens = weiAmount.mul(rate);
        uint256 discountTokens = tokens.div(discount);
        tokens = tokens.add(discountTokens);

        // update state
        weiRaised = weiRaised.add(weiAmount);

        token.mint(beneficiary, tokens);
        TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

        forwardFunds();
    }



    function finalization() internal {

        super.finalization();


    }

}