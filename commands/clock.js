import { SlashCommandBuilder } from 'discord.js';
import { getMemberById, upsertMember } from '../lib/airtableClient.js';

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
    const userId = interaction.user.id;
    const timestamp = Math.floor(Date.now() / 1000);

    // fetch existing member from Airtable (if any)
    let member = await getMemberById(userId);

    if (!member) {
      member = {
        discordId: userId,
        name: interaction.user.username,
        avatarURL: interaction.user.displayAvatarURL(),
        clockedIn: false,
        clockIn: null,
        clockOut: null,
      };
    }

    if (action === 'in') {
      member.clockedIn = true;
      member.clockIn = timestamp;
      await interaction.reply(`✅ You clocked in at <t:${timestamp}:t>`);
    } else {
      member.clockedIn = false;
      member.clockOut = timestamp;
      await interaction.reply(`⏱️ You clocked out at <t:${timestamp}:t>`);
    }

    // persist to Airtable
    try {
      await upsertMember(userId, {
        name: member.name,
        avatarURL: member.avatarURL,
        clockedIn: member.clockedIn,
        clockIn: member.clockIn,
        clockOut: member.clockOut,
      });
    } catch (err) {
      console.error('Failed to save member to Airtable:', err);
      await interaction.followUp({ content: 'Failed to save to Airtable. Check logs.', ephemeral: true });
    }
  },
};
