const assert = require('chai').assert;
const bitcoin = require('../src/js/bitcoin');

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

        });

        // see https://github.com/spesmilo/electrum-docs/blob/0821640adeda072fec1ee4ccfe74a0e47803f4cb/xpub_version_bytes.rst
        describe('Extended public key', function () {
            describe('New mnemonic', function () {
                it('Returns xpub', function () {
                    bitcoin.initiateHDWallet();
                    var credentials = bitcoin.createP2PKHaddresses([1], bitcoin.networks.bitcoin);
                    var xpub = credentials[0]['xpub'];

                    assert.equal(xpub.substring(0, 4), 'xpub');
                });
                it('Returns ypub', function () {
                    bitcoin.initiateHDWallet();
                    var credentials = bitcoin.createP2PKHaddresses([1], bitcoin.networks.bitcoin.p2wpkhInP2sh);
                    var ypub = credentials[0]['xpub'];

                    assert.equal(ypub.substring(0, 4), 'ypub');
                });
                it('Returns zpub', function () {
                    bitcoin.initiateHDWallet();
                    var credentials = bitcoin.createP2PKHaddresses([1], bitcoin.networks.bitcoin.p2wpkh);
                    var zpub = credentials[0]['xpub'];

                    assert.equal(zpub.substring(0, 4), 'zpub');
                });
                it('Returns tpub', function () {
                    bitcoin.initiateHDWallet();
                    var credentials = bitcoin.createP2PKHaddresses([1], bitcoin.networks.testnet);
                    var tpub = credentials[0]['xpub'];

                    assert.equal(tpub.substring(0, 4), 'tpub');
                });
                it('Returns upub', function () {
                    bitcoin.initiateHDWallet();
                    var credentials = bitcoin.createP2PKHaddresses([1], bitcoin.networks.testnet.p2wpkhInP2sh);
                    var upub = credentials[0]['xpub'];

                    assert.equal(upub.substring(0, 4), 'upub');
                });
                it('Returns vpub', function () {
                    bitcoin.initiateHDWallet();
                    var credentials = bitcoin.createP2PKHaddresses([1], bitcoin.networks.testnet.p2wpkh);
                    var vpub = credentials[0]['xpub'];

                    assert.equal(vpub.substring(0, 4), 'vpub');
                });
            });
            describe('Given mnemonic', function () {
                it('Returns XPUB [Non-Segwit]', function () {
                    bitcoin.initiateHDWallet(testing_mnemonic);
                    var credentials = bitcoin.createP2PKHaddresses([1], bitcoin.networks.bitcoin);
                    var xpub = credentials[0]['xpub'];

                    var expected = 'xpub6BgB4HXnJs3gV9t9r4LB6ZXmwbawUEZSwFcCHZC3K3yEN4Lmtzg8bBSpriKgHJLS9Jufgym9osUAVHvyMYdQ82zMzp3voYFbgfUYvq9XhCD';

                    assert.equal(xpub, expected);
                });
                it('Returns YPUB [P2SH-P2WPKH]', function () {
                    bitcoin.initiateHDWallet(testing_mnemonic);
                    var credentials = bitcoin.createP2PKHaddresses([1, 1], bitcoin.networks.bitcoin.p2wpkhInP2sh);
                    var xpub = credentials[0]['xpub'];

                    var expected = 'ypub6Xvc2hTW5ziP5tApCAFBM9JeyuriZ8SQ3GZfpdneEueDmmhUYgbqtzDub34jqwKAEe9YNwgKD7mBpBfbh1g6Mt5b3xtcczuZXNeu5Q5yJp8';

                    assert.equal(xpub, expected);
                });
                it('Returns ZPUB [Bech32, 2nd account]', function () {
                    bitcoin.initiateHDWallet(testing_mnemonic);
                    var credentials = bitcoin.createP2PKHaddresses([1, 1], bitcoin.networks.bitcoin.p2wpkh);
                    var xpub = credentials[1]['xpub'];

                    var expected = 'zpub6s7a2Y5RyxmLZLRMD79crfAeXuwXvChc5MRU5WvipdJHZG84Z1en4LGJCmMVLzYYRprAWShdKgcqPjr3kBuDLPj57j2XA44HaREZ4HMfFHw';

                    assert.equal(xpub, expected);
                });
            });

        });

        describe('Retrieve from mnemonic', function () {

            it('Non-Segwit address [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses([1], bitcoin.networks.bitcoin);
                var address = credentials[0]['credentials'][0]['address'];
                assert.equal(address, '16C6UYcvPuiY4nHMbdSFAXgB2QEyxjr8Jx');
            });

            it('Non-Segwit privKey [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses([1], bitcoin.networks.bitcoin);
                var privateKey = credentials[0]['credentials'][0]['privateKey'];
                assert.equal(privateKey, 'L2THPE6rBFZBqe1qsXAZvjHwNe1UP3PCePPLsdCv9WxpoeQuXsAd');
            });

            it('3 non-Segwit addresses [testnet]', function () {

                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);
                var amount = 3;
                var addresses = [];
                var credentials = bitcoin.createP2PKHaddresses([amount], bitcoin.networks.testnet)
                for (var x = 0; x < amount; x++) {
                    addresses[x] = credentials[0]['credentials'][x]['address'];
                }
                assert.deepEqual(addresses,
                    [
                        'mopKVYnyG1MXViEtsWSrmCRvfdBh87JEDC',
                        'n3Efkt9APhTRZS37oP7BQvj4ngjZTmZvEh',
                        'n4MbxG5MjgJ7KhFgb5639vWA2AbvRBbGmw'
                    ]);
            });

            it('2 non-Segwit privKeys [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);
                var amount = 2;
                var privKeys = [];
                var credentials = bitcoin.createP2PKHaddresses([amount], bitcoin.networks.testnet)
                for (var x = 0; x < amount; x++) {
                    privKeys[x] = credentials[0]['credentials'][x]['privateKey'];
                }
                assert.deepEqual(privKeys,
                    [
                        'cPbsmCBdoz9FkvoYQxcM7neaZXKhXDQpWcZRUJZPtjTttWRKFvTQ',
                        'cT9PJkpvFxZZe4CUf8kxZKHuwD6KDwue9qZtyvhPAJuYwLR8oyA6'
                    ]);
            });

            it('P2SH-P2WPKH address [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses([1], bitcoin.networks.bitcoin.p2wpkhInP2sh)
                var address = credentials[0]['credentials'][0]['address'];
                assert.equal(address, '31uAoP3hMQ2rehKnfEFTMJC4tADveRzx6K');
            });

            it('P2SH-P2WPKH privKey [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses([1], bitcoin.networks.bitcoin.p2wpkhInP2sh)
                var privateKey = credentials[0]['credentials'][0]['privateKey'];
                assert.equal(privateKey, 'KxxQTCfkZgBBQYRBJTJr41avZJdQ1fHb7gc1Q1poGvSBdJtUeaR7');
            });

            it('P2SH-P2WPKH address [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses([1], bitcoin.networks.testnet.p2wpkhInP2sh)
                var address = credentials[0]['credentials'][0]['address'];
                assert.equal(address, '2N7oVd4Xq9TfpCWaVHhFNCPQbi4buiLdpyi');
            });

            it('P2SH-P2WPKH privKey [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses([1], bitcoin.networks.testnet.p2wpkhInP2sh)
                var privateKey = credentials[0]['credentials'][0]['privateKey'];
                assert.equal(privateKey, 'cRsGmgKfnAueMA2DJzT29dvMx4cLJ4gMbTK8CRahP4orPeD15caX');
            });

            it('Bech32 address [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses([1], bitcoin.networks.bitcoin.p2wpkh)
                var address = credentials[0]['credentials'][0]['address'];
                assert.equal(address, 'bc1qk6rjegtxrvp7ty2tzd4uj88n33vnc3vqn90ps9');
            });

            it('Bech32 privKey [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses([1], bitcoin.networks.bitcoin.p2wpkh)
                var privateKey = credentials[0]['credentials'][0]['privateKey'];
                assert.equal(privateKey, 'Kzkuno5MDgVcs841HW5HWnSFmZ4xBEjzxNN2FnTv6k7cWMkzkvrc');
            });

            it('Bech32 address [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses([1], bitcoin.networks.testnet.p2wpkh)
                var address = credentials[0]['credentials'][0]['address'];
                assert.equal(address, 'tb1qc45lcycj4upms5v0hzdnhnyq4s09xe7jnsdhtz');
            });

            it('Bech32 privKey [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses([1], bitcoin.networks.testnet.p2wpkh)
                var privateKey = credentials[0]['credentials'][0]['privateKey'];
                assert.equal(privateKey, 'cSoNGp1yv5yJFsUNKJck5TRufjVZ6aCRUu8tQB6X9o8eNa4ZVP1R');
            });

            it('2 accounts with 3 addresses each', function () {
                var amountAccounts = 2;
                var amountAddresses = 3;

                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var credentials = bitcoin.createP2PKHaddresses([3, 3], bitcoin.networks.testnet.p2wpkh)
                var addresses = [];

                for (var accounts = 0; accounts < amountAccounts; accounts++) {
                    for (var x = 0; x < amountAddresses; x++) {
                        addresses.push(credentials[accounts]['credentials'][x]['address']);
                    }
                }

                assert.deepEqual(addresses,
                    [
                        'tb1qc45lcycj4upms5v0hzdnhnyq4s09xe7jnsdhtz',
                        'tb1q2cn8tv0uf3gcl7y3jj4eflddeyk3l3sqm29h2s',
                        'tb1q47ef5s9eyfcyrn5hnsm0p6cdnrld7mvsfjrccm',
                        'tb1qhgaflwwuxauaz7d8lp937nh9kkegatc4pjuq2a',
                        'tb1qgds0hznpnfg33nytttaaea6x54yjk6jg60530q',
                        'tb1qxkhq30zjdfx6xvw55d2pql638pzx4lm044npug'
                    ]);
            });
        });
    });
}

module.exports = {
    bitcoinJStests
}