var bip38 = require('./bip38encryption');

function encrypt(input) {
    return bip38.encryptPrivKey(input.privateKey, input.password, input.address);
}

function decrypt(input) {
    try{
        return JSON.stringify(bip38.decryptPrivKey(input.privateKey, input.password));
    } catch (e) {
        console.log('%c' + 'Error while trying to decrypt private key: ' + e.message, 'color: #FF0000;');
        return 'error';
    }
}

onmessage = function(e) {

    var input = JSON.parse(e.data);

    switch(input.mode) {
        case 'encrypt':
            self.postMessage(encrypt(input));
            break;
        case 'decrypt':
            self.postMessage(decrypt(input));
            break;
        default:
            self.postMessage('wrong encryption mode');
            break;
    }
};