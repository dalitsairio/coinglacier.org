# coinglacier.org cold storage
JavaScript Client-Side Bitcoin HD-Wallet Generator

> Coinglacier.org is an in-browser application that lets you create Bitcoin addresses and their corresponding
> private keys for your cold storage. It provides you the tools to create rock-solid, anti-theft Bitcoin
> addresses that hold your Bitcoins in place, as if they were frozen into a glacier.

The coinglacier.org project provides an all-in-one HTML document with embedded
JavaScript/Css/Images. The JavaScript is readable not minified and contains no
XMLHttpRequest's (no AJAX). The benefit of this technique is you can load the 
JavaScript locally and trust that the JavaScript did not change after being 
loaded. 

Here is a link to the BitcoinTalk.org forum topic discussing this project:<br />
**XXXXXX https://bitcointalk.org/index.php?topic=43496.0**

Please send DONATIONS for this project to Bitcoin Address:<br />
**XXXXXX (Bitcoin Address here)**

# Installation
## End Users

*Only use this application on a secure computer that has not been compromised.*

Download the git repository
```sh
git clone https://github.com/dalitsairio/coinglacier.org.git
cd coinglacier.org
```
### Verify authenticity of the source code
If you do this procedure for the first time on this machine, add our GPG key to your Public Key ring
```sh
wget XXXXXXhttp://www.bitaddress.org/ninja_bitaddress.org.txt
gpg --import XXXXXXninja_bitaddress.org.txt
```

Verify that the file was actually produced by us and has not been tampered with
```sh
gpg --verify coinglacier.org*.html.asc
```
### Use the coinglacier app
Open the HTML file in a trustworthy browser on a trustworthy machine.<br />
*If you want to print out the keys, make sure the printer does not store or transmit any data you send to it.*

## Developers

Install git, NodeJS and NPM
```sh
apt install git nodejs-legacy npm
```

Install Gulp 4 globally
```sh
npm install -g gulpjs/gulp.git#4.0
```

Download coinglacier.org
```sh
git clone https://github.com/dalitsairio/coinglacier.org.git
cd coinglacier.org
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
