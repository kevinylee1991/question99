var express = require('express.io');
var path = require('path');
var app = express().http().io();
var mongoose = require('mongoose');

// var uristring = process.env.MONGOLAB_URI || 
//     process.env.MONGOHQ_URL || 
//     'mongodb://localhost';

var uristring = process.env.MONGOLAB_URI || 
    process.env.MONGOHQ_URL || 
    'mongodb://heroku_app25018002:plqiscah8os7mmtufthjpd6mo4@ds043037.m
ongolab.com:43037/heroku_app25018002';

mongoose.connect(uristring, function(err, res){
    console.log('asdf');
}
// configuring our environments
app.configure(function(){
  app.use(express.cookieParser());  
  app.use(express.bodyParser());    //for handling post data
  app.use(express.static(path.join(__dirname, 'public'))); //for handling static contents
  app.use(express.session({secret: 'monkey'})); //for using sessions
  app.set('view engine', 'jade');
});
//we're going to have /routes/index.js handle all of our routing
var route = require('./routes/index.js')(app);
app.listen(process.env.PORT || 2343);