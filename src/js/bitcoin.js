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

function createP2PKHaddresses (amount, addressType, targetNetwork) {

    // by default return one address
    if(amount === undefined || amount < 1) {
        amount = 1;
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

    var addresses = [];
    var privKey;

    // calculate address
    for(var index = 0; index < amount; index++) {
        switch (addressType) {
            case p2pkhAddressTypes.p2pkh:
                // PrivKey / BIP44 / Bitcoin | Testnet / Account / External / First Address
                var derivationPath = "m/44'/" + mainnetORtestnet + "'/0'/0/" + index;
                privKey = root.derivePath(derivationPath);
                privKey.keyPair.network = targetNetwork;
                addresses.push({privateKey: privKey.keyPair.toWIF(), address: privKey.getAddress()});
                break;
            case p2pkhAddressTypes.p2sh_p2wpkh:
                // PrivKey / BIP49 / Bitcoin | Testnet / Account / External / First Address
                var derivationPath = "m/49'/" + mainnetORtestnet + "'/0'/0/" + index;
                privKey = root.derivePath(derivationPath);
                privKey.keyPair.network = targetNetwork;
                var pubKey = privKey.getPublicKeyBuffer();
                var redeemScript = bitcoin.script.witnessPubKeyHash.output.encode(bitcoin.crypto.hash160(pubKey));
                var scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
                addresses.push({
                    privateKey: privKey.keyPair.toWIF(),
                    address: bitcoin.address.fromOutputScript(scriptPubKey, targetNetwork)
                });
                break;
            case p2pkhAddressTypes.bech32:
                // PrivKey / BIP84 / Bitcoin | Testnet / Account / External / First Address
                var derivationPath = "m/84'/" + mainnetORtestnet + "'/0'/0/" + index;
                privKey = root.derivePath(derivationPath);
                privKey.keyPair.network = targetNetwork;
                var pubKey = privKey.getPublicKeyBuffer();
                var scriptPubKey = bitcoin.script.witnessPubKeyHash.output.encode(bitcoin.crypto.hash160(pubKey));
                addresses.push({
                    privateKey: privKey.keyPair.toWIF(),
                    address: bitcoin.address.fromOutputScript(scriptPubKey, targetNetwork)
                });
                break;
            default:
                throw ("\"" + addressType + "\" is not a valid address type");
        }
    }

    return addresses;
}

module.exports = {
    initiateHDWallet,
    createP2PKHaddresses,
    p2pkhAddressTypes,
    networks: bitcoin.networks
}
