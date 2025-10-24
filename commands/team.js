import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { listMembers } from '../lib/airtableClient.js';

export default {
  data: new SlashCommandBuilder()
    .setName('team')
    .setDescription('Show all team members and their clock-in/out status'),

  async execute(interaction) {
    const members = await listMembers();
    const embed = new EmbedBuilder()
      .setTitle('👥 Team Status')
      .setColor(0x7289da)
      .setThumbnail('https://example.com/team-logo.png') // Team logo
      .setFooter({ text: 'Updated', iconURL: 'https://example.com/footer-icon.png' })
      .setTimestamp();

    for (const member of members) {
      // Prefer Name, fallback to DiscordId, else show record ID
      const name = member.fields?.Name 
        ?? member.fields?.DiscordId 
        ?? member.id 
        ?? 'Unknown';

      // Ensure clockIn/clockOut are numbers
      const clockIn = Number(member.fields?.['Clock In']) || null;
      const clockOut = Number(member.fields?.['Clock Out']) || null;
      const avatarURL = member.fields?.AvatarURL;

      let status;
      if (clockIn && (!clockOut || clockIn > clockOut)) {
        status = `🟢 Clocked in <t:${clockIn}:R>`;
      } else if (clockOut) {
        status = `🔴 Clocked out <t:${clockOut}:R>`;
      } else {
        status = '⚪ No clock data';
      }

      embed.addFields({ name: `──────────`, value: '\u200B' });
      embed.addFields({ name: name, value: status, inline: true });

      // Set thumbnail only once, outside the loop
    }

    await interaction.reply({ embeds: [embed] });
  },
};
