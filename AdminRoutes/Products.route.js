//require("../features.js")();
// import {genLovePercent} from "./features.js";
// const encrypt = require('../features.js')
const express = require('express');
// var crypto = require('crypto');
// var assert = require('assert');

const allProducts = require('../models/Product.model.js');

var router = new express.Router();

router.get('/gap', (req, res, next ) => {GetAllProducts(req, res, next);});

router.post('/gop', (req, res, next ) => {GetOneProduct(req, res, next);});

//router.patch('/uop' , (req,res,next) => { UpdateOneProduct(req, res, next)});

router.patch('/uofc' , (req,res,next) => { UpdateOnlyFactoryConstants(req, res, next)});

router.post('/anp', (req, res, next ) => {AddNewProduct(req, res, next);});

router.patch('/mkd' , (req,res,next) => { ModifyKeyDetails(req, res, next)} );

async function GetAllProducts(req, res, next) {
    try {
        const results = await allProducts.find( {}, {} );
        res.send(results);
        // console.log(results.length + ' entries found' );
    } catch (error) {
        console.log(error.message);
    }
}

async function GetOneProduct(req, res, next) {
    try {
        if (req.body.LKey+''!='') {
            //const result = await allProducts.find( { LKey: /^req.body.LKey$/i } )
            // const result = await allProducts.find({ LKey : { $regex: /req.body.LKey/i } })
            // const result = await allProducts.findOne( { LKey: req.body.LKey } )
            const result = await allProducts.findOne({ LKey : { $regex: new RegExp(req.body.LKey,'i')  } })    //ignoring case not spaces
            //courtesy : https://www.geeksforgeeks.org/mongodb-query-with-case-insensitive-search/
            if (result==null || result=='') {
                //res.send('0');
                result='0';
                // console.log('0 found' );
            } else {
                //res.send(result);
                // console.log('1 entry found' );
            }
            if (res===null)
                return result;
            else
                res.send(result);
        }
    } catch (error) {
        console.log(error.message);
    }
}

