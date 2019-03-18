# Coinglacier.org | Bitcoin cold storage
JavaScript Client-Side Bitcoin HD-Wallet Generator

> Coinglacier.org is an in-browser application that lets you create Bitcoin addresses and their corresponding
> private keys for your cold storage. It provides you the tools to create rock-solid, anti-theft Bitcoin
> addresses that hold your Bitcoins in place, as if they were frozen into a glacier.

The coinglacier.org project provides an all-in-one HTML document with embedded
JavaScript/Css/Images. The JavaScript is readable (not minified) and contains no
XMLHttpRequest's (no AJAX). The benefit of this technique is you can load the 
JavaScript locally and trust that the JavaScript did not change after being 
loaded. 

Here is a link to the BitcoinTalk.org forum topic discussing this project:<br />
https://bitcointalk.org/index.php?topic=4461152

Please send DONATIONS for this project to one of the following Bitcoin addresses:<br />
* 34yh3Wofm4g7yNRXrAAEPjgXtuoLE6nyxY
* bc1qdmhnh62rn42uq6md7lp9zvwhsm6t8wl9nwh30a
* 1EFTmGDaDELbShUAjuPgj5Ada6WsKFBNHA

For ⚡️ pioneers:
[tippin.me](https://tippin.me/@DalitSairio)

# Manual
## End Users

*Only use this application on a secure computer that has not been compromised.*<br />
Consider creating a bootable USB flash drive with a clean Linux distribution installed on it to run the coinglacier.org application.<br />

### Installing the source code
The entire coinglacier.org application is packed into one single HTML file. There are various ways to download this file.
You may download the [zip file](https://github.com/dalitsairio/coinglacier.org/archive/master.zip) from Github
or visit [coinglacier.org](https://coinglacier.org) with your browser and save the file hitting CTRL + S .<br />
**However,** for best security, you should follow the recommended installation method below, 
to avoid becoming a victim of attackers trying to tamper with the coinglacier.org files.

### Recommended installation method (+ authenticity check)
If you do this procedure for the first time on this machine, add our PGP key to your Public Key ring
```sh
wget -qO- https://coinglacier.org/coinglacier-pgp-key.txt | gpg --import
```

List the imported PGP key and make sure its fingerprint is 12A2 411A 8C5C C035 6DDB  767C 24B0 274E 5B6C A8B1
```sh
gpg --list-keys --with-fingerprint dalit.sairio@protonmail.com
```
For extra credit you can validate the key's authenticity on [keybase.io](https://keybase.io/dalitsairio).

Download the HTML file and the corresponding PGP signature from coinglacier.org
```sh
wget https://coinglacier.org/coinglacier.org_v1.1.1_SHA256-9d0836a2b43a1661190146762786b3a21956c8192e57f6b18fa666a1266b47da.html https://coinglacier.org/coinglacier.org_v1.1.1_SHA256-9d0836a2b43a1661190146762786b3a21956c8192e57f6b18fa666a1266b47da.html.asc
```

Proof the authenticity of the HTML file by verifying its signature.
```sh
gpg --verify coinglacier.org_v1.1.1_SHA256-9d0836a2b43a1661190146762786b3a21956c8192e57f6b18fa666a1266b47da.html.asc
```
*If the verification fails, immediately stop the process. Somebody is trying to trick you.*

Congratulations, you have verified that the file was actually produced by us and has not been tampered with.<br />
You can now disconnect your machine from the internet and use the application offline.

### Using the coinglacier.org application
After having installed coinglacier.org on a trustworthy machine, disconnect your machine from the internet.
Open coinglacier.org_v1.1.1_SHA256-9d0836a2b43a1661190146762786b3a21956c8192e57f6b18fa666a1266b47da.html in the incognito mode of your trustworthy browser.<br />
To create safe wallets, print your created wallets but *do not* store any file anywhere digitally. The idea is that your confidential data is *only* stored offline, not digitally, for example on paper.<br />
If you print the keys, make sure the printer you are using does not store any data you send to it or transmit it to any other device/service.
This also applies to any other device your machine may be connected to.<br />

We recommend encrypting wallets with a password, however you must never lose your password
since if you lose it you will not be able to access your funds anymore and nobody will be able to help you.
Consider using a password manager for this purpose.

Once you have created your paper wallets, close your browser and restart your computer.
Consider reformatting your USB flash drive if you were using a bootable live system.
You may now reconnect your machine to the internet.

### On paper wallets
*Treat paper wallets like cash* and protect them from damage (water, fire), theft and loss and protect yourself from extortion.<br />
Consider putting your paper wallets into a ziploc bag to protect them from water.<br />
We recommend to copy your password-encrypted paper wallets and distributing them in different geographical but confidential locations.<br />
To keep track of your wallet balance, use a read only wallet like the smartphone app *Sentinel*.
With Sentinel, you can directly import extended public keys, allowing for a quick and easy integration.

Never photograph or scan any of your confidential ("KEEP SECRET") data, unless you want to spend the funds.

### Importing paper wallet into hot wallet
Once you want to spend your funds, you need to import your paper wallet into a wallet that is connected to the Bitcoin network resp. a *hot wallet*. If you want to import your entire wallet, there are wallets that allow for importing Mnemonics.<br />
If you only want to import single private keys, there are also wallets that let you "sweep" any given private key into them.
If your paper wallet is password-encrypted, you will most likely need to decrypt the private keys before you can import them.
You cand find this functionality in the coinglacier.org application.

### The reason for the long loading times
If you use Internet Explorer or other non-standard or outdated browsers, the loading might go on forever.
In this case we recommend that you download and use the latest version of Firefox (it's open source!) for coinglacier.org.

However, in most cases the loading process will eventually end at some point but it will take a long time.
This is the cost you pay for better security. While you are waiting, coinglacier.org calculates some entropy for you
which it uses in addition to the secure random number generator from window.crypto.
This means that you do not fully depend on window.crypto and have some security even if there are flaws in window.crypto
or some attacker manages to sneak into your browser.

### End user notes

 1) Coinglacier.org was designed to be used on PCs, it is very slow on mobile devices.
 2) Only modern browsers are supported.
 3) Internet Explorer is not supported.
 4) DO NOT use Opera Mini it renders JavaScript output server side, therefore
    they might record the private key you generated.

