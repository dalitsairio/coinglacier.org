const QRCode = require('qrcode');
const bip21 = require('bip21');

// //////////////////////////////////////////////////
// Constants and Variables
// //////////////////////////////////////////////////

// bitcoin network
var network;
var currentPage;
var password;
var accountsForm;
var mnemonic;
var showXPUB;
var useBitcoinLink;
var useImprovedEntropy;
var showUnitTests;


// identical to the id's set in bitcoinjs-lib_patched.js
const MAINNET_NONSEGWIT = 0;
const MAINNET_SEGWIT = 1;
const MAINNET_BECH32 = 2;
const TESTNET_NONSEGWIT = 10;
const TESTNET_SEGWIT = 11;
const TESTNET_BECH32 = 12;

// GET parameters
var GET = {};
// GET pages
GET.pages = {};
GET.pages.keyword = 'page';
GET.pages.singleWallet = 'single-wallet';
GET.pages.paperWallet = 'paper-wallet';
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
var classes = {};
classes.activeMenuItem = 'active';
classes.testnet = 'testnet';


// //////////////////////////////////////////////////
// Document Object Model
// //////////////////////////////////////////////////

var DOM = {};

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

DOM.pageElements = {};
DOM.pageElements.all = $('.page-element');
DOM.pageElements.singleWallet = $('.single-wallet');
DOM.pageElements.paperWallet = $('.paper-wallet');

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

DOM.popovers = {};
DOM.popovers.testnetWarning = $('#testnet-warning');
DOM.popovers.showXPUB = $('#showXPUBlabel');
DOM.popovers.encryption = $('#password-input-group');
DOM.popovers.numberAddresses = $('#address-numbering-label');
DOM.popovers.qrcodeLinks = $('#qrcode-links-label');

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
DOM.footer.status = {};
DOM.footer.status.online = $('footer #status-online');
DOM.footer.status.crypto = $('footer #status-crypto');
DOM.footer.status.unittests = $('footer #status-unittests');
DOM.footer.mochaWrapper = $('footer #mocha-wrapper');
DOM.footer.mochaTitle = $('footer #mocha-title');
DOM.footer.failedDescription = $('footer #mocha-failed-description');


// //////////////////////////////////////////////////
// Pages / Page Options
// //////////////////////////////////////////////////

var pages = {};
pages.singleWallet = {};
pages.singleWallet.pageElementsDOM = DOM.pageElements.singleWallet;
pages.singleWallet.menuEntryDOM = DOM.menuEntry.singleWallet;
pages.singleWallet.getParam = GET.pages.singleWallet;
// set default values
pages.singleWallet.addressesPerAccount = 1;
pages.singleWallet.allowAccounts = false;
pages.singleWallet.showXPUB = false;
pages.singleWallet.numberAddresses = false;
pages.singleWallet.useBitcoinLink = true;
pages.singleWallet.defaultPassword = '';

pages.paperWallet = {};
pages.paperWallet.pageElementsDOM = DOM.pageElements.paperWallet;
pages.paperWallet.menuEntryDOM = DOM.menuEntry.paperWallet;
pages.paperWallet.getParam = GET.pages.paperWallet;
// set default values
pages.paperWallet.addressesPerAccount = 3;
pages.paperWallet.allowAccounts = true;
pages.paperWallet.showXPUB = false;
pages.paperWallet.numberAddresses = true;
pages.paperWallet.useBitcoinLink = true;
pages.paperWallet.defaultPassword = '';


// //////////////////////////////////////////////////
// Global Options
// //////////////////////////////////////////////////

const defaultAddressType = {
    getParam: GET.addressTypes.segwit,
    optionsDOM: DOM.options.addressTypes.segwit
};
currentPage = pages.singleWallet;

// //////////////////////////////////////////////////
// Events
// //////////////////////////////////////////////////

// Mainnet/Testnet Link
DOM.network.testnet.click(switchToTestnet);
DOM.network.mainnet.click(switchToMainnet);

// Menu
DOM.menuEntry.singleWallet.click(function () {
    changePage(pages.singleWallet);
});
DOM.menuEntry.paperWallet.click(function () {
    changePage(pages.paperWallet);
});

