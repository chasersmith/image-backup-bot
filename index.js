require('dotenv').config();

const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const { getUrls } = require('./backupurls');
const { uploadImage } = require('./lib/imgur');

const token = process.env.DISCORD_TOKEN;

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.once('ready', (res) => {
    console.log('ready');
});

//Slash commdands
client.on('interactionCreate', async (interaction) => {
    
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction, interaction.guildId);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Error executing commmand', ephemeral: true});
    }
});

//Backup image
client.on('messageCreate', async (message) => {
    
    let backupImage = false;

    //Check if someone posted image that contains URL from added backup URLs
    if (message.content.toLowerCase().includes('http')) {
        let urls = [];
        await getUrls(message.guildId)
            .then((res) => {
                urls = res;
            })
            .catch((error) => {
                console.log('Error: ' + error);
                message.reply('There was an issue getting the URL list: ' + error);
            }
        );

        for (let i = 0; i < urls.length; i++) {
            if (message.content.includes(urls[i])) {
                backupImage = true;
            }
        }
        
        if (backupImage) {
            await uploadImage(message.content)
                .then((res) => {
                    message.reply(res);
                })
                .catch((error) => {
                    console.log('Error: ' + error);
                    return;
                }
            );
        }
    }
});

client.login(token);