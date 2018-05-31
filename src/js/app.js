const QRCode = require('qrcode');
const bip21 = require('bip21');
const bip38 = require('bip38');

// //////////////////////////////////////////////////
// Constants and Variables
// //////////////////////////////////////////////////

// bitcoin network
let networkId;
let currentPage;
let password;
let accounts;
let useBitcoinLink;
let useImprovedEntropy;

// identical to the id's set in bitcoinjs-lib_patched.js
const MAINNET_NONSEGWIT = 0;
const MAINNET_SEGWIT = 1;
const MAINNET_BECH32 = 2;
const TESTNET_NONSEGWIT = 10;
const TESTNET_SEGWIT = 11;
const TESTNET_BECH32 = 12;

// GET parameters
let GET = {};
// GET pages
GET.pages = {};
GET.pages.keyword = 'page';
GET.pages.singleWallet = 'single-wallet';
GET.pages.paperWallet = 'paper-wallet';
GET.pages.decryptMnemonic = 'decrypt-mnemonic';
GET.pages.decryptPrivKey = 'decrypt-private-key';
// GET network
GET.network = {};
GET.network.keyword = 'network';
GET.network.testnet = 'testnet';
GET.network.mainnet = 'mainnet';
// GET address types
GET.addressTypes = {};
GET.addressTypes.keyword = 'addressType';
GET.addressTypes.nonSegwit = 'non-segwit';
GET.addressTypes.segwit = 'segwit';
GET.addressTypes.bech32 = 'bech32';
// run also the slow unit tests?
GET.allUnitTests = {};
GET.allUnitTests.keyword = 'run-all-tests';
GET.allUnitTests.yes = 'true';

// CSS classes
let classes = {};
classes.activeMenuItem = 'active';
classes.testnet = 'testnet';


// //////////////////////////////////////////////////
// Document Object Model
// //////////////////////////////////////////////////

let DOM = {};

DOM.body = $('body');
DOM.root = $('div#root-container');
DOM.pageLoader = $('div#page-loader');

DOM.network = {};
DOM.network.mainnet = $('#mainnet-link');
DOM.network.testnet = $('#testnet-link');
DOM.network.testnetWarning = $('#testnet-warning');

DOM.menu = $('#mainmenu');
DOM.menuEntry = {};
DOM.menuEntry.singleWallet = $('#menu-single-wallet');
DOM.menuEntry.paperWallet = $('#menu-paper-wallet');
DOM.menuEntry.decrypt = $('#menu-decrypt');
DOM.menuEntry.decryptMnemonic = $('#menu-decrypt-mnemonic');
DOM.menuEntry.decryptPrivKey = $('#menu-decrypt-privkey');

DOM.networkElements = {};
DOM.networkElements.all = $('.network-element');
DOM.networkElements.mainnet = $('.network-mainnet');
DOM.networkElements.testnet = $('.network-testnet');

DOM.pageElements = {};
DOM.pageElements.all = $('.page-element');
DOM.pageElements.singleWallet = $('.single-wallet');
DOM.pageElements.paperWallet = $('.paper-wallet');
DOM.pageElements.decryptMnemonic = $('.decrypt-mnemonic');
DOM.pageElements.decryptPrivKey = $('.decrypt-privkey');

DOM.options = {};
DOM.options.addressTypes = {};
DOM.options.addressTypes.all = $("input[name='address-types']");
DOM.options.addressTypes.nonSegwit = $('input#non-segwit');
DOM.options.addressTypes.segwit = $('input#segwit');
DOM.options.addressTypes.bech32 = $('input#bech32');
DOM.options.showXPUB = $('input#showXPUB');
DOM.options.accounts = {};
DOM.options.accounts.accountTemplate = $('#account-row-template');
DOM.options.accounts.titleAccounts = $('#options-addresses-amount-title');
DOM.options.accounts.titleAddresses = $('#options-accounts-title');
DOM.options.encryption = {};
DOM.options.encryption.pass = $('input#password');
DOM.options.encryption.hidePass = $('span#hidePass');
DOM.options.numberAddresses = $('input#number-addresses');
DOM.options.qrcodeLink = $('input#qrcode-links-check');

DOM.actions = {};
DOM.actions.newAddress = $('#actions #new-address');
DOM.actions.newMnemonic = $('#actions #new-mnemonic');
DOM.actions.print = $('#actions #print-button');

DOM.popovers = {};
DOM.popovers.testnetWarning = $('#testnet-warning');
DOM.popovers.showXPUB = $('#showXPUBlabel');
DOM.popovers.encryption = $('#password-input-group');
DOM.popovers.numberAddresses = $('#address-numbering-label');
DOM.popovers.qrcodeLinks = $('#qrcode-links-label');

// Decrypt private key page
DOM.decPriv = {};
DOM.decPriv.privKey = $('#privkey-dec-key');
DOM.decPriv.pass = $('#privkey-dec-password');
DOM.decPriv.hidePass = $('#privkey-dec-hidePass');
DOM.decPriv.wrongNetwork = $('#privkey-dec-wrong-network');
DOM.decPriv.checkTestnet = $('button#check-testnet');
DOM.decPriv.checkMainnet = $('button#check-mainnet');

