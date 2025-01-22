const mongoose = require('mongoose');

module.exports = () => {
    mongoose.connect(
        process.env.mongodbURI,
         {
            dbName:process.env.dbName,
            user:process.env.dbUser,
            pass:process.env.dbPass,
            // useNewUrlParser:true,
            // useUnifiedTopology:true
         }
    ).then(()=>{
        console.log('mongodb connected...')
    })
    .catch( err => console.log (err.message) );
   
    mongoose.connection.on ('connected', () => {
       console.log('mongoose connected to db ...');
    })
   
    mongoose.connection.on ('error', (err) => {
       console.log(err.message);
    })
   
    mongoose.connection.on ('disconnected', () => {
       console.log('mongoose disconnected from the db ...')
    })
   
   //    process.on("exit", () => {
           // mongoose.connection.close();
       // console.log("EXIT - MongoDB Client disconnected");
           // process.exit(0);
       // mongoose.connection.close();
   //    });
   
    process.on('SIGINT', () => {
       mongoose.connection.close().then( ()=>{
            console.log('Mongoose disconnected on app termination');
            //console.log("SIGNIT - MongoDB Client disconnected");
            process.exit(0);
       
       });
    });
       
}