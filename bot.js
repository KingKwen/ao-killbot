const Discord = require('discord.js');
const client = new Discord.Client();

const request = require('request');

var killHistory = [];

/**
 * Wait until ready and logged in
 * If we do not wait for the ready event
 * All commands will process before we are authorized
 */
client.on('ready', () => {
    console.log('Ready and waiting!');

    // Set 'Playing Game' in discord
    client.user.setGame('Albion Online'); // broken due to discord API changes

    fetchKills();

    // Fetch kills every 30s
    var timer = setInterval(function() {
        fetchKills();
        purgeKillHistory();
    }, 30000);
});

function purgeKillHistory() {
    if (killHistory.length > 25) {
        for (j=0; j < 5; j++) {
            for (i=0; i < killHistory.length; i++) {
                killHistory[i] = killHistory[i+1];
                killHistory.splice(killHistory.length-1, 1);
            }
        }
    }
}

var lastRecordedKill = -1;

/**
 * Fetch recent kills from the Gameinfo API
 * @param  {Number} limit  [max kills to get]
 * @param  {Number} offset [offset for first kill]
 * @return {json} [json array of events]
 */
function fetchKills(limit = 51, offset = 0) {
    request({
        uri: 'https://gameinfo.albiononline.com/api/gameinfo/events?limit='+limit+'&offset='+offset,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            parseKills(body);
        } else {
            console.log('Error: ', error); // Log the error
        }
    });
}

/**
 * Parse returned JSON from Gameinfo to
 * find alliance members on the killboard
 * @param  {json} events
 */
function parseKills(events) {
    var count = 0;
    var breaker = lastRecordedKill;

    events.some(function(kill, index) {
        // Save the most recent kill for tracking
        if (index == 0) {
            lastRecordedKill = kill.EventId;
        }

        // Don't process data for the breaker KILL
        if (kill.EventId != breaker)
            // Alliance KILL
            if (kill.Killer.AllianceName.toLowerCase() == '<NONE>'.toLowerCase() || kill.Victim.AllianceName.toLowerCase() == '<NONE>'.toLowerCase()) {
                postKill(kill);
            } else if (kill.Killer.GuildName.toLowerCase() == 'GeniuS'.toLowerCase() || kill.Victim.GuildName.toLowerCase() == 'GeniuS'.toLowerCase()) {
                var newKill = true;
                for (i = 0; i < killHistory.length; i++) {
                    if (killHistory[i] == kill.EventId) {
                        newKill = false;
                        break;
                    }
                }
                if (newKill) {
                    postKill(kill);
                }
            } else {
                count++;
            }

        return kill.EventId == breaker;
    });

    // console.log('- Skipped ' + count + ' kills');
}

function postKill(kill, channel = '421975081258975242') {
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
            'Tout seul comme un grand',
            'Sans l\'aide de personne',
            'Pas besoin d\'aide',
            'En solo ;)'
        ];
        assistedBy = soloKill[Math.floor(Math.random() * soloKill.length)];
    } else {
        var assists = [];
        kill.Participants.forEach(function(participant) {
            if (participant.Name != kill.Killer.Name) {
                assists.push(participant.Name);
            }
        })
        assistedBy = "Avec l'aide de: " + assists.join(', ');
    }

    itemCount = 0;
    kill.Victim.Inventory.forEach(function(inventory) {
        if (inventory !== null) {
            itemCount++;
        }
    });

    var itemsDestroyedText = "";
    if (itemCount > 0) {
        itemsDestroyedText = " (" + itemCount + " objets détruits)";
    }

    var embed = {
        color: victory ? 0x008000 : 0x800000,
        author: {
            name: victory ? kill.Killer.Name + " a tué " + kill.Victim.Name : kill.Victim.Name + " s'est fait tué par " + kill.Killer.Name,
            icon_url: victory ? 'https://i.imgur.com/CeqX0CY.png' : 'https://albiononline.com/assets/images/killboard/kill__date.png',
            url: 'https://albiononline.com/en/killboard/kill/'+kill.EventId
        },
        title: assistedBy + itemsDestroyedText,
        description: 'Gain de ' + kill.TotalVictimKillFame + ' fame',
        thumbnail: {
            url: (kill.Killer.Equipment.MainHand.Type ? 'https://gameinfo.albiononline.com/api/gameinfo/items/' + kill.Killer.Equipment.MainHand.Type + '.png' : "https://albiononline.com/assets/images/killboard/kill__date.png")
        },
        timestamp: kill.TimeStamp,
        fields: [
            {
                name: "Guilde",
                value: victory ? (kill.Killer.AllianceName ? "["+kill.Killer.AllianceName+"] " : '') + (kill.Killer.GuildName ? kill.Killer.GuildName : '<none>') : (kill.Victim.AllianceName ? "["+kill.Victim.AllianceName+"] " : '') + (kill.Victim.GuildName ? kill.Victim.GuildName : '<none>'),
                inline: true
            },
            {
                name: "Guilde",
                value: victory ? (kill.Victim.AllianceName ? "["+kill.Victim.AllianceName+"] " : '') + (kill.Victim.GuildName ? kill.Victim.GuildName : '<none>'): (kill.Killer.AllianceName ? "["+kill.Killer.AllianceName+"] " : '') + (kill.Killer.GuildName ? kill.Killer.GuildName : '<none>'),
                inline: true
            },
            {
                name: "Valeur d'objets",
                value: victory ? kill.Killer.AverageItemPower.toFixed(2) : kill.Victim.AverageItemPower.toFixed(2),
                inline: true
            },
            {
                name: "Valeur d'objets",
                value: victory ? kill.Victim.AverageItemPower.toFixed(2) : kill.Killer.AverageItemPower.toFixed(2),
                inline: true
            },
        ],
        footer: {
            text: "ID #" + kill.EventId
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
        if (command === 'bonjour') {
            message.reply('Bonjour, je suis prêt à afficher vos exploits !');
        }

        else if (command === 'kbinfo') {
            request({
                json: true,
                uri: 'https://gameinfo.albiononline.com/api/gameinfo/events/' + args[0]
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    postKill(body, message.channel.id);
                } else {
                    console.log('Error: ', error); // Log the error
                }
            });
        }

        // [ADMIN] - clear config.botChannel messages
        else if (command === 'kbclear') {
            if (''.includes(message.author.id) && message.channel.id == '421975081258975242') {
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
