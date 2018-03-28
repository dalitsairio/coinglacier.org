const tests = require('../../test/bitcoinTest');

mocha.setup('bdd');
tests.bitcoinJStests();
mocha.run();

module.exports = {
    bitcoin: require('./bitcoin'),
    jQuery: require('jquery')
};
