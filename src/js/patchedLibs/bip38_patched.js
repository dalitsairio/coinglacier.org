/*

VERY DIRTY PATCH

The BIP32 standard needs to know the address belonging to the encrypted private key, since it uses it as a salt:
"4 bytes: SHA256(SHA256(expected_bitcoin_address))[0...3], used both for typo checking and as salt"
(https://github.com/bitcoin/bips/blob/master/bip-0038.mediawiki#Proposed_specification)

However, this library only supports standard Bitcoin addresses (beginning with 1) so far.
This should hopefully be fixed with version 3.0 (https://github.com/bitcoinjs/bip38/issues/20)

Until then, this file serves as a patch for the library, to allow all for providing the target address as a parameter.

--------------------

For this coinglacier.org, the support of the following address types is vital:

+---------+--------------+--------------+
| Network | Address Type | Prefix (Hex) |
+---------+--------------+--------------+
| Mainnet | Non-Segwit   | 0x00         |
| Mainnet | Segwit       | 0x05         |
| Mainnet | Bech32       | 0x6f         |
| Testnet | Non-Segwit   | 0x6F         |
| Testnet | Segwit       | 0xC4         |
| Testnet | Bech32       | 0x6f         |
+---------+--------------+--------------+

More details here: https://en.bitcoin.it/wiki/List_of_address_prefixes
And here https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki

 */
var aes = require('browserify-aes')
// var assert = require('assert')
var Buffer = require('safe-buffer').Buffer
var bs58check = require('bs58check')
var createHash = require('create-hash')
var scrypt = require('scryptsy')
var xor = require('buffer-xor/inplace')

var ecurve = require('ecurve')
// var curve = ecurve.getCurveByName('secp256k1')

// var BigInteger = require('bigi')

var bip38 = require('bip38')

// constants
var SCRYPT_PARAMS = {
    N: 16384, // specified by BIP38
    r: 8,
    p: 8
}
var NULL = Buffer.alloc(0);


// function hash160 (buffer) {
//     return createHash('rmd160').update(
//         createHash('sha256').update(buffer).digest()
//     ).digest()
// }

function hash256 (buffer) {
    return createHash('sha256').update(
        createHash('sha256').update(buffer).digest()
    ).digest()
}

function encryptRaw (address, buffer, compressed, passphrase, progressCallback, scryptParams) {
    if (buffer.length !== 32) throw new Error('Invalid private key length')
    scryptParams = scryptParams || SCRYPT_PARAMS

    // var d = BigInteger.fromBuffer(buffer)
    // var address = getAddress(d, compressed)
    var secret = Buffer.from(passphrase, 'utf8')
    var salt = hash256(address).slice(0, 4)

    var N = scryptParams.N
    var r = scryptParams.r
    var p = scryptParams.p

    var scryptBuf = scrypt(secret, salt, N, r, p, 64, progressCallback)
    var derivedHalf1 = scryptBuf.slice(0, 32)
    var derivedHalf2 = scryptBuf.slice(32, 64)

    var xorBuf = xor(derivedHalf1, buffer)
    var cipher = aes.createCipheriv('aes-256-ecb', derivedHalf2, NULL)
    cipher.setAutoPadding(false)
    cipher.end(xorBuf)

    var cipherText = cipher.read()

    // 0x01 | 0x42 | flagByte | salt (4) | cipherText (32)
    var result = Buffer.allocUnsafe(7 + 32)
    result.writeUInt8(0x01, 0)
    result.writeUInt8(0x42, 1)
    result.writeUInt8(compressed ? 0xe0 : 0xc0, 2)
    salt.copy(result, 3)
    cipherText.copy(result, 7)

    return result
}

function encrypt (targetAddress, buffer, compressed, passphrase, progressCallback, scryptParams) {
    return bs58check.encode(encryptRaw(targetAddress, buffer, compressed, passphrase, progressCallback, scryptParams))
}

// some of the techniques borrowed from: https://github.com/pointbiz/bitaddress.org
function decryptRaw (buffer, passphrase, progressCallback, scryptParams) {
    // 39 bytes: 2 bytes prefix, 37 bytes payload
    if (buffer.length !== 39) throw new Error('Invalid BIP38 data length')
    if (buffer.readUInt8(0) !== 0x01) throw new Error('Invalid BIP38 prefix')
    scryptParams = scryptParams || SCRYPT_PARAMS

    // check if BIP38 EC multiply
    var type = buffer.readUInt8(1)
    if (type === 0x43) return decryptECMult(buffer, passphrase, progressCallback, scryptParams)
    if (type !== 0x42) throw new Error('Invalid BIP38 type')

    passphrase = Buffer.from(passphrase, 'utf8')

    var flagByte = buffer.readUInt8(2)
    var compressed = flagByte === 0xe0
    if (!compressed && flagByte !== 0xc0) throw new Error('Invalid BIP38 compression flag')

    var N = scryptParams.N
    var r = scryptParams.r
    var p = scryptParams.p

    var salt = buffer.slice(3, 7)
    var scryptBuf = scrypt(passphrase, salt, N, r, p, 64, progressCallback)
    var derivedHalf1 = scryptBuf.slice(0, 32)
    var derivedHalf2 = scryptBuf.slice(32, 64)

    var privKeyBuf = buffer.slice(7, 7 + 32)
    var decipher = aes.createDecipheriv('aes-256-ecb', derivedHalf2, NULL)
    decipher.setAutoPadding(false)
    decipher.end(privKeyBuf)

    var plainText = decipher.read()
    var privateKey = xor(derivedHalf1, plainText)


    // VERIFYING IS DONE IN FILE BITCOIN.JS

    // verify salt matches address
    // var d = BigInteger.fromBuffer(privateKey)
    // var address = getAddress(d, compressed)

    // var checksum = hash256(address).slice(0, 4)
    // assert.deepEqual(salt, checksum)

    return {
        privateKey: privateKey,
        compressed: compressed,
        salt: salt
    }
}

function decrypt (string, passphrase, progressCallback, scryptParams) {
    return decryptRaw(bs58check.decode(string), passphrase, progressCallback, scryptParams)
}

module.exports = {
    decrypt: decrypt,
    decryptRaw: decryptRaw,
    encrypt: encrypt,
    encryptRaw: encryptRaw
}

