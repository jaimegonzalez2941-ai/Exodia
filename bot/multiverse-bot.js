/**
 * LA ACADEMIA // FULL MULTIVERSE DISCORD BOT (Discord.js v14)
 * Combines Moderation, Matchday RSVP, Squad Lineups, Roles, and FC27 Stats
 */

import { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionFlagsBits,
  Partials 
} from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Required for prefix commands
    GatewayIntentBits.GuildMembers,   // Required for kick, ban, mute, roles
  ],
  partials: [Partials.Channel, Partials.Message],
});

const CRIMSON_COLOR = 0xE11D48;
const GOLD_COLOR = 0xF59E0B;
const EMERALD_COLOR = 0x10B981;
const DARK_RED_COLOR = 0x991B1B;

const availabilityMap = new Map();
const sessionAttendance = new Set();

async function logToModChannel(guild, embed) {
  try {
    const modChannel = guild.channels.cache.find(
      c => c.name === 'mod-logs' || c.name === 'moderation-logs' || c.name === 'staff-logs'
    );
    if (modChannel && modChannel.isTextBased()) {
      await modChannel.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error('Audit dispatch notice:', err.message);
  }
}

client.once('ready', () => {
  console.log(`✅ Academia Multiverse Bot is online as ${client.user?.tag}!`);
  client.user?.setActivity('FC27 Trials & Matchday Discipline', { type: 3 });
});

// ==========================================
// 1. PREFIX COMMAND HANDLER
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  const content = message.content.trim();
  const lower = content.toLowerCase();

  // Basic Command Handler: !ping
  if (lower === '!ping') {
    return message.reply(`Pong! 🏓 (Gateway Latency: ${client.ws.ping}ms)`);
  }

  // Availability commands
  if (lower === '!avail in') {
    availabilityMap.set(message.author.id, { user: message.author.username, status: 'in' });
    return message.reply('🟢 **AVAILABILITY CONFIRMED:** You are marked **IN** for tonight\'s matchday fixture!');
  }
  if (lower.startsWith('!avail late')) {
    const note = content.slice(11).trim() || '15m late';
    availabilityMap.set(message.author.id, { user: message.author.username, status: 'late', note });
    return message.reply(`🟡 **LATE NOTICE FILED:** Marked as arriving late (${note}).`);
  }
  if (lower === '!avail out') {
    availabilityMap.set(message.author.id, { user: message.author.username, status: 'out' });
    return message.reply('🔴 **UNAVAILABLE RECORDED:** Marked as **OUT** for tonight.');
  }

  // Attendance checkin
  if (lower === '!checkin') {
    sessionAttendance.add(message.author.id);
    return message.reply(`✅ **ATTENDANCE LOGGED:** ${message.author.username} checked in present for voice comms!`);
  }

  // Lineup
  if (lower === '!lineup') {
    const lineupEmbed = new EmbedBuilder()
      .setColor(GOLD_COLOR)
      .setTitle('⚔️ FIRST XI MATCHDAY FORMATION (4-3-3 HOLDING)')
      .setDescription('Official starting sheet for upcoming tournament fixture:')
      .addFields(
        { name: '🧤 GK', value: 'Bastion_Wall (90 OVR)', inline: true },
        { name: '🛡️ Back 4', value: 'Aero_Wing (LB) • Vortex_Anchor [C] (CB) • Iron_Colossus_27 (CB) • Blitz_Pace (RB)', inline: false },
        { name: '⚡ Midfield 3', value: 'Kinetix_Press (CDM) • ShadowPress_99 (CM) • Silva_Maestro (CAM)', inline: false },
        { name: '🎯 Attack 3', value: 'Shadow_Drift (LW) • Grimm_Apex (ST) • Solar_Volt (RW)', inline: false }
      )
      .setFooter({ text: 'La Academia Multiverse Match Operations' });

    return message.reply({ embeds: [lineupEmbed] });
  }

  // ==========================================
  // MODERATION COMMANDS: !kick, !ban, !mute, !unmute, !clear
  // ==========================================
  // 1. !kick @user [reason]
  if (lower.startsWith('!kick')) {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply('❌ You do not have permission to kick members (Requires **Kick Members**).');
    }
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply('❌ The bot lacks **Kick Members** permission. Please check role permissions.');
    }
    const target = message.mentions.members.first();
    if (!target) {
      return message.reply('⚠️ **Usage:** `!kick @user [reason]`\nExample: `!kick @Viper_Striker99 Inactivity during matchday`');
    }
    if (target.id === message.author.id) return message.reply('❌ You cannot kick yourself.');
    if (target.id === client.user.id) return message.reply('❌ The bot cannot kick itself.');
    if (!target.kickable) {
      return message.reply('❌ Cannot kick this user. Their role hierarchy is higher or equal to the bot.');
    }
    if (message.member.roles.highest.position <= target.roles.highest.position && message.guild.ownerId !== message.author.id) {
      return message.reply('❌ Cannot kick this user because your role is not higher than theirs.');
    }
    const reason = content.split(' ').slice(2).join(' ') || 'Disciplinary violation & squad conduct';
    try {
      await target.kick(reason);
      const kickEmbed = new EmbedBuilder()
        .setColor(CRIMSON_COLOR)
        .setTitle('🛡️ MEMBER KICKED FROM SERVER')
        .setDescription(`**${target.user.tag}** was removed by staff moderation.`)
        .addFields(
          { name: 'Target User', value: `<@${target.id}> (${target.user.tag})`, inline: true },
          { name: 'Moderator', value: `${message.author}`, inline: true },
          { name: 'Action', value: '👢 Guild Kick (Can rejoin via valid invite)', inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'La Academia Staff Moderation Log • Action Confirmed' })
        .setTimestamp();

      await message.channel.send({ embeds: [kickEmbed] });
      await logToModChannel(message.guild, kickEmbed);
      return;
    } catch (err) {
      return message.reply(`❌ Failed to kick user: ${err.message}`);
    }
  }

  // 2. !ban @user [reason]
  if (lower.startsWith('!ban')) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('❌ You do not have permission to ban members (Requires **Ban Members**).');
    }
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('❌ The bot lacks **Ban Members** permission. Please check role permissions.');
    }
    const target = message.mentions.members.first();
    if (!target) {
      return message.reply('⚠️ **Usage:** `!ban @user [reason]`\nExample: `!ban @ToxicTroll Severe match fixing`');
    }
    if (target.id === message.author.id) return message.reply('❌ You cannot ban yourself.');
    if (target.id === client.user.id) return message.reply('❌ The bot cannot ban itself.');
    if (!target.bannable) {
      return message.reply('❌ Cannot ban this user. Their role hierarchy is higher or equal to the bot.');
    }
    if (message.member.roles.highest.position <= target.roles.highest.position && message.guild.ownerId !== message.author.id) {
      return message.reply('❌ Cannot ban this user because your role is not higher than theirs.');
    }
    const reason = content.split(' ').slice(2).join(' ') || 'Severe community violation & zero-tolerance breach';
    try {
      await target.ban({ reason, deleteMessageSeconds: 604800 });
      const banEmbed = new EmbedBuilder()
        .setColor(DARK_RED_COLOR)
        .setTitle('🔨 MEMBER PERMANENTLY BANNED')
        .setDescription(`**${target.user.tag}** was permanently blacklisted by staff moderation.`)
        .addFields(
          { name: 'Target User', value: `<@${target.id}> (${target.user.tag})`, inline: true },
          { name: 'Moderator', value: `${message.author}`, inline: true },
          { name: 'Action', value: '🔨 Permanent Guild Ban & 7-Day Message Cleanup', inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'La Academia Server Blacklist • Action Confirmed' })
        .setTimestamp();

      await message.channel.send({ embeds: [banEmbed] });
      await logToModChannel(message.guild, banEmbed);
      return;
    } catch (err) {
      return message.reply(`❌ Failed to ban user: ${err.message}`);
    }
  }

  // 3. !mute @user [duration] [reason]
  if (lower.startsWith('!mute') || lower.startsWith('!timeout')) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ You need **Timeout Members** permission to mute.');
    }
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ The bot lacks **Timeout Members** permission.');
    }
    const target = message.mentions.members.first();
    if (!target) {
      return message.reply('⚠️ **Usage:** `!mute @user [duration] [reason]`\nExample: `!mute @Viper_Striker99 10m Voice spam`\nDurations: `60s`, `5m`, `10m`, `1h`, `1d`, `7d` (default: `10m`)');
    }
    if (target.id === message.author.id) return message.reply('❌ You cannot mute yourself.');
    if (target.id === client.user.id) return message.reply('❌ The bot cannot mute itself.');
    if (!target.moderatable) {
      return message.reply('❌ Cannot mute this user due to role hierarchy.');
    }
    if (message.member.roles.highest.position <= target.roles.highest.position && message.guild.ownerId !== message.author.id) {
      return message.reply('❌ Cannot mute this user because your role is not higher than theirs.');
    }
    const rawArgs = content.split(' ').slice(2);
    let durationMs = 10 * 60 * 1000;
    let durationLabel = '10 Minutes';
    let reasonIndex = 0;
    if (rawArgs[0] && /^(\d+)(s|m|h|d|w)$/i.test(rawArgs[0])) {
      const match = rawArgs[0].match(/^(\d+)(s|m|h|d|w)$/i);
      const val = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      if (unit === 's') { durationMs = val * 1000; durationLabel = `${val} Second(s)`; }
      else if (unit === 'm') { durationMs = val * 60 * 1000; durationLabel = `${val} Minute(s)`; }
      else if (unit === 'h') { durationMs = val * 60 * 60 * 1000; durationLabel = `${val} Hour(s)`; }
      else if (unit === 'd') { durationMs = val * 24 * 60 * 60 * 1000; durationLabel = `${val} Day(s)`; }
      else if (unit === 'w') { durationMs = val * 7 * 24 * 60 * 60 * 1000; durationLabel = `${val} Week(s)`; }
      reasonIndex = 1;
    }
    const reason = rawArgs.slice(reasonIndex).join(' ') || 'Matchday comms disruption & team discipline';
    try {
      await target.timeout(durationMs, reason);
      const expiresUnix = Math.floor((Date.now() + durationMs) / 1000);
      const muteEmbed = new EmbedBuilder()
        .setColor(GOLD_COLOR)
        .setTitle('🔇 MEMBER TIMED OUT / MUTED')
        .setDescription(`**${target.user.tag}** was placed in timeout by staff moderation.`)
        .addFields(
          { name: 'Target User', value: `<@${target.id}> (${target.user.tag})`, inline: true },
          { name: 'Duration', value: `⏱️ **${durationLabel}**`, inline: true },
          { name: 'Expires', value: `<t:${expiresUnix}:R>`, inline: true },
          { name: 'Moderator', value: `${message.author}`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'La Academia Staff Moderation Log • Communication Restricted' })
        .setTimestamp();

      await message.channel.send({ embeds: [muteEmbed] });
      await logToModChannel(message.guild, muteEmbed);
      return;
    } catch (err) {
      return message.reply(`❌ Failed to timeout user: ${err.message}`);
    }
  }

  // 4. !unmute @user [reason]
  if (lower.startsWith('!unmute')) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ You need **Timeout Members** permission to unmute.');
    }
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ The bot lacks **Timeout Members** permission.');
    }
    const target = message.mentions.members.first();
    if (!target) {
      return message.reply('⚠️ **Usage:** `!unmute @user [reason]`\nExample: `!unmute @Viper_Striker99 Timeout served`');
    }
    if (!target.moderatable) {
      return message.reply('❌ Cannot unmute this user due to role hierarchy.');
    }
    const reason = content.split(' ').slice(2).join(' ') || 'Timeout lifted by staff moderation';
    try {
      await target.timeout(null, reason);
      const unmuteEmbed = new EmbedBuilder()
        .setColor(EMERALD_COLOR)
        .setTitle('🔊 MEMBER TIMEOUT REMOVED / UNMUTED')
        .setDescription(`**${target.user.tag}** has had their timeout lifted.`)
        .addFields(
          { name: 'Target User', value: `<@${target.id}> (${target.user.tag})`, inline: true },
          { name: 'Moderator', value: `${message.author}`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'La Academia Staff Moderation Log • Permissions Restored' })
        .setTimestamp();

      await message.channel.send({ embeds: [unmuteEmbed] });
      await logToModChannel(message.guild, unmuteEmbed);
      return;
    } catch (err) {
      return message.reply(`❌ Failed to unmute user: ${err.message}`);
    }
  }

  // 5. !clear <number>
  if (lower.startsWith('!clear') || lower.startsWith('!purge')) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('❌ You need **Manage Messages** permission to clear messages.');
    }
    const args = content.split(' ');
    const amount = parseInt(args[1], 10);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply('⚠️ **Usage:** `!clear <number>` (1-100, e.g. `!clear 5`)');
    }
    try {
      const fetched = await message.channel.messages.fetch({ limit: Math.min(amount + 1, 100) });
      const deleted = await message.channel.bulkDelete(fetched, true);
      const purgedCount = Math.max(0, deleted.size - 1);
      const confirmMsg = await message.channel.send(`🧹 Successfully deleted **${purgedCount}** messages.`);
      setTimeout(() => confirmMsg.delete().catch(() => {}), 4000);
      return;
    } catch (err) {
      return message.reply(`❌ Error clearing messages: ${err.message}`);
    }
  }
});

