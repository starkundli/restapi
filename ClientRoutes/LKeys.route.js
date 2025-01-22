const express = require('express');
const allKeys = require('../models/Product.model.js');
const admin = require("../AdminRoutes/Products.route.js");
// require("../features.js")();
const router = new express.Router();
var CurrLKey = null;
var CLKisValid = false;
var CLKisVerified = false;
var exo = '';

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));


router.use("/", async (req, res, next) => {
    CurrLKey = req.body.LKey;
    // console.log((req.body.LKey + ' = ' + CurrLKey));
    // next();
    //res.send(req.body + '');
    
    if (CurrLKey!=null && CurrLKey!='') {
        // const result = await allKeys.findOne({'LKey':CurrLKey})
        const result = await allKeys.findOne({ LKey : { $regex: new RegExp(CurrLKey,'i')  } })    //ignoring case not spaces        
        if (result!=null && result!='') {
            var vd = new Date(result.validUpto);
            var cd = new Date();
            if (vd<cd) {
                console.log('key expired');
                res.send('0');
                return null;
            } else {
                CLKisValid=true;
            }
            if (CLKisValid) {
                // console.log('hello from main all handler' );
                // res.send(result);
                next();
            }
        } else {
            console.log('key not found = ' + req.body.LKey);
            res.send('1');
            //return null;
        }
    } else {
        console.log('invalid key');
        res.send('2');
        return null;
    }
    
});

async function VerifyCurrentKey(updates) {
    
    CLKisVerified = false;
    const result = await allKeys.findOne({ LKey : { $regex: new RegExp(CurrLKey,'i')  } });    //ignoring case not spaces        
    
    if (result===null) return;
    if (result.appGroup!==updates.appGroup) return;
    if (result.appName!==updates.appName) return;
    
    CLKisVerified = true;
}

router.patch('/anl' , (req,res,next) => { 
    if (CLKisValid) ActivateNewLicense(req, res, next)
} );

router.patch('/uouc' , (req,res,next) => { UpdateOnlyUserConstants(req, res, next)});

router.post('/gcd', async (req, res, next ) => {
    var rs1 = await admin.GetOneProduct(req, res, next);
    // var rs2 = randomAsciiString();
    // var rs3 = admin.GOP2();

    // res.send(rs1);// + ' ' + rs3);
    // features.GOP(req, res, next);
    return rs1;
});

async function ActivateNewLicense(req, res, next) {
    try {
        const updates = req.body;
        await VerifyCurrentKey(updates);
        if (!CLKisVerified) {
            console.log('key not verifying as per body');
            res.send('3');
            return null;
        }
        updates.intpro = "";
        updates.actTS = new Date();
        
        const result = await allKeys.findOneAndUpdate({ LKey : { $regex: new RegExp(CurrLKey,'i')  } } , updates , {new:true} )
        if (result==null) {
            console.log('nothing updated');
            res.send('4');
        } else {
            SetExpOTPForServer(updates.actCode);
            if (exo.length==4) {
                // res.send(result + '\nexo=' + exo);
                res.send(exo+'');
                console.log('entry updated');
            } else {
                // res.send(result + '\nexo=' + exo);
                console.log('pls retry ...');
                res.send('5');
            }
        } 
    } catch (error) {
        console.log(error.message);
    }
}

async function UpdateOnlyUserConstants(req, res, next) {
    try {
        const updates = {"LKey":req.body.LKey,
            "consU":req.body.consU};   //updating only consU , no matter whatever extra is passed
        if (updates.LKey+''!='') {
            const result = await allKeys.findOneAndUpdate({LKey:updates.LKey} , updates , {new:true} )
            if (result==null) {
                res.send('0');
                console.log('nothing updated');
            } else {
                res.send('1');
                console.log('entry updated' );
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}


function SetExpOTPForServer(ac) {
        
    //'replica in clsAYL of AstroAndroid
    var strdivbyval ;
    var i ;
    
    var strAC = "";
    var strAC = ac;
    var divBy = 0;
    var divbyval;
    exo = "";

    if (ac === 0) return ;
    
    for (let i = strAC.length; i--;) {
        //divBy = val(mID(strAC, i, 1));
        divBy = Number(strAC.charAt(i));
        if (divBy > 1) break;
    }
    if (divBy > 1) {
        divbyval = ac / divBy //'val(val(ac) / val(divBy))
        strdivbyval = divbyval + '';
        strdivbyval = strdivbyval.split(".")[0];
        //strdivbyval = CStr(Split(divbyval, ".")(0))
        //exo = mID(strdivbyval, Len(strdivbyval) - 0, 1)
        //exo = exo & mID(strdivbyval, Len(strdivbyval) - 1, 1)
        //exo = exo & mID(strdivbyval, Len(strdivbyval) - 2, 1)
        //exo = exo & mID(strdivbyval, Len(strdivbyval) - 3, 1)
        //exo=strdivbyval;
        //exo = exo + strdivbyval.charAt(strdivbyval.length);
        exo = exo + strdivbyval.charAt(strdivbyval.length-1);
        exo = exo + strdivbyval.charAt(strdivbyval.length-2);
        exo = exo + strdivbyval.charAt(strdivbyval.length-3);
        exo = exo + strdivbyval.charAt(strdivbyval.length-4);
    }
    //return exo;
}

module.exports = router;