// Options
// Address Types
DOM.options.addressTypes.nonSegwit.click(changeToNonSegwit);
DOM.options.addressTypes.segwit.click(changeToSegwit);
DOM.options.addressTypes.bech32.click(changeToBech32);
// Show XPUB
DOM.options.showXPUB.change(optionShowXPUBchanged);
// Encryption
DOM.options.encryption.hidePass.click(togglePasswordVisibility);
DOM.options.encryption.pass.change(changePassword);
// Address Numbering
DOM.options.numberAddresses.change(toggleAddressNumbering);
// Bitcoin link in QR code
DOM.options.qrcodeLink.change(toggleQRcodeLink);

// Footer
DOM.footer.status.unittests.click(toggleUnitTests);

// //////////////////////////////////////////////////
// Page Loading
// //////////////////////////////////////////////////

function init() {

    // set mainnet or testnet
    switch (getURLparameter(GET.network.keyword)) {
        case GET.network.testnet:
            initTestnet();
            break;
        default:
            initMainnet();
    }

    // set correct page
    switch (getURLparameter(GET.pages.keyword)) {
        case GET.pages.paperWallet:
            initiatePage(pages.paperWallet);
            break;
        case GET.pages.singleWallet:
            initiatePage(pages.singleWallet);
        default:
            initiatePage(currentPage);
            break;
    }

    showAccountsOptions();

    // initialize popovers
    for (var x in DOM.popovers) {
        DOM.popovers[x].popover({html: true});
    }

    password = currentPage.defaultPassword;
    showXPUB = currentPage.showXPUB;
    useBitcoinLink = currentPage.useBitcoinLink;
    showUnitTests = false;

    initiateWallet(function () {
        loadWallet();
    });


    // run unit tests
    var runAllTests = getURLparameter(GET.allUnitTests.keyword) == GET.allUnitTests.yes;
    runUnitTests(runAllTests, onUnittestsSuccesful, onUnittestsFailed);
}

function onUnittestsSuccesful(){
    DOM.footer.mochaTitle.html('Unit tests successful');
    DOM.footer.mochaTitle.addClass('success');
    onStatusSuccessful(DOM.footer.status.unittests);
}

function onUnittestsFailed(){
    DOM.footer.mochaTitle.html('Unit tests failed!');
    DOM.footer.mochaTitle.addClass('failed');
    DOM.footer.failedDescription.show();
    onStatusFailed(DOM.footer.status.unittests);
}

function onStatusSuccessful(domElement){
    domElement.html('✔');
}

function onStatusFailed(domElement){
    domElement.html('⚠');
    domElement.addClass('warning');
}


// //////////////////////////////////////////////////
// Page Management
// //////////////////////////////////////////////////

function initiatePage(newPage) {
    currentPage = newPage;

    setupPageOptions();
    changePageElements();
    switchMenuLink();
    switchURLparam({key: GET.pages.keyword, value: currentPage.getParam});

    // reload the page
    showAccountsOptions(true);
}

function changePage(newPage) {
    interruptWorkers();
    initiatePage(newPage);
    loadWallet();
}

// set new menu link to active
function switchMenuLink() {
    DOM.menu.find('.' + classes.activeMenuItem).removeClass(classes.activeMenuItem);
    currentPage.menuEntryDOM.addClass(classes.activeMenuItem);
}

// change page function
function changePageElements() {
    // only show elements that are getting activated with this call
    DOM.pageElements.all.hide();
    currentPage.pageElementsDOM.show();
}


// //////////////////////////////////////////////////
// Switch beetween mainnet and testnet
// //////////////////////////////////////////////////

function initMainnet() {

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
    setNetwork();
}
function switchToMainnet() {
    interruptWorkers();
    initMainnet();
    loadWallet();
}

function initTestnet() {

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
    setNetwork();
}
function switchToTestnet() {
    interruptWorkers();
    initTestnet();
    loadWallet();
}


// //////////////////////////////////////////////////
// Options Container
// //////////////////////////////////////////////////

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

function changeToNonSegwit() {
    changeAddressType(GET.addressTypes.nonSegwit);
}

function changeToSegwit() {
    changeAddressType(GET.addressTypes.segwit);
}

function changeToBech32() {
    changeAddressType(GET.addressTypes.bech32);
}

function changeAddressType(newType) {
    interruptWorkers();
    switchURLparam({key: GET.addressTypes.keyword, value: newType});
    recalculateWallet();
}


