require('dotenv').config();
const path = require('node:path');
const fs = require('node:fs');
const { 
  Client, 
  Events,
  GatewayIntentBits: {
    Guilds,
    GuildMessages,
  },
} = require('discord.js');
const COMMANDS_PATH = path.join(path.dirname(require.main.filename), 'commands');
const client = new Client({ intents: [Guilds, GuildMessages] });
const command_filename_list = fs.readdirSync(COMMANDS_PATH).filter(file => file.endsWith('.js'));
let command_list = [];
let execute_dict = {};

for (const command_filename of command_filename_list) {
  const command_filepath = path.join(COMMANDS_PATH, command_filename);
  const command = require(command_filepath);
  if (!('data' in command && 'execute' in command)) {
    continue;
  }
  command_list.push({'name':command.data.name, 'description':command.data.description, 'options':command.data.options});
  execute_dict[command.data.name] = command.execute;
}

client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}!`);
  client.application.commands.set(command_list).then(() => 
  console.log(`Commands deployed in ${c.user.tag}!`));
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) {
    return;
  }  
  if (!interaction.commandName in execute_dict) {
    return;
  }
  console.log(interaction.commandName);
  try {
    await execute_dict[interaction.commandName](interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: error.message, ephemeral: true });
    } else {
      await interaction.reply({ content: error.message, ephemeral: true });
    }
  }
});


client.login(process.env.DISCORD_TOKEN);
