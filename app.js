const dotenv = require('dotenv').config()
var mongoose = require('mongoose');
require('./models/Polls');
require('./models/Users');
require('./config/passport');

var passport = require('passport');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();
const mongoHost = process.env.MONGO_URI;
const mongoUser = process.env.MONGO_USR;
const mongoPassword = process.env.MONGO_PW;
const MONGO_CONNECTION_STRING = `mongodb+srv://${mongoUser}:${mongoPassword}@${mongoHost}`
let db;
// mongoose.connect('mongodb://localhost/polls');
mongoose.connect(MONGO_CONNECTION_STRING,  {useNewUrlParser: true}, (err) => {
  if (err) { console.log(err); } else{ console.log("DB connection OK") };
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());


app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
