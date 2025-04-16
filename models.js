const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
	userId: {
		type: Number,
		required: true,
		index: true
	},
	firstName: String,
	lastName: String,
	username: String,
	addedAt: {
		type: Date,
		default: Date.now
	}
});

const GroupSchema = new mongoose.Schema({
	chatId: {
		type: Number,
		required: true,
		unique: true
	},
	title: String,
	type: String,
	admins: [{
		userId: Number,
		firstName: String,
		lastName: String,
		username: String,
		isBot: Boolean
	}],
	addedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	addedAt: {
		type: Date,
		default: Date.now
	},
	lastActivity: Date
});

const LogSchema = new mongoose.Schema({
	action: String,
	userId: Number,
	chatId: Number,
	details: Object,
	timestamp: {
		type: Date,
		default: Date.now
	}
});

const User = mongoose.model('User', UserSchema);
const Group = mongoose.model('Group', GroupSchema);
const Log = mongoose.model('Log', LogSchema);

module.exports = {
	User,
	Group,
	Log
};
