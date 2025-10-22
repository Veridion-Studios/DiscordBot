import fs from "fs";
import path from "path";
import { REST } from "@discordjs/rest";
import { Routes } from "discord.js";
import "dotenv/config";

const commands = [];
const commandsPath = path.join(process.cwd(), "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = await import(path.join(commandsPath, file));
  if (!command.default?.data) {
    console.warn(`Skipping ${file}, no "data" export`);
    continue;
  }
  commands.push(command.default.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

try {
  console.log("Started refreshing application (/) commands.");
  await rest.put(
    Routes.applicationCommands("1430260416709132431"),
    { body: commands },
  );
  console.log("Successfully reloaded application (/) commands.");
} catch (error) {
  console.error(error);
}