// Wallet
DOM.wallet = {};
DOM.wallet.template = $('div#wallet-template');
DOM.wallet.templateMnemonicWrapper = $('div#wallet-template .mnemonic-wrapper');
DOM.wallet.container = $('div#wallet');
DOM.wallet.mnemonic = $('div#wallet h1.mnemonic');
DOM.wallet.templateAccount = $('#wallet-template div#template-account-0');
DOM.wallet.templateCredentials = $('div#wallet-template .credentials');

// Footer
DOM.footer = {};
DOM.footer.securityChecks = {};
DOM.footer.securityChecks.online = $('footer #status-online');
DOM.footer.securityChecks.browserOnline = $('footer #browser-online');
DOM.footer.securityChecks.browserOffline = $('footer #browser-offline');
DOM.footer.securityChecks.crypto = $('footer #status-crypto');
DOM.footer.securityChecks.cryptoSupported= $('footer #crypto-supported');
DOM.footer.securityChecks.cryptoNotSupported= $('footer #crypto-not-supported');
DOM.footer.securityChecks.unittests = $('footer #status-unittests');
DOM.footer.securityChecks.windows = {};
DOM.footer.securityChecks.windows.online = $('footer #online-check-wrapper');
DOM.footer.securityChecks.windows.crypto = $('footer #crypto-check-wrapper');
DOM.footer.securityChecks.windows.mocha = $('footer #mocha-wrapper');
DOM.footer.securityChecks.mocha = {};
DOM.footer.securityChecks.mocha.title = $('footer #mocha-title');
DOM.footer.securityChecks.mocha.failedDescription = $('footer #mocha-failed-description');
DOM.footer.securityChecks.mocha.encryptionDialog = $('footer #encryption-tests-dialog');
DOM.footer.securityChecks.mocha.encTestButton = $('footer #run-enc-tests-button');


// //////////////////////////////////////////////////
// Pages / Page Options
// //////////////////////////////////////////////////

let pages = {};
pages.singleWallet = {};
pages.singleWallet.pageElementsDOM = DOM.pageElements.singleWallet;
pages.singleWallet.parentMenuEntryDOM = false;
pages.singleWallet.menuEntryDOM = DOM.menuEntry.singleWallet;
pages.singleWallet.getParam = GET.pages.singleWallet;
// set default values
pages.singleWallet.showWalletOnStartup = true;
pages.singleWallet.addressesPerAccount = 1;
pages.singleWallet.allowAccounts = false;
pages.singleWallet.showXPUB = false;
pages.singleWallet.numberAddresses = false;
pages.singleWallet.useBitcoinLink = true;
pages.singleWallet.defaultPassword = '';
pages.singleWallet.showEncryptedTag = true;

pages.paperWallet = {};
pages.paperWallet.pageElementsDOM = DOM.pageElements.paperWallet;
pages.paperWallet.parentMenuEntryDOM = false;
pages.paperWallet.menuEntryDOM = DOM.menuEntry.paperWallet;
pages.paperWallet.getParam = GET.pages.paperWallet;
// set default values
pages.paperWallet.showWalletOnStartup = true;
pages.paperWallet.addressesPerAccount = 3;
pages.paperWallet.allowAccounts = true;
pages.paperWallet.showXPUB = false;
pages.paperWallet.numberAddresses = true;
pages.paperWallet.useBitcoinLink = true;
pages.paperWallet.defaultPassword = '';
pages.paperWallet.showEncryptedTag = true;

pages.decryptMnemonic = {};
pages.decryptMnemonic.pageElementsDOM = DOM.pageElements.decryptMnemonic;
pages.decryptMnemonic.parentMenuEntryDOM = DOM.menuEntry.decrypt;
pages.decryptMnemonic.menuEntryDOM = DOM.menuEntry.decryptMnemonic;
pages.decryptMnemonic.getParam = GET.pages.decryptMnemonic;
// set default values
pages.decryptMnemonic.showWalletOnStartup = false;
pages.decryptMnemonic.addressesPerAccount = 3;
pages.decryptMnemonic.allowAccounts = true;
pages.decryptMnemonic.showXPUB = false;
pages.decryptMnemonic.numberAddresses = true;
pages.decryptMnemonic.useBitcoinLink = true;
pages.decryptMnemonic.defaultPassword = '';
pages.decryptMnemonic.showEncryptedTag = false;

pages.decryptPrivKey = {};
pages.decryptPrivKey.pageElementsDOM = DOM.pageElements.decryptPrivKey;
pages.decryptPrivKey.parentMenuEntryDOM = DOM.menuEntry.decrypt;
pages.decryptPrivKey.menuEntryDOM = DOM.menuEntry.decryptPrivKey;
pages.decryptPrivKey.getParam = GET.pages.decryptPrivKey;
// set default values
pages.decryptPrivKey.showWalletOnStartup = false;
pages.decryptPrivKey.addressesPerAccount = 1;
pages.decryptPrivKey.allowAccounts = false;
pages.decryptPrivKey.showXPUB = false;
pages.decryptPrivKey.numberAddresses = false;
pages.decryptPrivKey.useBitcoinLink = true;
pages.decryptPrivKey.defaultPassword = '';
pages.decryptPrivKey.showEncryptedTag = false;


