// courtesy : https://www.youtube.com/@mafiacodes
//https://www.youtube.com/playlist?list=PLdHg5T0SNpN3EoN3PEyCmPR42Ok_44OFT
//https://www.youtube.com/watch?v=cGAdC4A5fF4&list=PPSV
const express = require('express');
const dotenv = require('dotenv').config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

// console.log(dotenv.parsed);

//initialise db
require('./initdb.js')();
// note in future shift the entire product/admin endpoints to some other nodejs server/app
// so that client routes will be free from atleast this much amount of load processing,
// although mongodb will still cater to two nodejs apps but later that also can be
// streamlined like main DB for clients and backed up db for admin/product routes or whatever
const ProductRoute = require('./AdminRoutes/Products.route.js');
// app.use('/products', ProductRoute);
app.use('/products', ProductRoute.router);


const LKeyRoute = require('./ClientRoutes/LKeys.route.js');
//app.use('/client', LKeyRoute);      //if u are only exporting router(at end of file) in lkeys.route.js use this statement
app.use('/client', LKeyRoute.router);    //if u are exporting json object with router and other function in lkeys.route.js use this statement


const serverBackupRoute = require('./BackupRoutes/ServerBackup.route.js');
app.use('/serverbackup', serverBackupRoute);

const cloudBackupRoute = require('./BackupRoutes/CloudBackup.route.js');
app.use('/cloudbackup', cloudBackupRoute);

app.use((req, res, next) => {
    const err = new Error("Not found")
    err.status=404;
    next(err)
})

//error handler
app.use((err, req, res, next)=>{
    err.status = err.status || 500
    res.send({
        error : {
            status: err.status,
            message: err.message
        }
    })
})
// console.log(process.env.PORT);
const PORT = process.env.PORT || 3000;
app.listen(PORT , ()=>{
    console.log ('started with express at port ' + PORT + ' ...');
});


/*
app.all('/test', (req,res)=>{
    // console.log(req.query.name)
    // res.send(req.query.name)
    // console.log(req.params.name)
    // res.send(req.params.id)
    console.log(req.body);
    res.send(req.body);
})
*/

// const bodyParser = require('body-parser');

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

// app.use(express.urlencoded({ extended: false }));
// app.use(express.json());

//?retryWrites=true&w=majority/




// app.get('/products')
// app.post('/')
// app.delete('/')




// import http from 'http' ;
// import {genLovePercent} from "./features.js";
// import fs from 'fs'

// // console.log('running again , ok')
// // console.log(genLovePercent() + ' ');

// const server = http.createServer((req,res) =>{
//     // res.send('server is started ...' + req.url)  
//     // res.end(myObj.genLovePercent() + ' percent');
//     if (req.url === '/about') {
//         // res.end(`<h1>Love is ${genLovePercent()}</h1>`)
//         res.end('about ' +req.method);
//     } else if (req.url==="/") {
//         fs.readFile("./index.html", (err,fc)=>{
//             res.end(fc);
//         })
//     } else {
//         res.end('page not found');
//     }
// });
// server.listen(2000, ()=>{
//     console.log('server is listening ...')    
// });

//04.01.2025
// import express from 'express'
// import path from 'path'
// import mongoose from 'mongoose';

// mongodb+srv://killer:<db_password>@cluster0.4ff1t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
// killer = DOQ1bb5KTNifTzlG
// mongoose.connect("mongodb://localhost:27017/restapi").then(()=>{
//     console.log('mongodb connected...')
// })


/*
const app = express();
const users=[]
//middlewares ...
app.use(express.static(path.join(path.resolve() , "public")));
app.use(express.urlencoded({extended:true}) )

//Setting view engine
app.set("view engine","ejs")

app.get("/", (req,res) =>{
    //console.log(path.resolve())
    // res.sendFile(path.join(path.resolve() , 'index.html'))
    res.render("index", {zzz:'Singh'})
    // res.sendFile(path.join(path.resolve() , 'public/index.html'))
    // res.sendFile("index.html")
});
app.get("/users", (req,res) =>{
    res.json({users})
});
app.post("/contact",(req, res)=> {
    // console.log(req.body)
    users.push({username:req.body.name, email:req.body.email})
    
    res.redirect('/users')
}) 
*/

