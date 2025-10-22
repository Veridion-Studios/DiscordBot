import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs';

export default {
  data: new SlashCommandBuilder()
    .setName('team')
    .setDescription('Show all team members and their clock-in/out status'),

  async execute(interaction) {
    const teamData = JSON.parse(fs.readFileSync('./data/team.json', 'utf-8'));
    const embed = new EmbedBuilder()
      .setTitle('👥 Team Status')
      .setColor(0x7289da)
      .setThumbnail('https://example.com/team-logo.png') // Optional: Team logo
      .setFooter({ text: 'Updated', iconURL: 'https://example.com/footer-icon.png' })
      .setTimestamp();

    // Loop through all team members
    for (const member of Object.values(teamData.members)) {
      const status = member.clockedIn
        ? `🟢 Clocked in <t:${member.clockIn}:R>`
        : member.clockOut
        ? `🔴 Clocked out <t:${member.clockOut}:R>`
        : '⚪ No record';

      // Add a "divider" for visual separation
      embed.addFields({
        name: `──────────`,
        value: '\u200B', // empty value
      });

      // Add member field with avatar and status
      embed.addFields({
        name: `${member.name}`,
        value: `${status}`,
        inline: true,
      });

      // Use member avatar as a small icon via inline field
      embed.setThumbnail(member.avatarURL);
    }

    await interaction.reply({ embeds: [embed] });
  },
};
