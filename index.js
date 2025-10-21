// index.js
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from "discord.js";
import "dotenv/config";

// Create the client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Define your slash commands
const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!"),
  new SlashCommandBuilder().setName("hello").setDescription("Greets the user"),
  new SlashCommandBuilder().setName("joke").setDescription("Tells a random joke"),
  new SlashCommandBuilder().setName("server").setDescription("Displays server info"),
].map((command) => command.toJSON());

// Register slash commands on ready
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}!`);

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("✅ Slash commands registered globally!");
  } catch (err) {
    console.error("❌ Error registering slash commands:", err);
  }
});

// Handle slash commands
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === "ping") {
    await interaction.reply("🏓 Pong!");
  }

  if (commandName === "hello") {
    await interaction.reply(`Hey ${interaction.user.username}! 👋`);
  }

  if (commandName === "joke") {
    const jokes = [
      "Why did the scarecrow win an award? Because he was outstanding in his field! 🌾",
      "I told my computer I needed a break, and it said 'No problem, I'll go to sleep!' 😴",
    ];
    const random = jokes[Math.floor(Math.random() * jokes.length)];
    await interaction.reply(random);
  }

  if (commandName === "server") {
    const { guild } = interaction;
    await interaction.reply(`Server name: ${guild.name}\nTotal members: ${guild.memberCount}`);
  }
});

// Login
client.login(process.env.DISCORD_TOKEN);