// //////////////////////////////////////////////////
// Global Options
// //////////////////////////////////////////////////

const defaultAddressType = {
    getParam: GET.addressTypes.segwit,
    optionsDOM: DOM.options.addressTypes.segwit
};
currentPage = pages.singleWallet;


// //////////////////////////////////////////////////
// Global Objects
// //////////////////////////////////////////////////

const privkeyDecryption = new PrivkeyDecryption();
const securityChecks = new SecurityChecks();
const securityChecksWindows = new SecurityCheckWindows();
const init = new Init();
const pageManagement = new PageManagement();
const switchNetwork = new SwitchNetwork();
const options = new Options();
const wallet = new Wallet();
const bitcoinLoader = new BitcoinLoader();


// //////////////////////////////////////////////////
// Events
// //////////////////////////////////////////////////

// Mainnet/Testnet Link
DOM.network.testnet.click(switchNetwork.toTestnet);
DOM.network.mainnet.click(switchNetwork.toMainnet);

// Menu
DOM.menuEntry.singleWallet.click(() => pageManagement.changePage(pages.singleWallet));
DOM.menuEntry.paperWallet.click(() => pageManagement.changePage(pages.paperWallet));
DOM.menuEntry.decryptMnemonic.click(() => pageManagement.changePage(pages.decryptMnemonic));
DOM.menuEntry.decryptPrivKey.click(() => pageManagement.changePage(pages.decryptPrivKey));


// Options
// Address Types
DOM.options.addressTypes.nonSegwit.click(options.addressTypes.changeToNonSegwit);
DOM.options.addressTypes.segwit.click(options.addressTypes.changeToSegwit);
DOM.options.addressTypes.bech32.click(options.addressTypes.changeToBech32);
// Show XPUB
DOM.options.showXPUB.change(options.showXPUBchanged);
// Encryption
DOM.options.encryption.hidePass.click(options.togglePwVisibility);
DOM.options.encryption.pass.change(options.changePassword);
// Address Numbering
DOM.options.numberAddresses.change(options.toggleAddressNumbering);
// Bitcoin link in QR code
DOM.options.qrcodeLink.change(options.toggleQRcodeLink);

// Actions
DOM.actions.newAddress.click(init.wallet);
DOM.actions.newMnemonic.click(init.wallet);
DOM.actions.print.click(print);

// Decrypt private key page
DOM.decPriv.privKey.change(privkeyDecryption.encrypedPrivkeyChanged);
DOM.decPriv.pass.change(privkeyDecryption.passwordChanged);
DOM.decPriv.hidePass.click(privkeyDecryption.togglePwVisibility);
DOM.decPriv.checkTestnet.click(privkeyDecryption.checkTestnet);
DOM.decPriv.checkMainnet.click(privkeyDecryption.checkMainnet);

// Footer
DOM.footer.securityChecks.online.click(securityChecksWindows.toggleOnline);
DOM.footer.securityChecks.crypto.click(securityChecksWindows.toggleCrypto);
DOM.footer.securityChecks.unittests.click(securityChecksWindows.toggleUnitTests);
DOM.footer.securityChecks.mocha.encTestButton.click(securityChecks.reloadAndRunAllTests);

// //////////////////////////////////////////////////
// Page Loading
// //////////////////////////////////////////////////

function Init() {

    this.app = () => {

        network();
        page();
        popovers();
        setDefaults();
        options.addressTypes.initForm();

        this.accounts();
        this.wallet();

        // Run the security checks shown in the footer of the page
        securityChecks.runAll();
    }


    this.wallet = () => {

        if (password) {
            bitcoinLoader.interrupt();
        }

        wallet.init();
    }

    this.mainnet = () => {

        useImprovedEntropy = true;

        // remove GET parameter 'network'
        removeParamFromURL(GET.network.keyword);

        // design the page
        DOM.network.mainnet.hide();
        DOM.network.testnet.show();
        DOM.network.testnetWarning.hide();
        DOM.body.removeClass(classes.testnet);
        DOM.menu.removeClass(classes.testnet);

        // set correct Bitcoin network and reload the wallet
        wallet.setNetwork();
    }

    this.testnet = () => {

        // todo: this is not the right way to do this:
        // useImprovedEntropy = false;
        // todo: even though this extra layer of entropy is not needed
        // todo: on testnet, simply turning it off is wrong,
        // todo: since the user can afterwards change to the mainnet
        // todo: and then misses out on this extra protection
        useImprovedEntropy = true;

        // set GET parameter 'network' to 'testnet'
        addParamToURL({key: GET.network.keyword, value: GET.network.testnet});

        // design the page
        DOM.network.testnet.hide();
        DOM.network.mainnet.show();
        DOM.network.testnetWarning.show();
        DOM.body.addClass(classes.testnet);
        DOM.menu.addClass(classes.testnet);

        // set correct Bitcoin network and reload the wallet
        wallet.setNetwork();
    }

    this.accounts = () => {
        accounts = [];
        accounts.push(currentPage.addressesPerAccount);
    }

    const setDefaults = () => {
        password = currentPage.defaultPassword;
        options.showXPUB = currentPage.showXPUB;
        useBitcoinLink = currentPage.useBitcoinLink;
    }

    // set mainnet or testnet
    const network = () => {
        switch (getURLparameter(GET.network.keyword)) {
            case GET.network.testnet:
                this.testnet();
                break;
            default:
                this.mainnet();
                break;
        }
    }

    const page = () => {
        // set correct page
        switch (getURLparameter(GET.pages.keyword)) {
            case GET.pages.paperWallet:
                pageManagement.initPage(pages.paperWallet);
                break;
            case GET.pages.singleWallet:
                pageManagement.initPage(pages.singleWallet);
                break;
            case GET.pages.decryptMnemonic:
                pageManagement.initPage(pages.decryptMnemonic);
                break;
            case GET.pages.decryptPrivKey:
                pageManagement.initPage(pages.decryptPrivKey);
                break;
            default:
                pageManagement.initPage(currentPage);
                break;
        }
    }

    const popovers = () => {
        for (let x in DOM.popovers) {
            DOM.popovers[x].popover({html: true});
        }
    }
}

