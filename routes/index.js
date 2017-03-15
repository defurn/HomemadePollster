var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Poll = mongoose.model('Poll');

var passport = require('passport');
var User = mongoose.model('User');

var jwt = require('express-jwt');
var authSecret = AUTH_SECRET
var auth = jwt({secret: authSecret, userProperty: 'payload'});

router.get('/', function(req, res, next) {
  res.render('index', { title: 'APP' });
});

router.get('/polls', function(req, res, next) {
  Poll.find(function(err, polls){
    if(err){ return next(err); }
    res.json(polls);
  });
});

router.param('user', function(req, res, next, user) {
  var query = Poll.find({'user': user});
  query.exec(function(err, polls){
    if(err) { return next(err); }
    if(!polls){ return next(new Error("can't find any polls by " + user)) }
    req.polls = polls;
    return next();
  });
});

router.param('poll', function(req, res, next, poll) {
  var query = Poll.find({'title': poll});
  query.exec(function(err, data){
    if (err) { return next(err); }
    if (!data) { return next(new Error("can't find " +poll)) }
    req.poll = data;
    return next();
  });
});

router.param('contestant', function(req, res, next, contestantId){
  var query = Poll.find({
    contestants: {
      $elemMatch: {
        _id : contestantId } } } );
  query.exec(function(err, data){
    if (err) { return next(err); }
    if (!data) { return next(new Error("can't find contestant")); }
    req.poll = data;
    req.contestant = contestantId;
    return next();
  });
});

router.get('/editPoll/:user', function(req, res, next){
    res.json(req.polls)
});

router.get('/poll/:poll', function(req, res, next){
  res.json(req.poll);
})

router.put('/contestant/:contestant/upvote', function(req, res, next){
  req.poll[0].upvote(req.contestant, function(err){
    if (err) { return next(err); }
    res.json(req.poll);
  });
})

router.put('/posts/:post/upvote', auth, function(req, res, next) {
  req.post.upvote(function(err, post){
    if (err) { return next(err); }
    res.json(post);
  });
});


router.post('/polls', function(req, res, next) {
  var poll = new Poll(req.body);
  poll.save(function(err, poll){
    if(err){ return next(err); }
    res.json(poll);
  });
});

router.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }
  var user = new User();
  user.username = req.body.username;
  user.setPassword(req.body.password)
  user.save(function (err){
    if(err){ return next(err); }
    return res.json({token: user.generateJWT()})
  });
});

router.post('/login', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }
  passport.authenticate('local', function(err, user, info){
    console.log(user)

    if(err){ return next(err); }
    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })
  (req, res, next);
});

module.exports = router;
