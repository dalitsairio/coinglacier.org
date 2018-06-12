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
    describe('BitcoinJS tests', function () {

        this.timeout(30000); // all tests may take up to 30 seconds
        this.slow(3000); // a test is considered slow if it takes more than 3 seconds to complete

        describe('Initiating HD wallet', function () {
            describe('Unencrypted seed', function () {

                it('Return new 12 word mnemonic', function () {
                    bitcoin.initiateHDWallet(false, false, false, function (mnemonic) {
                        var mnemonic_array = mnemonic.split(' ');
                        assert.equal(mnemonic_array.length, 12);
                    });
                });

                it('Return given 12 word mnemonic', function () {
                    bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic) {
                        assert.equal(mnemonic, testing_mnemonic);
                    });
                });
            });
            describe('Encrypted seed', function () {

                it('Return new 12 word mnemonic', function () {
                    bitcoin.initiateHDWallet(false, testing_password, false, function (mnemonic) {
                        var mnemonic_array = mnemonic.split(' ');
                        assert.equal(mnemonic_array.length, 12);
                    });
                });

                it('Return given 12 word mnemonic', function () {
                    bitcoin.initiateHDWallet(testing_mnemonic, testing_password, false, function (mnemonic) {
                        assert.equal(mnemonic, testing_mnemonic);
                    });
                });

            });
        });

        // see https://github.com/spesmilo/electrum-docs/blob/0821640adeda072fec1ee4ccfe74a0e47803f4cb/xpub_version_bytes.rst
        describe('Extended public key', function () {
            describe('New mnemonic', function () {
                it('Returns xpub', function () {
                    bitcoin.initiateHDWallet(false, false, false, function (mnemonic, bip32RootKey) {
                        var account = bitcoin.createAccount(bip32RootKey, MAINNET_NONSEGWIT, 0);

                        assert.equal(account.xpub.substring(0, 4), 'xpub');
                    });
                });
                it('Returns ypub', function () {
                    bitcoin.initiateHDWallet(false, false, false, function (mnemonic, bip32RootKey) {
                        var account = bitcoin.createAccount(bip32RootKey, MAINNET_SEGWIT, 0);

                        assert.equal(account.xpub.substring(0, 4), 'ypub');
                    });
                });
                it('Returns zpub', function () {
                    bitcoin.initiateHDWallet(false, false, false, function (mnemonic, bip32RootKey) {
                        var account = bitcoin.createAccount(bip32RootKey, MAINNET_BECH32, 0);

                        assert.equal(account.xpub.substring(0, 4), 'zpub');
                    });
                });
                it('Returns tpub', function () {
                    bitcoin.initiateHDWallet(false, false, false, function (mnemonic, bip32RootKey) {
                        var account = bitcoin.createAccount(bip32RootKey, TESTNET_NONSEGWIT, 0);

                        assert.equal(account.xpub.substring(0, 4), 'tpub');
                    });
                });
                it('Returns upub', function () {
                    bitcoin.initiateHDWallet(false, false, false, function (mnemonic, bip32RootKey) {
                        var account = bitcoin.createAccount(bip32RootKey, TESTNET_SEGWIT, 0);

                        assert.equal(account.xpub.substring(0, 4), 'upub');
                    });
                });
                it('Returns vpub', function () {
                    bitcoin.initiateHDWallet(false, false, false, function (mnemonic, bip32RootKey) {
                        var account = bitcoin.createAccount(bip32RootKey, TESTNET_BECH32, 0);

                        assert.equal(account.xpub.substring(0, 4), 'vpub');
                    });
                });
            });
            describe('Given mnemonic', function () {
                it('Returns XPUB [Non-Segwit]', function () {
                    bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                        var account = bitcoin.createAccount(bip32RootKey, MAINNET_NONSEGWIT, 0);

                        var expected = 'xpub6BgB4HXnJs3gV9t9r4LB6ZXmwbawUEZSwFcCHZC3K3yEN4Lmtzg8bBSpriKgHJLS9Jufgym9osUAVHvyMYdQ82zMzp3voYFbgfUYvq9XhCD';

                        assert.equal(account.xpub, expected);
                    });
                });
                it('Returns YPUB [P2SH-P2WPKH]', function () {
                    bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                        var account = bitcoin.createAccount(bip32RootKey, MAINNET_SEGWIT, 0);

                        var expected = 'ypub6Xvc2hTW5ziP5tApCAFBM9JeyuriZ8SQ3GZfpdneEueDmmhUYgbqtzDub34jqwKAEe9YNwgKD7mBpBfbh1g6Mt5b3xtcczuZXNeu5Q5yJp8';

                        assert.equal(account.xpub, expected);
                    });
                });
                it('Returns ZPUB [Bech32, 2nd account]', function () {
                    bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                        var account = bitcoin.createAccount(bip32RootKey, MAINNET_BECH32, 1);

                        var expected = 'zpub6s7a2Y5RyxmLZLRMD79crfAeXuwXvChc5MRU5WvipdJHZG84Z1en4LGJCmMVLzYYRprAWShdKgcqPjr3kBuDLPj57j2XA44HaREZ4HMfFHw';

                        assert.equal(account.xpub, expected);
                    });
                });
            });

        });

        describe('Retrieve from mnemonic', function () {

            it('Non-Segwit address [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, MAINNET_NONSEGWIT, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);

                    assert.equal(credentials.address, '16C6UYcvPuiY4nHMbdSFAXgB2QEyxjr8Jx');
                });
            });

            it('Non-Segwit privKey [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, MAINNET_NONSEGWIT, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);

                    assert.equal(credentials.privateKey, 'L2THPE6rBFZBqe1qsXAZvjHwNe1UP3PCePPLsdCv9WxpoeQuXsAd');
                });
            });

            it('3 non-Segwit addresses [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, TESTNET_NONSEGWIT, 0);

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
            });

            it('2 non-Segwit privKeys [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, TESTNET_NONSEGWIT, 0);

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
            });

            it('P2SH-P2WPKH address [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, MAINNET_SEGWIT, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);

                    assert.equal(credentials.address, '31uAoP3hMQ2rehKnfEFTMJC4tADveRzx6K');
                });
            });

            it('P2SH-P2WPKH privKey [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, MAINNET_SEGWIT, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);

                    assert.equal(credentials.privateKey, 'KxxQTCfkZgBBQYRBJTJr41avZJdQ1fHb7gc1Q1poGvSBdJtUeaR7');
                });
            });

            it('P2SH-P2WPKH address [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, TESTNET_SEGWIT, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);

                    assert.equal(credentials.address, '2N7oVd4Xq9TfpCWaVHhFNCPQbi4buiLdpyi');
                });
            });

            it('P2SH-P2WPKH privKey [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, TESTNET_SEGWIT, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);

                    assert.equal(credentials.privateKey, 'cRsGmgKfnAueMA2DJzT29dvMx4cLJ4gMbTK8CRahP4orPeD15caX');
                });
            });

            it('Bech32 address [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, MAINNET_BECH32, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);

                    assert.equal(credentials.address, 'bc1qk6rjegtxrvp7ty2tzd4uj88n33vnc3vqn90ps9');
                });
            });

            it('Bech32 privKey [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, MAINNET_BECH32, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);

                    assert.equal(credentials.privateKey, 'Kzkuno5MDgVcs841HW5HWnSFmZ4xBEjzxNN2FnTv6k7cWMkzkvrc');
                });
            });

            it('Bech32 address [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, TESTNET_BECH32, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);

                    assert.equal(credentials.address, 'tb1qc45lcycj4upms5v0hzdnhnyq4s09xe7jnsdhtz');
                });
            });

            it('Bech32 privKey [testnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, TESTNET_BECH32, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);

                    assert.equal(credentials.privateKey, 'cSoNGp1yv5yJFsUNKJck5TRufjVZ6aCRUu8tQB6X9o8eNa4ZVP1R');
                });
            });

            it('2 accounts with 3 addresses each', function () {
                var amountAccounts = 2;
                var amountAddresses = 3;

                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {

                    var addresses = [];

                    for (var accIndex = 0; accIndex < amountAccounts; accIndex++) {
                        var account = bitcoin.createAccount(bip32RootKey, TESTNET_BECH32, accIndex);
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
            });

            it('Password Encrypted Mnemonic', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, testing_password, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, MAINNET_BECH32, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);

                    assert.equal(credentials.privateKey, 'L38Umd9kZNjeo98PFbpzaSfpuyREBc1rzBiyHBqQUXkjrysVyDi5');
                });
            });
        });

        describe('Retrieve from encrypted mnemonic', function () {

            it('P2SH-P2WPKH address [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, testing_password, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, MAINNET_SEGWIT, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);

                    assert.equal(credentials.address, '38799cavJvtfpkK55bsyPGMgQGUfY2EeVW');
                });
            });

            it('P2SH-P2WPKH privKey [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, testing_password, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, MAINNET_SEGWIT, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);

                    assert.equal(credentials.privateKey, 'KyYUc3DRDc4Qi9F1RZf7bVQVfKxZQAp8Se9KeGenpdT8Favounei');
                });
            });

            it('Bech32 address [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, testing_password, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, MAINNET_BECH32, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);

                    assert.equal(credentials.address, 'bc1qwvffxlvr7vhg54gtuarm3w4sv9mmsqmtjqq3x4');
                });
            });

            it('Bech32 privKey [mainnet]', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, testing_password, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, MAINNET_BECH32, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);

                    assert.equal(credentials.privateKey, 'L38Umd9kZNjeo98PFbpzaSfpuyREBc1rzBiyHBqQUXkjrysVyDi5');
                });
            });
        });
        describe('More-Entropy feature', function () {
            it('Initiate unencrypted HD wallet', function (done) {
                bitcoin.initiateHDWallet(false, false, true, function (mnemonic) {
                    var mnemonic_array = mnemonic.split(' ');
                    assert.equal(mnemonic_array.length, 12);
                    done();
                });
            });

            it('Initiate encrypted HD wallet', function (done) {
                bitcoin.initiateHDWallet(false, testing_password, true, function (mnemonic) {
                    var mnemonic_array = mnemonic.split(' ');
                    assert.equal(mnemonic_array.length, 12);
                    done();
                });
            });
        });
    });
}

