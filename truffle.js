// Allows us to use ES6 in our migrations and tests.
require('babel-register')

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*' // Match any network id
    },
    main: {
      gas: 5712388,
      gasPrice: 450000000000,
      host: 'localhost',
      port: 8545,
      network_id: '*' // Match any network id
    },
    rinkeby: {
      gas: 5012388,
      gasPrice: 450000000000,
      host: 'localhost',
      port: 8545,
      from: '0xB8CBAe47F750889E31E9d243F49E424DD0DAA99C',
      network_id: 4 // Match any network id
    },
    kovan: {
      host: 'localhost',
      port: 8545,
      network_id: '*' // Match any network id
    },
    ropsten: {
      host: 'localhost',
      port: 8545,
      network_id: '*' // Match any network id
    }
  }
}
