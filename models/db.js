// var mongojs = require('mongojs');
// var db = mongojs("mongodb://localhost:27017/questions_game_db", ['questions_game_db']);
// //var mycollection = db.collection('')

// console.log('db.js');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var userSchema = new Schema({
	username: String,
	email: String,
	enc_password: String,
	record: {wins: Number, losses: Number, ties: Number}
	//achievements
});
var questionsSchema = new Schema({
	questions: Array
});

var Questions = mongoose.model('Question_db', questionsSchema);
var User = mongoose.model('User', userSchema);

//Will clear database
Questions.remove({}, function(err){
	Questions.find(function(err,data){
	console.log(data);
	});
});

//Will add questions to database
var qs = new Questions({questions: ["Best Sailor Scout? eg. Sailor Moon",  
	"Best Powerpuff Girl?", 
	"Best Proud Family character?",
	"Best South Park character?",
	"Best Scooby Doo character?",
	"Best Spongebob character?",
	"Best candy?",
	"Best pizza?",
	"Who is the best Pokemon?",
	"What is the funniest thing to watch happen?", 
	"What's the cutest animal?", 
	"What animal do you want to cuddle with?",
	"Rock Paper Scissors, go!", 
	"Most attractive Disney princess?", 
	"Most attractive Disney Prince?", 
	"Most attractive Disney villain?", 
	"Who would win in a fight to the death and why? 50 Gays vs 50 Lesbians.", 
	"Who would win in a fight to the death and why? Ninjas vs Pirates.", 
	"Who would win in a fight to the death and why? Goku vs Superman.", 
	"Who would win in a fight to the death and why? Harry Potter vs Hermione Granger.", 
	"Who would win in a fight to the death and why? 1 T-rex vs 3 Deinonychus (big raptors).", 
	"Who would win in a fight to the death and why? Spiderman vs Megaman", 
	"A zombie apocalypse begins. What's your weapon of choice?", 
	"A zombie apocalypse begins. What's your first destination?",
	"Sacrifice yourself to save a friend, or let your friend die? Why?",
	"Beyonce or Solange Knowles?",
	"Oprah or Ellen? Why?",
	"Deathmatch, Oprah vs Ellen? Who would win and why?",
	"You are put into a fight to the death. Do you choose the sword or the spear?",
	"Mac vs PC? Why?",
	"If you could be any animal, which would it be and why?",
	"If you could have one superpower, what would it be?",
	"Would you rather be rich with no family or poor with a family? Why?",
	"Best Pixar film and why?",
	"Best Disney film and why?",
	"Who is the best One Direction member?",
	"Team Edward or Team Jacob?",
	"Team Peeta or Team Gale?",
	"Give your best mom joke",
	"Give the best compliment to your judge!",
	"Emma Watson or Jennifer Lawrence?"]});
qs.save(function(err, new_user){
	if (err) return console.log(err);
});

module.exports = {user: User, questions: Questions};