// //////////////////////////////////////////////////
// Page Management
// //////////////////////////////////////////////////

function PageManagement() {

    this.initPage = (newPage) => {
        currentPage = newPage;

        options.setupPageOptions();
        changePageElements();
        setMenuLinkActive();
        switchURLparam({key: GET.pages.keyword, value: currentPage.getParam});

        // reload the page
        options.showAccountsOptions(true);
    }

    this.changePage = (newPage) => {
        bitcoinLoader.interrupt();
        privkeyDecryption.resetPage();
        this.initPage(newPage);
        wallet.load();
    }

    const changePageElements = () => {
        // only show elements that are getting activated with this call
        DOM.pageElements.all.hide();
        currentPage.pageElementsDOM.show();
    }

    // set new menu link to active
    const setMenuLinkActive = () => {
        DOM.menu.find('.' + classes.activeMenuItem).removeClass(classes.activeMenuItem);
        currentPage.menuEntryDOM.addClass(classes.activeMenuItem);

        if (currentPage.parentMenuEntryDOM) {
            currentPage.parentMenuEntryDOM.addClass(classes.activeMenuItem);
        }
    }
}


// //////////////////////////////////////////////////
// Switch beetween mainnet and testnet
// //////////////////////////////////////////////////

function SwitchNetwork() {

    this.toMainnet = () => switchToNetwork(init.mainnet);
    this.toTestnet = () => switchToNetwork(init.testnet);

    const switchToNetwork = (initNetwork) => {
        bitcoinLoader.interrupt();
        initNetwork();
        wallet.load();
    }
}


// //////////////////////////////////////////////////
// Options Container
// //////////////////////////////////////////////////

function AddressTypes() {

    this.initForm = () => {
        // set checkboxes from GET params
        if (getURLparameter(GET.addressTypes.keyword)) {

            DOM.options.addressTypes.all.prop('checked', false);

            switch (getURLparameter(GET.addressTypes.keyword)) {
                case GET.addressTypes.nonSegwit:
                    DOM.options.addressTypes.nonSegwit.prop('checked', true);
                    break;
                case GET.addressTypes.segwit:
                    DOM.options.addressTypes.segwit.prop('checked', true);
                    break;
                case GET.addressTypes.bech32:
                    DOM.options.addressTypes.bech32.prop('checked', true);
                    break;
                default:
                    defaultAddressType.optionsDOM.prop('checked', true);
                    break;
            }
        }
    }

    this.changeToNonSegwit = () => changeAddressType(GET.addressTypes.nonSegwit);
    this.changeToSegwit = () => changeAddressType(GET.addressTypes.segwit);
    this.changeToBech32 = () => changeAddressType(GET.addressTypes.bech32);

    const changeAddressType = (newType) => {
        bitcoinLoader.interrupt();
        switchURLparam({key: GET.addressTypes.keyword, value: newType});
        wallet.recalculate();
    }
}

