const express = require('express');
const allKeys = require('../models/Product.model.js');
const allTrans = require('../models/Transaction.model.js');
const adminKeys = require("../AdminRoutes/Products.route.js");
var currTran = {} ;
var LKTotalActCount=0;
//const adminTrans = require("../AdminRoutes/Transactions.route.js");

const router = new express.Router();

var CurrLKey = null;
var CurrKeyDetailsDB = null;
var CurrKeyTransDB = null;
var CLKisValid = false;
var CLKisVerified = false;
var WhichsoftVerified = false;
var MobileVerified = false;
var exo = '';
var noActOnDiffDev = false;
var noFurtherAct = false;
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

router.use("/", async (req, res, next) => {
    
    if (req.body.LKey===undefined) {    //all endpoints should have lkey as a param
        if (req.body.otp!=undefined) {  //in this case lkey is requested based on otp
            next();
            return;
        } else {
            // console.log((req.body.LKey + ' = ' + CurrLKey));
            // next();
            return null ;
        }
        
    }

    // FakeReadMode = false;
    // FakeWriteMode = false;
    // CurrLKey = req.body.LKey+'';
    // if (CurrLKey.charAt(CurrLKey.length-1) === " ") FakeReadMode = true;
    // CurrLKey = CurrLKey.trim();

    req.body.LKey = req.body.LKey.trim();
    CurrLKey = req.body.LKey+'';
    if (CurrLKey!=null && CurrLKey!='') {
        // const result = await allKeys.findOne({'LKey':CurrLKey})
        // const result = await allKeys.findOne({ LKey : { $regex: new RegExp(CurrLKey,'i')  } })    //ignoring case but matches pattern i.e somewhat match will also come in result        
        const result = await allKeys.findOne({ LKey : { $regex: new RegExp("^"+CurrLKey+"$",'i')  } })    //ignoring case but exact match
        if (result!=null && result!='') {
            var vd = new Date(result.vudt);
            var cd = new Date();
            if (vd<cd) {
                // console.log('key expired');
                res.send('-1');
                return null;
            } else {
                CLKisValid=true;
            }
            if (CLKisValid) {
                // console.log('hello from main all handler' );
                // res.send(result);
                CurrKeyDetailsDB = result;
                CurrLKey = CurrKeyDetailsDB.LKey;
                next();
            }
        } else {
            // console.log('key not found = ' + req.body.LKey);
            res.send('1');
            //return null;
        }
    } else {
        // console.log('invalid key');
        res.send('2');
        return null;
    }
    
});

async function VerifyCurrentKey(inputs) {
    
    CLKisVerified = false;
    WhichsoftVerified = false;
    MobileVerified = false;
    //const result = await allKeys.findOne({ LKey : { $regex: new RegExp(CurrLKey,'i')  } });    //ignoring case not spaces        
    //remming result and using CurrKeyDetailsDB as it is intialised at / of each route call can be used in all next routes
    if (CurrKeyDetailsDB===null) return;
    
    // if (CurrKeyDetailsDB.appGroup!==inputs.appGroup) return;
    if (CurrKeyDetailsDB.appName!==inputs.appName) return;
    WhichsoftVerified = true;
    
    if (CurrKeyDetailsDB.ClMobile==='' && CurrKeyDetailsDB.ClEmail==='') {
        //may be activating for the 1st time
    } else {
        if (CurrKeyDetailsDB.ClMobile!==inputs.ClMobile) return;
        // if (CurrKeyDetailsDB.ClEmail!==inputs.ClEmail) return;
    }
    MobileVerified = true;
    
    CLKisVerified = true;
    
}

