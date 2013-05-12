/*
 * GET home page.
 */

var crypto = require('crypto');
var User = require('../models/user');
var Post = require('../models/post');

module.exports = function(app){
	app.get('/', function(req, res){
		Post.get(null, function(err, posts){
			if(err){
				posts = [];
			}
			
  			res.render('index', { title: 'Index',posts:posts, layout:'layout.ejs' });
		});
	});
	
	app.get('/login', checkNotLogin);
	app.get('/login', function(req, res){
		res.render('login', {title: 'Login', layout: 'layout'});
	});

	app.post('/login', checkNotLogin);
	app.post('/login', function(req, res){
		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('base64');
	
		User.get(req.body.username, function(err, user){
			if (!user){
				req.flash('error', 'User does not exist...');
				return res.redirect('/login');
			}
			if (user.password != password){
				req.flash('error', 'Bad password..');
				return res.redirect('/login');
			}

			req.session.user = user;
			req.flash('success', 'Login successfully...');
			return res.redirect('/');
		});

	});
	
	app.get('/reg', checkNotLogin);
	app.get('/reg', function(req, res){
		res.render('reg',{ title: 'Register', layout: 'layout.ejs'});
	});

	app.post('/reg', checkNotLogin);
	app.post('/reg', function(req, res){
		if (req.body['password-repeat'] != req.body['password']){
			req.flash('error', 'Please enter the same password.');
			return res.redirect('/reg');
		}

		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('base64');

		var newUser = new User({
			name: req.body.username,
			password: password,
		});

		User.get(newUser.name, function(err, user){
			if (user){
				err = 'User already exists';
			}
			if (err){
				req.flash('error', err);
				return res.redirect('/reg');
			}

			newUser.save(function(err){
				if (err){
					req.flash('error', err);
					return res.redirect('/reg');
				}
				req.session.user = newUser;
				req.flash('success', 'Register sucessfully.');
				return res.redirect('/');
			});
		});
	});

	app.get('/logout', checkLogin);
	app.get('/logout', function(req, res){
		req.session.user = null;
		req.flash('success', 'Logout sucessfully...');
		return res.redirect('/');
	});

	app.post('/post', checkLogin);
	app.post('/post', function(req, res){
		var currentUser = req.session.user;
		var post = new Post(currentUser.name, req.body.post);
		post.save(function(err){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			req.flash('success', 'Post successfully...');
			return res.redirect('/u/'+ currentUser.name);
		});
	});

	app.get('/u/:user', function(req, res){
		User.get(req.params.user, function(err, user){
			if (!user){
				req.flash('error', 'User does not exist...');
				return res.redirect('/');
			}

			Post.get(user.name, function(err, posts){
				if (err){
					req.flash('error', err);
					return res.redirect('/');
				}
				console.log(posts);
				res.render('user', {
					title: user.name,
					posts: posts,
					layout: 'layout',
				});
			});
		});
	});

	function checkLogin(req, res, next){
		if (!req.session.user){
			req.flash('error', 'Not login');
			return res.redirect('/login');
		}
		next();
	}

	function checkNotLogin(req, res, next){
		if (req.session.user){
			req.flash('error', 'Already login');
			return res.redirect('/');
		}
		next();
	}
};
