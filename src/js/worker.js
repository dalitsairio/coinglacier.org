var bip38 = require('bip38');
var wif = require('wif');


onmessage = function(e) {

    var input = JSON.parse(e.data);

    var privateKey = input.privateKey;
    var password = input.password;

    var decoded = wif.decode(privateKey);
    var encryptedPrivKey = bip38.encrypt(decoded.privateKey, decoded.compressed, password);

    self.postMessage(encryptedPrivKey);
}