var deviceIsNEW = true;
router.patch('/anl' , async (req,res) => {        //,next
/* sending to response
exo : all ok
-1  : validity expired
0   :
1   : key not found
2   : invalid key either null or ''
3   : key not verifying as per whichsoft/mobile/body
4   : noFurtherAct or noActOnDiffDev either is true 
5   : otp is proper but lkey entry not updated
6   : otp is proper but tran entry not updated
7   : exp otp not proper , nothing updated, pls retry
8   : try catch error
*/

    if (CLKisValid) {

        // const updates = req.body;
        await VerifyCurrentKey(req.body);
        if (!CLKisVerified) {
            // console.log('key not verifying as per body');
            if (!WhichsoftVerified) {
                console.log('key not verifying at step 1');
            } else if (!MobileVerified) {
                console.log('key not verifying at step 2');
            } else {
                console.log('key not verifying as per body');
            }
            res.send('3');
            return null;
        }

        noFurtherAct = CurrKeyDetailsDB.nfa;
        noActOnDiffDev = CurrKeyDetailsDB.naodd;

        // currTran = JSON.parse(allTrans);
        currTran.tranDT = new Date();
        currTran.LKey = CurrLKey;
        currTran.tranType = "1";
        currTran.deviceDetails = req.body.deviceDetails;
        currTran.tranCount = 1;

        deviceIsNEW = true;
        const lktrans = await allTrans.find({ LKey : { $regex: new RegExp("^"+CurrLKey+"$",'i')  } })    //ignoring case but exact match
        if (lktrans!=null && lktrans!='') {
            // console.log("Found documents:");
            for await (const doc of lktrans) {
                // console.log(doc);
                LKTotalActCount = LKTotalActCount + (+doc.tranCount);
                if (doc.deviceDetails===currTran.deviceDetails) {
                    deviceIsNEW = false;
                    currTran.tranCount = (+doc.tranCount) + 1;
                    // break;
                }
            }
        }
        if (noActOnDiffDev) {
            if (deviceIsNEW) {
                noFurtherAct=true;
            } 
        }

        if (!noFurtherAct) {
            await ActivateNewLicense(req, res)    //,next
            if (licenseActivated)  {
                //update in act transactions
                //update curr record values for firstActDate and/or lastactdate, totalActCount
                console.log('lic activated after 2 updates ...');
            };
        } else {
            res.send('4');
            return null;
        }
    } 
} );
var licenseActivated = false;
async function ActivateNewLicense(req, res) {
    licenseActivated = false;
    try {
        // const updates = req.body;
        const updates = {
            // "LKey":CurrLKey,     'lkey could hv been entered as different case hence donot disturb original lkey case
            "actc":"",
            "ClName":"",
            "ClMobile":"",
            "ClEmail":"",
            "ClCity":"",
            "dv1":"",
            "dv2":"",
            "dv3":"",
            "dv4":"",
            "inpr":"",
            "rlkd":"",
            "lcdt":"",
            "ladt":"",
            "fadt":"",
            "tac":0,
            "tdc":0,
        };   //updating only required fields

        SetExpOTPForServer(req.body.actc);
        if (exo.length==4) {
            
            updates.actc = req.body.actc;
            updates.ClName = req.body.ClName;
            updates.ClMobile = req.body.ClMobile;
            updates.ClEmail = req.body.ClEmail;
            updates.ClCity = req.body.ClCity;
            updates.dv1 = req.body.dv1;
            updates.dv2 = req.body.dv2;
            updates.dv3 = req.body.dv3;
            updates.dv4 = req.body.dv4;
            updates.inpr = "";
            updates.rlkd = "";
            updates.lcdt = currTran.tranDT;
       
            //note if no actinfo object is present in a record (as those records may been added 
            // before adding the definition of actinfo schema object) , then foll is the 
            // procedure to update those records
       
            // var aiObj = new Object();
            // aiObj.ladt = currTran.tranDT;
            // if (CurrKeyDetailsDB.actInfo==null) {
            //     aiObj.fadt = currTran.tranDT;
            // } else {
            //     if (CurrKeyDetailsDB.actInfo.fadt==null) {
            //         aiObj.fadt = currTran.tranDT;
            //     }
            // }
            // aiObj.tac = LKTotalActCount + 1;

            updates.ladt = currTran.tranDT;
            if (CurrKeyDetailsDB.fadt==null) {
                updates.fadt = currTran.tranDT;
            }

            updates.tac = LKTotalActCount + 1;
            
            updates.tdc = CurrKeyDetailsDB.tdc;
            if(deviceIsNEW) updates.tdc = updates.tdc + 1;
            if (updates.tdc==0) updates.tdc = 1;
            
            // const updates = {
            //  "LKey":CurrLKey,
            //  "actInfo":aiObj
            // };   //updating only actInfo

            //const result1 = await allKeys.findOneAndUpdate({ LKey : { $regex: new RegExp(CurrLKey,'i')  } } , CurrKeyDetailsDB , {new:true} );
            const result1 = await allKeys.findOneAndUpdate({ LKey : { $regex: new RegExp(CurrLKey,'i')  } } , updates , {new:true} );
            //const result2 = await allKeys.findOneAndUpdate({LKey:updates.LKey} , updates , {new:true} )
            //const result2 = await allKeys.findOneAndUpdate({LKey:updates.LKey} , updates , {new:true} )
            const result2 = await allTrans.findOneAndUpdate({ LKey: currTran.LKey, deviceDetails: currTran.deviceDetails }, currTran, 
                {
                    returnDocument: 'after', // Return the document after update/insert
                    upsert: true // Create if not found
                }
            );
            
            if (result1==null) {
                console.log('nothing updated in key record');
                res.send('5');
            // } else if (result2==null) {
            //     console.log('nothing updated in actinfo');
            //     res.send('6');
            } else if (result2==null) {
                console.log('nothing updated in tran record');
                res.send('6');
            } else {
                licenseActivated = true;
                res.send(exo+'');
                console.log('entries updated');
                //console.log(result1 + '\n\n' + result2 + '\n\n' + result3);
                // console.log(result2);
            }
        } else {
            // res.send(result + '\nexo=' + exo);
            console.log('pls retry ...');
            res.send('7');
        }
    } catch (error) {
        console.log(error.message);
        res.send('8');
    }
    
}

