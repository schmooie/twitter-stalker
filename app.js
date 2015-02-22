var express = require('express'),
    session = require('express-session'),
    expresshbs = require('express-handlebars'),
    OAuth = require('oauth').OAuth,
    Twit = require('twit'),
    _ = require('underscore'),
    mongoose = require('mongoose'),
    User = require('./models/user');

var server = express();
var oauth = new OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    process.env.TWIT_KEY,
    process.env.TWIT_SECRET,
    '1.0',
    'http://twitter-stalker.herokuapp.com/auth/twitter/callback',
    'HMAC-SHA1'
);
var port = process.env.PORT || 3000;
var T;


mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/twitter-tracker');
mongoose.connection.once('open', function() {
    console.log('DB connection open');
});

server.engine('handlebars', expresshbs({
    defaultLayout: 'main'
}));
server.set('view engine', 'handlebars');
server.use(session({
    secret: 'thug nasty',
    resave: false,
    saveUninitialized: true
}));
server.use(express.static(__dirname + '/public'));


// api
server.get('/', function(req, res) {
    var response = _.extend({}, { oauth: !!req.session.oauth });
    console.log(req.session);
    res.render('home', response);
});

server.get('/auth/twitter', function(req, res) {
    oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
        if (error) {
            console.log(error);
            res.send("Authentication Failed!");
        } else {
            req.session.oauth = {
                token: oauth_token,
                token_secret: oauth_token_secret
            };
            console.log('auth twitter', req.session.oauth);
            res.redirect('https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token);
        }
    });
});

server.get('/auth/twitter/callback', function(req, res, next) {
    if (req.session.oauth) {
        req.session.oauth.verifier = req.query.oauth_verifier;
        var oauth_data = req.session.oauth;

        oauth.getOAuthAccessToken(
            oauth_data.token,
            oauth_data.token_secret,
            oauth_data.verifier,
            function(error, oauth_access_token, oauth_access_token_secret, results) {
                if (error) {
                    console.log(error);
                    res.send("Authentication Failure!");
                } else {
                    req.session.oauth.access_token = oauth_access_token;
                    req.session.oauth.access_token_secret = oauth_access_token_secret;

                    T = new Twit({
                        consumer_key: process.env.TWIT_KEY,
                        consumer_secret: process.env.TWIT_SECRET,
                        access_token: oauth_access_token,
                        access_token_secret: oauth_access_token_secret
                    });

                    console.log(results, req.session.oauth);
                    res.redirect('/'); // You might actually want to redirect!
                }
            }
        );
    } else {
        res.redirect('/'); // Redirect to login page
    }
});

server.get('/user', function(req,res) {
    var screen_name = req.query.screen_name || false;

    if (screen_name) {
        T.get('users/show', { screen_name: screen_name }, function(err, twitterData, response) {
            var newFollower = { amount: twitterData.followers_count };

            User.findOneAndUpdate({ screen_name: screen_name }, { $push: { followers: newFollower } }, { upsert: true }, function(err, updatedDoc) {
                res.json(updatedDoc);
            });

        });
    } else {
        res.redirect('/');
    }
});


server.listen(port, function() {
    console.log('Listening on ' + port);
});