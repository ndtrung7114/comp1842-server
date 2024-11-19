const mongoose = require('mongoose');

async function connect() {
    try {
        await mongoose.connect(process.env.DATABASE_URI);
    } catch (error) {
        console.error('Error connecting to the database');
    }
}

module.exports = connect;