async function UpdateOneProduct(req, res, next) {
    try {
        const updates = req.body;

        if (updates.LKey+''!='') {
            const result = await allProducts.findOneAndUpdate({LKey:updates.LKey} , updates , {new:true} )
            if (result==null) {
                // console.log('nothing updated');
            } else {
                res.send(result);
                // console.log('1 entry updated' );
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

async function UpdateOnlyFactoryConstants(req, res, next) {
    try {
        const updates = {"LKey":req.body.LKey,
            "consF":req.body.consF};   //updating only consF , no matter whatever extra is passed
        
        if (updates.LKey+''!='') {
            const result = await allProducts.findOneAndUpdate({LKey:updates.LKey} , updates , {new:true} )
            if (result==null) {
                res.send('0');
                // console.log('nothing updated');
            } else {
                res.send('1');
                // console.log('entry updated');
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

async function AddNewProduct(req, res, next) {
    try {
        var addNewProduct = false;
        const newLKey = GetRamdomLKey();
        // const lkeyfound = await allProducts.findOne( {LKey:newLKey} )
        const lkeyfound = await allProducts.findOne({ LKey : { $regex: new RegExp(newLKey,'i')  } })    //ignoring case not spaces
        if (lkeyfound==null || '') {
            addNewProduct = true;
        } else {
            // console.log('LKey is already created, pls retry again');
            addNewProduct = false;
        }
        if (req.body.LKey!=null) {
            addNewProduct = false;
            // console.log('LKey is not required');
            return null;
        };
        var vd = new Date(req.body.validUpto);
        var cd = new Date();
        // console.log(vd + '\n' + cd );
        if (vd<cd) {
            addNewProduct = false;
            console.log('Validity is less');
            return null;
        }
        
        if (addNewProduct) {
            try {
                const newProduct = new allProducts(req.body);
                newProduct.LKey = newLKey;
                newProduct.actCode = "";
                newProduct.ClName = "";
                newProduct.ClMobile = "";
                newProduct.ClEmail = "";
                newProduct.ClCity = "";
                newProduct.dev1 = "";
                newProduct.dev2 = "";
                newProduct.dev3 = "";
                newProduct.dev4 = "";
                newProduct.consF = "";
                newProduct.consU = "";
                newProduct.intpro = "";
                newProduct.actTS = "";
                newProduct.lastCommTS = "";
                var cd = new Date();
                newProduct.createdON = cd;

                const result = await newProduct.save();
                if (result===null) {
                    // console.log('nothing added');
                    res.send('0');
                } else {
                    // console.log('one added');
                    // res.send(result + "\nadded as new");
                    res.send({'LKey':newLKey});
                }
            }
            catch (error) {
                console.log(error.message);
                res.send('-1');
            }
        }
        
    } catch (error) {
        console.log(error.message);
    }
}


async function ModifyKeyDetails(req, res, next) {
    try {
        const updates = {
            "LKey":req.body.LKey,
            "appGroup":req.body.appGroup,
            "appName":req.body.appName,
            "validUpto":req.body.validUpto
        };   //updating only appname appseries and vu  no matter whatever extra is passed
        if (updates.LKey+''!='') {
            const result = await allProducts.findOneAndUpdate({LKey:updates.LKey} , updates , {new:true} )
            if (result==null) {
                res.send('0');
                // console.log('nothing updated');
            } else {
                res.send('1');
                // console.log('entry updated' );
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}


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

function zzz2(epoch) {
    
    // const convert = (from, to) => str => Buffer.from(str, from).toString(to)
    // const utf8ToHex = convert('utf8', 'hex')
    // const hexToUtf8 = convert('hex', 'utf8')

    // hexToUtf8(utf8ToHex('dailyfile.host')) === 'dailyfile.host'

    // console.log(utf8ToHex('766994567123'));

    // Text send to encrypt function
    // var hw = encrypt(epoch);//"Welcome to Tutorials Point...")
    // console.log(hw)
    // console.log(decrypt(hw))

    
    var rs = randomAsciiString();
    console.log(rs+'');

}

function GetRamdomLKey () {

    const random = size => btoa(
        String.fromCharCode(
          ...crypto.getRandomValues(
            new Uint8Array(size)
          )
        )
      ).replaceAll('+', 'x').replaceAll('/', 'I').slice(0, size)
      
    //   for (let i = 5; i--;) console.log(random(20))
        var ret = random(20)+'';
        // console.log(ret);
        return ret;

}
function zzz4() {
    const buf256 = new Uint8Array(5)
    const random = crypto.getRandomValues.bind(crypto, buf256)

    for (let i = 5; i--;) console.log(random());//.slice()

}
function zzz(epoch)
{
    
    var crypto = require("crypto");
    var algorithm = "aes-192-cbc"; //algorithm to use
    var secret = "harisharan";//your-secret-key";
    const key = crypto.scryptSync(secret, 'salt', 24); //create key
    var text= epoch; //this is the text to be encrypted"; //text to be encrypted

    const iv = crypto.randomBytes(16); // generate different ciphertext everytime
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    var encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex'); // encrypted text
    
    console.log(encrypted);

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    var decrypted = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8'); //deciphered text
    console.log(decrypted);
    
    /*
    var algorithm = 'aes256'; // or any other algorithm supported by OpenSSL
    var key = 'password';
    var text = 'I love kittens';
    
    var cipher = crypto.createCipher(algorithm, key);  
    var encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
    var decipher = crypto.createDecipher(algorithm, key);
    var decrypted = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
    
    assert.equal(decrypted, text);
    */
}

/*
router.get('/', async (req, res, next ) => {
    // res.send('getting list...');
    
    try {
        // const queryStr  = "{price:{$gte:90000}}"
        // const results = await product.find( {price:{$gte:100000}}, {} )
        // const results = await allProducts.find( {}, {} )
        
        // res.send(results)
        // console.log(results.length + ' entries found' );

        // const epoch = Math.floor(new Date().getTime() / 1);
        // console.log(epoch  + ' = epoch' );

        // const str1 = stringToHex(epoch+'');
        // const str2 = hexToString(str1);
        // console.log(str1 + '\n' + str2)
        // zzz(epoch+'');
        
        // zzz2('1736576996');//1736576996524
        // GetRamdomLKey();//finalised this is it
        // zzz4();
    } catch (error) {
        next(new Error(error.message));    
    }
    
});
*/

//async-await approach
/*
router.post('/' , async (req, res, next) => {
    var addNewProduct = false;
    const newLKey = GetRamdomLKey();
    
    const lkeyfound = await allProducts.findOne( {LKey:newLKey} )
    if (lkeyfound==null) {
        addNewProduct = true;
    } else {
        console.log('LKey is already created, pls retry again');
        addNewProduct = false;
    }
    if (req.body.LKey!=null) {
        
        addNewProduct = false;
        console.log('LKey is not required');
        return null;
        
    };
    console.log(newLKey + ' = ' + addNewProduct);
    // try {

        // const newProduct = new Product(req.body);
        // const acFound = await product.find( {price:{$gte:100000}}, {} )
        // const result = await allProducts.findOne( {appCode:req.body.appCode} )
        // const result = await newProduct.save();
        // console.log(result);
        
        //res.send(req.body.appCode);
        //addNewProduct=true;
        // res.send("");
        // if (result===null) {
            // addNewProduct=true;
        // } else {
            // console.log('nothing added');
            // res.send(result + "\nfound this");
        // }
    // } catch (error) {
        // console.log(error.message);
    // }

    if (addNewProduct) {
        // const Product = require('../models/Product.model');
        //const allproducts = require('../models/Product.model');
        try {
            const newProduct = new allProducts(req.body);
            newProduct.LKey=newLKey;
            const result = await newProduct.save();
            console.log('one added');
            // res.send(result + "\nadded as new");
            res.send({'LKey':newLKey});
        }
        catch (error) {
            console.log(error.message);
        }
    }
})
*/
/*  promises approach
router.post('/' , (req,res,next) => {
    console.log(req.body)
    const product = new Product({
        name: req.body.name,
        price:req.body.price
    })
    product
    .save()
    .then(result=>{
        console.log(result);
        res.send(result)
    })
    .catch(err=>{
        console.log(err.message);
    })
    

});

*/


router.delete('/:id' , async(req,res,next) => {
    try {
        const id=req.params.id;
        const result = await  allProducts.findByIdAndDelete(id);
        if (result==null || '') {
            // console.log ('Product NOT FOUND ?');
        } else { 
            res.send(result);
            // console.log ('Product Deleted !');
        }
    } catch (error) {
        console.log(error.message);
    } 
    
});


// module.exports = router;

// module.exports = function() {
//     this.GOP = function () {
    
//         const length=20;
//         const retStr = 'GOP RETURNS'//randomString(length);
//         return retStr; // `${~~(Math.random()*100)} %`
    
//     }

//     //GetOneProduct()
//   };
  
// function GOP2() {
//     return 'zzz';
// }
module.exports = { 
    router,
    GetOneProduct
    // GOP2,
    
  }

