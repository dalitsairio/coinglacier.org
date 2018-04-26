const assert = require('chai').assert;
const bitcoin = require('../src/js/bitcoin');
const bip38 = require('../src/js/bip38encryption');


const MAINNET_NONSEGWIT = bitcoin.networks.bitcoin.id; // 0
const MAINNET_SEGWIT = bitcoin.networks.bitcoin.p2wpkhInP2sh.id; // 1
const MAINNET_BECH32 = bitcoin.networks.bitcoin.p2wpkh.id; // 2
const TESTNET_NONSEGWIT = bitcoin.networks.testnet.id; // 10
const TESTNET_SEGWIT = bitcoin.networks.testnet.p2wpkhInP2sh.id; // 11
const TESTNET_BECH32 = bitcoin.networks.testnet.p2wpkh.id; // 12

const testing_mnemonic = 'curve swear maze domain knock frozen ordinary climb love possible brave market';
const testing_password = 'MoonLambo';

function bitcoinJStests() {
    describe('BitcoinJS', function () {

        this.timeout(20000); // all tests may take up to 20 seconds
        this.slow(3000); // a test is considered slow if it takes more than 3 seconds to completes

        describe('Initiating HD wallet', function () {
            describe('Unencrypted seed', function () {

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
            describe('Encrypted seed', function () {

                it('Return new 12 word mnemonic', function () {
                    var mnemonic = bitcoin.initiateHDWallet(false, testing_password);
                    var mnemonic_array = mnemonic.split(' ');
                    assert.equal(mnemonic_array.length, 12);
                });

                it('Return given 12 word mnemonic', function () {
                    var mnemonic = bitcoin.initiateHDWallet(testing_mnemonic, testing_password);
                    assert.equal(mnemonic, testing_mnemonic);
                });

            });
        });

        // see https://github.com/spesmilo/electrum-docs/blob/0821640adeda072fec1ee4ccfe74a0e47803f4cb/xpub_version_bytes.rst
        describe('Extended public key', function () {
            describe('New mnemonic', function () {
                it('Returns xpub', function () {
                    bitcoin.initiateHDWallet();
                    var account = bitcoin.createAccount(MAINNET_NONSEGWIT, 0);

                    assert.equal(account.xpub.substring(0, 4), 'xpub');
                });
                it('Returns ypub', function () {
                    bitcoin.initiateHDWallet();
                    var account = bitcoin.createAccount(MAINNET_SEGWIT, 0);

                    assert.equal(account.xpub.substring(0, 4), 'ypub');
                });
                it('Returns zpub', function () {
                    bitcoin.initiateHDWallet();
                    var account = bitcoin.createAccount(MAINNET_BECH32, 0);

                    assert.equal(account.xpub.substring(0, 4), 'zpub');
                });
                it('Returns tpub', function () {
                    bitcoin.initiateHDWallet();
                    var account = bitcoin.createAccount(TESTNET_NONSEGWIT, 0);

                    assert.equal(account.xpub.substring(0, 4), 'tpub');
                });
                it('Returns upub', function () {
                    bitcoin.initiateHDWallet();
                    var account = bitcoin.createAccount(TESTNET_SEGWIT, 0);

                    assert.equal(account.xpub.substring(0, 4), 'upub');
                });
                it('Returns vpub', function () {
                    bitcoin.initiateHDWallet();
                    var account = bitcoin.createAccount(TESTNET_BECH32, 0);

                    assert.equal(account.xpub.substring(0, 4), 'vpub');
                });
            });
            describe('Given mnemonic', function () {
                it('Returns XPUB [Non-Segwit]', function () {
                    bitcoin.initiateHDWallet(testing_mnemonic);
                    var account = bitcoin.createAccount(MAINNET_NONSEGWIT, 0);

                    var expected = 'xpub6BgB4HXnJs3gV9t9r4LB6ZXmwbawUEZSwFcCHZC3K3yEN4Lmtzg8bBSpriKgHJLS9Jufgym9osUAVHvyMYdQ82zMzp3voYFbgfUYvq9XhCD';

                    assert.equal(account.xpub, expected);
                });
                it('Returns YPUB [P2SH-P2WPKH]', function () {
                    bitcoin.initiateHDWallet(testing_mnemonic);
                    var account = bitcoin.createAccount(MAINNET_SEGWIT, 0);

                    var expected = 'ypub6Xvc2hTW5ziP5tApCAFBM9JeyuriZ8SQ3GZfpdneEueDmmhUYgbqtzDub34jqwKAEe9YNwgKD7mBpBfbh1g6Mt5b3xtcczuZXNeu5Q5yJp8';

                    assert.equal(account.xpub, expected);
                });
                it('Returns ZPUB [Bech32, 2nd account]', function () {
                    bitcoin.initiateHDWallet(testing_mnemonic);
                    var account = bitcoin.createAccount(MAINNET_BECH32, 1);

                    var expected = 'zpub6s7a2Y5RyxmLZLRMD79crfAeXuwXvChc5MRU5WvipdJHZG84Z1en4LGJCmMVLzYYRprAWShdKgcqPjr3kBuDLPj57j2XA44HaREZ4HMfFHw';

                    assert.equal(account.xpub, expected);
                });
            });

        });

        describe('Retrieve from mnemonic', function () {

            it('Non-Segwit address [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);
                var account = bitcoin.createAccount(MAINNET_NONSEGWIT, 0);
                var credentials = bitcoin.createCredentials(account.external, 0);

                assert.equal(credentials.address, '16C6UYcvPuiY4nHMbdSFAXgB2QEyxjr8Jx');
            });

            it('Non-Segwit privKey [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);
                var account = bitcoin.createAccount(MAINNET_NONSEGWIT, 0);
                var credentials = bitcoin.createCredentials(account.external, 0);

                assert.equal(credentials.privateKey, 'L2THPE6rBFZBqe1qsXAZvjHwNe1UP3PCePPLsdCv9WxpoeQuXsAd');
            });

            it('3 non-Segwit addresses [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);
                var account = bitcoin.createAccount(TESTNET_NONSEGWIT, 0);

                var amount = 3;
                var addresses = [];

                for (var x = 0; x < amount; x++) {
                    addresses[x] = bitcoin.createCredentials(account.external, x).address;
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
                var account = bitcoin.createAccount(TESTNET_NONSEGWIT, 0);

                var amount = 2;
                var privKeys = [];

                for (var x = 0; x < amount; x++) {
                    privKeys[x] = bitcoin.createCredentials(account.external, x).privateKey;
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
                var account = bitcoin.createAccount(MAINNET_SEGWIT, 0);
                var credentials = bitcoin.createCredentials(account.external, 0);

                assert.equal(credentials.address, '31uAoP3hMQ2rehKnfEFTMJC4tADveRzx6K');
            });

            it('P2SH-P2WPKH privKey [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);
                var account = bitcoin.createAccount(MAINNET_SEGWIT, 0);
                var credentials = bitcoin.createCredentials(account.external, 0);

                assert.equal(credentials.privateKey, 'KxxQTCfkZgBBQYRBJTJr41avZJdQ1fHb7gc1Q1poGvSBdJtUeaR7');
            });

            it('P2SH-P2WPKH address [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);
                var account = bitcoin.createAccount(TESTNET_SEGWIT, 0);
                var credentials = bitcoin.createCredentials(account.external, 0);

                assert.equal(credentials.address, '2N7oVd4Xq9TfpCWaVHhFNCPQbi4buiLdpyi');
            });

            it('P2SH-P2WPKH privKey [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);
                var account = bitcoin.createAccount(TESTNET_SEGWIT, 0);
                var credentials = bitcoin.createCredentials(account.external, 0);

                assert.equal(credentials.privateKey, 'cRsGmgKfnAueMA2DJzT29dvMx4cLJ4gMbTK8CRahP4orPeD15caX');
            });

            it('Bech32 address [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);
                var account = bitcoin.createAccount(MAINNET_BECH32, 0);
                var credentials = bitcoin.createCredentials(account.external, 0);

                assert.equal(credentials.address, 'bc1qk6rjegtxrvp7ty2tzd4uj88n33vnc3vqn90ps9');
            });

            it('Bech32 privKey [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);
                var account = bitcoin.createAccount(MAINNET_BECH32, 0);
                var credentials = bitcoin.createCredentials(account.external, 0);

                assert.equal(credentials.privateKey, 'Kzkuno5MDgVcs841HW5HWnSFmZ4xBEjzxNN2FnTv6k7cWMkzkvrc');
            });

            it('Bech32 address [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);
                var account = bitcoin.createAccount(TESTNET_BECH32, 0);
                var credentials = bitcoin.createCredentials(account.external, 0);

                assert.equal(credentials.address, 'tb1qc45lcycj4upms5v0hzdnhnyq4s09xe7jnsdhtz');
            });

            it('Bech32 privKey [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);
                var account = bitcoin.createAccount(TESTNET_BECH32, 0);
                var credentials = bitcoin.createCredentials(account.external, 0);

                assert.equal(credentials.privateKey, 'cSoNGp1yv5yJFsUNKJck5TRufjVZ6aCRUu8tQB6X9o8eNa4ZVP1R');
            });

            it('2 accounts with 3 addresses each', function () {
                var amountAccounts = 2;
                var amountAddresses = 3;

                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);

                var addresses = [];

                for (var accIndex = 0; accIndex < amountAccounts; accIndex++) {
                    var account = bitcoin.createAccount(TESTNET_BECH32, accIndex);
                    for (var addressIndex = 0; addressIndex < amountAddresses; addressIndex++) {
                        addresses.push(bitcoin.createCredentials(account.external, addressIndex).address);
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

            it('Password Encrypted Mnemonic', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, testing_password);
                var account = bitcoin.createAccount(MAINNET_BECH32, 0);
                var credentials = bitcoin.createCredentials(account.external, 0);

                assert.equal(credentials.privateKey, 'L38Umd9kZNjeo98PFbpzaSfpuyREBc1rzBiyHBqQUXkjrysVyDi5');
            });

            it('BIP38 Encrypted PrivKey', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic);
                var account = bitcoin.createAccount(MAINNET_BECH32, 0);
                var credentials = bitcoin.createCredentials(account.external, 0);
                var encryptedPrivKey = bip38.encryptPrivKey(credentials.privateKey, testing_password);

                assert.equal(encryptedPrivKey, '6PYUjuUte84KiL2kFzuCNTven4WkdRFXmeMGGCVzDkpR1AcTBhLn2jMdoo');
            });

            it('BIP38 and Mnemonic Encryption', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, testing_password);
                var account = bitcoin.createAccount(MAINNET_BECH32, 0);
                var credentials = bitcoin.createCredentials(account.external, 0);
                var encryptedPrivKey = bip38.encryptPrivKey(credentials.privateKey, testing_password);

                assert.equal(encryptedPrivKey, '6PYSqLAHxW8CT2sBYVjaZZKJ6yes2itBcvk5WHmsNysTkzM8Z62DZntKYc');




                // // load testing mnemonic
                // bitcoin.initiateHDWallet(testing_mnemonic, testing_password);
                //
                // var credentials = bitcoin.createP2PKHaddresses([1], bitcoin.networks.bitcoin.p2wpkh, testing_password);
                // var privateKey = credentials[0]['credentials'][0]['privateKey'];
                // assert.equal(privateKey, '6PYSqLAHxW8CT2sBYVjaZZKJ6yes2itBcvk5WHmsNysTkzM8Z62DZntKYc');
            });
        });

        describe('Retrieve from encrypted mnemonic', function () {

            it('P2SH-P2WPKH address [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, testing_password);
                var account = bitcoin.createAccount(MAINNET_SEGWIT, 0);
                var credentials = bitcoin.createCredentials(account.external, 0);

                assert.equal(credentials.address, '38799cavJvtfpkK55bsyPGMgQGUfY2EeVW');
            });

            it('P2SH-P2WPKH privKey [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, testing_password);
                var account = bitcoin.createAccount(MAINNET_SEGWIT, 0);
                var credentials = bitcoin.createCredentials(account.external, 0);

                assert.equal(credentials.privateKey, 'KyYUc3DRDc4Qi9F1RZf7bVQVfKxZQAp8Se9KeGenpdT8Favounei');
            });

            it('Bech32 address [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, testing_password);
                var account = bitcoin.createAccount(MAINNET_BECH32, 0);
                var credentials = bitcoin.createCredentials(account.external, 0);

                assert.equal(credentials.address, 'bc1qwvffxlvr7vhg54gtuarm3w4sv9mmsqmtjqq3x4');
            });

            it('Bech32 privKey [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, testing_password);
                var account = bitcoin.createAccount(MAINNET_BECH32, 0);
                var credentials = bitcoin.createCredentials(account.external, 0);

                assert.equal(credentials.privateKey, 'L38Umd9kZNjeo98PFbpzaSfpuyREBc1rzBiyHBqQUXkjrysVyDi5');
            });
        });
    });
}

module.exports = {
    bitcoinJStests
}