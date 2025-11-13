import { EmbedBuilder } from 'discord.js';

export function buildTicketEmbed(ticket) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🧾 Ticket Information')
    .addFields(
      { name: 'Operator / Handler', value: ticket.operator ? `<@${ticket.operator}>` : 'Unassigned', inline: true },
      { name: 'Status', value: ticket.status, inline: true },
      { name: 'Priority', value: ticket.priority, inline: true },
      { name: 'Category', value: ticket.category || 'Unspecified', inline: true },
      { name: 'Created At', value: `<t:${Math.floor(ticket.createdAt/1000)}:f>`, inline: true },
      { name: 'Updated At', value: `<t:${Math.floor(ticket.updatedAt/1000)}:f>`, inline: true },
      { name: 'User / Submitter', value: `<@${ticket.userId}>`, inline: true },
      { name: 'User ID', value: ticket.userId, inline: true },
      { name: 'Contact Method', value: ticket.contact || 'Not provided', inline: true },
      { name: 'Description', value: ticket.description || 'No description provided', inline: false },
      { name: 'Internal Notes', value: ticket.internalNotes?.length ? ticket.internalNotes.map(n => `• ${n}`).join('\n') : 'None', inline: false },
      { name: 'Tags / Labels', value: ticket.tags?.length ? ticket.tags.join(', ') : 'None', inline: true },
      { name: 'Resolution Summary', value: ticket.resolution || 'None', inline: false },
      { name: 'Feedback / Rating', value: ticket.feedback || 'None', inline: true },
      { name: 'Related Case IDs', value: ticket.relatedCases?.length ? ticket.relatedCases.join(', ') : 'None', inline: true }
    )
    .setFooter({ text: `Ticket for ${ticket.userTag}`, iconURL: ticket.userAvatar });
}

export function parseTicketFromEmbed(embed) {
  const fields = {};
  for (const f of embed.fields) {
    fields[f.name] = f.value;
  }
  return {
    operator: fields['Operator / Handler']?.match(/<@(\d+)>/)?.[1] || null,
    status: fields['Status'] || 'Open',
    priority: fields['Priority'] || 'Medium',
    category: fields['Category'] === 'Unspecified' ? '' : fields['Category'],
    createdAt: fields['Created At'] ? Number(fields['Created At'].match(/<t:(\d+):f>/)?.[1]) * 1000 : Date.now(),
    updatedAt: fields['Updated At'] ? Number(fields['Updated At'].match(/<t:(\d+):f>/)?.[1]) * 1000 : Date.now(),
    userId: fields['User ID'],
    userTag: fields['User / Submitter']?.match(/<@(\d+)>/)?.[1] ? '' : fields['User / Submitter'],
    userAvatar: '',
    contact: fields['Contact Method'] === 'Not provided' ? '' : fields['Contact Method'],
    description: fields['Description'] === 'No description provided' ? '' : fields['Description'],
    internalNotes: fields['Internal Notes'] && fields['Internal Notes'] !== 'None'
      ? fields['Internal Notes'].split('\n').map(l => l.replace(/^• /, ''))
      : [],
    tags: fields['Tags / Labels'] && fields['Tags / Labels'] !== 'None'
      ? fields['Tags / Labels'].split(',').map(t => t.trim())
      : [],
    resolution: fields['Resolution Summary'] === 'None' ? '' : fields['Resolution Summary'],
    feedback: fields['Feedback / Rating'] === 'None' ? '' : fields['Feedback / Rating'],
    relatedCases: fields['Related Case IDs'] && fields['Related Case IDs'] !== 'None'
      ? fields['Related Case IDs'].split(',').map(t => t.trim())
      : [],
  };
}
