const bitcoinjs = require('./patchedLibs/bitcoinjs-lib_patched').bitcoinjs;
const bip39 = require('bip39');
const mEntropy = require('more-entropy');
const randomBytes = require('randombytes');
const createHash = require('create-hash');

const bip39_bitSize = 128; // = 12 words  // https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki#generating-the-mnemonic
const bip39_byteSize = bip39_bitSize / 8;

let moreEntropyGen = new mEntropy.Generator({
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

function hash256 (buffer) {
    return createHash('sha256').update(
        createHash('sha256').update(buffer).digest()
    ).digest()
}

function getEntropy(useImprovedEntropy, cb){
    if(useImprovedEntropy){
        improveEntropy(bip39_byteSize)
            .then(function (improvedEntropy) {
                cb(improvedEntropy);
            }).catch(function (err) {
                console.error(err);
        });
    }else{
        cb(randomBytes(bip39_byteSize));
    }
}

// takes randomBytes() and more-entropy and returns an XOR of both entropies
function improveEntropy(amountInBytes){

    return new Promise(function (resolve, reject) {
        // get an array of integers with at least the given amount of bits of combined entropy:
        moreEntropyGen.generate(amountInBytes * 8, function (vals) {

            // stuff entropy into a Uint8Array
            let valsUint8 = new Uint8Array(vals);

            // get randomBytes (uses crypto.getRandomValues)
            let randBytes = randomBytes(amountInBytes);

            // merge
            let mergeArray = new Uint8Array(amountInBytes);
            for (let i = 0; i < amountInBytes; i++) {
                mergeArray[i] = randBytes[i] ^ valsUint8[i];
            }

            let mergedEntropy = Buffer.from(mergeArray);

            resolve(mergedEntropy);
        });

    });
}

function initiateHDWallet(loadMnemonic, password, useImprovedEntropy, cb) {

    if (!loadMnemonic) {
        getEntropy(useImprovedEntropy, function (entropy) {

            // create a new mnemonic and return it
            let mnemonic = bip39.entropyToMnemonic(entropy);

            getRootKeyFromMnemonic(mnemonic, password, cb);
        });
    } else {
        // import a given mnemonic
        if (bip39.validateMnemonic(loadMnemonic)) {

            getRootKeyFromMnemonic(loadMnemonic, password, cb);
        } else {
            throw ('given mnemonic [' + loadMnemonic + '] is not a valid 12 word mnemonic');
        }
    }
}

function getRootKeyFromMnemonic(mnemonic, password, cb){
    let seed = bip39.mnemonicToSeed(mnemonic, password);
    let bip32RootKey = bitcoinjs.bip32.fromSeed(seed);

    cb(mnemonic, bip32RootKey);
}

function createAccount(bip32RootKey, networkID, index) {

    index = index || 0;

    // check path validity
    let accountPath = getAccountPath(networkID, index);
    let pathError = findDerivationPathErrors(accountPath, false, true);
    if (pathError) throw 'Derivation Path Error: ' + pathError;

    let account = bip32RootKey.derivePath(accountPath);
    account.network = getNetworkByID(networkID);

    let result = {
        account: account,
        xpub: account.neutered().toBase58(),
        credentials: []
    };

    // calculate one level more downwards the tree, so time can be saved when creating multiple addresses later on
    // Masternode / BIP44 | BIP49 | BIP84 / Bitcoin | Testnet / Account / External / First Address
    //                                                                   ^^^^^^^^^
    let externalPath = '0';
    let pathError2 = findDerivationPathErrors(externalPath, false, false);
    if (pathError2) throw 'Derivation Path Error: ' + pathError;
    result.external = account.derivePath(externalPath);

    return result;
}


// creates addresses and privKeys on the level of a BIP32 account
function createCredentials(bip44external, addressIndex) {

    // Masternode / BIP44 | BIP49 | BIP84 / Bitcoin | Testnet / Account / External / First Address
    //                                                                              ^^^^^^^^^^^^^^^
    let addressPath = addressIndex + '';
    let pathError = findDerivationPathErrors(addressPath, true, false);
    if (pathError) throw 'Derivation Path Error: ' + pathError;
    let bip32 = bip44external.derivePath(addressPath);

    let privateKey = bip32.toWIF();

    return getCredentialsFromPrivKey(privateKey, bip32, bip32.network);
}

function getCredentialsFromPrivKey(privateKey, ecPair, network){

    switch (network.id) {
        case bitcoinjs.networks.bitcoin.id:
        case bitcoinjs.networks.testnet.id:

            return {
                privateKey: privateKey,
                address: bitcoinjs.payments.p2pkh({ pubkey: ecPair.publicKey, network }).address
            };
        case bitcoinjs.networks.bitcoin.p2wpkhInP2sh.id:
        case bitcoinjs.networks.testnet.p2wpkhInP2sh.id:

            let redeemScript = bitcoinjs.payments.p2wpkh({pubkey: ecPair.publicKey, network});

            return {
                privateKey: privateKey,
                address: bitcoinjs.payments.p2sh({redeem: redeemScript, network}).address
            };
        case bitcoinjs.networks.bitcoin.p2wpkh.id:
        case bitcoinjs.networks.testnet.p2wpkh.id:

            return {
                privateKey: privateKey,
                address: bitcoinjs.payments.p2wpkh({pubkey: ecPair.publicKey, network}).address
            };
        default:
            throw ("given network is not a valid network");
    }
}

// todo   this should actually be part of the BIP38 library
// todo   but testnet/segwit/bech32 support is not implemented yet (May '18)
// is solely used for BIP38 decryption, to find out what addresstype the encrypted privKey originally was created for.
// guesses on what address type should be returned
function getCredentialsFromPrivKeyAndSalt(privateKey, salt, testnet){

    let possibleNetworks = getNetworkArray(testnet);

    try {
        for (let x = 0; x < possibleNetworks.length; x++) {

            let ecPair = bitcoinjs.ECPair.fromWIF(privateKey, possibleNetworks[x]);
            let credentials = getCredentialsFromPrivKey(privateKey, ecPair, possibleNetworks[x]);
            let checksum = hash256(credentials.address).slice(0, 4);

            let checksumCorrect = Buffer.compare(Buffer.from(salt), Buffer.from(checksum)) === 0;

            if (checksumCorrect) {
                return credentials;
            }
        }
    }catch (e) {
        console.error('Error in BIP38 Password Decryption');
        console.error(e.message);
    }

    return false;
}

function getNetworkArray(testnet){

    let mainnetNetworks = [
        bitcoinjs.networks.bitcoin.p2wpkhInP2sh,
        bitcoinjs.networks.bitcoin.p2wpkh,
        bitcoinjs.networks.bitcoin,
    ];

    let testnetNetworks = [
        bitcoinjs.networks.testnet.p2wpkhInP2sh,
        bitcoinjs.networks.testnet.p2wpkh,
        bitcoinjs.networks.testnet
    ];

    return testnet ? testnetNetworks : mainnetNetworks;
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
    let mainnetORtestnet = getBip44testnetOrMainnet(networkID);

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
    let maxDepth = 255; // TODO verify this!!
    let maxIndexValue = Math.pow(2, 31); // TODO verify this!!

    // check first character
    let invalidFirstChar = path[0].replace(/^[0-9m]/, "");
    if (invalidFirstChar > 0) {
        return "first charactar must be 'm' or a number, but is " + invalidFirstChar;
    }

    if (fromMasternode && path[0] !== 'm') {
        return "First character must be 'm'";
    } else if (!fromMasternode && path[0] === 'm') {
        return 'The path starts at masternode, but the third param is set to false';
    }

    if (fromMasternode && path.length > 1) {
        if (path[1] !== '/') {
            return "Separator must be '/'";
        }
        let indexes = path.split('/');
        if (indexes.length > maxDepth) {
            return 'Derivation depth is ' + indexes.length + ', must be less than ' + maxDepth;
        }
        for (let depth = 1; depth < indexes.length; depth++) {
            let index = indexes[depth];
            let invalidChars = index.replace(/^[0-9]+'?$/g, "");
            if (invalidChars.length > 0) {
                return "Invalid characters " + invalidChars + " found at depth " + depth;
            }
            let indexValue = parseInt(index.replace("'", ""));
            if (isNaN(depth)) {
                return "Invalid number at depth " + depth;
            }
            if (indexValue > maxIndexValue) {
                return "Value of " + indexValue + " at depth " + depth + " must be less than " + maxIndexValue;
            }
        }
    }

    // Check no hardened derivation path when using xpub keys
    let isHardenedPath = path.indexOf("'") > -1;
    if (isHardenedPath && createXPUB) {
        return "Hardened derivation path is invalid with xpub key";
    }
    return false;
}


module.exports = {
    initiateHDWallet,
    createAccount,
    createCredentials,
    getCredentialsFromPrivKeyAndSalt,
    validateMnemonic: bip39.validateMnemonic,
    networks: bitcoinjs.networks
};