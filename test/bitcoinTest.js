const bitcoinjs = require('bitcoinjs-lib');
const assert = require('chai').assert;
const bitcoin = require('../src/js/bitcoin');
const p2pkhAddressTypes = bitcoin.p2pkhAddressTypes;

const testing_mnemonic = 'curve swear maze domain knock frozen ordinary climb love possible brave market';

function bitcoinJStests() {
    describe('BitcoinJS', function () {

        this.timeout(10000); // all tests may take up to 10 seconds
        this.slow(3000); // a test is considered slow if it takes more than 3 seconds to completes

        describe('Initiating HD wallet', function () {
            it('Return new 12 word mnemonic', function () {
                var mnemonic = bitcoin.initiateHDWallet();
                var mnemonic_array = mnemonic.split(' ');
                assert.equal(mnemonic_array.length, 12);
            });

            it('Return given 12 word mnemonic', function () {
                var mnemonic = bitcoin.initiateHDWallet(testing_mnemonic);
                assert.equal(mnemonic, testing_mnemonic);
            });

            // it('Returns extended public key', function () {
            //     var xpub = bitcoin.initiateHDWallet().xpub;
            //     assert.equal(xpub.substring(0, 4), 'xpub');
            // });

        });

        describe('Retrieve from mnemonic', function () {

            it('Non-Segwit address [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses(1, p2pkhAddressTypes.p2pkh, bitcoinjs.networks.bitcoin)
                var address = credentials[0]['address'];
                assert.equal(address, '16C6UYcvPuiY4nHMbdSFAXgB2QEyxjr8Jx');
            });

            it('Non-Segwit privKey [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses(1, p2pkhAddressTypes.p2pkh, bitcoinjs.networks.bitcoin)
                var privateKey = credentials[0]['privateKey'];
                assert.equal(privateKey, 'L2THPE6rBFZBqe1qsXAZvjHwNe1UP3PCePPLsdCv9WxpoeQuXsAd');
            });

            it('3 non-Segwit addresses [testnet]', function () {

                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);
                var amount = 3;
                var addresses = [];
                var credentials = bitcoin.createP2PKHaddresses(amount, p2pkhAddressTypes.p2pkh, bitcoinjs.networks.testnet)
                for (var x = 0; x < amount; x++) {
                    addresses[x] = credentials[x]['address'];
                }
                assert.deepEqual(addresses, ['mopKVYnyG1MXViEtsWSrmCRvfdBh87JEDC', 'n3Efkt9APhTRZS37oP7BQvj4ngjZTmZvEh', 'n4MbxG5MjgJ7KhFgb5639vWA2AbvRBbGmw']);
            });

            it('2 non-Segwit privKeys [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);
                var amount = 2;
                var privKeys = [];
                var credentials = bitcoin.createP2PKHaddresses(amount, p2pkhAddressTypes.p2pkh, bitcoinjs.networks.testnet)
                for (var x = 0; x < amount; x++) {
                    privKeys[x] = credentials[x]['privateKey'];
                }
                assert.deepEqual(privKeys, ['cPbsmCBdoz9FkvoYQxcM7neaZXKhXDQpWcZRUJZPtjTttWRKFvTQ', 'cT9PJkpvFxZZe4CUf8kxZKHuwD6KDwue9qZtyvhPAJuYwLR8oyA6']);
            });

            it('P2SH-P2WPKH address [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses(1, p2pkhAddressTypes.p2sh_p2wpkh, bitcoinjs.networks.bitcoin)
                var address = credentials[0]['address'];
                assert.equal(address, '31uAoP3hMQ2rehKnfEFTMJC4tADveRzx6K');
            });

            it('P2SH-P2WPKH privKey [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses(1, p2pkhAddressTypes.p2sh_p2wpkh, bitcoinjs.networks.bitcoin)
                var privateKey = credentials[0]['privateKey'];
                assert.equal(privateKey, 'KxxQTCfkZgBBQYRBJTJr41avZJdQ1fHb7gc1Q1poGvSBdJtUeaR7');
            });

            it('P2SH-P2WPKH address [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses(1, p2pkhAddressTypes.p2sh_p2wpkh, bitcoinjs.networks.testnet)
                var address = credentials[0]['address'];
                assert.equal(address, '2N7oVd4Xq9TfpCWaVHhFNCPQbi4buiLdpyi');
            });

            it('P2SH-P2WPKH privKey [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses(1, p2pkhAddressTypes.p2sh_p2wpkh, bitcoinjs.networks.testnet)
                var privateKey = credentials[0]['privateKey'];
                assert.equal(privateKey, 'cRsGmgKfnAueMA2DJzT29dvMx4cLJ4gMbTK8CRahP4orPeD15caX');
            });

            it('Bech32 address [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses(1, p2pkhAddressTypes.bech32, bitcoinjs.networks.bitcoin)
                var address = credentials[0]['address'];
                assert.equal(address, 'bc1qk6rjegtxrvp7ty2tzd4uj88n33vnc3vqn90ps9');
            });

            it('Bech32 privKey [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses(1, p2pkhAddressTypes.bech32, bitcoinjs.networks.bitcoin)
                var privateKey = credentials[0]['privateKey'];
                assert.equal(privateKey, 'Kzkuno5MDgVcs841HW5HWnSFmZ4xBEjzxNN2FnTv6k7cWMkzkvrc');
            });

            it('Bech32 address [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses(1, p2pkhAddressTypes.bech32, bitcoinjs.networks.testnet)
                var address = credentials[0]['address'];
                assert.equal(address, 'tb1qc45lcycj4upms5v0hzdnhnyq4s09xe7jnsdhtz');
            });

            it('Bech32 privKey [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses(1, p2pkhAddressTypes.bech32, bitcoinjs.networks.testnet)
                var privateKey = credentials[0]['privateKey'];
                assert.equal(privateKey, 'cSoNGp1yv5yJFsUNKJck5TRufjVZ6aCRUu8tQB6X9o8eNa4ZVP1R');
            });
        });
    });
}

module.exports = {
    bitcoinJStests
}