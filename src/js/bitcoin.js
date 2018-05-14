const bitcoinjs = require('./bitcoinjs-lib_patched').bitcoinjs;
const bip39 = require('bip39');
const mEntropy = require('more-entropy');
var randomBytes = require('randombytes');

const bip39_bitSize = 128; // = 12 words  // https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki#generating-the-mnemonic
const bip39_byteSize = bip39_bitSize / 8;

var moreEntropyGen = new mEntropy.Generator({
    'loop_delay':        2, // how many milliseconds to pause between each operation loop. A lower value will generate entropy faster, but will also be harder on the CPU
    'work_min':           1 ,// milliseconds per loop; a higher value blocks the CPU more, so 1 is recommended
    'auto_stop_bits':  8192, // the generator prepares entropy for you before you request it; if it reaches this much unclaimed entropy it will stop working
    'max_bits_per_delta': 8, // a safety cap on how much entropy it can claim per value; 4 (default) is very conservative. a larger value will allow faster entropy generation
});

// cross-site scripting prevention: remove the generator from window, as it is not needed there.
// https://github.com/keybase/more-entropy/blob/v0.0.4/lib/generator.js#L173
if (typeof window !== "undefined" && window !== null) {
    window.Generator = null;
}

function getEntropy(useImprovedEntropy, cb){
    if(useImprovedEntropy){
        // if(useImprovedEntropy){
        improveEntropy(bip39_byteSize)
            .then(function (improvedEntropy) {
                cb(improvedEntropy);
            });
    }else{
        cb(randomBytes(bip39_byteSize));
    }
}

// takes randomBytes() and more-entropy and returns an XOR of both entropies
async function improveEntropy(amountInBytes){

    return new Promise(function (resolve, reject) {
        // get an array of integers with at least the given amount of bits of combined entropy:
        moreEntropyGen.generate(amountInBytes * 8, function (vals) {

            // stuff entropy into a Uint8Array
            var valsUint8 = new Uint8Array(vals);

            // get randomBytes (uses crypto.getRandomValues)
            var randBytes = randomBytes(amountInBytes);

            // merge
            var mergeArray = new Uint8Array(amountInBytes);
            for (var i = 0; i < amountInBytes; i++) {
                mergeArray[i] = randBytes[i] ^ valsUint8[i];
            }

            var mergedEntropy = Buffer.from(mergeArray);

            resolve(mergedEntropy);
        });

    });
}

function initiateHDWallet(loadMnemonic, password, useImprovedEntropy, cb) {

    function afterGettingMnemonic(mnemonic, password) {
        var seed = bip39.mnemonicToSeed(mnemonic, password);
        var bip32RootKey = bitcoinjs.HDNode.fromSeedBuffer(seed);

        cb(mnemonic, bip32RootKey);
    }

    if (!loadMnemonic) {

        getEntropy(useImprovedEntropy, function (entropy) {

            // create a new mnemonic and return it
            var mnemonic = bip39.entropyToMnemonic(entropy);

            afterGettingMnemonic(mnemonic, password);
        });


    } else {
        // import a given mnemonic
        if (bip39.validateMnemonic(loadMnemonic)) {

            afterGettingMnemonic(loadMnemonic, password);
        } else {
            throw ('given mnemonic [' + loadMnemonic + '] is not a valid 12 word mnemonic');
        }
    }
}

function createAccount(bip32RootKey, networkID, index) {

    index = index || 0;

    // check path validity
    var accountPath = getAccountPath(networkID, index);
    var pathError = findDerivationPathErrors(accountPath, false, true);
    if (pathError) throw 'Derivation Path Error: ' + pathError;

    var account = bip32RootKey.derivePath(accountPath);
    account.keyPair.network = getNetworkByID(networkID);

    var result = {};
    result.account = account;

    result.xpub = account.neutered().toBase58();
    result.credentials = [];

    // calculate one level more downwards the tree, so time can be saved when creating multiple addresses later on
    // Masternode / BIP44 | BIP49 | BIP84 / Bitcoin | Testnet / Account / External / First Address
    //                                                                   ^^^^^^^^^
    var externalPath = '0';
    var pathError2 = findDerivationPathErrors(externalPath, false, false);
    if (pathError2) throw 'Derivation Path Error: ' + pathError;
    result.external = account.derivePath(externalPath);

    return result;
}


// creates addresses and privKeys on the level of a BIP32 account
function createCredentials(bip44external, addressIndex) {

    var credentials;

    // Masternode / BIP44 | BIP49 | BIP84 / Bitcoin | Testnet / Account / External / First Address
    //                                                                              ^^^^^^^^^^^^^^^
    var addressPath = addressIndex + '';
    var pathError = findDerivationPathErrors(addressPath, true, false);
    if (pathError) throw 'Derivation Path Error: ' + pathError;
    var bip32 = bip44external.derivePath(addressPath);

    var privateKey = bip32.keyPair.toWIF();

    return getCredentialsFromPrivKeyByObjects(privateKey, bip32, bip32.keyPair.network);
}

function getCredentialsFromPrivKeyByObjects(privateKey, ecPair, network){
    switch (network) {
        case bitcoinjs.networks.bitcoin:
        case bitcoinjs.networks.testnet:

            credentials = {privateKey: privateKey, address: ecPair.getAddress()};
            break;
        case bitcoinjs.networks.bitcoin.p2wpkhInP2sh:
        case bitcoinjs.networks.testnet.p2wpkhInP2sh:

            var pubKey = ecPair.getPublicKeyBuffer();
            var redeemScript = bitcoinjs.script.witnessPubKeyHash.output.encode(bitcoinjs.crypto.hash160(pubKey));
            var scriptPubKey = bitcoinjs.script.scriptHash.output.encode(bitcoinjs.crypto.hash160(redeemScript));

            credentials = {
                privateKey: privateKey,
                address: bitcoinjs.address.fromOutputScript(scriptPubKey, network)
            };
            break;
        case bitcoinjs.networks.bitcoin.p2wpkh:
        case bitcoinjs.networks.testnet.p2wpkh:

            var pubKey = ecPair.getPublicKeyBuffer();
            var scriptPubKey = bitcoinjs.script.witnessPubKeyHash.output.encode(bitcoinjs.crypto.hash160(pubKey));

            credentials = {
                privateKey: privateKey,
                address: bitcoinjs.address.fromOutputScript(scriptPubKey, network)
            };
            break;
        default:
            throw ("given network is not a valid network");
    }

    return credentials;
}

function getCredentialsFromPrivKey(privateKey, networkId){

    var network = getNetworkByID(networkId);
    var ecPair = bitcoinjs.ECPair.fromWIF(privateKey, network);

    return getCredentialsFromPrivKeyByObjects(privateKey, ecPair, network);
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

    if (fromMasternode && path.length > 1) {
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
    createCredentials,
    getCredentialsFromPrivKey,
    networks: bitcoinjs.networks
};
