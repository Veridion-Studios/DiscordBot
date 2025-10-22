import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';

export default {
  data: new SlashCommandBuilder()
    .setName('clock')
    .setDescription('Clock in or out')
    .addStringOption(option =>
      option.setName('action')
            .setDescription('Clock in or out')
            .setRequired(true)
            .addChoices(
              { name: 'in', value: 'in' },
              { name: 'out', value: 'out' }
            )),
  async execute(interaction) {
    const action = interaction.options.getString('action');
    const teamData = JSON.parse(fs.readFileSync('./data/team.json', 'utf-8'));
    const userId = interaction.user.id;
    const timestamp = Math.floor(Date.now() / 1000);

    if (!teamData.members[userId]) {
      teamData.members[userId] = {
        name: interaction.user.username,
        avatarURL: interaction.user.displayAvatarURL(),
        clockedIn: false,
        clockIn: null,
        clockOut: null
      };
    }

    if (action === 'in') {
      teamData.members[userId].clockedIn = true;
      teamData.members[userId].clockIn = timestamp;
      await interaction.reply(`✅ You clocked in at <t:${timestamp}:t>`);
    } else {
      teamData.members[userId].clockedIn = false;
      teamData.members[userId].clockOut = timestamp;
      await interaction.reply(`⏱️ You clocked out at <t:${timestamp}:t>`);
    }

    fs.writeFileSync('./data/team.json', JSON.stringify(teamData, null, 2));
  },
};
