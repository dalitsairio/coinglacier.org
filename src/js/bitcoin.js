const bitcoinjs = require('./bitcoinjs-lib_patched').bitcoinjs;
const bip39 = require('bip39');
const bip38 = require('bip38');
const wif = require('wif');

var mnemonic;
var bip32RootKey;

function initiateHDWallet(loadMnemonic, password) {

    if (!loadMnemonic) {
        // create a new mnemonic and return it
        mnemonic = bip39.generateMnemonic();
    } else {
        // import a given mnemonic
        if (bip39.validateMnemonic(loadMnemonic)) {
            mnemonic = loadMnemonic;
        } else {
            throw ('given mnemonic [' + loadMnemonic + '] is not a valid 12 word mnemonic');
        }
    }

    var seed = bip39.mnemonicToSeed(mnemonic, password);
    bip32RootKey = bitcoinjs.HDNode.fromSeedBuffer(seed);

    return mnemonic;
}

function createAccount(networkID, index) {

    index = index || 0;

    // check path validity
    var accountPath = getAccountPath(networkID, index);
    var pathError = findDerivationPathErrors(accountPath, false, true);
    if (pathError) throw 'Derivation Path Error: ' + pathError;

    var account = bip32RootKey.derivePath(accountPath);
    account.keyPair.network = getNetworkByID(networkID);

    var result = {};
    result.account = account;

    // todo: this creates the cyclic object value problem
    // result.xpub = account.neutered().toBase58();
    result.credentials = [];

    return result;
}


// creates addresses and privKeys on the level of a BIP32 account
function createCredentials(account, addressIndex, password) {

    var credentials;

    // Masternode / BIP44 | BIP49 | BIP84 / Bitcoin | Testnet / Account / External / First Address
    //                                                                    ^^^^^^^^^^^^^^^^^^^^^^^^
    var addressPath = '0/' + addressIndex;
    var pathError = findDerivationPathErrors(addressPath, true, false);
    if (pathError) throw 'Derivation Path Error: ' + pathError;

    var bip32 = account.derivePath(addressPath);

    var privateKey = bip32.keyPair.toWIF();
    if (password) {
        // encrypt the privateKey
        var decoded = wif.decode(privateKey);
        privateKey = bip38.encrypt(decoded.privateKey, decoded.compressed, password);
    }

    switch (bip32.keyPair.network) {
        case bitcoinjs.networks.bitcoin:
        case bitcoinjs.networks.testnet:

            credentials = {privateKey: privateKey, address: bip32.getAddress()};
            break;
        case bitcoinjs.networks.bitcoin.p2wpkhInP2sh:
        case bitcoinjs.networks.testnet.p2wpkhInP2sh:

            var pubKey = bip32.getPublicKeyBuffer();
            var redeemScript = bitcoinjs.script.witnessPubKeyHash.output.encode(bitcoinjs.crypto.hash160(pubKey));
            var scriptPubKey = bitcoinjs.script.scriptHash.output.encode(bitcoinjs.crypto.hash160(redeemScript));

            credentials = {
                privateKey: privateKey,
                address: bitcoinjs.address.fromOutputScript(scriptPubKey, bip32.keyPair.network)
            };
            break;
        case bitcoinjs.networks.bitcoin.p2wpkh:
        case bitcoinjs.networks.testnet.p2wpkh:

            var pubKey = bip32.getPublicKeyBuffer();
            var scriptPubKey = bitcoinjs.script.witnessPubKeyHash.output.encode(bitcoinjs.crypto.hash160(pubKey));

            credentials = {
                privateKey: privateKey,
                address: bitcoinjs.address.fromOutputScript(scriptPubKey, bip32.keyPair.network)
            };
            break;
        default:
            throw ("given network is not a valid network");
    }

    return credentials;
}

function getNetworkByID(networkID) {

    switch (networkID) {
        case bitcoinjs.networks.bitcoin.id:
            return bitcoinjs.networks.bitcoin;
        case bitcoinjs.networks.bitcoin.p2wpkhInP2sh.id:
            return bitcoinjs.networks.bitcoin.p2wpkhInP2sh;
        case bitcoinjs.networks.bitcoin.p2wpkh.id:
            return bitcoinjs.networks.bitcoin.p2wpkh;
        case bitcoinjs.networks.testnet.id:
            return bitcoinjs.networks.testnet;
        case bitcoinjs.networks.testnet.p2wpkhInP2sh.id:
            return bitcoinjs.networks.testnet.p2wpkhInP2sh;
        case bitcoinjs.networks.testnet.p2wpkh.id:
            return bitcoinjs.networks.testnet.p2wpkh;
    }

    throw ('There is no network with the id ' + networkID);
}


