import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs';

export default {
  data: new SlashCommandBuilder()
    .setName('team')
    .setDescription('Show all team members and their clock-in/out status'),
  async execute(interaction) {
    const teamData = JSON.parse(fs.readFileSync('./data/team.json', 'utf-8'));
    const embed = new EmbedBuilder()
      .setTitle('Team Status')
      .setColor('Blue');

    for (const [id, member] of Object.entries(teamData.members)) {
      const status = member.clockedIn 
        ? `🟢 Clocked in at <t:${member.clockIn}:t>` 
        : `🔴 Clocked out at <t:${member.clockOut}:t>`;
      embed.addFields({ 
        name: member.name, 
        value: status, 
        inline: true 
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
