var bitcoin = require('./bitcoin');

onmessage = function(e) {

    var input = JSON.parse(e.data);

    var mnemonic = input.mnemonic;
    var networkID = input.networkID;
    var accountIndex = input.accountIndex;
    var addressIndex = input.addressIndex;
    var password = input.password;

    bitcoin.initiateHDWallet(mnemonic, password);
    var account = bitcoin.createAccount(networkID, accountIndex).account;

    self.postMessage(JSON.stringify(bitcoin.createCredentials(account, addressIndex, password)));
}
