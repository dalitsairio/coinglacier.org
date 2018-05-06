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
var bip32RootKey;
var workerpool;
var queue;


function initiateWorkerpool(){
    workerpool = [];
    queue = [];

    var workerCode = 'WORKER_CODE_PLACEHOLDER'; // is replaced with actual JS code by gulp task
    var blob = new Blob([workerCode], {type: 'application/javascript'});

    for(var x = 0; x < amountOfWorkers; x++){
        workerpool.push({state: workerState.available, worker: new Worker(URL.createObjectURL(blob))});
    }

    serveQueue();
};

function getFreeWorkerIndex(){
    for (var index = 0; index < amountOfWorkers; index++) {
        if (workerpool[index].state === workerState.available) {
            return index;
        }
    }
    return false;
}

function serveQueue(){

    // check every hundred milliseconds for a free worker
    var checkingInterval = setInterval(function () {

        // is set to the amount of work to be done, but maximum the amount of workers available
        var workForThisInterval = (queue.length < amountOfWorkers) ? queue.length : amountOfWorkers;

        for (var w = 0; w < workForThisInterval; w++) {

            var workerIndex = getFreeWorkerIndex();

            if(workerIndex !== false) {
                var callback = getElementFromQueue();
                callback(getFreeWorkerIndex());
            }
        }
    }, 100);
}

function addToQueue(callback){
    queue.push(callback);
}

function getElementFromQueue(){
    return queue.shift();
}

function clearQueue(){
    queue = [];
}

function interruptWorkers(){

    clearQueue();

    for(var index = 0; index < workerpool.length; index++){
        if(workerpool[index].state === workerState.busy){

            // reset the worker
            workerpool[index].worker.terminate();
            workerpool[index].worker = undefined;

            // make worker available to the pool again
            workerpool[index].state = workerState.available;
        }
    }
}

initiateWorkerpool()


// //////////////////////////////////////////////////
// functions
// //////////////////////////////////////////////////

function initiateHDWallet(loadMnemonic, password, useImprovedEntropy, cb) {

    // always reset the cache on new wallets
    cache = [];

    bitcoin.initiateHDWallet(loadMnemonic, password, useImprovedEntropy, function (resultMnemonic, resultBip32RootKey) {
        mnemonic = resultMnemonic;
        bip32RootKey = resultBip32RootKey;
        cb(mnemonic, bip32RootKey);
    });
}

function createAccount (networkID, index, callback) {

    if(typeof mnemonic === 'undefined'){
        throw 'you must run initiateHDWallet before calling createAccount()';
    }

    index = index || 0;
    cache[networkID] = cache[networkID] || []; // initialize array if that didn't happen before

    if (typeof cache[networkID][index] === 'undefined') {
            cache[networkID][index] = bitcoin.createAccount(bip32RootKey, networkID, index)
    }
    callback(cache[networkID][index]);
}

function asyncCreateCredentials(networkID, accountIndex, addressIndex, password, callback){

    if(typeof mnemonic === 'undefined'){
        throw 'you must run initiateHDWallet before calling asyncCreateCredentials()';
    }

    createAccount (networkID, accountIndex, function () {

        setTimeout(function () {

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

            var credentials = bitcoin.createCredentials(cache[networkID][accountIndex].external, addressIndex);

            if(!password){
                cache[networkID][accountIndex].credentials[password][addressIndex] = credentials;
                callback(credentials);
            }else{

                // asynchronous BIP38 encryption with web workers

                addToQueue(function (workerID) {

                    workerpool[workerID].state = workerState.busy;
                    var worker = workerpool[workerID].worker;

                    worker.onmessage = function (e) {

                        cache[networkID][accountIndex].credentials[password][addressIndex] = credentials;
                        cache[networkID][accountIndex].credentials[password][addressIndex].privateKey = e.data;
                        workerpool[workerID].state = workerState.available;

                        callback(cache[networkID][accountIndex].credentials[password][addressIndex]);
                    };

                    worker.postMessage(JSON.stringify({
                        privateKey: credentials.privateKey,
                        password: password
                    }));
                });
            }

        }, 0);
    });
    
}


// //////////////////////////////////////////////////
// Unit Tests
// //////////////////////////////////////////////////

function runUnitTests(runSlowTests) {
    mocha.setup('bdd');
    tests.bitcoinJStests();

    if(runSlowTests) {
        tests.bip38Tests();
    }

    mocha.run();
}