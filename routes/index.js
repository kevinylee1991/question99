// var db = require('../models/db');
// var auth = require('../lib/auth');
var db = require('../models/db');

// authorized = [];
room_id = 1;
rooms = {};
rooms_temp = {}; //created to be able to access db if person leaves prematurely

//To do:
//Remove room from req after joining a new room

module.exports = function Route(app){

	app.get('/', function(req, res){ //if user is trying to get to the root
		res.render('index', {}); //parameter we are passing to index.ejs file in views folder
	});

	app.get('/logout', function(req, res){
		req.session.destroy(function(){
			res.redirect('/');
		});
	});

	app.get('/game', function(req, res){
		if ( req.session.authorized == true ) //if user is authorized
		{
			res.render('game', {});
		}
		else
			res.redirect('/');
	});

	app.io.route('login', function(req){ //login using mongoose
		db.user.find({username: req.data.username.toLowerCase()}, function(err, users){
			if (err) return console.log(err);
			if (users.length < 1)
			{
				var msg = 'No user exists with that name';
			}
			else if ( req.data.password != users[0].enc_password )
			{
				var msg = 'Incorrect password';
				console.log(users);
			}
			else
			{
				// authorized.push(req.sessionID);
				req.session.authorized = true;
				req.session.username = req.data.username;
				req.session.save(function(){
					req.io.emit('login_successful');
				})
			}
			req.io.emit('login_msg', {msg: msg});
		});
	});

	app.io.route('register', function(req){ //register with mongoose
		db.user.find({username: req.data.username.toLowerCase()}, function(err, users){
			//validations
			errors = reg_errors();
			if (errors.length === 0) //if no errors
			{	
				if (users.length === 0)
				{
					var new_user = new db.user({username: req.data.username.toLowerCase(), email: req.data.email, enc_password: req.data.password, record: {wins: 0, losses: 0, ties: 0}});
					new_user.save(function(err, new_user){
						if (err) return console.log(err);
						var msg = 'Account successfully created';
						req.io.emit('register_msg', {msg: msg});
					});
				}
				else
				{
					var msg = 'Username already exists';
				}
				req.io.emit('register_msg', {msg: msg});
			}
			else
			{
				req.io.emit('errors', {errors: errors});
			}
		});

		function reg_errors(){
			errors = [];
			if (req.data.username.length < 1) errors.push("Username cannot be blank");
			if (req.data.email.length < 1) errors.push("Email cannot be blank");
			if (req.data.password.length < 1) errors.push("Password cannot be blank");
			if (req.data.confirm_password.length < 1) errors.push("Password confirmation cannot be blank");
			if (req.data.password != req.data.confirm_password) errors.push("Confirmed password does not match");
			return errors;
		};
	});

	//rooms fill up as people reach page
	app.io.route('join_room', function(req){
		if (rooms[room_id] == undefined)
		{
			rooms[room_id] = [];
			req.io.join(room_id);
			req.session.current_room = room_id;
			rooms[room_id].push(req.session.username.toLowerCase());
			req.session.save(function(){
				app.io.room(room_id).broadcast('first_player', {username: req.session.username});	
			});
		}
		else //if room isn't at 3 people yet
		{
			req.io.join(room_id);
			rooms[room_id].push(req.session.username.toLowerCase());
			app.io.room(room_id).broadcast('players', {players: rooms[room_id]});
			req.session.current_room = room_id;
			req.session.save(function(){
				if(rooms[room_id].length == 3) //full room
				{
					console.log('room is full');
					rooms[room_id] = shuffle(rooms[room_id]);
					rooms_temp[room_id] = clone(rooms[room_id]);
					var roles = {judge: rooms[room_id][0], players: [rooms[room_id][1], rooms[room_id][2]]};			
					//randomize array to place players in random roles

					db.questions.find(function(err, data){
						if (err) console.log(err);
						length = data[0].questions.length;
						index = Math.floor(Math.random()*length);
						app.io.room(room_id).broadcast('game_start', {question: data[0].questions[index], roles: roles, current_room: room_id});
						room_id++;
					});
				}
			});
		}
		db.user.find({username: req.session.username.toLowerCase()}, function(err, users){
			if (err) console.log(err);
			else
			{
				req.io.emit('get_stats', {stats: users[0], username: req.session.username});
			}
		});
	});

	//assigns the role of judge or player depending on position within room array
	app.io.route('request_roles', function(req){
		if (rooms[req.session.current_room].indexOf(req.session.username) == 0)
		{
			req.session.role = 'judge';
			req.session.save(function(){
				req.io.emit('judge', {});
			})
		}
		else
		{
			req.session.role = 'player';
			req.session.save(function(){
				req.io.emit('player', {});
			})
		}
	});

	app.io.route('disconnect', function(req){
		if (req.session.current_room != undefined)
		{
			var current_room = req.session.current_room;
			if (rooms[current_room].length < 3)
			{
				for(var i = 0; i < rooms[current_room].length; i++)
				{
					if(req.session.username == rooms[current_room][i])
					{
						console.log('deleting person', req.session.username);
						rooms[current_room].splice(i, 1);
					}
				}
				app.io.room(current_room).broadcast('players', {players: rooms[current_room]});
			}
			else
			{
				for(var i = 0; i < rooms_temp[current_room].length; i++)
				{
					if(req.session.username == rooms_temp[current_room][i])
					{
						console.log('deleting person', req.session.username);
						rooms_temp[current_room].splice(i, 1);
					}
				}
				//remove room if empty
				if (rooms_temp[current_room].length == 0)
				{
					delete rooms_temp[current_room];
					delete rooms[current_room];
				}
			}
		}
	});

	app.io.route('leave_room', function(req){
		if (req.session.current_room != undefined)
		{
			var current_room = req.session.current_room;
			for(var i=0; i < rooms_temp[current_room].length; i++)
			{
				if(req.session.username == rooms_temp[current_room][i])
				{
					//removes person from room array
					rooms_temp[current_room].splice(i, 1);
				}
			}
			//remove room if empty
			if (rooms_temp[current_room].length == 0)
			{
				delete rooms_temp[current_room];
				delete rooms[current_room];
			}
		}
	});

	app.io.route('submit_answer', function(req){
		var current_room = req.session.current_room;
		if (req.session.role == 'player') //only accept form submissions form a player
		{
			if (rooms[current_room][1] == req.session.username)
			{
				app.io.room(current_room).broadcast('player1_answer', {answer: req.data.answer});
			}
			else if (rooms[current_room][2] == req.session.username)
			{
				app.io.room(current_room).broadcast('player2_answer', {answer: req.data.answer});
			}
		}
		else if (req.session.role == 'judge') //emit to judge only
		{
			req.io.emit('judge_form', {});
		}
	});

	app.io.route('player1_wins', function(req){
		reason = req.data.reason;
		if (req.session.role == 'judge') //safety feature
		{
			winner = rooms[req.session.current_room][1];
			loser = rooms[req.session.current_room][2];
			message = winner + " wins!";
			//input win into database
			db.user.find({username: winner}, function(err, win){
				if (win.length > 0)
				{
					win[0].record.wins += 1;
					win[0].save();
				}
				db.user.find({username: loser}, function(err, lose){
					if (lose.length > 0)
					{
						lose[0].record.losses += 1;
						lose[0].save();
						app.io.room(req.session.current_room).broadcast('winner', {message: message, reason: reason});
					}
				});
			});
		}
	});

	app.io.route('player2_wins', function(req){
		reason = req.data.reason;
		if (req.session.role == 'judge') //safety feature
		{
			winner = rooms[req.session.current_room][2];
			loser = rooms[req.session.current_room][1];
			message = winner + " wins!";
			//input win into database
			db.user.find({username: winner}, function(err, win){
				if (win.length > 0)
				{
					win[0].record.wins += 1;
					win[0].save();
				}
				db.user.find({username: loser}, function(err, lose){
					if (lose.length > 0)
					{
						lose[0].record.losses += 1;
						lose[0].save();
						app.io.room(req.session.current_room).broadcast('winner', {message: message, reason: reason});
					}
				});
			});
		}
	});

	app.io.route('tie_game', function(req){
		reason = req.data.reason;
		if (req.session.role == 'judge') //safety feature
		{
			tie1 = rooms[req.session.current_room][1];
			tie2 = rooms[req.session.current_room][2];
			message = "It's a tie";
			//input ties into database
			db.user.find({username: tie1}, function(err, tie_update1){
				if (tie_update1.length > 0)
				{
					tie_update1[0].record.ties += 1;
					tie_update1[0].save();
				}
				db.user.find({username: tie2}, function(err, tie_update2){
					if (tie_update2.length > 0)
					{
						tie_update2[0].record.ties += 1;
						tie_update2[0].save();
						app.io.room(req.session.current_room).broadcast('winner', {message: message, reason: reason});
					}
				});
			});
		}
	});

	function shuffle(array) {
	    var counter = array.length, temp, index;
	    // While there are elements in the array
	    while (counter > 0) {
	        // Pick a random index
	        index = Math.floor(Math.random() * counter);

	        // Decrease counter by 1
	        counter--;

	        // And swap the last element with it
	        temp = array[counter];
	        array[counter] = array[index];
	        array[index] = temp;
	    }
	    return array;
	}

	function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
	}
}