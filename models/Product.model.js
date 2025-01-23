const mongoose = require('mongoose')
const Schema = mongoose.Schema
const productSchema = new Schema ({

    appGroup: {type : String, required: true } ,
    appName: {type : String, required: true } ,
    createdON: {type : Date, required: false } , 
    validUpto: {type : Date, required: true } , 
    actCode: {type : String, required: false } ,
    LKey: {type : String, required: false } ,
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
    actTS: {type: Date, required: false},
    lastCommTS: {type: Date, required: false},

                          
})
const product = mongoose.model('product', productSchema )
module.exports = product;
