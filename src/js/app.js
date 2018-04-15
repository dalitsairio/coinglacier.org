// //////////////////////////////////////////////////
// requires
// //////////////////////////////////////////////////

const tests = require('../../test/bitcoinTest');
const bitcoin = require('./bitcoin');


// //////////////////////////////////////////////////
// Constants and Variables
// //////////////////////////////////////////////////

// bitcoin network
// contains not only network information, but also address type specific information
var network;
var accounts;
var currentPage;
var password;

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
DOM.options.accountTemplate = $('#account-row-template');
DOM.options.encryption = {};
DOM.options.encryption.pass = $('input#password');
DOM.options.encryption.hidePass = $('span#hidePass');
DOM.options.numberAddresses = $('input#number-addresses');

DOM.popovers = {};
DOM.popovers.testnetWarning = $('#testnet-warning');
DOM.popovers.showXPUB = $('#showXPUBlabel');
DOM.popovers.encryption = $('input#password');
DOM.popovers.encryption = $('#address-numbering-label');


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
DOM.network.testnet.click(initTestnet);
DOM.network.mainnet.click(initMainnet);

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
            changePage(pages.paperWallet);
            break;
        case GET.pages.singleWallet:
            changePage(pages.singleWallet);
        default:
            changePage(currentPage);
            break;
    }

    // initialize popovers
    for (var x in DOM.popovers) {
        DOM.popovers[x].popover({html: true});
    }

    showAccountsOptions();

    password = currentPage.defaultPassword;

    loadWallet();

    // unit tests
    runUnitTests();
}


// //////////////////////////////////////////////////
// Page Management
// //////////////////////////////////////////////////

function changePage(newPage) {
    currentPage = newPage;

    setupPageOptions();
    changePageElements();
    switchMenuLink();
    switchURLparam({key: GET.pages.keyword, value: currentPage.getParam});

    // reload the page
    showAccountsOptions(true);
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
    recalculateWallet();
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
    recalculateWallet();
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
    $('.account-row.not-template span.title').show();
    $('.account-row.not-template button.account-insertion').show();
}

function disableAccounts() {
    if (isAccountsEmpty()) {
        initAccounts();
    }else {
        accounts.splice(1, accounts.length - 1); // remove all entries but the first
    }

    showAccountsOptions();
    $('.account-row.not-template span.title').hide();
    $('.account-row.not-template button.account-insertion').hide();
    loadWallet();
}

function initAccounts() {
    accounts = [];
    accounts.push(currentPage.addressesPerAccount);
}

function addAccount(prev) {
    accounts.splice(prev + 1, 0, currentPage.addressesPerAccount);

    // reload the view
    showAccountsOptions();
}

function removeAccount(position) {
    // remove the element from array
    accounts.splice(position, 1);

    // reload the view
    showAccountsOptions();
}

function setAddressesPerAccount(index, amount) {
    if (amount > 0) {
        accounts[index] = amount;
    }
}

function showAccountsOptions(reset) {

    if (isAccountsEmpty() || reset) {
        initAccounts();
    }

    // remove all accounts to add them again
    $('.account-row.not-template').remove();

    for (var index = accounts.length - 1; index >= 0; index--) {

        var accountDiv = DOM.options.accountTemplate.clone();
        accountDiv.prop('id', 'account-row-' + index);
        accountDiv.addClass('not-template');

        accountDiv.find('.title').text('# ' + (index + 1));
        accountDiv.find('input').prop('id', 'addresses-amount-' + index);
        accountDiv.find('input').val(accounts[index]);
        accountDiv.find('label').prop('for', 'addresses-amount-' + index);

        if (currentPage.showXPUB) {
            accountDiv.find('.title').show();
            accountDiv.find('button').show();
        }

        if (accounts.length <= 1) {
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


        DOM.options.accountTemplate.after(accountDiv);
    }
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
    loadWallet();
};

function isAccountsEmpty() {
    return typeof accounts === 'undefined' || accounts.length === 0;
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
                    network = bitcoin.networks.testnet;
                    break;
                case GET.addressTypes.segwit:
                    network = bitcoin.networks.testnet.p2wpkhInP2sh;
                    break;
                case GET.addressTypes.bech32:
                    network = bitcoin.networks.testnet.p2wpkh;
                    break;
            }
            break;
        default:
            switch (addressType) {
                case GET.addressTypes.nonSegwit:
                    network = bitcoin.networks.bitcoin;
                    break;
                case GET.addressTypes.segwit:
                    network = bitcoin.networks.bitcoin.p2wpkhInP2sh;
                    break;
                case GET.addressTypes.bech32:
                    network = bitcoin.networks.bitcoin.p2wpkh;
                    break;
            }
            break;
    }
}


function recalculateWallet() {
    setNetwork();
    loadWallet();
}

// todo this function will be replaced properly

var mnemonic = bitcoin.initiateHDWallet('curve swear maze domain knock frozen ordinary climb love possible brave market', password, true);

function loadWallet() {

    html_output = "<h1>" + mnemonic + "</h1>";

    var div_tag = document.getElementById('temporary');

    var x = {
        dynamic: bitcoin.createP2PKHaddresses(accounts, network, password),
        // non_segwit_mainnet_encrypted: bitcoin.createP2PKHaddresses([1], bitcoin.networks.bitcoin.p2wpkh, 'MoonLambo'),
        // non_segwit_testnet: bitcoin.createP2PKHaddresses([2, 3], bitcoin.networks.testnet),
        // p2sh_p2wpkh_mainnet: bitcoin.createP2PKHaddresses(1, bitcoin.networks.bitcoin.p2wpkhInP2sh),
        // p2sh_p2wpkh_testnet: bitcoin.createP2PKHaddresses(2, bitcoin.networks.testnet.p2wpkhInP2sh),
        // bech32_mainnet: bitcoin.createP2PKHaddresses([1], bitcoin.networks.bitcoin.p2wpkh),
        // bech32_testnet: bitcoin.createP2PKHaddresses([2], bitcoin.networks.testnet.p2wpkh),
        // bech32_mainnet_multi: bitcoin.createP2PKHaddresses([3, 3], bitcoin.networks.testnet.p2wpkh)
    }


    $.each(x, function (i, dataset) {
        $.each(dataset, function (accountIndex, addresses) {
            $.each(addresses.credentials, function (index, data) {

                var title = i;
                if (currentPage.numberAddresses) {
                    title += ' [Address ' + index + ']';
                }
                html_output += "<h2>" + title + "</h2><table>";

                $.each(data, function (inner_index, inner_data) {
                    html_output += "<tr><td><b>" + inner_index + "</b></td><td>" + inner_data + "</td></tr>";
                });

                if (currentPage.showXPUB) {
                    html_output += "<tr><td><b>XPUB</b></td><td>" + addresses.xpub + "</td></tr>";
                }


                html_output += "</table>";
            });
        });
    });

    div_tag.innerHTML = html_output;

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


// //////////////////////////////////////////////////
// Unit Tests
// //////////////////////////////////////////////////

function runUnitTests() {
    mocha.setup('bdd');
    tests.bitcoinJStests();
    mocha.run();
}

init();
