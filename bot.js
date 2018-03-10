// Define static constants


const Discord = require('discord.js');
const client = new Discord.Client();

const request = require('request');

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
client.login('NDIxNTg1MDI3NDMyODQxMjE2.DYWS5A.5LXXi_Anifz_AZqDvCHCoGQ96Dg');
