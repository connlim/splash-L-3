module.exports = function (mongoose) {
	var Schema = mongoose.Schema;

	var User = mongoose.model('User', {
		name: String,
		username: String,
		dateofbirth: Date,
		password: String,
		reputation: { type: Number, default: 100 },
		location : String,
		flagged : { type : Boolean, default : false},
	});
	
	var Item = mongoose.model("Item", {
		owner: { type: Schema.Types.ObjectId, ref: 'User' },
		name: String,
		description: String,
		picture: String,
		location : String,
		available: Boolean,
		wanter: { type: Schema.Types.ObjectId, ref: "User" },
	});

	var Message = mongoose.model("Message", {
		owner: { type: Schema.Types.ObjectId, ref: "User" },
		to: { type: Schema.Types.ObjectId, ref: 'User' },
		text: String,
	});
	/*
	User.schema.plugin(searchplugin, { 
		fields: ["name", "username"], // array of fields to use as keywords (can be String or [String] types), 
	});

	Item.schema.plugin(searchplugin, { 
		fields: ["name", "description"], // array of fields to use as keywords (can be String or [String] types), 
	});
	*/
	return {
		User: User,
		Item: Item,
		Message: Message
	};
}