function Options() {

    this.addressTypes = new AddressTypes();
    this.showXPUB = null;

    this.setupPageOptions = () => {
        switch (currentPage) {
            case pages.singleWallet:
            case pages.decryptPrivKey:
                disableAccounts();
                break;
            case pages.paperWallet:
            case pages.decryptMnemonic:
                readXPUBform();
                handleAccounts();
                currentPage.numberAddresses = DOM.options.numberAddresses.prop('checked');
                break;
        }

        password = currentPage.defaultPassword;
        DOM.options.encryption.pass.val(currentPage.defaultPassword);
    }

    // checkbox show extended public key changed
    this.showXPUBchanged = () => {
        readXPUBform();
        handleAccounts();
        wallet.load();
    }

    this.showAccountsOptions = (reset) => {
        if (this.isAccountsFormEmpty() || reset) {
            init.accounts();
        }

        // remove all accounts to add them again
        $('.account-row.not-template').remove();

        // create all accounts, but backwards => last account first onto the first account
        for (let index = accounts.length - 1; index >= 0; index--) {
            showAccountOptions(index);
        }
    }

    this.toggleAddressNumbering = () => {
        currentPage.numberAddresses = DOM.options.numberAddresses.prop('checked');
        wallet.load();
    };

    this.toggleQRcodeLink = () => {
        useBitcoinLink = DOM.options.qrcodeLink.prop('checked');
        if (currentPage === pages.decryptPrivKey) {
            initPasswordDecryption();
        } else {
            wallet.load();
        }
    };

    this.changePassword = () => {
        bitcoinLoader.interrupt();
        password = DOM.options.encryption.pass.val();
        init.wallet();
    };

    this.isAccountsFormEmpty = () => typeof accounts === 'undefined' || accounts.length === 0;
    this.togglePwVisibility = () => togglePasswordVisibility(DOM.options.encryption.pass, DOM.options.encryption.hidePass);

    const showAccountOptions = (index) => {
        let accountDiv = DOM.options.accounts.accountTemplate.clone();
        accountDiv.prop('id', 'account-row-' + index);
        accountDiv.addClass('not-template');

        accountDiv.find('.account-number').text('# ' + (index + 1));
        accountDiv.find('input').prop('id', 'addresses-amount-' + index);
        accountDiv.find('input').val(accounts[index]);
        accountDiv.find('label').prop('for', 'addresses-amount-' + index);

        if (options.showXPUB) {
            accountDiv.find('.account-number').show();
            accountDiv.find('button').show();
        }

        if (accounts.length <= 1) {
            accountDiv.find('button.account-remove').prop('disabled', true);
        }

        // events on buttons and on input change
        (function (accIndex, accDiv) {
            accountDiv.find('button.account-add').click(function () {
                addAccount(accIndex, currentPage.addressesPerAccount);
                wallet.load();
            });
            accountDiv.find('button.account-remove').click(function () {
                removeAccount(accIndex);
                wallet.load();
            });
            accountDiv.find('input#addresses-amount-' + accIndex).change(function () {
                setAddressesPerAccount(accIndex, parseInt(accDiv.find('input#addresses-amount-' + accIndex).val()));
                wallet.load();
            });
        })(index, accountDiv); // pass as argument to anonymous function - this will introduce a new scope


        DOM.options.accounts.accountTemplate.after(accountDiv);
    }

    const readXPUBform = () => this.showXPUB = DOM.options.showXPUB.prop('checked');
    const handleAccounts = () => this.showXPUB ? enableAccounts() : disableAccounts();

    const enableAccounts = () => {

        // set correct options title
        DOM.options.accounts.titleAccounts.hide();
        DOM.options.accounts.titleAddresses.show();

        $('.account-row.not-template span.title').show();
        $('.account-row.not-template button.account-insertion').show();
    }

    const disableAccounts = () => {

        // set correct options title
        DOM.options.accounts.titleAccounts.show();
        DOM.options.accounts.titleAddresses.hide();

        if (this.isAccountsFormEmpty()) {
            init.accounts();
        } else {
            accounts.splice(1, accounts.length - 1); // remove all entries but the first
        }

        this.showAccountsOptions();
        $('.account-row.not-template span.title').hide();
        $('.account-row.not-template button.account-insertion').hide();
    }

    const addAccount = (prev) => {
        accounts.splice(prev + 1, 0, currentPage.addressesPerAccount);

        // reload the view
        this.showAccountsOptions();
    }

    const removeAccount = (position) => {
        // remove the element from array
        accounts.splice(position, 1);

        // reload the view
        this.showAccountsOptions();
    }

    const setAddressesPerAccount = (index, amount) => {
        if (amount > 0) {
            accounts[index] = amount;
        }
    }
}

function togglePasswordVisibility(domTextfield, domButton) {
    if (domTextfield.prop('type') === 'text') {
        domTextfield.prop('type', 'password');
        domButton.html('Show');
    } else {
        domTextfield.prop('type', 'text');
        domButton.html('Hide');
    }
};

// //////////////////////////////////////////////////
// BIP38 Private Key Decryption
// //////////////////////////////////////////////////

