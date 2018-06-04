# Coinglacier.org cold storage
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
**XXXXXX https://bitcointalk.org/index.php?topic=43496.0**

Please send DONATIONS for this project to one of the following Bitcoin Addresses:<br />
* 34yh3Wofm4g7yNRXrAAEPjgXtuoLE6nyxY
* bc1qdmhnh62rn42uq6md7lp9zvwhsm6t8wl9nwh30a
* 1EFTmGDaDELbShUAjuPgj5Ada6WsKFBNHA

# Manual
## End Users

*Only use this application on a secure computer that has not been compromised.*<br />
Consider creating a bootable USB flash drive with a clean Linux distribution installed on it
and use this system to run the application.<br />

### Installing the source code
The entire coinglacier.org application is packed into one single HTML file. There are various ways to download this file.<br />
You may download the [zip file](https://github.com/dalitsairio/coinglacier.org/archive/master.zip) from Github
or visit [coinglacier.org](https://coinglacier.org) and save the file hitting CTRL + S .<br />
**However,** for optimal safety you should follow the recommended installation method stated below, 
in order to prevent you from being a victim of attackers that try to tamper with the coinglacier.org files.

### Recommended installation method (+ authenticity check)
If you do this procedure for the first time on this machine, add our GPG key to your Public Key ring
```sh
wget https://coinglacier.org/coinglacier-gpg-key.txt
gpg --import coinglacier-gpg-key.txt
```

List the imported GPG key and make sure its fingerprint is 12A2411A8C5CC0356DDB767C24B0274E5B6CA8B1
```sh
gpg --list-keys dalit.sairio@protonmail.com
```

Download the html file from coinglacier.org
```sh
wget https://coinglacier.org/git/coinglacier.org_v0.0.1_SHA256-b4c1f6db3c3a70beff0db88b65bc8595bd2373f787a4def1743c1fa0084bd691.html
```

Create the SHA256 hashsum of the file and make sure it matches the hashsum in the filename
```sh
sha256sum coinglacier.org_v0.0.1_SHA256-b4c1f6db3c3a70beff0db88b65bc8595bd2373f787a4def1743c1fa0084bd691.html
```

Download the signed changelog from coinglacier.org and verify its authenticity using the coinglacier.org GPG key<br />
Manually check that the newest versions hashsum matches the hashsum calculated in the previous step
```sh
wget -q0- https://coinglacier.org/git/CHANGELOG.md.asc | gpg -d
```

You have verified that the file was actually produced by us and has not been tampered with.<br />
You can now disconnect your machine from the internet and use the application offline.

### Using the coinglacier.org application
Open the HTML file coinglacier.org_v0.0.1_SHA256-b4c1f6db3c3a70beff0db88b65bc8595bd2373f787a4def1743c1fa0084bd691.html in a trustworthy browser on a trustworthy machine.<br />
To create safe wallets, print your created wallets but DO NOT store any file anywhere digitally. The idea is to have your sensitive information *only* stored offline and non-digital, e.g. on paper.<br />
*If you print the keys, make sure the printer does not store or transmit any data you send to it.*
This is also true for any other device your machine might be connected to.<br />
After having installed coinglacier.org on your machine, disconnect your machine from the internet for using the application
and consider never ever connecting the machine again to the internet. Consider reinstalling the OS of your machine respectively
reformatting your USB flash drive if you were using a bootable live system.
We recommend encrypting wallets with a password, however you must never lose your password
since if you lose it you will not be able to access your funds anymore and nobody will be able to help you.
Consider using a password manager for this purpose.

### On paper wallets
*Treat paper wallets like cash and protect them from damage (water, fire), theft and loss and protect yourself from extortion.*<br />
Consider putting your paper wallets into a ziploc bag to protect them from water.<br />
We recommend to copy your password-encrypted paper wallets and distributing them in different geographical yet confidential locations.<br />
For better oversight on your wallet balance, use a read only wallet like the smartphone app *Sentinel*.
With Sentinel, you can directly import extended public keys, which allows for a quick and easy integration.

### Importing paper wallet into hot wallet
Once you want to spend your funds, you need to import your paper wallet to a wallet that is connected to the Bitcoin network
aka a *hot wallet*. If you want to import your entire wallet, there are wallets that allow for importing Mnemonics.<br />
If you only want to import single private keys, there are also wallets that let you "sweep" your private key into them.
If you have an encrypted paper wallet, you will most likely need to decrypt the private keys before you can import them.
You cand find this functionality in the coinglacier.org application.

## Developers (install guide)

Install git, NodeJS and NPM
```sh
apt install git nodejs npm
```

Install Gulp 4 globally
```sh
npm install -g gulpjs/gulp.git#4.0
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
### Development
During development, run gulp watchers.
```sh
gulp
```
### Build finished releases
Bugfix releases
```sh
gulp build
```
Backwards compatible releases
```sh
gulp build-minor
```
Backwards incompatible releases:
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


# To be done ....
--------------- onwards is just a copy from bitaddress.org -------------------------- 

END USER NOTES:

 1) For Bulk Wallet I recommended using Google Chrome, it's the fastest.

 2) Requires IE9+, Firefox, Chrome or sufficient JavaScript support.

 3) Mobile Safari only works with iPhone4 or newer devices.
    Older devices timeout while executing JavaScript.

 4) DO NOT use Opera Mini it renders JavaScript output server side, therefore
    they might record the private key you generated.

 5) BIP38 most likely will not work on mobile devices due to hardware limitations.


Notice of Copyrights and Licenses:
---------------------------------------
The bitaddress.org project, software and embedded resources are
copyright bitaddress.org.

The bitaddress.org name and logo are not part of the open source
license.

Portions of the all-in-one HTML document contain JavaScript codes that
are the copyrights of others. The individual copyrights are included
throughout the document along with their licenses. Included JavaScript
libraries are separated with HTML script tags.

Summary of JavaScript functions with a redistributable license:

JavaScript function	|	License
-------------------	|	--------------
Array.prototype.map	|	Public Domain
window.Crypto | BSD License
window.SecureRandom	| BSD License
window.EllipticCurve	|	BSD License
window.BigInteger |	BSD License
window.QRCode | MIT License
window.Bitcoin | MIT License

The bitaddress.org software is available under The MIT License (MIT)
Copyright (c) 2011-2013 bitaddress.org

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
