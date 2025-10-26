//require("../features.js")();
// import {genLovePercent} from "./features.js";
// const encrypt = require('../features.js')
const express = require('express');
// var crypto = require('crypto');
// var assert = require('assert');

const allProducts = require('../models/Product.model.js');

var router = new express.Router();

router.get('/gap', (req, res, next ) => {GetAllProducts(req, res, next);});

//20.10.2025 no longer req as route GetOnProduct is exported to be used in lkeys.route
// router.post('/gop', (req, res, next ) => {GetOneProduct(req, res, next);});

//router.patch('/uop' , (req,res,next) => { UpdateOneProduct(req, res, next)});

router.patch('/uofc' , (req,res,next) => { UpdateOnlyFactoryConstants(req, res, next)});

router.post('/anp', (req, res, next ) => {AddNewProduct(req, res, next);});

router.patch('/mkd' , (req,res,next) => { ModifyKeyDetails(req, res, next)} );

router.post('/goc', (req, res, next ) => {getOnlineCount(req, res, next)} );

async function getOnlineCount (req, res, next)  { 
    var minDiff = 60;       //def 1 hour
    if (req.body.onlineByMins != null || req.body.onlineByMins != '') {
        minDiff=Number(req.body.onlineByMins);
    }
    var totalRecords=0;
    try {
        //const results = await allProducts.find( {}, {} );
        var totalRecords = await allProducts.countDocuments();
        //res.send(results + ' entries found');
        //console.log(results + ' entries found' );
    } catch (error) {
        console.log(error.message);
    }

    try {
        // Get the current date as an ISODate object
        const today = new Date();
        const fromTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 
                                today.getHours(), today.getMinutes() - minDiff);
        const toTime = new Date(today.getFullYear(), today.getMonth(), today.getDate() , 
                                today.getHours(), today.getMinutes());

        // Count documents where 'creationDate' is within the current day
        var onlineCount = await allProducts.countDocuments({
            lcdt : {
                $gte: fromTime,
                $lt: toTime
            }
        });
        //res.send(totalRecords + ' = total , ' + onlineCount + ' = online found');
        res.send(onlineCount + '/' + totalRecords);
        // console.log('from : ' + fromTime + '\nto : ' + toTime );
    } catch (error) {
        console.log(error.message);
    }
    
    return null;
} 

async function GetAllProducts(req, res, next) {

//if any change in model/schema, the already saved records/collection are not affected, hence 
//foll call is made as per the requirement and when work is done remm them again
//set will add the field with data, unset will delete it, but if inside a json object then
//entire object gets deleted(warning), rename should be done before actually modifying the schema

    // await allProducts.updateMany({}, {$set: {backupInfo:{clientCount: "-"}}}, {upsert: true})

    // await allProducts.updateMany({}, {$rename: {backupInfo:{lastBackupDate : "lastBackupDT"}}}, {strict: false})

    // await allProducts.updateMany({}, {$unset: {backupInfo:{lastBackupDate:"-"}}} );

    var projection = { 
        LKey: 1, 
        appGroup: 1, 
        appName: 1, 
        crdt: 1, 
        vudt: 1, 
        ClName: 1, 
        ClMobile: 1, 
        ClEmail: 1, 
        ClCity: 1, 
        budt: 1, 
        fadt: 1,
        ladt: 1,
        tac: 1,
        tdc: 1,
        lcdt: 1, 
        ofd: 1, 
        naodd: 1, 
        nfa: 1, 
        _id: 0 
    };

    try {
        //const results = await allProducts.find( {}, {} );
        const results = await allProducts.find( {}, projection );
        res.send(results);
        // console.log(results.length + ' entries found' );
    } catch (error) {
        console.log(error.message);
    }
}

async function GetOneProduct(req, res, next) {
    try {
        // console.log(req.body.LKey + ' = lkey' );
        if (req.body.LKey+''!='') {
            //const result = await allProducts.find( { LKey: /^req.body.LKey$/i } )
            // const result = await allProducts.find({ LKey : { $regex: /req.body.LKey/i } })
            // const result = await allProducts.findOne( { LKey: req.body.LKey } )
            
            //var result = await allProducts.findOne({ LKey : { $regex: new RegExp(req.body.LKey,'i')  } })    //ignoring case not spaces
            //var result = await allProducts.findOne({ LKey : { $regex: new RegExp("^"+req.body.LKey+"$",'i')  } })    //ignoring case not spaces
            //// courtesy : https://www.geeksforgeeks.org/mongodb-query-with-case-insensitive-search/
            
            // const result = await allProducts.findOne({ LKey : { $regex: new RegExp(req.body.LKey,'i')  } }, {explicit:true}  )    //ignoring case not spaces
            // var result = await allProducts.findOne({ LKey : /^req.body.LKey$/i } )    //ignoring case not spaces
            
            // console.log(result + ' = 0 found' );

            var result;
            if (Number(req.body.uplcdt)===1) {

                const updates = {
                    "lcdt":new Date(),
                };   //updating only lcdt
                result = await allProducts.findOneAndUpdate({ LKey : { $regex: new RegExp(req.body.LKey,'i')  } } , updates , {new:true} );

            } else {
                var result = await allProducts.findOne({ LKey : { $regex: new RegExp("^"+req.body.LKey+"$",'i')  } })    //ignoring case not spaces
                // courtesy : https://www.geeksforgeeks.org/mongodb-query-with-case-insensitive-search/
            }

            if (result==null || result=='') {
                //res.send('0');
                result='0';
                
            } else {
                //res.send(result);
                // console.log('1 entry found' );

                // const updates = {
                //     // "LKey":req.body.LKey,
                //     "lcdt":new Date(),
                // };   //updating only lcdt
                
                // const result1 = await allProducts.findOneAndUpdate({ LKey : { $regex: new RegExp(req.body.LKey,'i')  } } , updates , {new:true} );
                // if (Number(req.body.uplcdt)===1) {
                //     console.log('lcdt entry = ' + result.lcdt);
                // } else {
                //     console.log('1 entry found' );
                // }
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
            "conf":req.body.conf};   //updating only consF , no matter whatever extra is passed
        
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
        var vd = new Date(req.body.vudt);
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
                newProduct.actc = "";
                newProduct.ClName = "";
                newProduct.ClMobile = "";
                newProduct.ClEmail = "";
                newProduct.ClCity = "";
                newProduct.dv1 = "";
                newProduct.dv2 = "";
                newProduct.dv3 = "";
                newProduct.dv4 = "";
                newProduct.conf = "";
                newProduct.conu = "";
                newProduct.inpr = "";
                newProduct.lcdt = "";
                var cd = new Date();
                newProduct.crdt = cd;
                newProduct.rlkd="";
                newProduct.ofd=false;
                newProduct.naodd=false;
                newProduct.nfa=false;
                newProduct.fadt="";
                newProduct.ladt="";
                newProduct.tac=0;
                newProduct.tdc=0;

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
            "vudt":req.body.vudt,
            "budt":req.body.budt
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

//https://stackoverflow.com/questions/79588051/google-cloud-run-next-js-build-gives-error-invalid-node-js-version-specified-f

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

