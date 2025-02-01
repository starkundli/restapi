const express = require('express');
const allKeys = require('../models/Product.model.js');
const admin = require("../AdminRoutes/Products.route.js");
// require("../features.js")();
const router = new express.Router();
var CurrLKey = null;
var CurrKeyDetails = null;
var CLKisValid = false;
var CLKisVerified = false;
var WhichsoftVerified = false;
var MobileVerified = false;
var exo = '';

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));


router.use("/", async (req, res, next) => {
    CurrLKey = req.body.LKey+'';
    
    if (req.body.LKey===undefined) {
        if (req.body.otp!=undefined) {
            next();
            return;
        } else {
            console.log((req.body.LKey + ' = ' + CurrLKey));
            return null;
        }
    }
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
                CurrKeyDetails = result;
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
    WhichsoftVerified = false;
    MobileVerified = false;
    //const result = await allKeys.findOne({ LKey : { $regex: new RegExp(CurrLKey,'i')  } });    //ignoring case not spaces        
    //remming result and using CurrKeyDetails as it is intialised at / of each route call can be used in all next routes
    if (CurrKeyDetails===null) return;
    
    // if (CurrKeyDetails.appGroup!==updates.appGroup) return;
    if (CurrKeyDetails.appName!==updates.appName) return;
    WhichsoftVerified = true;
    
    if (CurrKeyDetails.ClMobile==='' && CurrKeyDetails.ClEmail==='') {
        //may be activating for the 1st time
    } else {
        if (CurrKeyDetails.ClMobile!==updates.ClMobile) return;
        // if (CurrKeyDetails.ClEmail!==updates.ClEmail) return;
    }
    MobileVerified = true;
    
    CLKisVerified = true;
    
}

router.patch('/anl' , (req,res,next) => { 
    if (CLKisValid) ActivateNewLicense(req, res, next)
} );

router.patch('/mkd' , (req,res,next) => { ModifyKeyDetails(req, res, next)} );

router.patch('/uouc' , (req,res,next) => { UpdateOnlyUserConstants(req, res, next)});

router.post('/gcd', async (req, res, next ) => {
    var rs1 = await admin.GetOneProduct(req, res, next);
    
    return rs1;
});

router.post('/rofk' , (req,res) => { RequestOtpForKey(req, res) } );

router.post('/vogk' , (req,res) => { VerifyOtpSendKey(req, res) } );

async function VerifyOtpSendKey (req, res) {
    try {
        //if (CurrKeyDetails===null) return;
        // console.log(req.body.otp+'');
        const result = await allKeys.findOne({ reqlkdata : { $regex: new RegExp(req.body.otp,'i')  } })    //ignoring case not spaces
        //console.log(result+'');
        var resSend = '';
        if (result===null || result==='') {
            resSend='0';
        } else {
            resSend = '-1';
            if (result.ClMobile===req.body.ClMobile) {
                if (result.appName===req.body.appName) {
                    if (result.intpro===req.body.intpro) {
                        resSend = result.LKey;
                    }
                }
            }
        }
        
        // console.log( CurrKeyDetails.reqlkdata + '\n' + loggedOTP + ' = ' + loggedTS) ;
        res.send({'lk':resSend});
        if (resSend==='0') {
            console.log('otp mismatch / expired / not requested');
        } else if (resSend==='-1') {
                console.log('name / ip / whichsoft mismatch');
            } else {
                console.log('key sent');
        }
        if (result!=null) {
            setTimeout(ResetLKData, 2*1000, result.LKey+'' , 2);
        }
    } catch (error) {
        console.log(error.message);
    }
}

async function VerifyOtpSendKey_NR (req, res) {
    try {
        if (CurrKeyDetails===null) return;
        var loggedOTP = null;
        var loggedTS = null;
        if (CurrKeyDetails.reqlkdata != '') {
            loggedOTP = CurrKeyDetails.reqlkdata.split(',')[0];
            loggedTS = CurrKeyDetails.reqlkdata.split(',')[1];
        }
        // console.log( CurrKeyDetails.reqlkdata + '\n' + loggedOTP + ' = ' + loggedTS) ;
        var resSend = CurrKeyDetails.LKey;

        if (loggedOTP===null || loggedTS===null) {
            resSend='-1';
        } else {
            if (loggedOTP != req.body.otp) {
                resSend='0';
            } else {

                let timeout = 10; //seconds
                //console.log("start:" + new Date());
                var start = Number(loggedTS);
                var end = start + timeout * 1000;
                var now = Date.now();

                if (Number(now) > end) {
                    resSend = "-2";
                }

                console.log('start = ' + start + '\n' + 'end = ' + end + '\n' + 'now = ' + now)
            }
        }
        res.send(resSend);
        if (resSend==='0') {
            console.log('otp mismatch');
        } else if (resSend==='-1') {
            console.log('otp not requested');
        } else if (resSend==='-2') {
            console.log('key expired');
        } else {
            console.log('key sent');
        }
        
        // runs after 2 seconds
        setTimeout(ResetLKData, 2000, CurrKeyDetails.LKey);

        /*
        const updates = {"LKey":req.body.LKey,
            "reqlkdata":''};   //updating only reqlkdata , no matter whatever extra is passed
        const result = await allKeys.findOneAndUpdate({LKey:updates.LKey} , updates , {new:true} )
        if (result==null) {
            console.log('nothing updated');
        } else {
            console.log('entry nullified' );
        }
        */
    } catch (error) {
        console.log(error.message);
    }
}

async function ResetLKData (firstParam, secondParam) {
    // do something
    const updates = {"LKey":firstParam, "intpro":'',
        "reqlkdata":''};   //updating only intpro and reqlkdata , no matter whatever extra is passed
    const result = await allKeys.findOneAndUpdate({LKey:updates.LKey} , updates , {new:true} )
    if (result===null) {
        console.log('nothing updated');
    } else {
        console.log('entry nullified after ' + secondParam + ' seconds ...' );
    }
};

async function RequestOtpForKey(req, res) {
    try {
        const inputs = req.body;
        await VerifyCurrentKey(inputs);
        if (!CLKisVerified) {
            if (!WhichsoftVerified) {
                console.log('app not verifying');
                res.send('-1');
            } else if (!MobileVerified) {
                console.log('Mobile not verifying : ' + CurrKeyDetails.ClMobile);
                res.send('-2');
            }
            return null;
        }

        var d = new Date();
        var seconds = Math.round(d.getTime() / 1);
        // console.log(seconds + ' = ' + inputs.actCode);
        SetExpOTPForServer((seconds+''));
        if (exo.length==4) {
            var now = new Date();
            //var lkdata = exo + "," + now ;
            var lkdata = exo + CurrKeyDetails.LKey.substr(0,2).toLowerCase() + CurrKeyDetails.LKey.substr(CurrKeyDetails.LKey.length-2).toLowerCase(); 
            const updates = {"LKey":req.body.LKey, "intpro":req.body.intpro,
                "reqlkdata":lkdata};   //updating only intpro and reqlkdata , no matter whatever extra is passed
            const result = await allKeys.findOneAndUpdate({LKey:updates.LKey} , updates , {new:true} )
            if (result==null) {
                res.send('0');
                console.log('nothing updated');
            } else {
                res.send({'otp':lkdata});
                console.log('entry updated' );
            }
        } else {
            console.log('pls retry ...');
            res.send('5');
        }
    } catch (error) {
        console.log(error.message);
    }

    // runs after 10 seconds, expire otp auto after timer of 10 seconds
    //ref : https://nodejs.org/en/learn/asynchronous-work/discover-javascript-timers
    setTimeout(ResetLKData, 30*1000, CurrKeyDetails.LKey, 30);

}

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
        updates.reqlkdata = "";
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

async function ModifyKeyDetails(req, res, next) {
    try {
        const updates = {
            "LKey":req.body.LKey,
            "appGroup":req.body.appGroup,
            "appName":req.body.appName,
            "validUpto":req.body.validUpto
        };   //updating only appname appseries and vu  no matter whatever extra is passed
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
    // console.log(strAC + ' = ' + strAC.length);
    for (let i = strAC.length; i--;) {
        //divBy = val(mID(strAC, i, 1));
        divBy = Number(strAC.charAt(i));
        // console.log(divBy);
        if (divBy > 1) break;
    }
    //console.log(divBy);
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