function PrivkeyDecryption() {

    let password;

    this.encrypedPrivkeyChanged = () => {
        resetPrivKeyValidityClasses();
        let encryptedPrivKey = DOM.decPriv.privKey.val();

        if (bip38.verify(encryptedPrivKey)) {
            DOM.decPriv.privKey.addClass('is-valid');

            initDecryption();
        } else {
            DOM.decPriv.privKey.addClass('is-invalid');
            $('.wallet-account').hide();
        }
    }

    this.passwordChanged = () => {
        resetPasswordValidityClasses();
        password = DOM.decPriv.pass.val();

        if (password == '') {
            DOM.decPriv.pass.addClass('is-invalid');
            $('.wallet-account').hide();
        } else {
            DOM.decPriv.pass.addClass('is-valid');
            initDecryption();
        }
    }

    this.resetPage = (leavePrivKey) => {
        DOM.decPriv.pass.val('');
        DOM.decPriv.wrongNetwork.hide();
        resetPasswordValidityClasses();
        password = '';

        if (!leavePrivKey) {
            DOM.decPriv.privKey.val('');
            resetPrivKeyValidityClasses();
        }
    }

    this.togglePwVisibility = () => togglePasswordVisibility(DOM.decPriv.pass, DOM.decPriv.hidePass);
    this.checkMainnet = () => checkOtherNetwork(init.mainnet);
    this.checkTestnet = () => checkOtherNetwork(init.testnet);


    const initDecryption = () => {
        let encryptedPrivKey = DOM.decPriv.privKey.val();

        if (bip38.verify(encryptedPrivKey) && password !== '') {
            DOM.decPriv.wrongNetwork.hide();
            wallet.createHTML();
            $('.wallet-account').show();
            decryptPrivKey(encryptedPrivKey);
        }
    }

    const decryptPrivKey = (encryptedPrivKey) => {

        let isTestnet = networkId >= 10;

        bitcoinLoader.getCredentialsFromEncryptedPrivKey(encryptedPrivKey, password, isTestnet, function (credentials) {
            wallet.fillCredentialsHTML(0, 0, credentials.address, credentials.privateKey);
        }, function () {
            DOM.decPriv.wrongNetwork.show();
            DOM.decPriv.pass.addClass('is-invalid');
            $('.wallet-account').hide();
        }, function () {
            DOM.decPriv.pass.addClass('is-invalid');
            $('.wallet-account').hide();
        });
    }

    const resetPrivKeyValidityClasses = () => {
        DOM.decPriv.privKey.removeClass('is-valid');
        DOM.decPriv.privKey.removeClass('is-invalid');
    }

    const resetPasswordValidityClasses = () => {
        DOM.decPriv.pass.removeClass('is-valid');
        DOM.decPriv.pass.removeClass('is-invalid');
    }

    const checkOtherNetwork = (initNetwork) => {
        let pass = DOM.decPriv.pass.val();
        initNetwork();
        DOM.decPriv.pass.val(pass);
        this.passwordChanged();
    }
}


// //////////////////////////////////////////////////
// Footer
// //////////////////////////////////////////////////

function SecurityChecks() {

    this.runAll = () => {

        // check whether browser is online or not
        this.online();
        // check whether window.crypto.getRandomValues is supported
        this.crypto();

        // run unit tests
        let runAllTests = getURLparameter(GET.allUnitTests.keyword) == GET.allUnitTests.yes;
        if(runAllTests){
            removeParamFromURL(GET.allUnitTests.keyword);
        }
        this.unittests(runAllTests);
    }

    this.online = () => {
        if (navigator.onLine) {
            onFailed(DOM.footer.securityChecks.online);
            DOM.footer.securityChecks.browserOnline.show();
        } else {
            onSuccess(DOM.footer.securityChecks.online)
            DOM.footer.securityChecks.browserOffline.show();
        }
    }

    this.crypto = () => {
        if (window.crypto && window.crypto.getRandomValues) {
            onSuccess(DOM.footer.securityChecks.crypto)
            DOM.footer.securityChecks.cryptoSupported.show();
        } else {
            onFailed(DOM.footer.securityChecks.crypto);
            DOM.footer.securityChecks.cryptoNotSupported.show();
        }
    }

    this.unittests = (allTests) => {
        if(allTests){
            DOM.footer.securityChecks.mocha.encryptionDialog.hide();
        }
        bitcoinLoader.runUnitTests(allTests, onUnittestsSuccesful, onUnittestsFailed);
    }

    this.reloadAndRunAllTests = () => {
        addParamToURL({key: GET.allUnitTests.keyword, value: GET.allUnitTests.yes});

        // looks ridiculous but this is actually a page reload
        window.location.href = window.location.href;
    }

    const onSuccess = (domElement) => domElement.html('&#10004;'); // &#10004; = ✔
    const onFailed = (domElement) => {
        domElement.html('&#9888;'); // &#9888; = ⚠
        domElement.addClass('warning');
    }

    const onUnittestsSuccesful = () => {
        DOM.footer.securityChecks.mocha.title.html('Unit tests successful');
        DOM.footer.securityChecks.mocha.title.addClass('success');
        onSuccess(DOM.footer.securityChecks.unittests);
    }

    const onUnittestsFailed = () => {
        DOM.footer.securityChecks.mocha.title.html('Unit tests failed!');
        DOM.footer.securityChecks.mocha.title.addClass('failed');
        DOM.footer.securityChecks.mocha.failedDescription.show();
        onFailed(DOM.footer.securityChecks.unittests);
    }
}

function SecurityCheckWindows() {

    const ONLINE = {id: 0, window: DOM.footer.securityChecks.windows.online};
    const CRYPTO = {id: 1, window: DOM.footer.securityChecks.windows.crypto};
    const UNITTESTS = {id: 2, window: DOM.footer.securityChecks.windows.mocha};

    let shownWindow = null;

    this.toggleOnline = () => toggleWindow(ONLINE);
    this.toggleCrypto = () => toggleWindow(CRYPTO);
    this.toggleUnitTests = () => toggleWindow(UNITTESTS);

    const hideAllWindows = function () {
        for(let window in DOM.footer.securityChecks.windows){
            DOM.footer.securityChecks.windows[window].hide();
        }
    };

    const toggleWindow = function(obj){
        hideAllWindows();

        if (shownWindow !== obj.id) {
            obj.window.show();
            shownWindow = obj.id;
        } else {
            shownWindow = null;
        }
    };
};