// option show extended public key
function optionShowXPUBchanged() {
    currentPage.showXPUB = DOM.options.showXPUB.prop('checked');
    if (currentPage.showXPUB) {
        enableAccounts();
        showXPUB = true;
    } else {
        disableAccounts();
        showXPUB = false;
    }
    loadWallet();
}

function setupPageOptions() {
    switch (currentPage) {
        case pages.singleWallet:
            disableAccounts();
            break;
        case pages.paperWallet:
            if (DOM.options.showXPUB.prop('checked')) {
                enableAccounts();
            }else {
                disableAccounts();
            }
            currentPage.numberAddresses = DOM.options.numberAddresses.prop('checked');
            break;
    }

    password = currentPage.defaultPassword;
    DOM.options.encryption.pass.val(currentPage.defaultPassword);
}

function enableAccounts() {

    // set correct options title
    DOM.options.accounts.titleAccounts.hide();
    DOM.options.accounts.titleAddresses.show();

    $('.account-row.not-template span.title').show();
    $('.account-row.not-template button.account-insertion').show();
}

function disableAccounts() {

    // set correct options title
    DOM.options.accounts.titleAccounts.show();
    DOM.options.accounts.titleAddresses.hide();

    if (isAccountsFormEmpty()) {
        initAccountsForm();
    }else {
        accountsForm.splice(1, accountsForm.length - 1); // remove all entries but the first
    }

    showAccountsOptions();
    $('.account-row.not-template span.title').hide();
    $('.account-row.not-template button.account-insertion').hide();
}

function initAccountsForm() {
    accountsForm = [];
    accountsForm.push(currentPage.addressesPerAccount);
}

function addAccount(prev) {

    accountsForm.splice(prev + 1, 0, currentPage.addressesPerAccount);

    // reload the view
    showAccountsOptions();
}

function removeAccount(position) {
    // remove the element from array
    accountsForm.splice(position, 1);

    // reload the view
    showAccountsOptions();
}

function setAddressesPerAccount(index, amount) {
    if (amount > 0) {
        accountsForm[index] = amount;
    }
}

function showAccountsOptions(reset) {
    if (isAccountsFormEmpty() || reset) {
        initAccountsForm();
    }

    // remove all accountsForm to add them again
    $('.account-row.not-template').remove();

    for (var index = accountsForm.length - 1; index >= 0; index--) {

        var accountDiv = DOM.options.accounts.accountTemplate.clone();
        accountDiv.prop('id', 'account-row-' + index);
        accountDiv.addClass('not-template');

        accountDiv.find('.account-number').text('# ' + (index + 1));
        accountDiv.find('input').prop('id', 'addresses-amount-' + index);
        accountDiv.find('input').val(accountsForm[index]);
        accountDiv.find('label').prop('for', 'addresses-amount-' + index);

        if (currentPage.showXPUB) {
            accountDiv.find('.account-number').show();
            accountDiv.find('button').show();
        }

        if (accountsForm.length <= 1) {
            accountDiv.find('button.account-remove').prop('disabled', true);
        }

        // events on buttons and on input change
        (function (accIndex, accDiv) {
            accountDiv.find('button.account-add').click(function () {
                addAccount(accIndex, currentPage.addressesPerAccount);
                loadWallet();
            });
            accountDiv.find('button.account-remove').click(function () {
                removeAccount(accIndex);
                loadWallet();
            });
            accountDiv.find('input#addresses-amount-' + accIndex).change(function () {
                setAddressesPerAccount(accIndex, parseInt(accDiv.find('input#addresses-amount-' + accIndex).val()));
                loadWallet();
            });
        })(index, accountDiv); // pass as argument to anonymous function - this will introduce a new scope


        DOM.options.accounts.accountTemplate.after(accountDiv);
    }
}

function isAccountsFormEmpty() {
    return typeof accountsForm === 'undefined' || accountsForm.length === 0;
}

function togglePasswordVisibility() {
    if (DOM.options.encryption.pass.prop('type') === 'text') {
        DOM.options.encryption.pass.prop('type', 'password');
        DOM.options.encryption.hidePass.html('Show');
    } else {
        DOM.options.encryption.pass.prop('type', 'text');
        DOM.options.encryption.hidePass.html('Hide');
    }
};

