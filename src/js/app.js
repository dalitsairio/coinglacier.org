// //////////////////////////////////////////////////
// Constants and Variables
// //////////////////////////////////////////////////

// bitcoin network
var network;
var currentPage;
var password;
var accountsForm;
var mnemonic;


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

// CSS classes
var classes = {};
classes.activeMenuItem = 'active';
classes.testnet = 'testnet';


// //////////////////////////////////////////////////
// Document Object Model
// //////////////////////////////////////////////////

var DOM = {};

DOM.body = $('body');

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

DOM.popovers = {};
DOM.popovers.testnetWarning = $('#testnet-warning');
DOM.popovers.showXPUB = $('#showXPUBlabel');
DOM.popovers.encryption = $('#password-input-group');
DOM.popovers.numberAddresses = $('#address-numbering-label');


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
pages.singleWallet.showXPUB = false;
pages.singleWallet.numberAddresses = false;
pages.singleWallet.defaultPassword = '';

pages.paperWallet = {};
pages.paperWallet.pageElementsDOM = DOM.pageElements.paperWallet;
pages.paperWallet.menuEntryDOM = DOM.menuEntry.paperWallet;
pages.paperWallet.getParam = GET.pages.paperWallet;
// set default values
pages.paperWallet.addressesPerAccount = 3;
pages.paperWallet.showXPUB = false;
pages.paperWallet.numberAddresses = true;
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

    loadWallet();

    // run unit tests
    runUnitTests();
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
    initMainnet();
    loadWallet();
}

function initTestnet() {

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
    switchURLparam({key: GET.addressTypes.keyword, value: newType});
    recalculateWallet();
}


// option show extended public key
function optionShowXPUBchanged() {
    currentPage.showXPUB = DOM.options.showXPUB.prop('checked');
    if (currentPage.showXPUB) {
        enableAccounts();
    } else {
        disableAccounts();
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

function changePassword() {
    password = DOM.options.encryption.pass.val();
    loadWallet(true);
};


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


mnemonic = initiateHDWallet('curve swear maze domain knock frozen ordinary climb love possible brave market', password);

function loadWallet(newMnemonic) {

    if(newMnemonic){
        mnemonic = initiateHDWallet('curve swear maze domain knock frozen ordinary climb love possible brave market', password);
    }

    if (isAccountsFormEmpty()) {
        initAccountsForm();
    }

// todo do this the right way
    var div_tag = document.getElementById('temporary');
    div_tag.innerHTML = createWalletHTML();

    fillWalletHTML();

}

// todo this function will be replaced properly with templates n' stuff
function createWalletHTML(){
    var html_output = "<h1>" + mnemonic + "</h1>";

    foreachCredential(function (accountIndex, addressIndex) {

        var title = 'lorem ipsum';

        if (currentPage.numberAddresses) {
            title += ' [Address ' + (addressIndex + 1) + ']';
        }
        html_output += '<h2>' + title + '</h2><table>';
        html_output += '<tr><td><b>Address</b></td><td id="address-' + accountIndex + '-' + addressIndex + '"> ... wait ... </td></tr>';
        html_output += '<tr><td><b>Private Key</b></td><td id="privkey-' + accountIndex + '-' + addressIndex + '"> ... wait ... </td></tr>';
        html_output += "</table>";
    });

    return html_output;
}

function fillWalletHTML(){

    foreachCredential(function (accountIndex, addressIndex) {

        asyncCreateCredentials(network, accountIndex, addressIndex, password, function (credentials) {
            $('td#address-' + accountIndex + '-' + addressIndex).text(credentials.address);
            $('td#privkey-' + accountIndex + '-' + addressIndex).text(credentials.privateKey);
        });
    });
}

function foreachCredential(callback){

    // loop through accounts
    for(var accountIndex = 0; accountIndex < accountsForm.length; accountIndex++) {
        // loop through addresses
        for (var addressIndex = 0; addressIndex < accountsForm[accountIndex]; addressIndex++) {
            callback(accountIndex, addressIndex);
        }
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
