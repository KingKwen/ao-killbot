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

/**
 * Wait until ready and logged in
 * If we do not wait for the ready event
 * All commands will process before we are authorized
 */
client.on('ready', () => {
    console.log('Ready and waiting!');

    // Set 'Playing Game' in discord
    client.user.setGame('Albion Online'); // broken due to discord API changes

    //fetchKills();

    // Fetch kills every 30s
    var timer = setInterval(function() {
        //fetchKills();
    }, 30000);
});

/**
 * On receive message
 */
client.on('message', message => {
    if (message.content.indexOf('!') !== 0 || message.author.bot) return;
    else { // Execute command!
        var args = message.content.slice('!'.length).trim().split(/ +/g);
        var command = args.shift().toLowerCase();

        // Test Command - !ping
        if (command === 'ping') {
            message.reply('pong');
        }

        else if (command === 'kbinfo') {
            request({
                json: true,
                uri: 'https://gameinfo.albiononline.com/api/gameinfo/events/' + args[0]
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    //postKill(body, message.channel.id);
                } else {
                    console.log('Error: ', error); // Log the error
                }
            });
        }

        // [ADMIN] - clear config.botChannel messages
        else if (command === 'kbclear') {
            if (config.admins.includes(message.author.id) && message.channel.id == config.botChannel) {
                message.channel.send('Clearing Killboard').then(msg => {
                    msg.channel.fetchMessages().then(messages => {
                        message.channel.bulkDelete(messages);
                        console.log("[ADMIN] " + message.author.username + " cleared Killboard");
                    })
                })
            }
        }
    }
});

// THIS  MUST  BE  THIS  WAY
client.login(process.env.BOT_TOKEN);
