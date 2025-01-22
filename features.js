const crypt = require('crypto');

// export const genLovePercent = () => {

//     return `${~~(Math.random()*100)} %`
    
// }

/*
//Checking the crypto module
const crypto = require('crypto');
const algorithm = 'aes-256-cbc'; //Using AES encryption
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

//Encrypting text
function encrypt(text) {
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
 }

 // Decrypting text
function decrypt(text) {
    let iv = Buffer.from(text.iv, 'hex');
    let encryptedText = Buffer.from(text.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
 }


*/

 //=================


//courtesy : https://stackoverflow.com/questions/8855687/secure-random-token-in-node-js

/** Sync */
function randomString(length) {

    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    // if (!chars) {
        // throw new Error("Argument 'chars' is undefined");
    // }

    const charsLength = chars.length;
    if (charsLength > 256) {
        throw new Error("Argument 'chars' should not have more than 256 characters"
        + ", otherwise unpredictability will be broken");
    }

    const randomBytes = crypt.randomBytes(length);
    let result = new Array(length);

    let cursor = 0;
    for (let i = 0; i < length; i++) {
        cursor += randomBytes[i];
        result[i] = chars[cursor % charsLength];
    }

    return result.join("");
}

/** Sync */
// function randomAsciiString(length) {
//   return randomString(length,
    // "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
// }

var randomAsciiString = function () {
    
         const length=20;
         const retStr = randomString(length);
         return retStr; // `${~~(Math.random()*100)} %`
    
}

//module.exports = randomAsciiString(); 
module.exports = function() {
    this.randomAsciiString = function () {
    
        const length=20;
        const retStr = randomString(length);
        return retStr; // `${~~(Math.random()*100)} %`
   
    }   
}

// export const randomAsciiString = () => {

//     // return `${~~(Math.random()*100)} %`

//     //         const length=20;
//     //         const retStr = randomString(length);
//     return retStr; 
    
// }