// ==========================================
// 2. SLASH COMMAND ROUTER & INTERACTION HANDLER
// ==========================================
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    if (commandName === 'ping') {
      await interaction.reply({ content: `Pong! 🏓 (Gateway Latency: ${client.ws.ping}ms)`, ephemeral: true });
    }

    // Availability Poll
    else if (commandName === 'availability') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('avail_in').setLabel('🟢 Available (In)').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('avail_late').setLabel('🟡 Late (15m)').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('avail_out').setLabel('🔴 Out').setStyle(ButtonStyle.Danger)
      );

      const embed = new EmbedBuilder()
        .setColor(EMERALD_COLOR)
        .setTitle('📅 MATCHDAY AVAILABILITY RSVP // OFFICIAL CALLOUT')
        .setDescription('Confirm your availability for tonight\'s competitive fixture:')
        .addFields(
          { name: '🟢 Available', value: 'Click In button to RSVP', inline: true },
          { name: '🟡 Late', value: 'Click Late button to notify', inline: true },
          { name: '🔴 Out', value: 'Click Out if unavailable', inline: true }
        );

      await interaction.reply({ embeds: [embed], components: [row] });
    }

    // Moderation Slash Commands: /kick, /ban, /mute, /unmute, /clear
    else if (commandName === 'kick') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        return interaction.reply({ content: '❌ You need **Kick Members** permission.', ephemeral: true });
      }
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
        return interaction.reply({ content: '❌ The bot requires **Kick Members** permission to perform this action.', ephemeral: true });
      }
      const targetUser = interaction.options.getUser('target');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      if (!targetMember || !targetMember.kickable) {
        return interaction.reply({ content: '❌ Cannot kick this user due to role hierarchy or missing permissions.', ephemeral: true });
      }
      await targetMember.kick(reason);
      const embed = new EmbedBuilder()
        .setColor(CRIMSON_COLOR)
        .setTitle('🛡️ MEMBER KICKED FROM SERVER')
        .setDescription(`**${targetUser.tag}** was kicked by staff moderation.`)
        .addFields(
          { name: 'Target User', value: `<@${targetUser.id}>`, inline: true },
          { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        );
      await interaction.reply({ embeds: [embed] });
      await logToModChannel(interaction.guild, embed);
    }
    else if (commandName === 'ban') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return interaction.reply({ content: '❌ You need **Ban Members** permission.', ephemeral: true });
      }
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
        return interaction.reply({ content: '❌ The bot requires **Ban Members** permission to perform this action.', ephemeral: true });
      }
      const targetUser = interaction.options.getUser('target');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      if (!targetMember || !targetMember.bannable) {
        return interaction.reply({ content: '❌ Cannot ban this user due to role hierarchy or missing permissions.', ephemeral: true });
      }
      await targetMember.ban({ reason, deleteMessageSeconds: 604800 });
      const embed = new EmbedBuilder()
        .setColor(DARK_RED_COLOR)
        .setTitle('🔨 MEMBER PERMANENTLY BANNED')
        .setDescription(`**${targetUser.tag}** was blacklisted by staff moderation.`)
        .addFields(
          { name: 'Target User', value: `<@${targetUser.id}>`, inline: true },
          { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        );
      await interaction.reply({ embeds: [embed] });
      await logToModChannel(interaction.guild, embed);
    }
    else if (commandName === 'mute') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return interaction.reply({ content: '❌ You need **Timeout Members** permission.', ephemeral: true });
      }
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return interaction.reply({ content: '❌ The bot requires **Timeout Members** permission.', ephemeral: true });
      }
      const targetUser = interaction.options.getUser('target');
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      if (!targetMember) {
        return interaction.reply({ content: '❌ Member not found in this guild.', ephemeral: true });
      }
      if (!targetMember.moderatable) {
        return interaction.reply({ content: '❌ Cannot mute this user due to role hierarchy or guild ownership.', ephemeral: true });
      }
      const durationStr = interaction.options.getString('duration') || '10m';
      const durationMap = {
        '60s': 60 * 1000,
        '5m': 5 * 60 * 1000,
        '10m': 10 * 60 * 1000,
        '1h': 60 * 60 * 1000,
        '1d': 24 * 60 * 60 * 1000,
        '1w': 7 * 24 * 60 * 60 * 1000,
      };
      const durationMs = durationMap[durationStr] || 10 * 60 * 1000;
      const reason = interaction.options.getString('reason') || 'Violation of team rules & discipline';

      await targetMember.timeout(durationMs, reason);
      const embed = new EmbedBuilder()
        .setColor(GOLD_COLOR)
        .setTitle('🔇 MEMBER TIMED OUT / MUTED')
        .setDescription(`**${targetUser.tag}** was placed on communication timeout.`)
        .addFields(
          { name: 'Target User', value: `<@${targetUser.id}>`, inline: true },
          { name: 'Duration', value: `⏱️ **${durationStr}**`, inline: true },
          { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'La Academia Staff Moderation Log' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      await logToModChannel(interaction.guild, embed);
    }
    else if (commandName === 'unmute') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return interaction.reply({ content: '❌ You need **Timeout Members** permission.', ephemeral: true });
      }
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return interaction.reply({ content: '❌ The bot requires **Timeout Members** permission.', ephemeral: true });
      }
      const targetUser = interaction.options.getUser('target');
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      if (!targetMember || !targetMember.moderatable) {
        return interaction.reply({ content: '❌ Cannot unmute this user due to role hierarchy.', ephemeral: true });
      }
      const reason = interaction.options.getString('reason') || 'Timeout lifted by staff moderation';
      await targetMember.timeout(null, reason);

      const embed = new EmbedBuilder()
        .setColor(EMERALD_COLOR)
        .setTitle('🔊 MEMBER TIMEOUT REMOVED / UNMUTED')
        .setDescription(`**${targetUser.tag}** has had their timeout lifted.`)
        .addFields(
          { name: 'Target User', value: `<@${targetUser.id}>`, inline: true },
          { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        );
      await interaction.reply({ embeds: [embed] });
      await logToModChannel(interaction.guild, embed);
    }
  }
});

if (process.env.DISCORD_TOKEN) {
  client.login(process.env.DISCORD_TOKEN);
} else {
  console.log('⚠️ DISCORD_TOKEN is not defined in .env.');
}
