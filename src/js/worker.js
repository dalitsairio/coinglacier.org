
var i = 0;

function timedCount() {
    i = i + 1;
    postMessage(i);
    setTimeout("timedCount()",500);
}

timedCount();

const tests = require('../../test/bitcoinTest');



mocha.setup('bdd');
tests.bitcoinJStests();
mocha.run();