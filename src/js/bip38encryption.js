var bip38 = require('bip38');
var wif = require('wif');

// privKey must be in WIF format
function encryptPrivKey(privKey, password) {

    var decoded = wif.decode(privKey);
    return bip38.encrypt(decoded.privateKey, decoded.compressed, password);
}

// privKey must be a string beginning with a 6
function decryptPrivKey(privKey_encrypted, password) {

    var decryptedKey = bip38.decrypt(privKey_encrypted, password);
    return wif.encode(0x80, decryptedKey.privateKey, decryptedKey.compressed);
}

module.exports = {
    encryptPrivKey: encryptPrivKey,
    decryptPrivKey: decryptPrivKey
};