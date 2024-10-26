const mongoose = require('mongoose');
const dotenv = require('dotenv');

module.exports = () => {
    const connectionParams = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        writeConcern: { w: 'majority', j: true, wtimeout: 1000 }
    };
    try {
        mongoose.connect(process.env.DB, connectionParams);
        console.log('Connected to database succesfully');
    } catch (error) {
        console.log(error);
        console.log("Couldn't connect to database");
    }
}
