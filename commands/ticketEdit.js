
import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } from 'discord.js';
import { buildTicketEmbed, parseTicketFromEmbed } from './ticketUtils.js';

export const data = new SlashCommandBuilder()
  .setName('ticket-edit')
  .setDescription('Edit your ticket');

export async function execute(interaction) {
  const staffRoleId = '1425467385481138237';
  if (!interaction.member.roles.cache.has(staffRoleId)) {
      // Helper to log to Discord channel
      async function logAction(msg, type = 'info') {
        console.log('[TICKET EDIT][ACTION]', msg);
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
          console.error('[TICKET EDIT][LOG FAIL]', err);
        }
      }
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription('❌ Only staff can use this command.')
      ],
      ephemeral: true
    });
    return;
  }

  const channel = interaction.channel;
  const pinned = await channel.messages.fetchPinned();
  const infoMsg = pinned.find(m => m.author.id === channel.client.user.id && m.embeds.length && m.embeds[0].title === '🧾 Ticket Information');
  if (!infoMsg) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription('❌ Ticket info message not found or not pinned.')
      ],
      ephemeral: true
    });
    return;
  }
  const ticket = parseTicketFromEmbed(infoMsg.embeds[0]);
  ticket.userTag = ticket.userTag || interaction.user.tag;
  ticket.userAvatar = ticket.userAvatar || interaction.user.displayAvatarURL();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder().setCustomId('edit_topic').setLabel('Edit Topic').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('edit_operator').setLabel('Assign Operator').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('edit_status').setLabel('Status').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('edit_priority').setLabel('Priority').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('edit_category').setLabel('Category').setStyle(ButtonStyle.Secondary)
    );
  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder().setCustomId('edit_description').setLabel('Description').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('edit_internal').setLabel('Internal Notes').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('edit_tags').setLabel('Tags/Labels').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('edit_resolution').setLabel('Resolution').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('edit_feedback').setLabel('Feedback').setStyle(ButtonStyle.Secondary)
    );

  const panelMsg = await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('Edit Panel')
        .setDescription('Select an option below to edit this ticket.')
    ],
    components: [row, row2],
    ephemeral: true,
    fetchReply: true,
  });

  let editMode = true;
  const editingUserId = interaction.user.id;
      await logAction(`Edit panel sent for ticket in channel <#${channel.id}> by <@${interaction.user.id}>.`);
  const messageBlocker = async (msg) => {
    if (
      msg.channel.id === channel.id &&
      editMode &&
      msg.author.id !== editingUserId &&
      !msg.author.bot
    ) {
      try { await msg.delete(); } catch {}
    }
  };
  channel.client.on('messageCreate', messageBlocker);

  const filter = i =>
    i.user.id === editingUserId &&
    i.member.roles.cache.has(staffRoleId);

  const collector = panelMsg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter,
    time: 120000,
  });

  collector.on('collect', async i => {
    let promptEmbed;
    let field = null;
    switch (i.customId) {
      case 'edit_topic':
        promptEmbed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('Edit Ticket Topic')
          .setDescription(`**${i.user.tag}** has chosen to edit the ticket topic.\n\nPlease enter the new topic for this ticket below. Once you send your message, the topic will be updated.`)
          .setFooter({ text: 'Editing ticket topic...', iconURL: i.user.displayAvatarURL() });
        field = 'category';
        break;
      case 'edit_operator':
        promptEmbed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('Assign Ticket Operator')
          .setDescription(`**${i.user.tag}** has chosen to assign an operator to this ticket.\n\nPlease mention the operator you want to assign. Once you send your message, the operator will be assigned.`)
          .setFooter({ text: 'Assigning operator...', iconURL: i.user.displayAvatarURL() });
        field = 'operator';
        break;
      case 'edit_status':
        promptEmbed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('Edit Ticket Status')
          .setDescription('Please enter the new status (e.g. open, in-progress, waiting for user, closed).')
          .setFooter({ text: 'Editing status...', iconURL: i.user.displayAvatarURL() });
        field = 'status';
        break;
      case 'edit_priority':
        promptEmbed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('Edit Ticket Priority')
          .setDescription('Please enter the new priority (low, medium, high, urgent).')
          .setFooter({ text: 'Editing priority...', iconURL: i.user.displayAvatarURL() });
        field = 'priority';
        break;
      case 'edit_category':
        promptEmbed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('Edit Ticket Category')
          .setDescription('Please enter the new category (e.g. billing, bug, suggestion, etc.).')
          .setFooter({ text: 'Editing category...', iconURL: i.user.displayAvatarURL() });
        field = 'category';
        break;
      case 'edit_description':
        promptEmbed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('Edit Ticket Description')
          .setDescription('Please enter the new description for this ticket.')
          .setFooter({ text: 'Editing description...', iconURL: i.user.displayAvatarURL() });
        field = 'description';
        break;
      case 'edit_internal':
        promptEmbed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('Add Internal Note')
          .setDescription('Please enter the internal note to add (operator-only, not visible to user).')
          .setFooter({ text: 'Adding internal note...', iconURL: i.user.displayAvatarURL() });
        field = 'internalNotes';
        break;
      case 'edit_tags':
        promptEmbed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('Edit Ticket Tags/Labels')
          .setDescription('Please enter tags/labels separated by commas (e.g. bug,urgent).')
          .setFooter({ text: 'Editing tags...', iconURL: i.user.displayAvatarURL() });
        field = 'tags';
        break;
      case 'edit_resolution':
        promptEmbed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('Edit Resolution Summary')
          .setDescription('Please enter the resolution summary for this ticket.')
          .setFooter({ text: 'Editing resolution...', iconURL: i.user.displayAvatarURL() });
        field = 'resolution';
        break;
      case 'edit_feedback':
        promptEmbed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('Edit Feedback/Rating')
          .setDescription('Please enter the feedback or rating (e.g. ⭐, 👍👎, etc.).')
          .setFooter({ text: 'Editing feedback...', iconURL: i.user.displayAvatarURL() });
        field = 'feedback';
        break;
    }

    await i.update({ embeds: [promptEmbed], components: [], ephemeral: true });

    const msgFilter = m => m.author.id === editingUserId;
    const collected = await channel.awaitMessages({ filter: msgFilter, max: 1, time: 30000 });
    const userMsg = collected.first();
    const value = userMsg?.content;
    if (userMsg) {
      await userMsg.delete()
        .then(() => {
          console.log('[TICKET EDIT][SUCCESS] Deleted user response message:', userMsg.id);
        })
        .catch(async err => {
          console.error('[TICKET EDIT][FAIL] Could not delete user response message:', userMsg.id, err);
          // Send a notification to the specified Discord channel
          try {
            const notifyChannel = channel.guild.channels.cache.get('1438553454896480257');
            if (notifyChannel) {
              await notifyChannel.send({
                content: `:rotating_light: **TICKET EDIT: FAILED TO DELETE USER RESPONSE** :rotating_light:\nUser: <@${userMsg.author.id}> | Message ID: \`${userMsg.id}\`\nError: \`${err}\``
              });
            }
          } catch (notifyErr) {
            console.error('[TICKET EDIT][FAIL] Could not notify channel about message deletion:', notifyErr);
          }
        });
    }

    let resultEmbed;
    if (value) {
      ticket.updatedAt = Date.now();
      switch (field) {
        case 'operator':
          const mention = userMsg.mentions.members?.first();
          if (mention) {
            ticket.operator = mention.id;
            resultEmbed = new EmbedBuilder()
              .setColor(0x57f287)
              .setTitle('Operator Assigned')
              .setDescription(`✅ Operator assigned: ${mention}`)
              .setFooter({ text: `Assigned by ${i.user.tag}`, iconURL: i.user.displayAvatarURL() });
          } else {
            resultEmbed = new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle('Edit Cancelled')
              .setDescription('❌ No valid user mentioned. The edit operation was cancelled.')
              .setFooter({ text: 'Edit cancelled', iconURL: i.user.displayAvatarURL() });
          }
          break;
        case 'status':
          ticket.status = value;
          resultEmbed = new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle('Ticket Status Updated')
            .setDescription(`Status updated to: **${value}**`)
            .setFooter({ text: `Edited by ${i.user.tag}`, iconURL: i.user.displayAvatarURL() });
          break;
        case 'priority':
          ticket.priority = value;
          resultEmbed = new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle('Ticket Priority Updated')
            .setDescription(`Priority updated to: **${value}**`)
            .setFooter({ text: `Edited by ${i.user.tag}`, iconURL: i.user.displayAvatarURL() });
          break;
        case 'category':
          ticket.category = value;
          resultEmbed = new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle('Ticket Category Updated')
            .setDescription(`Category updated to: **${value}**`)
            .setFooter({ text: `Edited by ${i.user.tag}`, iconURL: i.user.displayAvatarURL() });
          break;
        case 'description':
          ticket.description = value;
          resultEmbed = new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle('Ticket Description Updated')
            .setDescription(`Description updated.`)
            .setFooter({ text: `Edited by ${i.user.tag}`, iconURL: i.user.displayAvatarURL() });
          break;
        case 'internalNotes':
          ticket.internalNotes.push(value);
          resultEmbed = new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle('Internal Note Added')
            .setDescription('Internal note added to the ticket.')
            .setFooter({ text: `Added by ${i.user.tag}`, iconURL: i.user.displayAvatarURL() });
          break;
        case 'tags':
          ticket.tags = value.split(',').map(t => t.trim()).filter(Boolean);
          resultEmbed = new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle('Tags/Labels Updated')
            .setDescription(`Tags/labels updated.`)
            .setFooter({ text: `Edited by ${i.user.tag}`, iconURL: i.user.displayAvatarURL() });
          break;
        case 'resolution':
          ticket.resolution = value;
          resultEmbed = new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle('Resolution Summary Updated')
            .setDescription('Resolution summary updated.')
            .setFooter({ text: `Edited by ${i.user.tag}`, iconURL: i.user.displayAvatarURL() });
          break;
        case 'feedback':
          ticket.feedback = value;
          resultEmbed = new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle('Feedback/Rating Updated')
            .setDescription('Feedback/rating updated.')
            .setFooter({ text: `Edited by ${i.user.tag}`, iconURL: i.user.displayAvatarURL() });
          break;
        default:
          await channel.setTopic(value);
          ticket.category = value;
          resultEmbed = new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle('Ticket Topic Updated')
            .setDescription(`The ticket topic has been updated to:\n> ${value}`)
            .setFooter({ text: `Edited by ${i.user.tag}`, iconURL: i.user.displayAvatarURL() });
      }
      await infoMsg.edit({ embeds: [buildTicketEmbed(ticket)] });
    } else {
      resultEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('Edit Cancelled')
        .setDescription('❌ No value provided. The edit operation was cancelled.')
        .setFooter({ text: 'Edit cancelled', iconURL: i.user.displayAvatarURL() });
    }

    try {
      await panelMsg.edit({ embeds: [resultEmbed], components: [] });
    } catch (err) {
      console.error('Failed to edit panelMsg:', err);
    }
          await logAction(`Panel message edited with result for <@${i.user.id}>.`);
    await channel.send({ embeds: [resultEmbed] });
    editMode = false;
          await logAction(`Failed to edit panelMsg: ${err}`);
    channel.client.off('messageCreate', messageBlocker);
    collector.stop();
        await logAction(`Result embed sent to channel <#${channel.id}> for <@${i.user.id}>.`);
  });

  collector.on('end', () => {
    editMode = false;
    channel.client.off('messageCreate', messageBlocker);
    panelMsg.edit({ components: [] }).catch(() => {});
        logAction(`Edit collector ended for channel <#${channel.id}>.`);
  });
}

export default { data, execute };
