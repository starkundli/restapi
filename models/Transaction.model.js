const mongoose = require('mongoose')
const Schema = mongoose.Schema

//transactionsSchema actually used for activations (type=1) if in future any other type required
//for ex deact or react change use trantype other than '1'
const transactionSchema = new Schema ({      
    tranDT : {type: Date, required: true} ,
    LKey: {type : String, required: true} ,
    tranType: {type : String, required: true , default : '1'} ,
    deviceDetails: {type : String, required: true } ,   //sep by • i.e. alt+0149
    tranCount: {type : Number, required: true} , 
    
})
const transactions = mongoose.model('transactions', transactionSchema ); //this OR below line without s
//const transactions = mongoose.model('transaction', transactionSchema);
module.exports = transactions;
