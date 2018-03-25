const bip39 = require('bip39');
const bitcoinjs = require('./bitcoinjs-lib_patched').bitcoinjs;

var mnemonic;
var root;

function initiateHDWallet (loadMnemonic) {

    // create a new mnemonic and return it
    if(loadMnemonic === undefined) {
        mnemonic = bip39.generateMnemonic();

        // import a given mnemonic
    }else{
        if(bip39.validateMnemonic(loadMnemonic)) {
            mnemonic = loadMnemonic;
        }else{
            throw ('given mnemonic [' + loadMnemonic + '] is not a valid 12 word mnemonic');
        }
    }

    var seed = bip39.mnemonicToSeed(mnemonic);
    root = bitcoinjs.HDNode.fromSeedBuffer(seed);

    return mnemonic;
}

// if you want 2 accounts with 3 addresses each:
// accounts = [3, 3];
function createP2PKHaddresses (accounts, targetNetwork) {

    // by default return one address
    if(accounts === undefined || accounts.constructor !== Array) {
        accounts = [1];
    }

    // set MAINNET P2SH-P2WPKH as standard network
    if(targetNetwork === undefined) {
        targetNetwork = bitcoinjs.networks.bitcoin.p2wpkhInP2sh;
    }

    // https://github.com/satoshilabs/slips/blob/master/slip-0044.md
    var mainnetORtestnet = 0;
    if(targetNetwork === bitcoinjs.networks.testnet ||
        targetNetwork === bitcoinjs.networks.testnet.p2wpkhInP2sh ||
        targetNetwork === bitcoinjs.networks.testnet.p2wpkh){
        mainnetORtestnet = 1;
    }

    var result = [];

    // calculate addresses
    for(var accIndex = 0; accIndex < accounts.length; accIndex++) {
        var amount = accounts[accIndex];

        result[accIndex] = [];
        result[accIndex]['credentials'] = [];
        var accountPath;

        // get extended public key of each account
        switch (targetNetwork) {
            case bitcoinjs.networks.bitcoin:
            case bitcoinjs.networks.testnet:

                // PrivKey / BIP44 / Bitcoin | Testnet / Account
                accountPath = "m/44'/" + mainnetORtestnet + "'/" + accIndex + "'";

                break;
            case bitcoinjs.networks.bitcoin.p2wpkhInP2sh:
            case bitcoinjs.networks.testnet.p2wpkhInP2sh:

                // PrivKey / BIP49 / Bitcoin | Testnet / Account
                accountPath = "m/49'/" + mainnetORtestnet + "'/" + accIndex + "'";

                break;
            case bitcoinjs.networks.bitcoin.p2wpkh:
            case bitcoinjs.networks.testnet.p2wpkh:

                // PrivKey / BIP84 / Bitcoin | Testnet / Account
                accountPath = "m/84'/" + mainnetORtestnet + "'/" + accIndex + "'";

                break;
            default:
                throw ("given network is not a valid network");
        }

        var account =  root.derivePath(accountPath);
        account.keyPair.network = targetNetwork;
        result[accIndex]['xpub'] = account.neutered().toBase58();

        for (var index = 0; index < amount; index++) {

            // PrivKey / BIP44 | BIP49 | BIP84 / Bitcoin | Testnet / Account / External / First Address
            var addressPath = "0/" + index;
            var bip32 = account.derivePath(addressPath);

            bip32.keyPair.network = targetNetwork;

            switch (targetNetwork) {
                case bitcoinjs.networks.bitcoin:
                case bitcoinjs.networks.testnet:

                    result[accIndex]['credentials'].push({privateKey: bip32.keyPair.toWIF(), address: bip32.getAddress()});
                    break;
                case bitcoinjs.networks.bitcoin.p2wpkhInP2sh:
                case bitcoinjs.networks.testnet.p2wpkhInP2sh:

                    var pubKey = bip32.getPublicKeyBuffer();
                    var redeemScript = bitcoinjs.script.witnessPubKeyHash.output.encode(bitcoinjs.crypto.hash160(pubKey));
                    var scriptPubKey = bitcoinjs.script.scriptHash.output.encode(bitcoinjs.crypto.hash160(redeemScript));

                    result[accIndex]['credentials'].push({
                        privateKey: bip32.keyPair.toWIF(),
                        address: bitcoinjs.address.fromOutputScript(scriptPubKey, targetNetwork)
                    });
                    break;
                case bitcoinjs.networks.bitcoin.p2wpkh:
                case bitcoinjs.networks.testnet.p2wpkh:

                    var pubKey = bip32.getPublicKeyBuffer();
                    var scriptPubKey = bitcoinjs.script.witnessPubKeyHash.output.encode(bitcoinjs.crypto.hash160(pubKey));

                    result[accIndex]['credentials'].push({
                        privateKey: bip32.keyPair.toWIF(),
                        address: bitcoinjs.address.fromOutputScript(scriptPubKey, targetNetwork)
                    });
                    break;
                default:
                    throw ("given network is not a valid network");
            }
        }
    }

    return result;
}

module.exports = {
    initiateHDWallet,
    createP2PKHaddresses,
    networks: bitcoinjs.networks
}
