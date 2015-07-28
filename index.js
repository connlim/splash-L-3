var express = require("express");
var flash = require("connect-flash");
var expresshbs = require("express-handlebars");
var mongoose = require("mongoose");
var handlebars = require("handlebars");

mongoose.connect('mongodb://derp:derp123@localhost/derp');

var models = require("./models")(mongoose);
var backend = require("./backend")(mongoose, models);
var frontend = require("./frontend")(mongoose, models);

    var User = models.User;
    var Item = models.Item;
    var Message = models.Message;

var app = express();

app.engine('handlebars', expresshbs({
	defaultLayout: 'main',
	helpers: {
		newlinetobr: function (text) {
			return new handlebars.SafeString(handlebars.Utils.escapeExpression(text).replace(/\r\n/g, "<br />").replace(/\r/g, "<br />").replace(/\n/g, "<br />"));
		},
		row: function (items, count, options) {
			var out = "";
			for (var i = 0, l = items.length; i < l; i++) {
				if (i % count == 0) { 
					out += "<div class='row'>";
				}
				out += options.fn(items[i]);
				if (i % count == count - 1) {
					out += "</div>";
				}
			}
			return out;
		},
		datetodatestring: function (date) {
			return date.toLocaleDateString();
		}
	}
}));
app.set('view engine', 'handlebars');

function clientErrorHandler(err, req, res, next) {
	if (req.xhr) {
		res.status(500).send({ error: 'Something blew up!' });
	} else {
		next(err);
	}
}

function errorHandler(err, req, res, next) {
	res.status(500);
	res.render('error', { error: err });
}

app.use(clientErrorHandler);
app.use(errorHandler);

app.use(flash());

app.use(backend);
app.use(frontend);

var server = app.listen(process.env.PORT || 8080, function () {
	console.log("listening");	
});

require('mongoose-watch')(mongoose);
var io = require('socket.io')(server);

var users = {};
io.on("connection", function (socket) {
	socket.on("auth", function (data) {
		User.findOne({ username: data.me }, function (err, me) {
			users[data.me] = socket;
			users[data.me].to = data.to;
			User.findOne({ username: data.to }, function (err, to) {
				socket.on("message", function (data) {
					var message = new Message({
						owner: me.id,
						to: to.id,
						text: data.text
					});
					message.save();
					socket.emit("message", {
						text: data.text,
						isself: true
					});
					if (users[to.username] && users[to.username].to == me.username) {
						try {
							users[to.username].emit("message", {
								text: data.text
							});
						}
						catch (e) {
							console.error(e);
							users[to.username] = null;
						}
					}
					console.log(message);
				});
				Message.find().or([{ to: me.id }, { owner: me.id }]).exec(function (err, docs) {
					for (var i = 0; i < docs.length; i++) {
						socket.emit("message", {
							text: docs[i].text,
							isself: (docs[i].owner == me.id)
						});
					}
				});
			});
		});
	});
});