// //////////////////////////////////////////////////
// Bitcoin Stuff
// //////////////////////////////////////////////////

function Wallet() {

    let self = this;

    this.init = () => {
        bitcoinLoader.initiateHDWallet(false, password, useImprovedEntropy, function (result) {
            DOM.pageLoader.hide();
            DOM.root.show();

            self.load();
        });
    }

    this.load = () => {

        if (options.isAccountsFormEmpty()) {
            init.accounts();
        }

        this.createHTML();

        showDOMif(currentPage.allowAccounts && options.showXPUB, $('div.xpub-wrapper'));
        showDOMif(accounts.length > 1, $('.account-title'));
        showDOMif(currentPage.showWalletOnStartup, $('.wallet-account'));

        if (currentPage.showWalletOnStartup) {
            fillWalletHTML();
        }
    }

    this.setNetwork = () => {

        DOM.networkElements.all.hide();

        let addressType = getURLparameter(GET.addressTypes.keyword) || defaultAddressType.getParam;

        switch (getURLparameter(GET.network.keyword)) {
            case GET.network.testnet:
                setNetworkTestnet(addressType);
                break;
            case GET.network.mainnet:
            default:
                setNetworkMainnet(addressType);
                break;
        }

        privkeyDecryption.resetPage(true);
    }

    this.recalculate = () => {
        this.setNetwork();
        this.load();
    }


    this.createHTML = () => {

        DOM.wallet.template.hide();
        DOM.wallet.container.html(DOM.wallet.templateMnemonicWrapper.clone());

        if (password && currentPage.showEncryptedTag) {
            $('.mnemonic-title').html('Mnemonic [encrypted]');
            $('.privkey-title').html('Private Key [encrypted]');
        } else {
            $('.mnemonic-title').html('Mnemonic');
            $('.privkey-title').html('Private Key');
        }

        createMnemonicHTML();

        foreachCredential(createAccountHTML, createCredentialsHTML);
    }

    const showDOMif = (condition, domElement) => { condition ? domElement.show() : domElement.hide(); }

    const setNetworkMainnet = (addressType) => {
        DOM.networkElements.mainnet.show();

        switch (addressType) {
            case GET.addressTypes.nonSegwit:
                networkId = MAINNET_NONSEGWIT;
                break;
            case GET.addressTypes.segwit:
                networkId = MAINNET_SEGWIT;
                break;
            case GET.addressTypes.bech32:
                networkId = MAINNET_BECH32;
                break;
        }
    }

    const setNetworkTestnet = (addressType) => {
        DOM.networkElements.testnet.show();

        switch (addressType) {
            case GET.addressTypes.nonSegwit:
                networkId = TESTNET_NONSEGWIT;
                break;
            case GET.addressTypes.segwit:
                networkId = TESTNET_SEGWIT;
                break;
            case GET.addressTypes.bech32:
                networkId = TESTNET_BECH32;
                break;
        }
    }

    const createMnemonicHTML = () => {
        DOM.wallet.container.find('.mnemonic').html(bitcoinLoader.getMnemonic());

        let mnemonicCanvas = DOM.wallet.container.find('.canvas-mnemonic').get(0);
        QRCode.toCanvas(mnemonicCanvas, bitcoinLoader.getMnemonic(), function (error) {
            if (error) {
                console.error(error);
            }
        });
    }

    const createAccountHTML = (accountIndex) => {

        $('div#account-' + accountIndex).html('');

        let accountCopy = DOM.wallet.templateAccount.clone();
        accountCopy.prop('id', 'account-' + accountIndex);
        if (accountIndex == 0) {
            accountCopy.addClass('first-account');
        }
        accountCopy.find('.account-title').html('Account ' + (accountIndex + 1));
        accountCopy.find('.xpub').prop('id', 'xpub-' + accountIndex);
        accountCopy.find('.canvas-xpub').prop('id', 'canvas-xpub-' + accountIndex);
        accountCopy.find('div.credentials').remove();

        DOM.wallet.container.append(accountCopy);
    }

    const createCredentialsHTML = (accountIndex, addressIndex) => {

        let identifier = accountIndex + '-' + addressIndex;

        let credentialsCopy = DOM.wallet.templateCredentials.clone();
        credentialsCopy.prop('id', 'credentials-' + identifier);
        credentialsCopy.find('.address').prop('id', 'address-' + identifier);
        credentialsCopy.find('.canvas-address').prop('id', 'canvas-address-' + identifier);
        credentialsCopy.find('.privkey').prop('id', 'privkey-' + identifier);
        credentialsCopy.find('.canvas-privkey').prop('id', 'canvas-privkey-' + identifier);

        if (currentPage.numberAddresses) {
            credentialsCopy.find('.address-title').append(' ' + (addressIndex + 1));
        }

        let walletAccount = $('div#account-' + accountIndex);
        walletAccount.append(credentialsCopy);
    }

    const fillWalletHTML = () => {

        let perAccount = function (accountIndex) {
            bitcoinLoader.createAccount(networkId, accountIndex, function (account) {
                fillAccountHTML(accountIndex, account.xpub);
            });
        };

        let perAddress = function (accountIndex, addressIndex) {

            bitcoinLoader.asyncCreateCredentials(networkId, accountIndex, addressIndex, password, function (credentials) {
                self.fillCredentialsHTML(accountIndex, addressIndex, credentials.address, credentials.privateKey);
            });
        };

        foreachCredential(perAccount, perAddress);
    }

    const foreachCredential = (callbackPerAccount, callbackPerAddress) => {
        // loop through accounts
        for (let accountIndex = 0; accountIndex < accounts.length; accountIndex++) {
            callbackPerAccount(accountIndex);
            // loop through addresses
            for (let addressIndex = 0; addressIndex < accounts[accountIndex]; addressIndex++) {
                callbackPerAddress(accountIndex, addressIndex);
            }
        }
    }

    const fillAccountHTML = (accountIndex, xpub) => {
        $('#xpub-' + accountIndex).html(xpub);

        let xpubCanvas = $('#canvas-xpub-' + accountIndex).get(0);
        QRCode.toCanvas(xpubCanvas, xpub, function (error) {
            if (error) {
                console.error(error);
            }
        });
    }

    this.fillCredentialsHTML = (accIndex, addIndex, address, privKey) => {

        // remove loading spinners
        removeCredentialsLoadingGui(accIndex, addIndex);

        let addressLink = useBitcoinLink ? createBitcoinLink(address, accIndex, addIndex) : false;

        let addressIdentifier = 'address-' + accIndex + '-' + addIndex;
        let privKeyIdentifier = 'privkey-' + accIndex + '-' + addIndex;

        fillCredentialsElement(addressIdentifier, address, addressLink);
        fillCredentialsElement(privKeyIdentifier, privKey);
    }

    const fillCredentialsElement = (id, plaintext, link) => {

        let qrCodeData;

        if (!link) {
            $('#' + id).text(plaintext);
            qrCodeData = plaintext;
        } else {
            $('#' + id).html(wrapLinkAroundAddress(id, plaintext, link));
            qrCodeData = link;
        }

        QRCode.toCanvas($('#canvas-' + id).get(0), qrCodeData, function (error) {
            if (error) {
                console.error(error);
            }
        });
    }

    const wrapLinkAroundAddress = (id, plaintext, link) => {
        let html = '<a href="' + link + '" target="_blank">';
        html += plaintext;
        html += '</a>';

        return html;
    }

    const createBitcoinLink = (address, accIndex, addIndex) => {

        let label;

        switch (currentPage) {
            case pages.paperWallet:
                label = 'Paper wallet: Account ' + accIndex + ', Address ' + addIndex;
                break;
            case pages.singleWallet:
            default:
                label = 'Address generated on coinglacier.org';
                break;
        }

        return bip21.encode(address, {label: label});
    }

    const removeCredentialsLoadingGui = (accountIndex, addressIndex) => {
        let credentialsDiv = $('div#credentials-' + accountIndex + '-' + addressIndex);

        credentialsDiv.find('.address-wrapper').removeClass('loading');
        credentialsDiv.find('.privkey-wrapper').removeClass('loading');
        credentialsDiv.find('.okay-to-share').show();
        credentialsDiv.find('.keep-secret').show();
        credentialsDiv.find('canvas').show();
    }
}