function toggleAddressNumbering() {
    currentPage.numberAddresses = DOM.options.numberAddresses.prop('checked');
    loadWallet();
};

function toggleQRcodeLink() {
    useBitcoinLink = DOM.options.qrcodeLink.prop('checked');
    loadWallet();
};

function changePassword() {
    interruptWorkers();
    password = DOM.options.encryption.pass.val();
    initiateWallet(function () {
        loadWallet();
    });
};


// //////////////////////////////////////////////////
// Footer
// //////////////////////////////////////////////////

function toggleUnitTests(){

    showUnitTests = !showUnitTests;

    if(showUnitTests) {
        DOM.footer.mochaWrapper.show();
        // todo remove the other views
    }else{
        DOM.footer.mochaWrapper.hide();
    }
}


// //////////////////////////////////////////////////
// Bitcoin Stuff
// //////////////////////////////////////////////////

function setNetwork() {

    var addressType = getURLparameter(GET.addressTypes.keyword) || defaultAddressType.getParam;

    switch (getURLparameter(GET.network.keyword)) {
        case GET.network.testnet:
            switch (addressType) {
                case GET.addressTypes.nonSegwit:
                    network = TESTNET_NONSEGWIT;
                    break;
                case GET.addressTypes.segwit:
                    network = TESTNET_SEGWIT;
                    break;
                case GET.addressTypes.bech32:
                    network = TESTNET_BECH32;
                    break;
            }
            break;
        case GET.network.mainnet:
        default:
            switch (addressType) {
                case GET.addressTypes.nonSegwit:
                    network = MAINNET_NONSEGWIT;
                    break;
                case GET.addressTypes.segwit:
                    network = MAINNET_SEGWIT;
                    break;
                case GET.addressTypes.bech32:
                    network = MAINNET_BECH32;
                    break;
            }
            break;
    }
}


function recalculateWallet() {
    setNetwork();
    loadWallet();
}

function initiateWallet(cb){
    initiateHDWallet(false, password, useImprovedEntropy, function (result) {
        mnemonic = result;

        DOM.pageLoader.hide();
        DOM.root.show();

        cb();
    });
}

function loadWallet() {

    if (isAccountsFormEmpty()) {
        initAccountsForm();
    }

    createWalletHTML();

    if(currentPage.allowAccounts && showXPUB){
        $('div.xpub-wrapper').show();
    }else{
        $('div.xpub-wrapper').hide();
    }

    if(accountsForm.length > 1){
        $('.account-title').show();
    }else{
        $('.account-title').hide();
    }

    fillWalletHTML();

}

function createWalletHTML(accountIndex){

    DOM.wallet.template.hide();
    DOM.wallet.container.html(DOM.wallet.templateMnemonicWrapper.clone());

    if(!password){
        $('.mnemonic-title').html('Mnemonic');
        $('.privkey-title').html('Private Key');
    }else{
        $('.mnemonic-title').html('Mnemonic [encrypted]');
        $('.privkey-title').html('Private Key [encrypted]');
    }

    DOM.wallet.container.find('.mnemonic').html(mnemonic);

    var mnemonicCanvas = DOM.wallet.container.find('.canvas-mnemonic').get(0);
    QRCode.toCanvas(mnemonicCanvas, mnemonic, function (error) {
        if (error){
            console.error(error);
        }
    });


    foreachCredential(

        // per account
        function (accountIndex){

            $('div#account-' + accountIndex).html('');

            var accountCopy = DOM.wallet.templateAccount.clone();
            accountCopy.prop('id', 'account-' + accountIndex);
            if(accountIndex == 0){
                accountCopy.addClass('first-account');
            }
            accountCopy.find('.account-title').html('Account ' + (accountIndex + 1));
            accountCopy.find('.xpub').prop('id', 'xpub-' + accountIndex);
            accountCopy.find('.canvas-xpub').prop('id', 'canvas-xpub-' + accountIndex);
            accountCopy.find('div.credentials').remove();

            DOM.wallet.container.append(accountCopy);
        },

        // per address
        function (accountIndex, addressIndex) {

            var credentialsCopy = DOM.wallet.templateCredentials.clone();
            credentialsCopy.prop('id', 'credentials-' + accountIndex + '-' + addressIndex);
            credentialsCopy.find('.address').prop('id', 'address-' + accountIndex + '-' + addressIndex);
            credentialsCopy.find('.canvas-address').prop('id', 'canvas-address-' + accountIndex + '-' + addressIndex);
            credentialsCopy.find('.privkey').prop('id', 'privkey-' + accountIndex + '-' + addressIndex);
            credentialsCopy.find('.canvas-privkey').prop('id', 'canvas-privkey-' + accountIndex + '-' + addressIndex);

            if(currentPage.numberAddresses){
                credentialsCopy.find('.address-title').append(' ' + (addressIndex + 1));
            }

            var walletAccount = $('div#account-' + accountIndex);
            walletAccount.append(credentialsCopy);
        }
    );
}

