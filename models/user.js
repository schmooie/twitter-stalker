var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User;

var followersSchema = new Schema({
    amount: Number,
    date: { type: Date, default: Date.now }
});

var userSchema = new Schema({
    screen_name: String,
    followers: [followersSchema],
    last_checked: { type: Date, default: Date.now }
});

module.exports = User = mongoose.model('User', userSchema);