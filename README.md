# Linda Contracts

## Description:

The linda ICO is made of three contracts which are ERC20 compliant token built using OpenZeppelin library.  
The naming convention used describes the purpose of the individual contracts.


1) LindaToken
2) LindaCrowdsale 
3) LindaPresale

## Dependencies

We use Truffle in order to compile and test the contracts.

It can be installed using: npm install -g truffle

For more information, visit https://truffle.readthedocs.io/en/latest/

Also, running a node with active json-rpc is required. For testing purposes we suggest using https://github.com/ethereumjs/testrpc

## Usage

    ./scripts/test.sh - run testrpc node with required params

    truffle compile - compile all contracts

    truffle test - run tests

## Features

- The LindaToken contract is an Openzeppelin-MintableToken.

- LindaCrowdsale and presale contracts are capped, refundable and finalizable.

- TokenTimelock contrats are used to implement vaults for the unsold and team tokens.

More information about the LindaHealthcare ICO can be found at https://linda.healthcare/ 