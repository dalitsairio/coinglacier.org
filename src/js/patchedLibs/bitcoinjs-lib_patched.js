var bitcoinjs = require('bitcoinjs-lib');

// extensions copied from https://github.com/iancoleman/bip39/blob/master/src/js/segwit-parameters.js
(function() {

// add id's to existing networks
bitcoinjs.networks.bitcoin.id = 0;
bitcoinjs.networks.testnet.id = 10;


// p2wpkh

bitcoinjs.networks.bitcoin.p2wpkh = {
    id: 2,
    baseNetwork: "bitcoin",
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bc',
    bip32: {
        public: 0x04b24746,
        private: 0x04b2430c
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80
};

bitcoinjs.networks.testnet.p2wpkh = {
    id: 12,
    baseNetwork: "testnet",
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'tb',
    bip32: {
        public: 0x045f1cf6,
        private: 0x045f18bc
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef
};

// p2wpkh in p2sh

bitcoinjs.networks.bitcoin.p2wpkhInP2sh = {
    id: 1,
    baseNetwork: "bitcoin",
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bc',
    bip32: {
        public: 0x049d7cb2,
        private: 0x049d7878
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80
};

bitcoinjs.networks.testnet.p2wpkhInP2sh = {
    id: 11,
    baseNetwork: "testnet",
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'tb',
    bip32: {
        public: 0x044a5262,
        private: 0x044a4e28
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef
};

})();

module.exports = {
    bitcoinjs
}
