const Discord = require('discord.js');
const client = new Discord.Client();

const config = require('./config.json');

client.on('ready', () => {
    console.log('I am ready!');
});

client.on('message', message => {
    if (message.content === 'ping') {
    	message.channel.send('PONG!');
  	}
});

client.on('message', message => {
    if (message.content === 'bing') {
    	message.reply('BONG!');
  	}
});

// THIS  MUST  BE  THIS  WAY
client.login(process.env.BOT_TOKEN);