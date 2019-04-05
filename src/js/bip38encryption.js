const bip38 = require('./patchedLibs/bip38_patched');
const wif = require('wif');


// privKey must be in WIF format
function encryptPrivKey(privKey, password, targetAddress) {

    let decoded = wif.decode(privKey);

    return bip38.encrypt(targetAddress, decoded.privateKey, decoded.compressed, password);
}

// privKey must be a string beginning with a 6
function decryptPrivKey(privKey_encrypted, password) {

    let decryptedKey = bip38.decrypt(privKey_encrypted, password);

    return {
        mainnet: {
            privateKey: wif.encode(0x80, decryptedKey.privateKey, decryptedKey.compressed),
            salt: decryptedKey.salt
        },
        testnet: {
            privateKey: wif.encode(0xEF, decryptedKey.privateKey, decryptedKey.compressed),
            salt: decryptedKey.salt
        }
    };
}

module.exports = {
    encryptPrivKey: encryptPrivKey,
    decryptPrivKey: decryptPrivKey
};