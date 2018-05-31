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

function BitcoinLoader() {

    // //////////////////////////////////////////////////
    // Constants and Variables
    // //////////////////////////////////////////////////

    // set amount of workers to the amount of cpu cores, or to 8 if the former does not work
    const amountOfWorkers = navigator.hardwareConcurrency || 8;
    const WORK_IN_PROGRESS = 1;

    let workerState = {};
    workerState.available = 0;
    workerState.busy = 1;

    let cache;
    let bip38cache; // only used for decryption, encryption is stored in "cache"
    let mnemonic;
    let bip32RootKey;
    let workerpool;
    let queue;


    // //////////////////////////////////////////////////
    // Workerpool
    // //////////////////////////////////////////////////

    const initiateWorkerpool = () => {
        workerpool = [];
        queue = [];

        for (let x = 0; x < amountOfWorkers; x++) {
            workerpool.push({state: workerState.available, worker: createWorker()});
        }

        serveQueue();
    };

    const createWorker = () => {

        let workerCode = 'WORKER_CODE_PLACEHOLDER'; // is replaced with actual JS code by gulp task
        let blob = new Blob([workerCode], {type: 'application/javascript'});

        return new Worker(URL.createObjectURL(blob));
    }

    const getFreeWorkerIndex = () => {
        for (let index = 0; index < amountOfWorkers; index++) {
            if (workerpool[index].state === workerState.available) {
                return index;
            }
        }
        return false;
    }

    const serveQueue = () => {

        // check every hundred milliseconds for a free worker
        let checkingInterval = setInterval(function () {

            // is set to the amount of work to be done, but maximum the amount of workers available
            let workForThisInterval = (queue.length < amountOfWorkers) ? queue.length : amountOfWorkers;

            for (let w = 0; w < workForThisInterval; w++) {

                let workerIndex = getFreeWorkerIndex();

                if (workerIndex !== false) {
                    let callback = getElementFromQueue();
                    callback(getFreeWorkerIndex());
                }
            }
        }, 100);
    }

    const addToQueue = (callback) => {
        queue.push(callback);
    }

    const getElementFromQueue = () => {
        return queue.shift();
    }

    const clearQueue = () => {
        queue = [];
    }

    this.interruptWorkers = () => {

        clearQueue();

        for (let index = 0; index < workerpool.length; index++) {
            if (workerpool[index].state === workerState.busy) {

                // reset the worker
                workerpool[index].worker.terminate();
                workerpool[index].worker = createWorker();

                // make worker available to the pool again
                workerpool[index].state = workerState.available;
            }
        }
    }

    initiateWorkerpool()


    // //////////////////////////////////////////////////
    // Bitcoin functions
    // //////////////////////////////////////////////////

    this.initiateHDWallet = (loadMnemonic, password, useImprovedEntropy, cb) => {

        // always reset the cache on new wallets
        cache = [];

        bitcoin.initiateHDWallet(loadMnemonic, password, useImprovedEntropy, function (resultMnemonic, resultBip32RootKey) {
            mnemonic = resultMnemonic;
            bip32RootKey = resultBip32RootKey;
            cb(mnemonic, bip32RootKey);
        });
    }

    this.getMnemonic = () => mnemonic;

    this.createAccount = (networkID, index, callback) => {

        if (typeof mnemonic === 'undefined') {
            throw 'you must run initiateHDWallet before calling createAccount()';
        }

        index = index || 0;
        cache[networkID] = cache[networkID] || []; // initialize array if that didn't happen before

        if (typeof cache[networkID][index] === 'undefined') {
            cache[networkID][index] = bitcoin.createAccount(bip32RootKey, networkID, index)
        }
        callback(cache[networkID][index]);
    }

    this.asyncCreateCredentials = (networkID, accountIndex, addressIndex, password, callback) => {

        if (typeof mnemonic === 'undefined') {
            throw 'you must run initiateHDWallet before calling asyncCreateCredentials()';
        }

        this.createAccount(networkID, accountIndex, function () {

            setTimeout(function () {

                // initiate cache array for all credentials under the given password
                cache[networkID][accountIndex].credentials[password] = cache[networkID][accountIndex].credentials[password] || [];
                let currentCache = cache[networkID][accountIndex].credentials[password][addressIndex];

                // return result from cache if available
                if (currentCache) {
                    // if cache is set to WORK_IN_PROGRESS, do nothing.
                    // The result will be displayed as soon as the calculation is done.
                    if (currentCache !== WORK_IN_PROGRESS) {
                        callback(currentCache);
                    }

                    return;
                }


                // calculate the credentials using web workers
                cache[networkID][accountIndex].credentials[password][addressIndex] = WORK_IN_PROGRESS;

                let credentials = bitcoin.createCredentials(cache[networkID][accountIndex].external, addressIndex);

                if (!password) {
                    cache[networkID][accountIndex].credentials[password][addressIndex] = credentials;
                    callback(credentials);
                } else {

                    // asynchronous BIP38 encryption with web workers

                    addToQueue(function (workerID) {

                        workerpool[workerID].state = workerState.busy;
                        let worker = workerpool[workerID].worker;

                        worker.onmessage = function (e) {

                            cache[networkID][accountIndex].credentials[password][addressIndex] = credentials;
                            cache[networkID][accountIndex].credentials[password][addressIndex].privateKey = e.data;
                            workerpool[workerID].state = workerState.available;

                            callback(cache[networkID][accountIndex].credentials[password][addressIndex]);
                        };

                        worker.postMessage(JSON.stringify({
                            mode: 'encrypt',
                            address: credentials.address,
                            privateKey: credentials.privateKey,
                            password: password
                        }));
                    });
                }

            }, 0);
        });

    }

    const runPrivateKeyDecryption = (encryptedPrivKey, password, success, failure) => {

        // reset workers if there are still some working
        // (user changed password or encrypted private key, while previous encryption was still ongoing)
        this.interruptWorkers();

        addToQueue(function (workerID) {

            workerpool[workerID].state = workerState.busy;
            let worker = workerpool[workerID].worker;

            worker.onmessage = function (e) {

                workerpool[workerID].state = workerState.available;

                if (e.data === 'error') {
                    failure();
                } else {
                    success(JSON.parse(e.data));
                }
            };

            worker.postMessage(JSON.stringify({
                mode: 'decrypt',
                privateKey: encryptedPrivKey,
                password: password
            }));
        });
    }

    this.getCredentialsFromEncryptedPrivKey = (encryptedPrivKey, password, testnet, success, otherNetwork, failure) => {

        bip38cache = cache || [];
        bip38cache[encryptedPrivKey] = bip38cache[encryptedPrivKey] || [];
        bip38cache[encryptedPrivKey][password] = bip38cache[encryptedPrivKey][password] || [];

        if (bip38cache[encryptedPrivKey][password][testnet]) {
            success(bip38cache[encryptedPrivKey][password][testnet]);
        } else {

            let cb = function (result) {

                let credentials = getCredentialsFromBIP38Result(result, testnet);

                if (credentials) {
                    success(credentials);

                    // cache the result
                    bip38cache[encryptedPrivKey][password][testnet] = credentials;
                } else {
                    // check whether user is in wrong network mode (mainnet/testnet)
                    if (getCredentialsFromBIP38Result(result, !testnet)) {
                        otherNetwork();
                    } else {
                        failure();
                    }
                }
            }

            runPrivateKeyDecryption(encryptedPrivKey, password, cb, failure);
        }
    }

    const getCredentialsFromBIP38Result = (result, testnet) => {
        let decrypted = testnet ? result.testnet : result.mainnet;
        let privKey = decrypted.privateKey;
        let salt = Uint8Array.from(decrypted.salt.data);

        return bitcoin.getCredentialsFromPrivKeyAndSalt(privKey, salt, testnet);
    }

    // //////////////////////////////////////////////////
    // Unit Tests
    // //////////////////////////////////////////////////

    this.runUnitTests = (runSlowTests, cbSuccessful, cbFailure) => {
        mocha.setup('bdd');
        tests.bitcoinJStests();

        if (runSlowTests) {
            tests.bip38Tests();
        }

        let testsFailed = false;

        mocha.run()
            .on('fail', function () {
                testsFailed = true;
                cbFailure();
            })
            .on('end', function () {
                if (!testsFailed) {
                    cbSuccessful();
                }
            });
    }
}