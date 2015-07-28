function AutoRenderer() {
	var parser = new DOMParser();
	this.handles = [];
	this.context = {};
	function Handle(scriptElement, context) {
		var templateString = scriptElement.innerHTML;
		this.template = Handlebars.compile(templateString);
		this.context = context || {};
		this.element = scriptElement;
	}
	Handle.prototype.update = function (newContext) {
		newContext && (this.context = newContext);
		var rawHTML = this.template(this.context);
		var newElement = document.createElement("div");
		Array.prototype.forEach.call(parser.parseFromString(rawHTML, "text/html").firstChild.childNodes[1].childNodes, function (ele) {
			newElement.appendChild(ele);
		});
		this.element.parentElement.replaceChild(newElement, this.element);
		this.element = newElement;
	};
	var scriptElements = document.querySelectorAll("script[type='text/x-handlebars-template']");
	Array.prototype.forEach.call(scriptElements, function (scriptElement) {
		var handler = new Handle(scriptElement, this.context);
		this.handles.push(handler);
	}.bind(this));
}

AutoRenderer.prototype.update = function (newContext) {
	for (var i = 0; i < this.handles.length; i++) {
		var handle = this.handles[i];
		if (handle.context == this.context) {
			handle.update(newContext);
		}
	}
	this.context = newContext;
}

var socket = io();

var to = location.hash.replace("#", "");

socket.emit("auth", {
	me: username,
	to: to
});

var cont = {
	messages: []
};

var a = new AutoRenderer();

socket.on("message", function (message) {
	console.log(message);
	cont.messages.push(message);
	a.update(cont);
	window.scrollTo(0, window.innerHeight);
});

document.getElementById("messageform").addEventListener("submit", function (e) {
	e.preventDefault();
	socket.emit("message", {
		text: document.getElementById("message").value
	});
	document.getElementById("message").value = "";
});
