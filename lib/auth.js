//db = require('../models/db');

var mongojs = require('mongojs');
var db = mongojs("mongodb://localhost:27017/questions_game_db", ['questions_game_db']);

function register_cb(username, email, password, confirm_password)
{
	db.questions_game_db.find({username: username.toLowerCase()}, function(err, docs){
		if (docs.length == 0)
		{
			db.questions_game_db.insert({username: username.toLowerCase(), email: email, password: password});
			return 'Account successfully created';
		}
		else
		{
			console.log('Username already exists');
			return 'Username already exists';
		}
	});
}

module.exports = (function(){
	return {
		login: function(username, password){
			db.questions_game_db.find({username: username.toLowerCase()}, function(err, docs){
				if (docs.length < 1)
				{
					return 'No user exists with that name';
				}
				else if ( password != docs[0].password )
				{
					return 'Incorrect password';
				}
				else
				{
					return 'Success';
				}
			})
		},
		// register: function(username, email, password, confirm_password, cb)
		// {
		// 	return cb(username, email, password, confirm_password);
		// }
		register: function(username, email, password, confirm_password)
		{
			errors = [];
			//validations
			if (username.length < 1) errors.push("Username cannot be blank");
			if (email.length < 1) errors.push("Email cannot be blank");
			if (password.length < 1) errors.push("Password cannot be blank");
			if (confirm_password.length < 1) errors.push("Password confirmation cannot be blank");
			if (password != confirm_password) errors.push("Confirmed password does not match");
			if (errors.length > 0 )
			{
				console.log('errors', errors);
				return errors;	
			}
			else
			{
				db.questions_game_db.find({username: username.toLowerCase()}, function(err, docs){
					if (docs.length == 0)
					{
						db.questions_game_db.insert({username: username.toLowerCase(), email: email, password: password});
						return 'Account successfully created';
					}
					else
					{
						console.log('Username already exists');
						return 'Username already exists';
					}
				});
			}
		} //end register function
	}
})();