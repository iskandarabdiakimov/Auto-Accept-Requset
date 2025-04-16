require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(() => console.log('✅ MongoDB ga ulandi'))
	.catch(err => console.error('❌ MongoDB ulanish xatosi:', err));

module.exports = {
	mongoose
};
