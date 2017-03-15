var mongoose = require('mongoose');

var PollSchema = new mongoose.Schema({
  title: String,
  user: String,
  numberContestants: Number,
  link: String,
  contestants: [
    {
      index: Number,
      name: String,
      votes: String
    }
  ],

});
//need to make this match only the given contestant to upvote... use filter()?
//it seems better to make a new schema for contestants, keep track of
// their individual votes, and populate the poll object with them...
PollSchema.methods.upvote = function(contestant, cb) {
   this.contestants.filter(function(x){
     return x._id == contestant;
     })[0].votes += '[]';
   this.save(cb);
};

mongoose.model('Poll', PollSchema);
