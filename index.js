import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import 'dotenv/config';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// Load commands
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const mod = await import(`./commands/${file}`);
  const command = mod.default ?? mod;
  if (!command?.data) {
    console.warn(`Skipping ${file}, no "data" export`);
    continue;
  }
  client.commands.set(command.data.name, command);
}

// Deploy slash commands automatically
async function deployCommands() {
  const commands = [];
  for (const file of commandFiles) {
    const mod = await import(`./commands/${file}`);
    const command = mod.default ?? mod;
    if (!command?.data) {
      console.warn(`Skipping ${file}, no "data" export`);
      continue;
    }
    commands.push(command.data.toJSON());
  }

  try {
    // register global application commands using the logged-in client
    await client.application.commands.set(commands);
    console.log('✅ Slash commands deployed successfully.');
  } catch (error) {
    console.error('❌ Failed to deploy commands:', error);
  }
}

client.once('clientReady', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await deployCommands();
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Error executing command!', ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
