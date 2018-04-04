
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
var showXPUB;

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
DOM.network.mainnet = $("#mainnet-link");
DOM.network.testnet = $("#testnet-link");
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

DOM.popovers = {};
DOM.popovers.testnetWarning = $("#testnet-warning");
DOM.popovers.showXPUB = $("#showXPUBlabel");


// //////////////////////////////////////////////////
// Options
// //////////////////////////////////////////////////

const defaultAddressType = {
    getParam: GET.addressTypes.segwit,
    optionsDOM: DOM.options.addressTypes.segwit
};
const defaultPage = {
    pageElementsDOM: DOM.pageElements.singleWallet,
    menuEntryDOM: DOM.menuEntry.singleWallet,
    getParam: GET.pages.singleWallet
};
showXPUB = false;


// //////////////////////////////////////////////////
// Events
// //////////////////////////////////////////////////

// Mainnet/Testnet Link
DOM.network.testnet.click(initTestnet);
DOM.network.mainnet.click(initMainnet);

// Menu
DOM.menuEntry.singleWallet.click(function() {
    changePage(DOM.pageElements.singleWallet, DOM.menuEntry.singleWallet, GET.pages.singleWallet)
});
DOM.menuEntry.paperWallet.click(function() {
    changePage(DOM.pageElements.paperWallet, DOM.menuEntry.paperWallet, GET.pages.paperWallet)
});

// Options
// Address Types
DOM.options.addressTypes.nonSegwit.click(changeToNonSegwit);
DOM.options.addressTypes.segwit.click(changeToSegwit);
DOM.options.addressTypes.bech32.click(changeToBech32);
// Show XPUB
DOM.options.showXPUB.change(optionShowXPUBchanged);


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
            changePage(DOM.pageElements.paperWallet, DOM.menuEntry.paperWallet, GET.pages.paperWallet);
            break;
        case GET.pages.singleWallet:
            changePage(DOM.pageElements.singleWallet, DOM.menuEntry.singleWallet, GET.pages.singleWallet);
        default:
            changePage(defaultPage.pageElementsDOM, defaultPage.menuEntryDOM, defaultPage.getParam);
            break;
    }

    // initialize popovers
    for (var x in DOM.popovers) {
        DOM.popovers[x].popover({html:true});
    }

    // unit tests
    runUnitTests();
}


// //////////////////////////////////////////////////
// Page Management
// //////////////////////////////////////////////////

function changePage(pageElementsDOM, menuEntryDOM, pageKeyword){
    changePageElements(pageElementsDOM);
    switchMenuLink(menuEntryDOM);
    switchURLparam({key: GET.pages.keyword, value: pageKeyword});
}

// set new menu link to active
function switchMenuLink(DOMtoActivate){
    DOM.menu.find('.' + classes.activeMenuItem).removeClass(classes.activeMenuItem);
    DOMtoActivate.addClass(classes.activeMenuItem);
}

// change page function
function changePageElements(DOMtoShow){
    // only show elements that are getting activated with this call
    DOM.pageElements.all.hide();
    DOMtoShow.show();
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
if(getURLparameter(GET.addressTypes.keyword)){

    DOM.options.addressTypes.all.prop('checked', false);

    switch(getURLparameter(GET.addressTypes.keyword)){
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

function changeAddressType(newType){
    switchURLparam({key: GET.addressTypes.keyword, value: newType});
    recalculateWallet();
}


// option show extended public key
function optionShowXPUBchanged(){
    showXPUB = DOM.options.showXPUB.prop('checked');
    loadWallet();
}


// //////////////////////////////////////////////////
// Bitcoin Stuff
// //////////////////////////////////////////////////

function setNetwork(){

    var addressType = getURLparameter(GET.addressTypes.keyword) || defaultAddressType.getParam;

    switch(getURLparameter(GET.network.keyword)){
        case GET.network.testnet:
            switch(addressType){
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
            switch(addressType){
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


function recalculateWallet(){
    setNetwork();
    loadWallet();
}

// todo this function will be replaced properly
function loadWallet() {

    var mnemonic = bitcoin.initiateHDWallet('curve swear maze domain knock frozen ordinary climb love possible brave market');

    html_output = "<h1>" + mnemonic + "</h1>";

    var div_tag = document.getElementById('temporary');

    var x = {
        dynamic: bitcoin.createP2PKHaddresses([1], network),
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
                html_output += "<h2>" + i + "</h2><table>";

                $.each(data, function (inner_index, inner_data) {
                    html_output += "<tr><td><b>" + inner_index + "</b></td><td>" + inner_data + "</td></tr>";
                });

                if(showXPUB) {
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
function switchURLparam(param){
    removeParamFromURL(param.key)
    addParamToURL(param);
}

// param requires object {key: key, value: value}
function addParamToURL(param){

    // check if URL already contains param
    if(getURLparameter(param.key)){
        return;
    }

    if (history.pushState) {
        var url = window.location.href;
        var paramConcat = (url.indexOf('?') === -1 ? "?" : "&");
        var newURL = url + paramConcat + param.key + "=" + param.value;

        window.history.pushState({path:newURL},'',newURL);
    }
}

function removeParamFromURL(param){
    if (history.pushState) {
        var url = window.location.href;

        // check whether the given parameter is actually in the URL
        if(url.indexOf(param) < 0){
            return;
        }

        var startParam = url.indexOf(param) -1;
        var endParam = (url.indexOf('&', startParam) <= startParam) ? url.length : url.indexOf('&', startParam);
        var toBeRemoved = url.substring(startParam, endParam);

        var newURL = url.replace(toBeRemoved, '');

        // if there are params left, make sure the first one starts with '?'
        if(newURL.indexOf('&') >= 0 && newURL.indexOf('?') < 0){
            newURL = newURL.replace('&', '?'); // replace first occurrence of & with ?
        }

        window.history.pushState({path:newURL},'',newURL);
    }
}

function getURLparameter(name, url){

    if(!name){
        return null;
    }

    url = url || window.location.href;
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
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
