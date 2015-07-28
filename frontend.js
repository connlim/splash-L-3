var express = require("express");

var frontend = express.Router();

/*
  Frontend Router

  Uses res.data to render the templates
*/

frontend.get("/", function (req, res) {
	res.data.title = "Most Recent";
	res.data.page = "home";
	res.render("itemlist", res.data);
});

frontend.get("/user/:username", function (req, res) {
	res.render("user", res.data);
});

frontend.get("/user/:username/edit", function(req, res){
	res.render("editprofile", res.data);
});

frontend.get("/search", function (req, res) {
	res.data.title = "Searching for \"" + req.query.query + "\"";
	res.render("itemlist", res.data);
});

frontend.get("/new", function (req, res) {
	res.data.error = req.query.error;
	res.render("itemadd", res.data);
});

frontend.get("/item/:id", function (req, res) {
	//res.data.description = res.data.description.replace(/\r\n/g, "<br />").replace(/\r/g, "<br />").replace(/\n/g, "<br />");
	res.render("item", res.data);
});

frontend.get("/item/:id/edit", function (req, res) {
	res.render("itemadd", res.data);
});

frontend.get("/item/:id/get", function (req, res) {
	res.render("itemget", res.data);
});
frontend.post("/item/:id/get", function (req, res) {
	res.render("itemget", res.data);
});

frontend.get("/login", function (req, res) {
	res.data.error = req.flash("error");
	res.render("login", res.data);
});

frontend.get("/signup", function (req, res) {
	res.data.error = req.flash("error");
	res.render("signup", res.data);
});

frontend.get("/messaging", function (req, res) {
	res.render("messaging", res.data);
});

frontend.get("/flag", function(req, res){
	res.render("user", res.data);
});

frontend.use(express.static('assets'));

module.exports = function (m) {
	//mongoose = m;
	return frontend;
};
