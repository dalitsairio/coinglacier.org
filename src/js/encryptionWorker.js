var bip38 = require('./bip38encryption');

onmessage = function(e) {

    var input = JSON.parse(e.data);

    self.postMessage(bip38.encryptPrivKey(input.privateKey, input.password));
};