function fillWalletHTML(){

    foreachCredential(
        function (accountIndex) {
            createAccount(network, accountIndex, function (account) {
                $('#xpub-' + accountIndex).html(account.xpub);

                var xpubCanvas = $('#canvas-xpub-' + accountIndex).get(0);
                QRCode.toCanvas(xpubCanvas, account.xpub, function (error) {
                    if (error) {
                        console.error(error);
                    }
                });
            });
        },
        function (accountIndex, addressIndex) {

            asyncCreateCredentials(network, accountIndex, addressIndex, password, function (credentials) {
                removeCredentialsLoadingGui(accountIndex, addressIndex);
                fillCredentials(accountIndex, addressIndex, credentials.address, credentials.privateKey);
            });
        }
    );
}

function foreachCredential(callbackPerAccount, callbackPerAddress){
    // loop through accounts
    for(var accountIndex = 0; accountIndex < accountsForm.length; accountIndex++) {
        callbackPerAccount(accountIndex);
        // loop through addresses
        for (var addressIndex = 0; addressIndex < accountsForm[accountIndex]; addressIndex++) {
            callbackPerAddress(accountIndex, addressIndex);
        }
    }
}

function fillCredentials(accIndex, addIndex, address, privKey){

    var addressLink = useBitcoinLink ? createBitcoinLink(address, accIndex, addIndex) : false;

    var addressIdentifier = 'address-' + accIndex + '-' + addIndex;
    var privKeyIdentifier = 'privkey-' + accIndex + '-' + addIndex;

    fillCredentialsElement(addressIdentifier, address, addressLink);
    fillCredentialsElement(privKeyIdentifier, privKey);
}

function fillCredentialsElement(id, plaintext, link){

    var qrCodeData;

    if(!link){
        $('#' + id).text(plaintext);
        qrCodeData = plaintext;
    }else{
        $('#' + id).html(wrapLinkAroundAddress(id, plaintext, link));
        qrCodeData = link;
    }

    QRCode.toCanvas($('#canvas-' + id).get(0), qrCodeData, function (error) {
        if (error){
            console.error(error);
        }
    });
}

function wrapLinkAroundAddress(id, plaintext, link){
    var html = '<a href="' + link + '" target="_blank">';
    html += plaintext;
    html += '</a>';

    return html;
}

function createBitcoinLink(address, accIndex, addIndex){

    var label;

    switch(currentPage){
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

function removeCredentialsLoadingGui(accountIndex, addressIndex){
    var credentialsDiv = $('div#credentials-' + accountIndex + '-' + addressIndex);

    credentialsDiv.find('.address-wrapper').removeClass('loading');
    credentialsDiv.find('.privkey-wrapper').removeClass('loading');
    credentialsDiv.find('.okay-to-share').show();
    credentialsDiv.find('.keep-secret').show();
    credentialsDiv.find('canvas').show();
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
        var url = window.location.href;
        var paramConcat = (url.indexOf('?') === -1 ? "?" : "&");
        var newURL = url + paramConcat + param.key + "=" + param.value;

        window.history.pushState({path: newURL}, '', newURL);
    }
}

function removeParamFromURL(param) {
    if (history.pushState) {
        var url = window.location.href;

        // check whether the given parameter is actually in the URL
        if (url.indexOf(param) < 0) {
            return;
        }

        var startParam = url.indexOf(param) - 1;
        var endParam = (url.indexOf('&', startParam) <= startParam) ? url.length : url.indexOf('&', startParam);
        var toBeRemoved = url.substring(startParam, endParam);

        var newURL = url.replace(toBeRemoved, '');

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
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(url);
    return results == null ? null : results[1];
}

init();