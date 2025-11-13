
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ticket-close')
  .setDescription('Close your ticket');

export async function execute(interaction) {
    // Helper to log to Discord channel
    async function logAction(msg, type = 'info') {
      console.log('[TICKET CLOSE][ACTION]', msg);
      try {
        const logChannel = interaction.guild.channels.cache.get('1438553454896480257');
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setColor(type === 'error' ? 0xff0000 : 0x57f287)
            .setTitle(type === 'error' ? 'Ticket Error Log' : 'Ticket Log')
            .setDescription(msg)
            .setFooter({ text: `User: ${interaction.user.tag} | Channel: #${interaction.channel.name}` });
          await logChannel.send({ embeds: [embed] });
        }
      } catch (err) {
        console.error('[TICKET CLOSE][LOG FAIL]', err);
      }
    }
  const user = interaction.user;
    await logAction(`Ticket close command used by <@${user.id}> in channel <#${interaction.channel.id}>.`);
  const channel = interaction.channel;
  if (!channel.name.startsWith('ticket-') || !channel.topic || !channel.topic.includes(user.id)) {
    await logAction(`Close attempt failed: <@${user.id}> tried to close a non-ticket or someone else's ticket.`, 'error');
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription('❌ You can only close your own ticket channel.')
      ],
      ephemeral: true
    });
    return;
  }
  await logAction(`Ticket close initiated for <@${user.id}>. Channel will be locked and moved to category: **Closed Ticket**.`);
    // ...existing code...
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription('✅ Ticket closed. Channel locked and archived.')
    ],
    ephemeral: true
  });
  // Set permissions: Only role 1425467385481138237 can view, only role 1422922406950862947 can send
  await channel.permissionOverwrites.set([
    {
      id: interaction.guild.roles.everyone,
      deny: ['ViewChannel', 'SendMessages'],
    },
    {
      id: '1425467385481138237', // can view
      allow: ['ViewChannel'],
      deny: ['SendMessages'],
    },
    {
      id: '1422922406950862947', // can send
      allow: ['ViewChannel', 'SendMessages'],
    }
  ]);
  // Move to archive category
  await channel.setParent('1436354378780115096', { lockPermissions: false });
}

export default { data, execute };
