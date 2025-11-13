
import { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { buildTicketEmbed } from './ticketUtils.js';

export const data = new SlashCommandBuilder()
  .setName('ticket-create')
  .setDescription('Create a new support ticket');

export async function execute(interaction) {
    // Helper to log to Discord channel
    async function logAction(msg, type = 'info') {
      console.log('[TICKET CREATE][ACTION]', msg);
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
        console.error('[TICKET CREATE][LOG FAIL]', err);
      }
    }
  const user = interaction.user;
    await logAction(`Ticket create command used by <@${interaction.user.id}> in channel <#${interaction.channel.id}>.`);
    // ...existing code...
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Create a Support Ticket')
    .setDescription('Click the button below to open a ticket form. Our staff will assist you as soon as possible.')
    .setThumbnail(user.displayAvatarURL())
    .setFooter({ text: `Requested by ${user.tag}` });

  const { ButtonBuilder, ActionRowBuilder } = await import('discord.js');
  const button = new ButtonBuilder()
    .setCustomId('open_ticket_modal')
    .setLabel('Open Ticket')
    .setStyle(1); // Primary

  const row = new ActionRowBuilder().addComponents(button);

  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true
  });
  await logAction(`Sent ticket creation embed and button to <@${user.id}>.`);
  // ...existing code...
}

export default { data, execute };