function bip38Tests() {
    describe('BIP38 tests', function () {

    this.timeout(50000); // all tests may take up to 50 seconds
    this.slow(25000); // a test is considered slow if it takes more than 25 seconds to complete

        describe('Mainnet', function () {

            it('Encrpyt Privkey and Mnemonic', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, testing_password, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, MAINNET_NONSEGWIT, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);
                    var encryptedPrivKey = bip38.encryptPrivKey(credentials.privateKey, testing_password, credentials.address);

                    assert.equal(encryptedPrivKey, '6PYW2432QXPUg4PQRUCBNicekqdicAeAX1gjaPa3qLr736HnqXq59Lxxp9');
                });
            });

            it('Encrypt Non-Segwit PrivKey', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, MAINNET_NONSEGWIT, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);
                    var encryptedPrivKey = bip38.encryptPrivKey(credentials.privateKey, testing_password, credentials.address);

                    assert.equal(encryptedPrivKey, '6PYKxTcTV5sADexbXMKZQE5MbwYTorHmv79BaycQQv8kJSMTdxSC7z9iAq');
                });
            });

            it('Decrypt Non-Segwit PrivKey', function () {
                var encryptedPrivKey = '6PYW2432QXPUg4PQRUCBNicekqdicAeAX1gjaPa3qLr736HnqXq59Lxxp9';
                var result = bip38.decryptPrivKey(encryptedPrivKey, testing_password);
                var decrypted = result.mainnet;

                var credentials = bitcoin.getCredentialsFromPrivKeyAndSalt(decrypted.privateKey, decrypted.salt);

                assert.deepEqual(credentials, {
                    address: '1HMQsNfFrLkx9kfeBxpSq65LY3cgamGQnu',
                    privateKey: 'L4g7NjUmXosFyEWUFGqNHvAPD3jXsXDXfohLvY4jqKCn8tJVbh3h'
                });
            });

            it('Encrypt Segwit PrivKey', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, MAINNET_SEGWIT, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);
                    var encryptedPrivKey = bip38.encryptPrivKey(credentials.privateKey, testing_password, credentials.address);

                    assert.equal(encryptedPrivKey, '6PYPe7vMDwxV4op89scq8rmFwBFeePcWXPRaPSGLbdn5MKbdaX6GnLHrtA');
                });
            });

            it('Decrypt Segwit PrivKey', function () {
                var encryptedPrivKey = '6PYPe7vMDwxV4op89scq8rmFwBFeePcWXPRaPSGLbdn5MKbdaX6GnLHrtA';
                var result = bip38.decryptPrivKey(encryptedPrivKey, testing_password);
                var decrypted = result.mainnet;

                var credentials = bitcoin.getCredentialsFromPrivKeyAndSalt(decrypted.privateKey, decrypted.salt);

                assert.deepEqual(credentials, {
                    address: '31uAoP3hMQ2rehKnfEFTMJC4tADveRzx6K',
                    privateKey: 'KxxQTCfkZgBBQYRBJTJr41avZJdQ1fHb7gc1Q1poGvSBdJtUeaR7'
                });
            });

            it('Encrypt Bech32 PrivKey', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, MAINNET_BECH32, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);
                    var encryptedPrivKey = bip38.encryptPrivKey(credentials.privateKey, testing_password, credentials.address);

                    assert.equal(encryptedPrivKey, '6PYVPoKcHSKQT1ZGvjPQzwsKAM3vLfwNXZdFMZ3vUq7szz72GDwtyRtori');
                });
            });

            it('Decrypt Bech32 PrivKey', function () {
                var encryptedPrivKey = '6PYVPoKcHSKQT1ZGvjPQzwsKAM3vLfwNXZdFMZ3vUq7szz72GDwtyRtori';
                var result = bip38.decryptPrivKey(encryptedPrivKey, testing_password);
                var decrypted = result.mainnet;

                var credentials = bitcoin.getCredentialsFromPrivKeyAndSalt(decrypted.privateKey, decrypted.salt);

                assert.deepEqual(credentials, {
                    address: 'bc1qk6rjegtxrvp7ty2tzd4uj88n33vnc3vqn90ps9',
                    privateKey: 'Kzkuno5MDgVcs841HW5HWnSFmZ4xBEjzxNN2FnTv6k7cWMkzkvrc'
                });
            });
        });

        describe('Testnet', function () {

            it('Encrpyt Privkey and Mnemonic', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, testing_password, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, TESTNET_NONSEGWIT, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);
                    var encryptedPrivKey = bip38.encryptPrivKey(credentials.privateKey, testing_password, credentials.address);

                    assert.equal(encryptedPrivKey, '6PYSUdTaGFR5geTNFBALJyDcGr59ySSCPbGaa1TCP9djEFb8MehyjfoV1R');
                });
            });

            it('Encrypt Non-Segwit PrivKey', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, TESTNET_NONSEGWIT, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);
                    var encryptedPrivKey = bip38.encryptPrivKey(credentials.privateKey, testing_password, credentials.address);

                    assert.equal(encryptedPrivKey, '6PYShLJQxTbgRXSMyBTwQJyac6xdzCtEdZG4VnZLa6JYVtwGR5McqrAiq9');
                });
            });

            it('Decrypt Non-Segwit PrivKey', function () {
                var encryptedPrivKey = '6PYSUdTaGFR5geTNFBALJyDcGr59ySSCPbGaa1TCP9djEFb8MehyjfoV1R';
                var result = bip38.decryptPrivKey(encryptedPrivKey, testing_password);
                var decrypted = result.testnet;

                var credentials = bitcoin.getCredentialsFromPrivKeyAndSalt(decrypted.privateKey, decrypted.salt, true);

                assert.deepEqual(credentials, {
                    address: 'n3VaxebYQ8BYVh1EoCKUaFKEsz3WytSEzV',
                    privateKey: 'cSwsK2UDrt7WYbn2WHdfsEzrjRUWsS5onhd58Pm2B43PnkpCDRTS'
                });
            });

            it('Encrypt Segwit PrivKey', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, TESTNET_SEGWIT, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);
                    var encryptedPrivKey = bip38.encryptPrivKey(credentials.privateKey, testing_password, credentials.address);

                    assert.equal(encryptedPrivKey, '6PYTcVFnQv31t1ZBV7dGGSUbicxcu1C5fMJRUeTkZzAbnQgoRALAzBThr2');
                });
            });

            it('Decrypt Segwit PrivKey', function () {
                var encryptedPrivKey = '6PYTcVFnQv31t1ZBV7dGGSUbicxcu1C5fMJRUeTkZzAbnQgoRALAzBThr2';
                var result = bip38.decryptPrivKey(encryptedPrivKey, testing_password);
                var decrypted = result.testnet;

                var credentials = bitcoin.getCredentialsFromPrivKeyAndSalt(decrypted.privateKey, decrypted.salt, true);

                assert.deepEqual(credentials, {
                    address: '2N7oVd4Xq9TfpCWaVHhFNCPQbi4buiLdpyi',
                    privateKey: 'cRsGmgKfnAueMA2DJzT29dvMx4cLJ4gMbTK8CRahP4orPeD15caX'
                });
            });

            it('Encrypt Bech32 PrivKey', function () {
                // load testing mnemonic
                bitcoin.initiateHDWallet(testing_mnemonic, false, false, function (mnemonic, bip32RootKey) {
                    var account = bitcoin.createAccount(bip32RootKey, TESTNET_BECH32, 0);
                    var credentials = bitcoin.createCredentials(account.external, 0);
                    var encryptedPrivKey = bip38.encryptPrivKey(credentials.privateKey, testing_password, credentials.address);

                    assert.equal(encryptedPrivKey, '6PYQPgWyGk2BfURMJ8uiESrcNPWvm2JuB95ouys71YsKXEL4SwQQTjTM35');
                });
            });

            it('Decrypt Bech32 PrivKey', function () {
                var encryptedPrivKey = '6PYQPgWyGk2BfURMJ8uiESrcNPWvm2JuB95ouys71YsKXEL4SwQQTjTM35';
                var result = bip38.decryptPrivKey(encryptedPrivKey, testing_password);
                var decrypted = result.testnet;

                var credentials = bitcoin.getCredentialsFromPrivKeyAndSalt(decrypted.privateKey, decrypted.salt, true);

                assert.deepEqual(credentials, {
                    address: 'tb1qc45lcycj4upms5v0hzdnhnyq4s09xe7jnsdhtz',
                    privateKey: 'cSoNGp1yv5yJFsUNKJck5TRufjVZ6aCRUu8tQB6X9o8eNa4ZVP1R'
                });
            });
        });
    });
}

module.exports = {
    bitcoinJStests: bitcoinJStests,
    bip38Tests: bip38Tests
}