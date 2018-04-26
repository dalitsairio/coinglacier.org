var bip38 = require('bip38');
var wif = require('wif');

// privKey must be in WIF format
function encryptPrivKey(privKey, password) {

    var decoded = wif.decode(privKey);
    return bip38.encrypt(decoded.privateKey, decoded.compressed, password);
}

//
// var bip38 = require('bip38');
// var wif = require('wif');
//
// function encryptPrivKey() {
//     // do nothing
// }

module.exports = {
    encryptPrivKey: encryptPrivKey
};