// //////////////////////////////////////////////////
// Handle GET Parameters
// //////////////////////////////////////////////////

// param requires object {key: key, value: value}
function switchURLparam(param) {
    removeParamFromURL(param.key)
    addParamToURL(param);
}

// param requires object {key: key, value: value}
function addParamToURL(param) {

    // check if URL already contains param
    if (getURLparameter(param.key)) {
        return;
    }

    if (history.pushState) {
        let url = window.location.href;
        let paramConcat = (url.indexOf('?') === -1 ? "?" : "&");
        let newURL = url + paramConcat + param.key + "=" + param.value;

        window.history.pushState({path: newURL}, '', newURL);
    }
}

function removeParamFromURL(param) {
    if (history.pushState) {
        let url = window.location.href;

        // check whether the given parameter is actually in the URL
        if (url.indexOf(param) < 0) {
            return;
        }

        let startParam = url.indexOf(param) - 1;
        let endParam = (url.indexOf('&', startParam) <= startParam) ? url.length : url.indexOf('&', startParam);
        let toBeRemoved = url.substring(startParam, endParam);

        let newURL = url.replace(toBeRemoved, '');

        // if there are params left, make sure the first one starts with '?'
        if (newURL.indexOf('&') >= 0 && newURL.indexOf('?') < 0) {
            newURL = newURL.replace('&', '?'); // replace first occurrence of & with ?
        }

        window.history.pushState({path: newURL}, '', newURL);
    }
}

function getURLparameter(name, url) {

    if (!name) {
        return null;
    }

    url = url || window.location.href;
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    let regexS = "[\\?&]" + name + "=([^&#]*)";
    let regex = new RegExp(regexS);
    let results = regex.exec(url);
    return results == null ? null : results[1];
}

function print(){
    window.print();
}


init.app();