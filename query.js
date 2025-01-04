const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mydatabase', { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
});

// Define User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

const User = mongoose.model('User', userSchema);

// Query function
async function queryUsers() {
    try {
        const users = await User.find({}, {password: 0}); // Exclude passwords
        console.log('Users:', users);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.connection.close();
    }
}

queryUsers(); 