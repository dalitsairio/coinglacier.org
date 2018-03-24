var bip39 = require('bip39');
var bitcoin = require('bitcoinjs-lib');

var p2pkhAddressTypes = {
    p2pkh: 0,       // non-segwit                                      // address begins with 1
    p2sh_p2wpkh: 1, // backwards compatible segwit (wrapped in a P2SH) // address begins with 3
    bech32: 2,      // native segwit                                   // address begins with bc1
}

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
    root = bitcoin.HDNode.fromSeedBuffer(seed);

    // todo this must be put into the function createP2PKHaddresses
    // var derivationPath = "m/44'/0'/0'";
    // var account0 = root.derivePath(derivationPath);
    // xpub = account0.neutered().toBase58();

    return mnemonic;
}

// if you want 2 accounts with 3 addresses each:
// accounts = [3, 3];
function createP2PKHaddresses (accounts, addressType, targetNetwork) {

    // by default return one address
    if(accounts === undefined || accounts.constructor !== Array) {
        accounts = [1];
    }

    // set P2SH-P2WPKH as standard address type
    if(addressType === undefined) {
        addressType = p2pkhAddressTypes.p2sh_p2wpkh;
    }

    // set MAINNET as standard network
    if(targetNetwork === undefined) {
        targetNetwork = bitcoin.networks.bitcoin;
    }

    // https://github.com/satoshilabs/slips/blob/master/slip-0044.md
    var mainnetORtestnet = 0;
    if(targetNetwork === bitcoin.networks.testnet){
        mainnetORtestnet = 1;
    }

    var result = [];

    // calculate addresses
    for(var accIndex = 0; accIndex < accounts.length; accIndex++) {
        var amount = accounts[accIndex];
        for (var index = 0; index < amount; index++) {
            switch (addressType) {
                case p2pkhAddressTypes.p2pkh:
                    if(result[accIndex] === undefined || result[accIndex].constructor !== Array){
                        result[accIndex] = [];
                    }

                    // PrivKey / BIP44 / Bitcoin | Testnet / Account / External / First Address
                    var derivationPath = "m/44'/" + mainnetORtestnet + "'/" + accIndex + "'/0/" + index;
                    var bip32 = root.derivePath(derivationPath);
                    bip32.keyPair.network = targetNetwork;
                    result[accIndex].push({privateKey: bip32.keyPair.toWIF(), address: bip32.getAddress()});
                    break;
                case p2pkhAddressTypes.p2sh_p2wpkh:
                    if(result[accIndex] === undefined || result[accIndex].constructor !== Array){
                        result[accIndex] = [];
                    }

                    // PrivKey / BIP49 / Bitcoin | Testnet / Account / External / First Address
                    var derivationPath = "m/49'/" + mainnetORtestnet + "'/" + accIndex + "'/0/" + index;
                    var bip32 = root.derivePath(derivationPath);
                    bip32.keyPair.network = targetNetwork;
                    var pubKey = bip32.getPublicKeyBuffer();
                    var redeemScript = bitcoin.script.witnessPubKeyHash.output.encode(bitcoin.crypto.hash160(pubKey));
                    var scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
                    result[accIndex].push({
                        privateKey: bip32.keyPair.toWIF(),
                        address: bitcoin.address.fromOutputScript(scriptPubKey, targetNetwork)
                    });
                    break;
                case p2pkhAddressTypes.bech32:
                    if(result[accIndex] === undefined || result[accIndex].constructor !== Array){
                        result[accIndex] = [];
                    }

                    // PrivKey / BIP84 / Bitcoin | Testnet / Account / External / First Address
                    var derivationPath = "m/84'/" + mainnetORtestnet + "'/" + accIndex + "'/0/" + index;
                    var bip32 = root.derivePath(derivationPath);
                    bip32.keyPair.network = targetNetwork;
                    var pubKey = bip32.getPublicKeyBuffer();
                    var scriptPubKey = bitcoin.script.witnessPubKeyHash.output.encode(bitcoin.crypto.hash160(pubKey));
                    result[accIndex].push({
                        privateKey: bip32.keyPair.toWIF(),
                        address: bitcoin.address.fromOutputScript(scriptPubKey, targetNetwork)
                    });
                    break;
                default:
                    throw ("\"" + addressType + "\" is not a valid address type");
            }
        }
    }

    return result;
}

module.exports = {
    initiateHDWallet,
    createP2PKHaddresses,
    p2pkhAddressTypes,
    networks: bitcoin.networks
}
