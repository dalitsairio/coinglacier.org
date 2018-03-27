const bitcoinjs = require('./bitcoinjs-lib_patched').bitcoinjs;
const bip39 = require('bip39');
const bip38 = require('bip38');
const wif = require('wif');

var mnemonic;
var root;

function initiateHDWallet (loadMnemonic, password) {

    // create a new mnemonic and return it
    if(!loadMnemonic) {
        mnemonic = bip39.generateMnemonic();

        // import a given mnemonic
    }else{
        if(bip39.validateMnemonic(loadMnemonic)) {
            mnemonic = loadMnemonic;
        }else{
            throw ('given mnemonic [' + loadMnemonic + '] is not a valid 12 word mnemonic');
        }
    }

    var seed = bip39.mnemonicToSeed(mnemonic, password);
    root = bitcoinjs.HDNode.fromSeedBuffer(seed);

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

        var account =  root.derivePath(getAccountPath(targetNetwork, accIndex));
        account.keyPair.network = targetNetwork;

        result[accIndex] = [];
        result[accIndex]['credentials'] = createAccountCredentials(account, targetNetwork, amount, password);
        result[accIndex]['xpub'] = account.neutered().toBase58();

    }

    return result;
}

// creates addresses and privKeys on the level of a BIP32 account
function createAccountCredentials(account, network, amount, password){

    var credentials = [];

    for (var index = 0; index < amount; index++) {

        // PrivKey / BIP44 | BIP49 | BIP84 / Bitcoin | Testnet / Account / External / First Address
        var addressPath = "0/" + index;
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

module.exports = {
    initiateHDWallet,
    createP2PKHaddresses,
    networks: bitcoinjs.networks
}
