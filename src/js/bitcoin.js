const bitcoinjs = require('./bitcoinjs-lib_patched').bitcoinjs;
const bip39 = require('bip39');
const bip38 = require('bip38');
const wif = require('wif');

var mnemonic;
var bip32RootKey;
var useCache;
var cache;

function initiateHDWallet (loadMnemonic, password, cacheResults) {

    useCache = (cacheResults ? true : false);
    cache = [];

    if(!loadMnemonic) {
        // create a new mnemonic and return it
        mnemonic = bip39.generateMnemonic();
    }else{
        // import a given mnemonic
        if(bip39.validateMnemonic(loadMnemonic)) {
            mnemonic = loadMnemonic;
        }else{
            throw ('given mnemonic [' + loadMnemonic + '] is not a valid 12 word mnemonic');
        }
    }

    var seed = bip39.mnemonicToSeed(mnemonic, password);
    bip32RootKey = bitcoinjs.HDNode.fromSeedBuffer(seed);

    return mnemonic;
}

// if you want 2 accounts with 3 addresses each:
// accounts = [3, 3];
function createP2PKHaddresses (accounts, targetNetwork, password) {

    // by default return one address
    if(accounts === undefined || accounts.constructor !== Array) {
        accounts = [1];
    }

    // set MAINNET P2SH-P2WPKH as standard network
    targetNetwork = targetNetwork || bitcoinjs.networks.bitcoin.p2wpkhInP2sh;

    var result = [];

    // calculate addresses
    for(var accIndex = 0; accIndex < accounts.length; accIndex++) {
        var amount = accounts[accIndex];

        // check path validity
        var accountPath = getAccountPath(targetNetwork, accIndex);
        var pathError = findDerivationPathErrors(accountPath, false, true);
        if(pathError) throw 'Derivation Path Error: ' + pathError;

        var account =  bip32RootKey.derivePath(accountPath);
        account.keyPair.network = targetNetwork;

        var accountResults;

        // read data from cache
        var cachedData = getCachedResults(accountPath, password);
        if(cachedData){
            var cachedAmount = cachedData.credentials.length;

            if(cachedAmount >= amount){
                // clone the cache object
                var cacheCopy = {};
                cacheCopy.xpub = cachedData.xpub;
                cacheCopy.credentials = cachedData.credentials;
                cacheCopy.credentials.splice(amount); // from the clone, remove the data that is not needed

                result[accIndex] = cacheCopy;
                continue;
            }else{
                // remove result from cache (to afterwards write the bigger cache)
                removeCachedResult(accountPath, password);

                // prepend to the cached results so not all the calculations need to be done anymore
                accountResults = cachedData;
                var newCredentials = createAccountCredentials(account, targetNetwork, amount, password, cachedAmount);
                accountResults.credentials = accountResults.credentials.concat(newCredentials);
            }
        }else{
            accountResults = {};
            accountResults.credentials = createAccountCredentials(account, targetNetwork, amount, password);
            accountResults.xpub = account.neutered().toBase58();
        }

        result[accIndex] = accountResults;
        cacheResults(accountPath, password, accountResults);
    }

    return result;
}

