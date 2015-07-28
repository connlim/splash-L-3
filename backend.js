module.exports = function (mongoose, models) {

    var express = require("express");
    var cookieparser = require('cookie-parser');
    var session = require('express-session');
    var bodyparser = require("body-parser");

    var validate = require("validate.js");
    validate.moment = require("moment");

    var tools = require("./tools");
    //var models = require("./models");
    var User = models.User;
    var Item = models.Item;
    var Message = models.Message;

    var backend = express.Router();

    backend.use(bodyparser.json());
    backend.use(bodyparser.urlencoded({extended: true}));

    var passport = require('passport');
    var LocalStrategy = require('passport-local').Strategy;

    backend.use(cookieparser());
    backend.use(session({secret: 'keyboard cat'}));
    backend.use(passport.initialize());
    backend.use(passport.session());

    passport.use(new LocalStrategy(function (username, password, done) {
        User.findOne({ username: username }, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, { message: 'No such user.' });
            }
            if (user.get("password") != password) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        });
    }));
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });
    passport.deserializeUser(function (id, done) {
        User.findOne({ _id: id }).exec(function (err, user) {
            done(null, user);
        });
    });

    backend.use(function (req, res, next) {
        res.data = {
            loggedin: req.user != undefined,
			user: req.user
        };
        next();
    });

	backend.get("/messaging", function (req, res, next) {
		if (!req.user) {
			req.flash("error", "Please log in");
			res.redirect("/login");
		}
		else {
		next();
		}
	});

    backend.get('/', function (req, res, next) {
        Item.find().sort([['_id', 'descending']]).limit(40).lean().exec(function (err, items) {
            res.data.items = items;
			var promises = [];
			res.data.items.forEach(function (item, index) {
				promises.push(User.findOne({ _id: res.data.items[index].owner }));
			});
			Promise.all(promises).then(function (values) {
				for (var i = 0; i < values.length; i++) {
					res.data.items[i].user = values[i];
					res.data.items[i].id = res.data.items[i]._id;
					res.data.items[i].isowner = req.user && res.data.items[i].user ? res.data.items[i].user.username == req.user.username : false;
				}
				next();
			}).catch(function (err) {
				next(err);
			});
        });
    });

    backend.get('/search', function (req, res, next) {
        Item.find({ name: { $regex: req.query.query, $options: 'i' } }).sort([['_id', 'descending']]).limit(10).lean().exec(function (err, items) {
            res.data.items = items;
			var promises = [];
			res.data.items.forEach(function (item, index) {
				promises.push(User.findOne({ _id: res.data.items[index].owner }));
			});
			Promise.all(promises).then(function (values) {
				for (var i = 0; i < values.length; i++) {
					res.data.items[i].user = values[i];
					res.data.items[i].id = res.data.items[i]._id;
					res.data.items[i].isowner = req.user && res.data.items[i].user ? res.data.items[i].user.username == req.user.username : false;
				}
				next();
			}).catch(function (err) {
				next(err);
			});
        });
    });

	backend.get("/user/:username", function (req, res, next) {
		User.findOne({ username: req.params.username }, function (err, user) {
			res.data.profile = user;
			if (err || !user) {
				next(err);
			}
			else {
				res.data.ownprofile = req.user ? req.user.username == req.params.username : false;
				Item.find({ owner: user.id }).sort([['_id', 'descending']]).lean().exec(function (err, items) {
				res.data.items = items;
				var promises = [];
				res.data.items.forEach(function (item, index) {
					promises.push(User.findOne({ _id: res.data.items[index].owner }));
				});
				Promise.all(promises).then(function (values) {
					for (var i = 0; i < values.length; i++) {
						res.data.items[i].user = values[i];
						res.data.items[i].id = res.data.items[i]._id;
					}
					console.log(res.data.items);
					next();
				}).catch(function (err) {
					next(err);
				});
			});
			}
		});
	});

	backend.get("/user/:username/edit", function (req, res, next) {
		if(!req.user){
			req.flash("error", "Please log in");
			res.redirect("/login");
		}else{
			User.findOne({ username: req.user.id }, function (err, user) {
				res.data.profile = user;
				if(err || !user){
					next(err);
				}else{
					if (req.body.newpassword != req.body.newpassword2) {
						req.flash("error", "Passwords do not match");
						next();
						return;
					}else if (req.body.newpassword.length < 3) {
						req.flash("error", "Password too short");
						next();
						return;
					}else if(req.body.newpassword != req.body.oldpassword){
						req.flash("error", "Old password incorrect");
					}
					res.data.profile.location = req.body.location;
					res.data.profile.password = req.body.newpassword;
				}
			});
		}
	});    	
    backend.post('/new', function (req, res, next) {
		if (!req.user) {
			req.flash("error", "Please log in");
			res.redirect("/login");
			next();
			return;
		}
        else if (req.body.name.length < 3) {
			req.flash("error", "Name too short");
            res.redirect(req.path);
            next();
            return;
        }
        else if (req.body.description.length < 10) {
			req.flash("error", "Description too short");
            res.redirect(req.path);
            return;
        }
        else if (req.body.image.search(/https?:\/\//) != 0 && req.body.image.length != 0) {
			req.flash("error", "Invalid image URL");
            res.redirect(req.path);
            return;
        }
        var item = new Item({
            name: req.body.name,
            description: req.body.description,
            location: req.body.location,
            picture: req.body.image,
			owner: req.user._id
        });
        item.save(function (err) {
            console.log("Item created");
            if (err) {
				req.flash("error", "Unknown error");
				res.redirect(req.path);
            }
            else {
                res.redirect("/user/" + req.user.username);
            }
            next();
        });

	});
	
	backend.get("/item/:id", function (req, res, next) {
		Item.findOne({ _id: req.params.id }).lean().exec(function (err, item) {
			if (err || !item) {
				next(err);
			}
			else {
			res.data.item = item;
			User.findOne({ _id: item.owner }, function (err, user) {
				res.data.item.user = user;
				res.data.item.id = res.data.item._id;
				res.data.isowner = req.user ? user.username == req.user.username : false;
				
				next(err);		
			});
			}
		});
	});
	
	backend.get("/item/:id/edit", function (req, res, next) {
		Item.findOne({ _id: req.params.id }).lean().exec(function (err, item) {
			res.data.item = item;
			User.findOne({ _id: item.owner }, function (err, user) {
				res.data.item.user = user;
				res.data.item.id = res.data.item._id;
				console.log(res.data);
				next(err);
			});
		});
	});
    
	backend.post('/item/:id/edit', function (req, res, next) {
		if (!req.user) {
			req.flash("error", "Please log in");
			res.redirect("/login");
			next();
			return;
		}
        else if (req.body.name.length < 3) {
			req.flash("error", "Name too short");
            res.redirect(req.path);
            next();
            return;
        }
        else if (req.body.description.length < 10) {
			req.flash("error", "Description too short");
            res.redirect(req.path);
            return;
        }
        else if (req.body.image.search(/https?:\/\//) != 0 && req.body.image.length != 0) {
			req.flash("error", "Invalid image URL");
            res.redirect(req.path);
            return;
        }
        Item.findOne({ _id: req.params.id }).update({
            name: req.body.name,
            description: req.body.description,
            location: req.body.location,
            picture: req.body.image,
        }, function (err) {
            console.log("Item edited");
            if (err) {
				req.flash("error", "Unknown error");
				res.redirect(req.path);
            }
            else {
                res.redirect("/item/" + req.params.id);
            }
            next();
        });

	});
	
	backend.get("/item/:id/get", function (req, res, next) {
		if (!req.user) {
			req.flash("error", "Please log in");
			res.redirect("/login");
			//next();
			return;
		}
		Item.findOne({ _id: req.params.id }).lean().exec(function (err, item) {
			res.data.item = item;
			User.findOne({ _id: item.owner }, function (err, user) {
				res.data.item.user = user;
				res.data.item.id = res.data.item._id;
				res.data.isowner = req.user ? user.username == req.user.username : false;
				User.findOne({ _id: res.data.item.wanter }, function (err, user) {
					res.data.wanter = user;
					if (err) {
						next(err);
					}
					else if (!res.data.isowner && !item.wanter) {
						console.log("Set");
						Item.findOne({ _id: req.params.id }).update({
							wanter: req.user.id
						}, function () {
							next();	
						});
					}
					else {
						next();
					}
				});
			});
		});
	});
	
	backend.post("/item/:id/get", function (req, res, next) {
		console.log(req.body);
		if (!req.user) {
			req.flash("error", "Please log in");
			res.redirect("/login");
			//next();
			return;
		}
		Item.findOne({ _id: req.params.id }).lean().exec(function (err, item) {
			res.data.item = item;
			User.findOne({ _id: item.owner }, function (err, user) {
				res.data.item.user = user;
				res.data.item.id = res.data.item._id;
				res.data.isowner = req.user ? user.username == req.user.username : false;
				User.findOne({ _id: res.data.item.wanter }, function (err, user) {
					res.data.wanter = user;
					if (err) {
						next(err);
					}
					else if (res.data.isowner && item.wanter) {
						console.log("Given");
						Item.findOne({ _id: req.params.id }, function (err, item) {
							console.log(item);
							if (req.body.confirm == "true") {
								item.owner = item.wanter;
							}
							item.wanter = undefined;
							item.save(function () {
								res.redirect("/item/" + item.id);
							});
							//next();	
						});
					}
					else {
						res.redirect("/item/" + item.id);
						//next();
					}
				});
			});
		});
	});

    backend.post('/signup', function (req, res, next) {
		User.findOne({ username: req.body.username }, function (err, existinguser) {
			var datevalid = validate({
				birthday: req.body.dob
			},
			{
				birthday: {
					datetime: {
						dateOnly: true,
						latest: validate.moment().subtract(10, "year"),
						message: "^You need to be at least 10 years old"
					}
				}
			});
			if (req.body.password != req.body.password2) {
				req.flash("error", "Passwords do not match");
				res.redirect("/signup");
				next();
				return;
			}
			else if (req.body.password.length < 3) {
				req.flash("error", "Password too short");
				res.redirect("/signup");
				next();
				return;
			}
			else if (req.body.username.length < 3) {
				req.flash("error", "Username too short");
				res.redirect("/signup");
				next();
				return;
			}
			else if (req.body.name.length < 3) {
				req.flash("error", "Name too short");
				res.redirect("/signup");
				next();
				return;
			}
			else if (existinguser) {
				req.flash("error", "Username is taken");
				res.redirect("/signup");
				next();
				return;
			}
			else if (datevalid != undefined) {
				req.flash("error", datevalid.birthday[0]);
				res.redirect("/signup");
				next();
				return;
			}
			var user = new User({
				name: req.body.name,
				username: req.body.username,
				dateofbirth: validate.moment(req.body.dob),
				location : req.body.location,
				password: req.body.password,
				location : req.body.location,
			});
			res.data.user = user;
			user.save(function (err) {
				console.log("User created");
				if (err) {
					req.flash("error", "Unknown error");
					req.redirect("/signup");
				}
				else {
					res.redirect("/login");
				}
				next();
			});
		});
    });
	
	backend.get('/flag', function(req, res, next){
		if(!req.user){
			req.flash("error", "Please log in");
			res.redirect("/login");
		}else{
			User.findOne({ username: req.user.username }, function (err, user) {
				res.data.profile = user;
				if (err || !user) {
					next(err);
				}else {
					console.log("Succefully flagged.");
					res.data.profile.reputation -= 10;
					res.data.profile.flagged = true;
					next();
				}
			});
		}
	});
	
    backend.get('/logout', function (req, res) {
        req.logout();
        res.redirect("/");
    });
	
    backend.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login', failureFlash: true }));

    return backend;
};
