/*
    Adds multi-threading (with web workers) and caching for the bitcoin library

    // Result Caching
    Caching is only done per mnemonic and is resetted
    on the creation of a new mnemonic.
 */

// //////////////////////////////////////////////////
// requires
// //////////////////////////////////////////////////

const tests = require('../../test/bitcoinTest');
const bitcoin = require('./bitcoin');


// //////////////////////////////////////////////////
// Constants and Variables
// //////////////////////////////////////////////////

// set amount of workers to the amount of cpu cores, or to 8 if the former does not work
const amountOfWorkers = navigator.hardwareConcurrency || 8;
const WORK_IN_PROGRESS = 1;

var workerState = {};
workerState.available = 0;
workerState.busy = 1;

var cache;
var mnemonic;
var workerpool;


function initiateWorkerpool(){
    workerpool = [];

    // var code = '';
    // var blob = new Blob([code], {type: 'application/javascript'});

    for(var x = 0; x < amountOfWorkers; x++){
        // workerpool.push({state: workerState.available, worker: new Worker(URL.createObjectURL(blob))});
        workerpool.push({state: workerState.available, worker: new Worker('js/worker_bundled.js')});
    }

};

function getAvailableWorkerIndex(callback){

    // check every hundert milliseconds for a free worker
    var checkingInterval = setInterval(function () {
        for(var index = 0; index < workerpool.length; index++){
            if(workerpool[index].state === workerState.available){
                // return index;
                clearInterval(checkingInterval);
                callback(index);
                return;
            }
        }
    }, 100);
}

initiateWorkerpool()


// //////////////////////////////////////////////////
// functions
// //////////////////////////////////////////////////

function initiateHDWallet(mnemonic, password) {

    // always reset the cache on new wallets
    cache = [];
    mnemonic = bitcoin.initiateHDWallet(mnemonic, password);

    return bitcoin.initiateHDWallet(mnemonic, password);
}

function createAccount (networkID, index, callback) {

    if(typeof mnemonic === 'undefined'){
        throw 'run initiateHDWallet before calling createAccount()';
    }

    index = index || 0;
    cache[networkID] = cache[networkID] || []; // initialize array if that didn't happen before

    JSON.stringify(bitcoin.createAccount(networkID, index));

    if (typeof cache[networkID][index] === 'undefined') {
            cache[networkID][index] = bitcoin.createAccount(networkID, index)
    }
    callback(cache[networkID][index]);
}

function asyncCreateCredentials(networkID, accountIndex, addressIndex, password, callback){

    if(typeof mnemonic === 'undefined'){
        throw 'run initiateHDWallet before calling asyncCreateCredentials()';
    }

    createAccount (networkID, accountIndex, function () {

        // initiate cache array for all credentials under the given password
        cache[networkID][accountIndex].credentials[password] = cache[networkID][accountIndex].credentials[password] || [];
        var currentCache = cache[networkID][accountIndex].credentials[password][addressIndex];

        // return result from cache if available
        if(currentCache) {
            // if cache is set to WORK_IN_PROGRESS, do nothing.
            // The result will be displayed as soon as the calculation is done.
            if(currentCache !== WORK_IN_PROGRESS){
                callback(currentCache);
            }

            return;
        }


        // calculate the credentials using web workers

        cache[networkID][accountIndex].credentials[password][addressIndex] = WORK_IN_PROGRESS;

        getAvailableWorkerIndex(function (workerID) {

            workerpool[workerID].state = workerState.busy;
            var worker = workerpool[workerID].worker

            worker.onmessage = function (e) {
                cache[networkID][accountIndex].credentials[password][addressIndex] = JSON.parse(e.data);
                workerpool[workerID].state = workerState.available;
                callback(cache[networkID][accountIndex].credentials[password][addressIndex]);
            };

            worker.postMessage(JSON.stringify({
                mnemonic: mnemonic,
                networkID: networkID,
                accountIndex: accountIndex,
                addressIndex: addressIndex,
                password: password
            }));
        });
    });
    
}


// //////////////////////////////////////////////////
// Unit Tests
// //////////////////////////////////////////////////

function runUnitTests() {
    mocha.setup('bdd');
    tests.bitcoinJStests();
    mocha.run();
}