/*
    Adds multi-threading (with web workers) and caching for the bitcoin library
    and adds possibility to run the unit tests in the Browsers

    // Result Caching
    Caching is only done per mnemonic and is resetted
    on the creation of a new mnemonic.
 */

// //////////////////////////////////////////////////
// requires
// //////////////////////////////////////////////////

const tests = require('../../test/bitcoinTest');
const bitcoin = require('./bitcoin');

function WorkerPool (){

    // set amount of workers to the amount of cpu cores, or to 8 if the former does not work
    const amountOfWorkers = navigator.hardwareConcurrency || 8;
    const workerState = {
        available: 0,
        busy: 1
    };

    let pool;
    let queue;


    this.init = () => {
        pool = [];
        queue = [];

        for (let x = 0; x < amountOfWorkers; x++) {
            pool.push({state: workerState.available, worker: createWorker()});
        }

        serveQueue();
    };

    this.interruptWorkers = () => {

        clearQueue();

        for (let index = 0; index < pool.length; index++) {
            resetWorker(pool[index]);
        }
    }

    this.addToQueue = (callData, callback) => {
        queue.push({callData: callData, callback: callback});
    }


    const getElementFromQueue = () => queue.shift();
    const clearQueue = () => { queue = []; }

    const createWorker = () => {

        let workerCode = 'WORKER_CODE_PLACEHOLDER'; // is replaced with actual JS code by gulp task
        let blob = new Blob([workerCode], {type: 'application/javascript'});

        return new Worker(URL.createObjectURL(blob));;
    }

    const getFreeWorkerIndex = () => {
        for (let index = 0; index < amountOfWorkers; index++) {
            if (pool[index].state === workerState.available) {
                return index;
            }
        }
        return false;
    }

    const serveQueue = () => {

        // check every hundred milliseconds for a free worker
        setInterval(function () {

            // is set to the amount of work to be done, but maximum the amount of workers available
            let workForThisInterval = (queue.length < amountOfWorkers) ? queue.length : amountOfWorkers;

            for (let w = 0; w < workForThisInterval; w++) {

                let workerIndex = getFreeWorkerIndex();

                // if no more free worker is left, break out of for loop
                if (workerIndex === false){
                    break;
                }

                runWorker(workerIndex, getElementFromQueue());
            }
        }, 100);
    }

    const runWorker = (workerIndex, task) => {
        pool[workerIndex].worker.onmessage = function (e) {
            pool[workerIndex].state = workerState.available;
            task.callback(e.data);
        };

        pool[workerIndex].state = workerState.busy;
        pool[workerIndex].worker.postMessage(JSON.stringify(task.callData));
    }

    const resetWorker = (workerObj) => {
        if (workerObj.state === workerState.busy) {

            // reset the worker
            workerObj.worker.terminate();
            workerObj.worker = createWorker();

            // make worker available to the pool again
            workerObj.state = workerState.available;
        }
    }
}

