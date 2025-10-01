const express = require('express');
const multer = require('multer');
const client = require("../ClientRoutes/LKeys.route.js");

const router = new express.Router();

var fileWillBeUploaded;//=false;
var fileDownloadLink='-';
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        //console.log("callback="+req.body.LKey);
        cb(null, "backups/");
    },
    
    filename: (req, file, cb) => {
        //console.log("callback="+req.body.LKey);
        //fileDownloadLink = req.body.LKey + "-" + file.originalname;
        cb(null, req.body.LKey + "-" + file.originalname);
    },
});
var biObj = new Object();
async function uploadFilter(req, file, cb) {
// async function uploadFilter(req, file) {
    //Here you can access the other fields
    // console.log('key in filter =' + req.body.LKey)
    fileDownloadLink = req.body.LKey + "-" + file.originalname;
    biObj.downloadLink = fileDownloadLink;
    biObj.clientCount = req.body.clientCount; 
    biObj.astroCount = req.body.astroCount; 
    biObj.lastBackupDT = req.body.lastBackupDT; 

    //console.log(req.body.description)
    //and you won't get undefined anymore.
    //so do your validation here
    
    var vals; // = {"licserverbased":false,"lkeyvalidbydate":false,"backupvalidbydate":false};

    vals = await client.Check3BackupValidities (req.body.LKey); //licserverbased, lkeyvalidbydate, backupvalidbydate);

    // console.log('serverbased=' + vals.licserverbased);
    // console.log('keyvalid=' + vals.lkeyvalidbydate);
    // console.log('backupvalid=' + vals.backupvalidbydate);
    
    if ( vals.licserverbased && vals.lkeyvalidbydate && vals.backupvalidbydate ) {
        fileWillBeUploaded=true;
        // return true;
        return cb(null, true);
    } else {
        //console.log('only mdb files uploaded');
        fileWillBeUploaded=false;
        // return false;
        return cb(null, false);
    }
}

var upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        return uploadFilter(req, file, cb);
        // cb(null, uploadFilter(req, file));
        // cb(null, true);// uploadFilter(req, file));
    }
}).single("mdbName");

//const upload = multer({dest: "backups/"});

var retStr='';

/*
router.use("/", async (req, res, next) => {
    // res.send('123');
    //res.status(200).json({ message: 'inside root = ' + req.body.LKey })
    retStr = 'inside root = ' + req.body.LKey;
    console.log(`\nform-data ->> ${JSON.stringify(req.body)}`);
    // console.log(retStr);
    // res.send(retStr);
    lkeyvalidbydate = true;
    lkeyvalidbydate = await client.IsKeyValidByDate (req.body.LKey);
    licserverbased = true;
    backupvalidbydate = true;
    console.log(lkeyvalidbydate);
    if (lkeyvalidbydate && licserverbased && backupvalidbydate) {
        next();
    } else {
        res.send(retStr + " = false");
        return null;
    }
    // return true;// res.status(200).json({ message: 'inside root = ' + req.body.LKey })
});
*/

router.post("/masters", upload, (req, res) => {
    // console.log(req.body, req.file);
    //retStr = retStr + "\n" + "testing master route = " + req.body + " / " + req.file;
    
    // console.log(`\nform-data ->> ${JSON.stringify(req.body)}`);
    // console.log('after single=' + req.body.LKey);
    // console.log('fileWillBeUploaded=' + fileWillBeUploaded);
    // console.log('bi=' + req.body);
    // console.log('fn=' + fileDownloadLink);
    //const bi = req.body.info;
    if (fileWillBeUploaded==true) {
        //bi.downloadlink = bi.downloadlink + ' = ' + fileDownloadLink;
        //const newbidownloadlink = bi.downloadlink + ' = ' + fileDownloadLink;
        // console.log('new bi=' + JSON.stringify(biObj, null, 4));
        //console.log('newbidownloadlink = ' + newbidownloadlink );
        client.ModifyBackupInfo (req.body.LKey, biObj);
    }
    
    res.send("done");
    return true;//res.status(200).json({ message: 'testing' })

});

module.exports = router;
