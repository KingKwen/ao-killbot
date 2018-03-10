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

function postKill(kill, channel = '421583954861228042') {
    //quick fix to not post kills with 0 fame (like arena kills after the patch)
    if (kill.TotalVictimKillFame == 0){
         return;
    }

    var victory = false;
    if (kill.Killer.AllianceName.toLowerCase() == '<NONE>'.toLowerCase() || kill.Killer.GuildName.toLowerCase() == 'GeniuS'.toLowerCase()) {
        victory = true;
    }

    var assistedBy = "";
    if (kill.numberOfParticipants == 1) {
        var soloKill = [
            'All on their own',
            'Without assitance from anyone',
            'All by himself',
            'SOLO KILL'
        ];
        assistedBy = soloKill[Math.floor(Math.random() * soloKill.length)];
    } else {
        var assists = [];
        kill.Participants.forEach(function(participant) {
            if (participant.Name != kill.Killer.Name) {
                assists.push(participant.Name);
            }
        })
        assistedBy = "Assisted By: " + assists.join(', ');
    }

    itemCount = 0;
    kill.Victim.Inventory.forEach(function(inventory) {
        if (inventory !== null) {
            itemCount++;
        }
    });

    var itemsDestroyedText = "";
    if (itemCount > 0) {
        itemsDestroyedText = " destroying " + itemCount + " items";
    }

    var embed = {
        color: victory ? 0x008000 : 0x800000,
        author: {
            name: kill.Killer.Name + " killed " + kill.Victim.Name,
            icon_url: victory ? 'https://i.imgur.com/CeqX0CY.png' : 'https://albiononline.com/assets/images/killboard/kill__date.png',
            url: 'https://albiononline.com/en/killboard/kill/'+kill.EventId
        },
        title: assistedBy + itemsDestroyedText,
        description: 'Gaining ' + kill.TotalVictimKillFame + ' fame',
        thumbnail: {
            url: (kill.Killer.Equipment.MainHand.Type ? 'https://gameinfo.albiononline.com/api/gameinfo/items/' + kill.Killer.Equipment.MainHand.Type + '.png' : "https://albiononline.com/assets/images/killboard/kill__date.png")
        },
        timestamp: kill.TimeStamp,
        fields: [
            {
                name: "Killer Guild",
                value: (kill.Killer.AllianceName ? "["+kill.Killer.AllianceName+"] " : '') + (kill.Killer.GuildName ? kill.Killer.GuildName : '<none>'),
                inline: true
            },
            {
                name: "Victim Guild",
                value: (kill.Victim.AllianceName ? "["+kill.Victim.AllianceName+"] " : '') + (kill.Victim.GuildName ? kill.Victim.GuildName : '<none>'),
                inline: true
            },
            {
                name: "Killer IP",
                value: kill.Killer.AverageItemPower.toFixed(2),
                inline: true
            },
            {
                name: "Victim IP",
                value: kill.Victim.AverageItemPower.toFixed(2),
                inline: true
            },
        ],
        footer: {
            text: "Kill #" + kill.EventId
        }
    };

    console.log(embed);

    client.channels.get(channel).send({embed: embed});
}

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
            if (''.includes(message.author.id) && message.channel.id == '421583954861228042') {
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