function BitcoinLoader() {

    const WORK_IN_PROGRESS = 1;

    let cache;
    let bip38cache; // only used for decryption, encryption is stored in "cache"
    let mnemonic;
    let bip32RootKey;

    const workerPool = new WorkerPool();
    workerPool.init();


    this.initiateHDWallet = (loadMnemonic, password, useImprovedEntropy, cb) => {

        // always reset the cache on new wallets
        cache = [];

        bitcoin.initiateHDWallet(loadMnemonic, password, useImprovedEntropy, function (resultMnemonic, resultRootKey) {
            mnemonic = resultMnemonic;
            bip32RootKey = resultRootKey;
            cb(mnemonic, bip32RootKey);
        });
    }

    this.getMnemonic = () => mnemonic;

    this.createAccount = (networkID, index, callback) => {

        if (typeof mnemonic === 'undefined') {
            throw 'you must run initiateHDWallet before calling createAccount()';
        }

        index = index || 0;
        cache[networkID] = cache[networkID] || []; // initialize cache array if that didn't happen before

        if (typeof cache[networkID][index] === 'undefined') {
            cache[networkID][index] = bitcoin.createAccount(bip32RootKey, networkID, index)
        }
        callback(cache[networkID][index]);
    }

    this.asyncCreateCredentials = (networkID, accountIndex, addressIndex, encryption, callback) => {

        if (typeof mnemonic === 'undefined') {
            throw 'you must run initiateHDWallet before calling asyncCreateCredentials()';
        }

        this.createAccount(networkID, accountIndex, function () {

            setTimeout(function () {

                // initiate cache array for all credentials under the given password
                cache[networkID][accountIndex].credentials[encryption.password] = cache[networkID][accountIndex].credentials[encryption.password] || [];
                let currentCache = cache[networkID][accountIndex].credentials[encryption.password][addressIndex];

                // return result from cache if available
                if (currentCache) {
                    // if cache is set to WORK_IN_PROGRESS, do nothing.
                    // The result will be displayed as soon as the calculation is done.
                    if (currentCache !== WORK_IN_PROGRESS) {
                        callback(currentCache);
                    }
                    return;
                }

                // calculate address now (asynchronously when doing encryption)
                cache[networkID][accountIndex].credentials[encryption.password][addressIndex] = WORK_IN_PROGRESS;

                let credentials = bitcoin.createCredentials(cache[networkID][accountIndex].external, addressIndex);

                let processResult = (credentials) => {
                    cache[networkID][accountIndex].credentials[encryption.password][addressIndex] = credentials;
                    callback(credentials);
                }

                if (encryption.password && encryption.bip38encrypt) {
                    runPrivateKeyEncryption(function (credentialsEncrypted){
                        processResult(credentialsEncrypted);
                    }, credentials);
                } else {
                    processResult(credentials);
                }
            }, 0);
        });

    }

    this.interrupt = () => workerPool.interruptWorkers();

    const runPrivateKeyEncryption = (cb, credentials) => {

        // asynchronous BIP38 encryption with web workers
        let callData = {
            mode: 'encrypt',
            address: credentials.address,
            privateKey: credentials.privateKey,
            password: password
        };

        let onResponse = (response) => {
            credentials.privateKey = response;
            cb(credentials);
        }

        workerPool.addToQueue(callData, onResponse);
    }

    const runPrivateKeyDecryption = (encryptedPrivKey, password, success, failure) => {

        // reset workers if there are still some working
        // (user changed password or encrypted private key, while previous encryption was still ongoing)
        workerPool.interruptWorkers();

        // asynchronous BIP38 decryption with web workers
        let callData = {
            mode: 'decrypt',
            privateKey: encryptedPrivKey,
            password: password
        };

        let onResponse = (response) => {
            if (response === 'error') {
                failure();
            } else {
                success(JSON.parse(response));
            }
        }

        workerPool.addToQueue(callData, onResponse);
    }

    this.getCredentialsFromEncryptedPrivKey = (encryptedPrivKey, password, testnet, success, otherNetwork, failure) => {

        bip38cache = bip38cache || [];
        bip38cache[encryptedPrivKey] = bip38cache[encryptedPrivKey] || [];
        bip38cache[encryptedPrivKey][password] = bip38cache[encryptedPrivKey][password] || [];

        if (bip38cache[encryptedPrivKey][password][testnet]) {
            success(bip38cache[encryptedPrivKey][password][testnet]);
        } else {
            let cb = (result) => {
                let credentials = processPrivKeyDecryptionResult(result, testnet, success, otherNetwork, failure);
                // cache the result
                bip38cache[encryptedPrivKey][password][testnet] = credentials;
            }

            runPrivateKeyDecryption(encryptedPrivKey, password, cb, failure);
        }
    }

    const processPrivKeyDecryptionResult = (result, testnet, success, otherNetwork, failure) => {

        let credentials = getCredentialsFromBIP38Result(result, testnet);

        if (credentials) {
            success(credentials);
            return credentials;
        } else {
            // check whether user is in wrong network mode (mainnet/testnet)
            if (getCredentialsFromBIP38Result(result, !testnet)) {
                otherNetwork();
            } else {
                failure();
            }
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