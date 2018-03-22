const bitcoin = require('./bitcoin');
const tests = require('../../test/bitcoinTest');

mocha.setup('bdd');
tests.bitcoinJStests();
mocha.run();