// creates addresses and privKeys on the level of a BIP32 account
function createAccountCredentials(account, network, amount, password, startIndex){

    var credentials = [];

    for (var index = startIndex || 0; index < amount; index++) {

        // PrivKey / BIP44 | BIP49 | BIP84 / Bitcoin | Testnet / Account / External / First Address
        //                                                                 ^^^^^^^^^^^^^^^^^^^^^^^^
        var addressPath = '0/' + index;
        var pathError = findDerivationPathErrors(addressPath, true, false);
        if(pathError) throw 'Derivation Path Error: ' + pathError;

        var bip32 = account.derivePath(addressPath);
        bip32.keyPair.network = network;

        var privateKey = bip32.keyPair.toWIF();
        if(password){
            // encrypt the privateKey
            var decoded = wif.decode(privateKey);
            privateKey = bip38.encrypt(decoded.privateKey, decoded.compressed, password);
        }

        switch (network) {
            case bitcoinjs.networks.bitcoin:
            case bitcoinjs.networks.testnet:

                credentials.push({privateKey: privateKey, address: bip32.getAddress()});
                break;
            case bitcoinjs.networks.bitcoin.p2wpkhInP2sh:
            case bitcoinjs.networks.testnet.p2wpkhInP2sh:

                var pubKey = bip32.getPublicKeyBuffer();
                var redeemScript = bitcoinjs.script.witnessPubKeyHash.output.encode(bitcoinjs.crypto.hash160(pubKey));
                var scriptPubKey = bitcoinjs.script.scriptHash.output.encode(bitcoinjs.crypto.hash160(redeemScript));

                credentials.push({
                    privateKey: privateKey,
                    address: bitcoinjs.address.fromOutputScript(scriptPubKey, network)
                });
                break;
            case bitcoinjs.networks.bitcoin.p2wpkh:
            case bitcoinjs.networks.testnet.p2wpkh:

                var pubKey = bip32.getPublicKeyBuffer();
                var scriptPubKey = bitcoinjs.script.witnessPubKeyHash.output.encode(bitcoinjs.crypto.hash160(pubKey));

                credentials.push({
                    privateKey: privateKey,
                    address: bitcoinjs.address.fromOutputScript(scriptPubKey, network)
                });
                break;
            default:
                throw ("given network is not a valid network");
        }
    }

    return credentials;

}

function getBip44testnetOrMainnet(network){

    if(network === bitcoinjs.networks.testnet ||
        network === bitcoinjs.networks.testnet.p2wpkhInP2sh ||
        network === bitcoinjs.networks.testnet.p2wpkh){

        return 1;
    }

    return 0;
}

function getAccountPath(network, accountIndex){

    // https://github.com/satoshilabs/slips/blob/master/slip-0044.md
    var mainnetORtestnet = getBip44testnetOrMainnet(network);

    // get extended public key of each account
    switch (network) {
        case bitcoinjs.networks.bitcoin:
        case bitcoinjs.networks.testnet:

            // PrivKey / BIP44 / Bitcoin | Testnet / Account
            return "m/44'/" + mainnetORtestnet + "'/" + accountIndex + "'";

        case bitcoinjs.networks.bitcoin.p2wpkhInP2sh:
        case bitcoinjs.networks.testnet.p2wpkhInP2sh:

            // PrivKey / BIP49 / Bitcoin | Testnet / Account
            return "m/49'/" + mainnetORtestnet + "'/" + accountIndex + "'";

        case bitcoinjs.networks.bitcoin.p2wpkh:
        case bitcoinjs.networks.testnet.p2wpkh:

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

    if(fromMasternode !== false){
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
    if(invalidFirstChar > 0){
        return "first charactar must be 'm' or a number, but is " + invalidFirstChar;
    }

    if (fromMasternode && path[0] != 'm') {
        return "First character must be 'm'";
    }else if(!fromMasternode && path[0] == 'm'){
        return 'The path starts at masternode, but the third param is set to false';
    }

    if (path.length > 1) {
        if (path[1] != '/') {
            return "Separator must be '/'";
        }
        var indexes = path.split('/');
        if (indexes.length > maxDepth) {
            return 'Derivation depth is ' + indexes.length + ', must be less than '  + maxDepth;
        }
        for (var depth = 1; depth<indexes.length; depth++) {
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


// //////////////////////////////////////////////////
// Result Caching
// Caching is only done per mnemonic and is resetted
// on the creation of a new mnemonic.
// //////////////////////////////////////////////////

function cacheResults(accountPath, password, accountResults){
    if(useCache) {
        cache.push({
                accountPath: accountPath,
                password: password,
                xpub: accountResults.xpub,
                credentials: accountResults.credentials
            });
    }
}

function getCachedResults(accountPath, password){
    if(useCache) {
        for (var i = 0; i < cache.length; i++) {
            if (cache[i].accountPath === accountPath && cache[i].password === password) {
                return cache[i];
            }
        }
    }

    return false;
}

function removeCachedResult(accountPath, password){
    for (var i = 0; i < cache.length; i++) {
        if (cache[i].accountPath === accountPath && cache[i].password === password) {
            cache.splice(i, 1);
        }
    }
}



module.exports = {
    initiateHDWallet,
    createP2PKHaddresses,
    networks: bitcoinjs.networks
};
