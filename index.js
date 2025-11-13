import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import 'dotenv/config';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// Load commands
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js') && !f.toLowerCase().includes('utils'));
for (const file of commandFiles) {
  const mod = await import(`./commands/${file}`);
  const command = mod.default ?? mod;
  if (!command?.data) {
    console.warn(`Skipping ${file}, no "data" export`);
    continue;
  }
  client.commands.set(command.data.name, command);
}

// Deploy slash commands automatically
async function deployCommands() {
  const commands = [];
  for (const file of commandFiles) {
    const mod = await import(`./commands/${file}`);
    const command = mod.default ?? mod;
    if (!command?.data) {
      console.warn(`Skipping ${file}, no "data" export`);
      continue;
    }
    commands.push(command.data.toJSON());
  }

  try {
    // register global application commands using the logged-in client
    await client.application.commands.set(commands);
    console.log('✅ Slash commands deployed successfully.');
  } catch (error) {
    console.error('❌ Failed to deploy commands:', error);
  }
}

client.once('clientReady', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await deployCommands();
});

client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Error executing command!', ephemeral: true });
    }
    return;
  }

  // Handle ticket button
  if (interaction.isButton() && interaction.customId === 'open_ticket_modal') {
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
    const modal = new ModalBuilder()
      .setCustomId('ticket_modal')
      .setTitle('Create Support Ticket');

    const subjectInput = new TextInputBuilder()
      .setCustomId('subject')
      .setLabel('Subject')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder('Briefly describe your issue');

    const descriptionInput = new TextInputBuilder()
      .setCustomId('description')
      .setLabel('Description')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setPlaceholder('Provide details about your issue');

    const contactInput = new TextInputBuilder()
      .setCustomId('contact')
      .setLabel('Contact Method')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setPlaceholder('Email, Discord tag, etc.');

    const categoryInput = new TextInputBuilder()
      .setCustomId('category')
      .setLabel('Category')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setPlaceholder('Billing, Tech, General...');

    const priorityInput = new TextInputBuilder()
      .setCustomId('priority')
      .setLabel('Priority')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setPlaceholder('Low, Medium, High');

    modal.addComponents(
      new ActionRowBuilder().addComponents(subjectInput),
      new ActionRowBuilder().addComponents(descriptionInput),
      new ActionRowBuilder().addComponents(contactInput),
      new ActionRowBuilder().addComponents(categoryInput),
      new ActionRowBuilder().addComponents(priorityInput)
    );
    await interaction.showModal(modal);
    return;
  }

  // Handle ticket modal submission
  if (interaction.isModalSubmit() && interaction.customId === 'ticket_modal') {
    const subject = interaction.fields.getTextInputValue('subject');
    const description = interaction.fields.getTextInputValue('description');
    const contact = interaction.fields.getTextInputValue('contact');
    const category = interaction.fields.getTextInputValue('category');
    const priority = interaction.fields.getTextInputValue('priority') || 'Medium';

    const user = interaction.user;
    const guild = interaction.guild;

    // Read ticket ID from topic of channel 1422923640437080085
    const idChannel = guild.channels.cache.get('1422923640437080085');
    let ticketId = '00001';
    if (idChannel && idChannel.topic) {
      const match = idChannel.topic.match(/(\d{5})/);
      if (match) {
        ticketId = String(match[1]).padStart(5, '0');
        // Increment for new ticket
        ticketId = String(parseInt(ticketId, 10) + 1).padStart(5, '0');
      }
    }

    const channelName = `ticket-${ticketId}`;

    // Check if user already has a ticket open
    const existing = guild.channels.cache.find(
      c => c.name.startsWith(`ticket-`) && c.topic && c.topic.includes(user.id)
    );
    if (existing) {
      await interaction.reply({
        embeds: [
          new (await import('discord.js')).EmbedBuilder()
            .setColor(0xff0000)
            .setDescription(`❌ You already have an open ticket: ${existing}`)
        ],
        ephemeral: true
      });
      return;
    }

    const now = Date.now();
    const channel = await guild.channels.create({
      name: channelName,
      type: (await import('discord.js')).ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [(await import('discord.js')).PermissionFlagsBits.ViewChannel],
        },
        {
          id: user.id,
          allow: [(await import('discord.js')).PermissionFlagsBits.ViewChannel, (await import('discord.js')).PermissionFlagsBits.SendMessages],
        },
        // Add staff role here if needed
      ],
      topic: ticketId,
    });

    // Update the topic of the ID channel for the next ticket
    if (idChannel) {
      await idChannel.setTopic(ticketId);
    }

    // Create a private thread in the ticket channel
    const thread = await channel.threads.create({
      name: `private-${channelName}`,
      autoArchiveDuration: 1440,
      type: (await import('discord.js')).ChannelType.PrivateThread,
      reason: `Private thread for ticket ${channelName}`,
    });
    await thread.send('<@&1425467385481138237>');

    // Build ticket data
    const ticketData = {
      operator: null,
      status: 'Open',
      priority,
      category,
      createdAt: now,
      updatedAt: now,
      userId: user.id,
      userTag: user.tag,
      userAvatar: user.displayAvatarURL(),
      contact,
      description,
      internalNotes: [`Staff Thread: <#${thread.id}>`],
      tags: [],
      resolution: '',
      feedback: '',
      relatedCases: [],
    };

    // Use buildTicketEmbed from ticketUtils
    const { buildTicketEmbed } = await import('./commands/ticketUtils.js');
    const infoMsg = await thread.send({
      embeds: [buildTicketEmbed(ticketData)]
    });
    await infoMsg.pin();

    await channel.send({
      embeds: [
        new (await import('discord.js')).EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('Ticket Created')
          .setDescription(`Hello ${user}, thank you for creating a ticket!\nSubject: **${subject}**\nA staff member will be with you shortly.`)
      ]
    });

    await interaction.reply({
      embeds: [
        new (await import('discord.js')).EmbedBuilder()
          .setColor(0x57f287)
          .setDescription(`✅ Ticket created: ${channel}`)
      ],
      ephemeral: true
    });
    return;
  }
});

client.login(process.env.DISCORD_TOKEN);
