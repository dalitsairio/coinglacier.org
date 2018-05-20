var bip38 = require('./bip38encryption');

onmessage = function(e) {

    var input = JSON.parse(e.data);

    switch(input.mode) {
        case 'encrypt':
            self.postMessage(bip38.encryptPrivKey(input.privateKey, input.password, input.address));
            break;
        case 'decrypt':
            var response;

            try{
                response = JSON.stringify(bip38.decryptPrivKey(input.privateKey, input.password));
            } catch (e) {
                console.log('%c' + 'Error while trying to decrypt private key: ' + e.message, 'color: #FF0000;');
                response = 'error';
            }

            self.postMessage(response);

            break;
        default:
            self.postMessage('wrong encryption mode');
            break;
    }
};