## Developers (install guide)
### Dockerized setup

Download coinglacier.org
```sh
git clone https://github.com/dalitsairio/coinglacier.org.git
cd coinglacier.org
git checkout develop
```

Create image
```sh
docker build -t coinglacier-org .
```

#### Development
During development, run gulp watchers
```sh
docker run -t --rm -p 3000:3000 -v "$PWD":/usr/src/app coinglacier-org
```
Open http://localhost:3000 in your browser

#### Build finished releases
Bugfix releases
```sh
docker run -t --rm -v "$PWD":/usr/src/app coinglacier-org gulp build
```
Backwards compatible releases
```sh
docker run -t --rm -v "$PWD":/usr/src/app coinglacier-org gulp build-minor
```
Backwards incompatible releases
```sh
docker run -t --rm -v "$PWD":/usr/src/app coinglacier-org gulp build-major
```

### Without Docker
Install git, NodeJS and NPM
```sh
apt install git nodejs npm
```

Install Gulp 4 globally
```sh
npm install -g gulp@next
```

Download coinglacier.org
```sh
git clone https://github.com/dalitsairio/coinglacier.org.git
cd coinglacier.org
git checkout develop
```

Install dependencies
```sh
npm install --only=dev
```
#### Development
During development, run gulp watchers
```sh
gulp
```
#### Build finished releases
Bugfix releases
```sh
gulp build
```
Backwards compatible releases
```sh
gulp build-minor
```
Backwards incompatible releases
```sh
gulp build-major
```

### Commit tags

Each commit message should begin with one of the following tags:

* **[FEAT]**: A new feature
* **[FIX]**: A bug fix
* **[DOCS]**: Documentation only changes (documentation files as well as source code documentation)
* **[REFACTOR]**: Changes that do not affect the meaning of the code
* **[TEST]**: Handling unit tests
* **[CHORE]**: Changes to the build process or auxiliary tools
* **[STYLING]**: UI design changes that do not affect functionality
* **[RELEASE]**: For new releases
* **[MISC]**: Everything that doesn't fit the above types

# Supported Bitcoin Standards
| BIP | Description |
| ------ | ------ |
| BIP38 | [Wallet Encryption][BIP38] |
| BIP32 | [Hierarchical Deterministic Wallets][BIP32] |
| BIP39 | [Mnemonic Phrase][BIP39] |
| BIP44 | [Derivation Paths][BIP44] |
| BIP49 | [P2SH SegWit Paths][BIP49] |
| BIP84 | [Native SegWit Paths][BIP84] |
| BIP141 | [Segregated Witness][BIP141] |
| BIP173 | [Bech32 Addresses][BIP173] |
| BIP21 | [URI Scheme][BIP21] |

   [BIP38]: <https://github.com/bitcoin/bips/blob/master/bip-0038.mediawiki>
   [BIP32]: <https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki>
   [BIP39]: <https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki>
   [BIP44]: <https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki>
   [BIP49]: <https://github.com/bitcoin/bips/blob/master/bip-0049.mediawiki>
   [BIP84]: <https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki>
   [BIP141]: <https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki>
   [BIP173]: <https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki>
   [BIP21]: <https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki>


# Notice of Copyrights and Licenses
The coinglacier.org project, software and embedded resources are
copyright coinglacier.org.

The coinglacier.org name and logo are not part of the open source
license.

Portions of the all-in-one HTML document contain NPM packages that
are the copyrights of others. The individual copyrights are included
throughout the document along with their licenses. A summary of the 
NPM packages functions with their redistributable license is provided below.

| NPM package	|	License |
| -------------------	|	-------------- |
| [bip21](https://www.npmjs.com/package/bip21)	| ISC |
| [bip38](https://www.npmjs.com/package/bip38) | MIT |
| [bip39](https://www.npmjs.com/package/bip39) | ISC |
| [bitcoinjs-lib](https://www.npmjs.com/package/bitcoinjs-lib) | MIT |
| [bootstrap](https://www.npmjs.com/package/bootstrap) | MIT |
| [chai](https://www.npmjs.com/package/chai) | MIT |
| [jquery](https://www.npmjs.com/package/jquery) | MIT |
| [mocha](https://www.npmjs.com/package/mocha) | MIT |
| [more-entropy](https://www.npmjs.com/package/more-entropy) | MIT |
| [qrcode](https://www.npmjs.com/package/qrcode) | MIT |

The github [repository](https://github.com/pointbiz/bitaddress.org) from bitaddress.org 
was used as a template. Ideas, patterns and parts of documentation were adopted from it.
The bitaddress.org project is published under the MIT license.

The coinglacier.org software is available under the MIT License (MIT)
Copyright (c) 2018 coinglacier.org

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