function getBip44testnetOrMainnet(networkID) {
    if (networkID >= 10) {
        return 1;
    }
    return 0;
}

function getAccountPath(networkID, accountIndex) {

    // https://github.com/satoshilabs/slips/blob/master/slip-0044.md
    var mainnetORtestnet = getBip44testnetOrMainnet(networkID);

    // get extended public key of each account
    switch (networkID) {
        case bitcoinjs.networks.bitcoin.id:
        case bitcoinjs.networks.testnet.id:

            // PrivKey / BIP44 / Bitcoin | Testnet / Account
            return "m/44'/" + mainnetORtestnet + "'/" + accountIndex + "'";

        case bitcoinjs.networks.bitcoin.p2wpkhInP2sh.id:
        case bitcoinjs.networks.testnet.p2wpkhInP2sh.id:

            // PrivKey / BIP49 / Bitcoin | Testnet / Account
            return "m/49'/" + mainnetORtestnet + "'/" + accountIndex + "'";

        case bitcoinjs.networks.bitcoin.p2wpkh.id:
        case bitcoinjs.networks.testnet.p2wpkh.id:

            // PrivKey / BIP84 / Bitcoin | Testnet / Account
            return "m/84'/" + mainnetORtestnet + "'/" + accountIndex + "'";

        default:
            throw ("given network is not a valid network");
    }
}

// copied from https://github.com/iancoleman/bip39/blob/master/src/js/index.js and adapted
// PARAMETERS
// path: the derivation path as a string
// createXPUB: do you want to create an xpub for the given path?
// fromMasternode: is the path starting at the masternode level or deeper down the path? (starts with 'm'?)
function findDerivationPathErrors(path, createXPUB, fromMasternode) {

    if (fromMasternode !== false) {
        fromMasternode = true;
    }

    // TODO is not perfect but is better than nothing
    // Inspired by
    // https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#test-vectors
    // and
    // https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#extended-keys
    var maxDepth = 255; // TODO verify this!!
    var maxIndexValue = Math.pow(2, 31); // TODO verify this!!

    // check first character
    var invalidFirstChar = path[0].replace(/^[0-9m]/, "");
    if (invalidFirstChar > 0) {
        return "first charactar must be 'm' or a number, but is " + invalidFirstChar;
    }

    if (fromMasternode && path[0] != 'm') {
        return "First character must be 'm'";
    } else if (!fromMasternode && path[0] == 'm') {
        return 'The path starts at masternode, but the third param is set to false';
    }

    if (path.length > 1) {
        if (path[1] != '/') {
            return "Separator must be '/'";
        }
        var indexes = path.split('/');
        if (indexes.length > maxDepth) {
            return 'Derivation depth is ' + indexes.length + ', must be less than ' + maxDepth;
        }
        for (var depth = 1; depth < indexes.length; depth++) {
            var index = indexes[depth];
            var invalidChars = index.replace(/^[0-9]+'?$/g, "")
            if (invalidChars.length > 0) {
                return "Invalid characters " + invalidChars + " found at depth " + depth;
            }
            var indexValue = parseInt(index.replace("'", ""));
            if (isNaN(depth)) {
                return "Invalid number at depth " + depth;
            }
            if (indexValue > maxIndexValue) {
                return "Value of " + indexValue + " at depth " + depth + " must be less than " + maxIndexValue;
            }
        }
    }
    // Check root key exists or else derivation path is useless!
    if (!bip32RootKey) {
        return "No root key";
    }
    // Check no hardened derivation path when using xpub keys
    var isHardenedPath = path.indexOf("'") > -1;
    if (isHardenedPath && createXPUB) {
        return "Hardened derivation path is invalid with xpub key";
    }
    return false;
}


module.exports = {
    initiateHDWallet,
    createAccount,
    createCredentials
};
