const express = require('express');
const multer = require('multer');
const multerGoogleStorage = require("multer-google-storage");
const { Storage } = require('@google-cloud/storage')
const client = require("../ClientRoutes/LKeys.route.js");
const router = new express.Router();

var finalFN="";
var fileUploaded=false;
var ret="0";    //0=file not uploaded, 1=file uploaded, 2=file made public, -1=file not made public
const bucketName = "zzz_bucket_1";
const keyFN ="composite-dream-444606-i6-ac46e7ab0b6e.json";
const folderInBucket = "mastersbackups";
var fileWillBeUploaded;//=false;

//note : for bucket creation - create bucket with unique name and ignore all other opions
//in permission/access option select access control as Fine-grained: Object-level ACLs enabled
//thereby public access will show as : Subject to object ACLs, thas it ...

var uploadHandler = multer({
    storage: multerGoogleStorage.storageEngine({
      autoRetry: true,
      // bucket: 'composite-dream-444606-i6.appspot.com',
      bucket: bucketName, //'zzz_bucket_1',
      projectId: '<projectId>',
      keyFilename: keyFN, //'composite-dream-444606-i6-ac46e7ab0b6e.json',
      filename: (req, file, cb) => {
        
        //finalFN = (`mastersbackups/${req.body.LKey}_${file.originalname}`);
        finalFN = (`${folderInBucket}/${req.body.LKey}_${file.originalname}`);
        // console.log(finalFN);
    
        cb(null, `/${folderInBucket}/${req.body.LKey}_${file.originalname}`);
      }
    }),

    fileFilter: (req, file, cb) => {

        return uploadFilter(req, file, cb);

    },

});

async function uploadFilter(req, file, cb) {
// async function uploadFilter(req, file) {
    //Here you can access the other fields
    // console.log('key in filter =' + req.body.LKey)
    
    //console.log(req.body.description)
    //and you won't get undefined anymore.
    //so do your validation here
    
    var vals; // = {"licserverbased":false,"lkeyvalidbydate":false,"backupvalidbydate":false};

    vals = await client.Check3BackupValidities (req.body.LKey); //licserverbased, lkeyvalidbydate, backupvalidbydate);
    
    if ( vals.licserverbased && vals.lkeyvalidbydate && vals.backupvalidbydate ) {
        fileWillBeUploaded=true;
        // return true;
        return cb(null, true);
    } else {
        console.log('file will not be uploaded');
        fileWillBeUploaded=false;
        // return false;
        ret="0";
        return cb(null, false);
    }
}

// Initialize storage
const storage = new Storage({
  keyFilename: keyFN, //`./composite-dream-444606-i6-ac46e7ab0b6e.json`,
})


/*
router.post('/masters', uploadHandler.any(), function (req, res) {
    console.log(req.files);
    console.log(req.body);
    res.json(req.files);
});
*/

router.post('/masters', uploadHandler.single('mdbName'), async (req, res) => {
    try {
        if (req.file) {
            // const filePath = req.file.path;
            // const fileName = req.file.originalname; 
            // const destination = 'mastersbackups/' + fileName;

            try {
                
                //res.status(200).send('Data uploaded successfully'); // as = ' + req.file);
                fileUploaded=true;
                ret="1";
            } catch (error) {
                //res.status(500).send('Error uploading data');
                console.log('Error uploading data');
                res.send(ret);
            }
        } else {
            //res.status(400).send('No file uploaded');
            console.log('No file uploaded');
            res.send(ret);
        }
    } catch (error) {
        //res.status(500).send('My custom error message', error);
        console.log('My custom error message = ' + error);
        res.send(ret);
    }
    
    if (fileUploaded) {
        //const bucketName = 'zzz_bucket_1'
        const bucket = storage.bucket(bucketName);
        // Making file public to the internet
        bucket.file(finalFN).makePublic(async function (err) {
            if (err) {
                console.error(`Error making file public: ${err}`)
                //res.send(`Error making file public: ${err}`);
                ret="-1";
                res.send(ret);
            } else {
                //console.log(`File ${bucket.file(mdbFile).name} is now public.`)
                const publicUrl = decodeURIComponent(bucket.file(finalFN).publicUrl()); //this will convert %2F to slash
                //console.log(`Public URL for ${bucket.file(mdbFile).name}: ${publicUrl}`)
                //console.log(`File made public as : ${publicUrl}`);
                
                var biObj = new Object();
                // var fileDownloadLink='-';
                fileDownloadLink = publicUrl; //req.body.LKey + "-" + file.originalname;
                biObj.downloadLink = fileDownloadLink;
                biObj.clientCount = req.body.clientCount; 
                biObj.astroCount = req.body.astroCount; 
                biObj.lastBackupDT = req.body.lastBackupDT; 
                biObj.appVer = req.body.appVer; 
                const mbi = await client.ModifyBackupInfo (req.body.LKey, biObj);
                if (mbi) {
                    // console.log(req.body.LKey + ' = ' + JSON.stringify(biObj, null, 4));
                    ret="2";
                    res.send(ret);
                }

                // if (await client.ModifyBackupInfo (req.body.LKey, biObj)) {
                //     ret="2";
                // };

            }
        })
    }
    
});

module.exports = router;

