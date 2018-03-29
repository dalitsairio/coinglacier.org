const tests = require('../../test/bitcoinTest');

const network = 'network';
const testnet = 'testnet';

if(getURLparameter(network) === testnet){
    initTestnet();
}else{
    initMainnet();
}

$("#testnet-link").click(function() {
    addParamToURL({key: network, value: testnet});
    initTestnet();
});

$("#mainnet-link").click(function() {
    removeParamFromURL(network);
    initMainnet();
});

function initMainnet() {
    $('#mainnet-link').hide();
    $('#testnet-link').show();
    $('#root-container').removeClass('testnet');
    $('#root-container').addClass('mainnet');
}

function initTestnet() {
    $('#testnet-link').hide();
    $('#mainnet-link').show();
    $('#root-container').removeClass('mainnet');
    $('#root-container').addClass('testnet');
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
    url = url || window.location.href;
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( url );
    return results == null ? null : results[1];
}




mocha.setup('bdd');
tests.bitcoinJStests();
mocha.run();

module.exports = {
    bitcoin: require('./bitcoin')
};