async function ActivateNewLicense_NR(req, res, next) {

    licenseActivated = false;
    
    try {
        const updates = req.body;
        await VerifyCurrentKey(updates);
        if (!CLKisVerified) {
            // console.log('key not verifying as per body');
            if (!WhichsoftVerified) {
                console.log('key not verifying at step 1');
            } else if (!MobileVerified) {
                console.log('key not verifying at step 2');
            } else {
                console.log('key not verifying as per body');
            }
            res.send('3');
            return null;
        }
        updates.inpr = "";
        updates.rlkd = "";
        updates.actTS = new Date();
        
        const result = await allKeys.findOneAndUpdate({ LKey : { $regex: new RegExp(CurrLKey,'i')  } } , updates , {new:true} )
        if (result==null) {
            console.log('nothing updated');
            res.send('4');
        } else {
            SetExpOTPForServer(updates.actc);
            if (exo.length==4) {
                // res.send(result + '\nexo=' + exo);
                res.send(exo+'');
                licenseActivated = true;
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

/*
router.patch('/mkd' , (req,res,next) => { ModifyKeyDetails(req, res, next)} );
*/
router.patch('/uouc' , (req,res,next) => { UpdateOnlyUserConstants(req, res, next)});

router.post('/gcd', async (req, res, next ) => {            //get client details

    var FakeReadMode = false;
    var FakeWriteMode = false;
    var actc, frwcode;
    actc = req.body.actc+'';
    frwcode = actc.charAt(actc.length-1);
    if (Number(frwcode)===6) FakeReadMode = true;
    if (Number(frwcode)===8) FakeWriteMode = true;
    
    var rs1 = await adminKeys.GetOneProductLimited(req, null, next);//not sending res as we hv to modify o/p and then send response from this method
    // console.log(rs1);
    //res = rs1;

    if (FakeReadMode) {
        rs1.conu = rs1.conu.trim() + " "; 
    }

    res.send(rs1);
    // return rs1;
});

//called from android app GetLKey during activation process
router.post('/rofk' , (req,res) => { RequestOtpForKey(req, res) } );

//called from astrooffice app (after android app) to complete the step of getting key after otp verification during activation process
router.post('/vogk' , (req,res) => { VerifyOtpSendKey(req, res) } );

//called from astrooffice app to checklkvalidity
router.post('/gofvk' , (req,res) => { GetOtpForValidKey(req, res) } );

async function VerifyOtpSendKey (req, res) {
    try {
        //if (CurrKeyDetailsDB===null) return;
        // console.log(req.body.otp+'');
        const result = await allKeys.findOne({ rlkd : { $regex: new RegExp(req.body.otp,'i')  } })    //ignoring case not spaces
        //console.log(result+'');
        var resSend = '';
        if (result===null || result==='') {
            resSend='0';
        } else {
            resSend = '-1';
            if (result.ClMobile===req.body.ClMobile || (result.ClMobile==='' || result.ClMobile===null)) {  //case if mobile is null 
                if (result.appName===req.body.appName) {
                    if (result.inpr===req.body.inpr) {
                        resSend = result.LKey;
                    }
                }
            }
        }
        
        // console.log( CurrKeyDetailsDB.rlkd + '\n' + loggedOTP + ' = ' + loggedTS) ;
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
        if (CurrKeyDetailsDB===null) return;
        var loggedOTP = null;
        var loggedTS = null;
        if (CurrKeyDetailsDB.rlkd != '') {
            loggedOTP = CurrKeyDetailsDB.rlkd.split(',')[0];
            loggedTS = CurrKeyDetailsDB.rlkd.split(',')[1];
        }
        // console.log( CurrKeyDetailsDB.rlkd + '\n' + loggedOTP + ' = ' + loggedTS) ;
        var resSend = CurrKeyDetailsDB.LKey;

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
        setTimeout(ResetLKData, 2000, CurrKeyDetailsDB.LKey);

        /*
        const updates = {"LKey":req.body.LKey,
            "rlkd":''};   //updating only reqlkdata , no matter whatever extra is passed
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
    const updates = {"LKey":firstParam, "inpr":'',
        "rlkd":''};   //updating only intpro and reqlkdata , no matter whatever extra is passed
    const result = await allKeys.findOneAndUpdate({LKey:updates.LKey} , updates , {new:true} )
    if (result===null) {
        console.log('nothing updated');
    } else {
        console.log(firstParam + ' entry nullified after ' + secondParam + ' seconds ...' );
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
                console.log('Mobile not verifying : ' + CurrKeyDetailsDB.ClMobile);
                res.send('-2');
            }
            return null;
        }

        var d = new Date();
        var seconds = Math.round(d.getTime() / 1);
        // console.log(seconds + ' = ' + inputs.actc);
        SetExpOTPForServer((seconds+''));
        if (exo.length==4) {
            var now = new Date();
            //var lkdata = exo + "," + now ;
            var lkdata = exo + CurrKeyDetailsDB.LKey.substr(0,2).toLowerCase() + CurrKeyDetailsDB.LKey.substr(CurrKeyDetailsDB.LKey.length-2).toLowerCase(); 
            const updates = {"LKey":req.body.LKey, "inpr":req.body.inpr,
                "rlkd":lkdata};   //updating only intpro and reqlkdata , no matter whatever extra is passed
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
    setTimeout(ResetLKData, 30*1000, CurrKeyDetailsDB.LKey, 30);

}

async function GetOtpForValidKey(req, res) {
    try {
        const inputs = req.body;
        await VerifyCurrentKey(inputs);
        if (!CLKisVerified) {
            if (!WhichsoftVerified) {
                console.log('app not verifying');
                res.send('-1');
            } else if (!MobileVerified) {
                console.log('Mobile not verifying : ' + CurrKeyDetailsDB.ClMobile);
                res.send('-2');
            }
            return null;
        }
        
        /*  27.10.2025 remming it for a while till the whole idea of its requirement is understood
        var d = new Date();
        var seconds = Math.floor(d.getTime() / 1);      //Math.round was giving the 30-40 secs difference dny
        //ref : https://stackoverflow.com/questions/25250551/node-js-how-to-generate-timestamp-unix-epoch-format
        if (Math.abs(seconds-parseFloat(inputs.actc) ) > 2000 ) { //2 secs diff only
            //either sync clients computer with net date and time or increase this diff or skip this altogether
            //or any other alternative
            console.log (seconds + ' = ' + inputs.actc + ' = ' + (seconds - parseFloat(inputs.actc)));
            // console.log (seconds - parseFloat(inputs.actc));
            res.send('1');
            return;    
        }
        */
        // console.log (seconds + ' = ' + inputs.actc + ' = ' + (seconds - parseFloat(inputs.actc)));
        
        SetExpOTPForServer(inputs.actc);
        var lkdata = ''; //exo + CurrKeyDetailsDB.LKey.substr(0,2).toLowerCase() + CurrKeyDetailsDB.LKey.substr(CurrKeyDetailsDB.LKey.length-2).toLowerCase(); 
        var char1,char2,char3,char4;

        if (isEven(exo.charAt(0))) {    //positions from right side of lkey
            char1 = CurrKeyDetailsDB.LKey.charAt(CurrKeyDetailsDB.LKey.length-exo.charAt(0)-1).toLowerCase();
            char2 = CurrKeyDetailsDB.LKey.charAt(CurrKeyDetailsDB.LKey.length-exo.charAt(1)-1).toLowerCase();
            char3 = CurrKeyDetailsDB.LKey.charAt(CurrKeyDetailsDB.LKey.length-exo.charAt(2)-1).toLowerCase();
            char4 = CurrKeyDetailsDB.LKey.charAt(CurrKeyDetailsDB.LKey.length-exo.charAt(3)-1).toLowerCase();
        } else {        //get positions from left side of lkey
            char1 = CurrKeyDetailsDB.LKey.charAt(exo.charAt(0)).toLowerCase();
            char2 = CurrKeyDetailsDB.LKey.charAt(exo.charAt(1)).toLowerCase();
            char3 = CurrKeyDetailsDB.LKey.charAt(exo.charAt(2)).toLowerCase();
            char4 = CurrKeyDetailsDB.LKey.charAt(exo.charAt(3)).toLowerCase();
        }
        lkdata = exo + char1 + char2 + char3 + char4;
        // console.log(lkdata);
        
        if (lkdata.length==8) {
            res.send(lkdata+'');
            // console.log('entry updated');
        } else {
            // res.send(result + '\nexo=' + exo);
            // console.log('pls retry ...');
            res.send('-3');
        }
    } catch (error) {
        console.log(error.message);
        res.send("0");
    }
}

async function UpdateOnlyUserConstants(req, res, next) {
    try {
        //const updates = {"LKey":req.body.LKey,
        //    "conu":req.body.conu};   //updating only consU , no matter whatever extra is passed
        const updates = {"conu":req.body.conu};   //updating only consU , no matter whatever extra is passed
            
        // if (updates.LKey+''!='') {
        if (req.body.LKey+''!='') {
            //const result = await allKeys.findOneAndUpdate({LKey:updates.LKey} , updates , {new:true} )
            const result = await allKeys.findOneAndUpdate({ LKey : { $regex: new RegExp(req.body.LKey,'i')  } } , updates , {new:true} );
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
            "vudt":req.body.vudt
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

function isEven(n) {
    return (n % 2 === 0);
}

/*
async function IsLicenseServerBased_NR (forLKey) {    
    if (forLKey!=null && forLKey!='') {
        const result = await allKeys.findOne({ LKey : { $regex: new RegExp(forLKey,'i')  } })    //ignoring case not spaces        
        if (result!=null && result!='') {
            return !result.ofd;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

async function IsKeyValidByDate_NR (forLKey) {    
    //console.log('forlkey='+forLKey+'');
    if (forLKey!=null && forLKey!='') {
        const result = await allKeys.findOne({ LKey : { $regex: new RegExp(forLKey,'i')  } })    //ignoring case not spaces        
        //console.log('result='+result);
        if (result!=null && result!='') {
            var vd = new Date(result.vudt);
            var cd = new Date();
            if (vd<cd) {
                // console.log('key expired');
                //res.send('0');
                return "0";//false;
            } else {
                return true;
            }
        } else {
            // console.log('key not found = ' + req.body.LKey);
            //res.send('1');
            return false;
        }
    } else {
        // console.log('invalid key');
        //res.send('2');
        return "-2";//false;
    }
};

async function IsBackupValidByDate_NR (forLKey) {    
    //console.log('forlkey='+forLKey+'');
    if (forLKey!=null && forLKey!='') {
        const result = await allKeys.findOne({ LKey : { $regex: new RegExp(forLKey,'i')  } })    //ignoring case not spaces        
        //console.log('result='+result);
        if (result!=null && result!='') {
            if (result.budt===null) {
                return false;
            } else {
                var vd = new Date(result.budt);
                var cd = new Date();
                if (vd<cd) {
                    return false;
                } else {
                    return true;
                }
            }
        } else {
            // console.log('key not found = ' + req.body.LKey);
            //res.send('1');
            return false;
        }
    } else {
        // console.log('invalid key');
        //res.send('2');
        return "-2";//false;
    }
};

async function Check3BackupValidities_NR (forLKey, vals) {    
    
    vals.licserverbased = false;
    vals.lkeyvalidbydate = false;
    vals.backupvalidbydate = false;
    if (forLKey!=null && forLKey!='') {
        const result = await allKeys.findOne({ LKey : { $regex: new RegExp(forLKey,'i')  } })    //ignoring case not spaces        
        
        if (result!=null && result!='') {
            vals.licserverbased = !result.ofd;
            var cd = new Date();
            var vd = new Date(result.vudt);
            if (vd<cd) {
                vals.lkeyvalidbydate = false;
            } else {
                vals.lkeyvalidbydate = true;
            }

            if (result.budt===null) {
                vals.backupvalidbydate = false;
            } else {
                var vd = new Date(result.budt);
                if (vd<cd) {
                    vals.backupvalidbydate = false;
                } else {
                    vals.backupvalidbydate = true;
                }
            }
        } else {
            // console.log('key not found = ' + req.body.LKey);
            //res.send('1');
            //return false;
        }
    } else {
        // console.log('invalid key');
        //res.send('2');
        //return "-2";//false;
    }
    return true;
};

*/

async function Check3BackupValidities (forLKey) {    
    // console.log('key not found = ' + forLKey);
    var licserverbased = false;
    var lkeyvalidbydate = false;
    var backupvalidbydate = false;
    if (forLKey!=null && forLKey!='') {
        // const result = await allKeys.findOne({ LKey : { $regex: new RegExp(forLKey,'i')  } })    //ignoring case not spaces        
        const result = await allKeys.findOne({ LKey : { $regex: new RegExp("^"+forLKey+"$",'i')  } })    //ignoring case not spaces
        if (result!=null && result!='') {
            licserverbased = !result.ofd;
            var cd = new Date();
            var vd = new Date(result.vudt);
            if (vd<cd) {
                lkeyvalidbydate = false;
            } else {
                lkeyvalidbydate = true;
            }

            if (result.budt===null) {
                backupvalidbydate = false;
            } else {
                var vd = new Date(result.budt);
                if (vd<cd) {
                    backupvalidbydate = false;
                } else {
                    backupvalidbydate = true;
                }
            }
        } else {
            // console.log('key not found = ' + req.body.LKey);
            //res.send('1');
            // return false;
        }
    } else {
        // console.log('invalid key');
        //res.send('2');
        //return "-2";//false;
    }
    // console.log ( { licserverbased, lkeyvalidbydate , backupvalidbydate} );
    return {licserverbased, lkeyvalidbydate , backupvalidbydate};
};

async function ModifyBackupInfo(forLKey, bi) {
    try {
        const updates = {
            "LKey":forLKey,
            "binf":bi
        };   //updating only backupInfo

        // console.log('in MBI = ' + JSON.stringify(updates, null, 4));
        
        if (updates.LKey+''!='') {
             const result = await allKeys.findOneAndUpdate({LKey:updates.LKey} , updates , {new:true} )
            // console.log('in MBI result = ' + result );
            
            if (result==null) {
                console.log('backupinfo NOT updated');
                return false;
            } else {
                console.log('backupinfo updated' );
                return true;
            }

            // Use the updateOne method to update the user's email
            // allKeys.updateOne({ LKey: updates.LKey }, { $set: { binf: bi } })
            //   .then(result => {
            //     console.log('Update result:', result);
            //     if (result.nModified > 0) {
            //       console.log('User updated successfully');
            //     } else {
            //       console.log('User not found');
            //     }
            //   })
            //   .catch(error => {
            //     console.error('Error updating user:', error);
            //   });



        }
    } catch (error) {
        console.log(error.message);
    }
}

// module.exports = router;
module.exports = { 
    router,
    Check3BackupValidities,
    ModifyBackupInfo
}

// //return router;


// const multer = require('multer');

// const storage = multer.diskStorage( {
//     destination: (req, file, cb)=> {
//         cb(null, 'mastersuploads/');
//     },
//     filename: (req, file, cb) => {
//         cb(null, '123-' + file.originalname);
//     }
// })

// const backupMaster = multer(storage);

// require("../features.js")();
// router.post('/backupmasters' , backupMaster.none() , (req, res) => {  
//     try {
//         // backupMaster.single('file');
//         console.log(req.body);
//         console.log(req.body.file);
//         console.log(req.LKey);
//         res.send('ok');
//         console.log('inside backupmasters route');
//         return '1';
//     } catch (error) {
//         console.log(error.message);
//     }
// });
