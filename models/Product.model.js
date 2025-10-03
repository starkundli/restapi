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
    createdON: {type : Date, required: false } , 
    validUpto: {type : Date, required: true } , 
    actCode: {type : String, required: false } ,
    ClName: {type: String, required: false},
    ClMobile: {type: String, required: false},
    ClEmail: {type: String, required: false},
    ClCity: {type: String, required: false},
    dev1: {type: String, required: false},
    dev2: {type: String, required: false},
    dev3: {type: String, required: false},
    dev4: {type: String, required: false},
    consF: {type: String, required: false},
    consU: {type: String, required: false},
    intpro: {type: String, required: false},
    //actTS: {type: Date, required: false},     //use actInfo.lastActDT
    lastCommDT: {type: Date, required: false},  // lastCommTS
    reqlkdata: {type: String, required: false}, // storing otp and ts sent to client to verify received otp from client and check both ts diff (10secs) before sending , while lkey request from client
    backupUpto: {type : Date, required: false, default: null}, 
    backupInfo: {type : backupInfoSchema, required: true},
    //actInfo: {type : activationInfoSchema, required: true},
    optedForDongle: {type: Boolean, required: false, default: false},
    noActOnDiffDev: {type: Boolean, default: false},   //post first activation this will come into effect handled by ADMIN only
    noFurtherAct: {type: Boolean, default: false},   //post first activation this will come into effect handled by ADMIN only

    firstActDT: {type: Date, required: false},
    lastActDT: {type: Date, required: false},
    totalActCount: { type: Number, default: 0},
    totalDevCount: { type: Number, default: 0},

    //selfDeregDT: {type: Date, required: false, default: null},

})
const product = mongoose.model('product', productSchema )
module.exports = product;

/*
const activationInfoSchema = new Schema ({
    firstActDT: {type: Date, required: false},
    lastActDT: {type: Date, required: false},
    totalActCount: { type: Number, default: "0"},

});


const backupInfoObject = new Object({

    downloadLink: { type: String , default: "-"},
    clientCount: { type: String , default: "-"},
    astroCount: { type: String , default: "-" },
    appVer: { type: String , default: "-" },
    lastBackupDT: { type: String, default: "-" },

});
*/
