const express = require('express');

const allTransactions = require('../models/Transaction.model.js');

var router = new express.Router();

//router.get('/gap', (req, res, next ) => {GetAllProducts(req, res, next);});

// router.post('/golkt', (req, res, next ) => {GetOneLKTrans(req, res, next);});

//router.post('/ant', (req, res, next ) => {AddNewProduct(req, res, next);});

//router.patch('/mkd' , (req,res,next) => { ModifyKeyDetails(req, res, next)} );

//if any change in model/schema, the already saved records/collection are not affected, hence 
//foll call is made as per the requirement and when work is done remm them again
//set will add the field with data, unset will delete it, but if inside a json object then
//entire object gets deleted(warning), rename should be done before actually modifying the schema

    // await allProducts.updateMany({}, {$set: {backupInfo:{clientCount: "-"}}}, {upsert: true})
    // await allProducts.updateMany({}, {$rename: {backupInfo:{lastBackupDate : "lastBackupDT"}}}, {strict: false})
    // await allProducts.updateMany({}, {$unset: {backupInfo:{lastBackupDate:"-"}}} );

router.post('/gatflk', (req, res, next ) => {GetAllTransForLK(req, res, next);});

async function GetAllTransForLK(req, res, next) {

    var projection = { 
        //LKey: 0, 
        tranDT: 1, 
        tranType: 1, 
        deviceDetails: 1, 
        tranCount: 1, 
        _id: 0 
    };

    if (req.body.LKey+''!='') {
        try {
            //const results = await allTransactions.find( {}, {} );
            //const results = await allTransactions.find({ LKey : { $regex: new RegExp("^"+req.body.LKey+"$",'i')  } })    //ignoring case but exact match
            const results = await allTransactions.find({ LKey : { $regex: new RegExp("^"+req.body.LKey+"$",'i')  } }, projection)    //ignoring case but exact match
            if (results!=null && results!='') {
                res.send(results);
            } else {
                res.send('0');
            }
            // console.log(results.length + ' entries found' );
        } catch (error) {
            res.send('error');
            console.log(error.message);
        }
    } else {
        res.send('-1');
        console.log('no lkey');
    }


}

async function GetOneLKTrans(req, res, next) {
    try {
        // console.log(req.body.LKey + ' = lkey' );
        if (req.body.LKey+''!='') {
            //const result = await allProducts.find( { LKey: /^req.body.LKey$/i } )
            // const result = await allProducts.find({ LKey : { $regex: /req.body.LKey/i } })
            // const result = await allProducts.findOne( { LKey: req.body.LKey } )
            
            //var result = await allProducts.findOne({ LKey : { $regex: new RegExp(req.body.LKey,'i')  } })    //ignoring case not spaces
            var result = await allProducts.findOne({ LKey : { $regex: new RegExp("^"+req.body.LKey+"$",'i')  } })    //ignoring case not spaces
            //// courtesy : https://www.geeksforgeeks.org/mongodb-query-with-case-insensitive-search/
            
            // const result = await allProducts.findOne({ LKey : { $regex: new RegExp(req.body.LKey,'i')  } }, {explicit:true}  )    //ignoring case not spaces
            // var result = await allProducts.findOne({ LKey : /^req.body.LKey$/i } )    //ignoring case not spaces
            
            // console.log(result + ' = 0 found' );

            if (result==null || result=='') {
                //res.send('0');
                result='0';
                
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

async function UpdateOneTrans(req, res, next) {
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

async function AddNewTrans(req, res, next) {
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

router.delete('/:id' , async(req,res,next) => {
    try {
        const id=req.params.id;
        const result = await  allTransactions.findByIdAndDelete(id);
        if (result==null || '') {
            // console.log ('TRAN NOT FOUND ?');
        } else { 
            res.send(result);
            // console.log ('TRAN Deleted !');
        }
    } catch (error) {
        console.log(error.message);
    } 
    
});


module.exports = { 
    router//,
    // GetOneLKTrans
    // GOP2,
}

