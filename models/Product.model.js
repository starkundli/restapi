const mongoose = require('mongoose')
const Schema = mongoose.Schema

const backupInfoSchema = new Schema({

    downloadLink: { type: String , default: "-"},
    clientCount: { type: String , default: "-"},
    astroCount: { type: String , default: "-" },
    appVer: { type: String , default: "-" },
    lastBackupDT: { type: String, default: "-" },

});

const productSchema = new Schema ({

    LKey: {type : String, required: false } ,
    appGroup: {type : String, required: true } ,
    appName: {type : String, required: true } ,
    crdt: {type : Date, required: false } ,        //createdON
    vudt: {type : Date, required: true } ,          //validUpto
    actc : {type : String, required: false } ,        //actCode
    ClName: {type: String, required: false},
    ClMobile: {type: String, required: false},
    ClEmail: {type: String, required: false},
    ClCity: {type: String, required: false},
    dv1 : {type: String, required: false},          //dev1
    dv2 : {type: String, required: false},      //dev2
    dv3 : {type: String, required: false},      //dev3
    dv4 : {type: String, required: false},      //dev4
    conf : {type: String, required: false},     //consF
    conu : {type: String, required: false},     //consU
    inpr : {type: String, required: false},     //intpro
    lcdt : {type: Date, required: false},  // lastCommDT
    rlkd : {type: String, required: false}, // reqlkdata = storing otp and ts sent to client to verify received otp from client and check both ts diff (10secs) before sending , while lkey request from client
    budt : {type : Date, required: false, default: null},   //backupUpto
    binf : {type : backupInfoSchema, required: false, default: null},       //backupInfo
    ofd: {type: Boolean, required: false, default: false},  //optedForDongle
    naodd : {type: Boolean, default: false},   //noActOnDiffDev = post first activation this will come into effect handled by ADMIN only
    nfa : {type: Boolean, default: false},   //noFurtherAct = post first activation this will come into effect handled by ADMIN only

    fadt : {type: Date, required: false},           //firstActDT
    ladt : {type: Date, required: false},           //lastActDT
    tac : { type: Number, default: 0},              //totalActCount
    tdc : { type: Number, default: 0},      //totalDevCount = act on no. of devices/pcs after first purchase

    //selfDeregDT: {type: Date, required: false, default: null},

})
const product = mongoose.model('product', productSchema )
module.exports = product;

/*
const activationInfoSchema = new Schema ({
    fadt: {type: Date, required: false},
    ladt: {type: Date, required: false},
    tac: { type: Number, default: "0"},

});


const backupInfoObject = new Object({

    downloadLink: { type: String , default: "-"},
    clientCount: { type: String , default: "-"},
    astroCount: { type: String , default: "-" },
    appVer: { type: String , default: "-" },
    lastBackupDT: { type: String, default: "-" },

});
*/
