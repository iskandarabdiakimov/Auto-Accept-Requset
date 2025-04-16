const express = require('express');
const bot = require('./bot');
const app = express();

bot.launch()
	.then(() => console.log(`🤖 Bot @${bot.options.username} ishga tushdi`))
	.catch(err => console.error('Launch error:', err));

app.get('/', (req, res) => res.send('Bot is running'));
app.listen(process.env.PORT || 3000, () => {
	console.log(`🖥️ Server ${process.env.PORT || 3000} portida ishga tushdi`);
});