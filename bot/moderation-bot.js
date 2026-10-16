/**
 * LA ACADEMIA // DISCORD MODERATION BOT
 * Production Moderation Engine (Discord.js v14)
 * 
 * Features:
 * - Kicking (!kick @user [reason] & /kick)
 * - Banning (!ban @user [reason] & /ban)
 * - Muting / Timeout (!mute @user [duration] [reason] & /mute)
 * - Unmuting (!unmute @user [reason] & /unmute)
 * - Bulk Purge (!clear [amount] & /clear)
 * - Channel Confirmation Embeds with Enforcing Moderator, Target User, and Reason
 * - Automatic Audit Logging to #mod-logs
 * - Role Hierarchy Safety & Permission Verification
 */

import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionFlagsBits,
  Partials,
} from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Required for !kick, !ban, !mute, !ping
    GatewayIntentBits.GuildMembers,   // Required for kickable, bannable, and timeout checks
  ],
  partials: [Partials.Channel, Partials.Message],
});

const CRIMSON_COLOR = 0xE11D48;
const GOLD_COLOR = 0xF59E0B;
const EMERALD_COLOR = 0x10B981;
const DARK_RED_COLOR = 0x991B1B;

// Helper: Dispatch audit embed to #mod-logs if channel exists
async function logToModChannel(guild, embed) {
  try {
    const modChannel = guild.channels.cache.find(
      c => c.name === 'mod-logs' || c.name === 'moderation-logs' || c.name === 'staff-logs'
    );
    if (modChannel && modChannel.isTextBased()) {
      await modChannel.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error('Audit dispatch error:', err.message);
  }
}

client.once('ready', () => {
  console.log('====================================================');
  console.log(`🛡️  ACADEMIA MODERATION BOT ONLINE: ${client.user?.tag}`);
  console.log('✅  Active Commands: !kick, !ban, !mute, !unmute, !clear, !ping');
  console.log('====================================================');
  client.user?.setActivity('Staff Moderation & Discipline', { type: 3 });
});

// ==========================================
// 1. PREFIX COMMAND LISTENER (!kick, !ban, !mute, !unmute, !clear, !ping)
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  const content = message.content.trim();
  const lower = content.toLowerCase();

  // Basic Command Handler: responds with 'Pong!' on !ping
  if (lower === '!ping') {
    return message.reply(`🏓 Pong! (Gateway Latency: ${client.ws.ping}ms • Moderation Handler: Operational)`);
  }

  // Moderation help
  if (lower === '!modhelp' || lower === '!mod') {
    const helpEmbed = new EmbedBuilder()
      .setColor(CRIMSON_COLOR)
      .setTitle('🛡️ LA ACADEMIA // MODERATION COMMAND REFERENCE')
      .setDescription('Available staff moderation commands with full confirmation messaging:')
      .addFields(
        { name: '👢 Kick Member', value: '`!kick @user [reason]`\nRemoves member from server. Requires **Kick Members**.', inline: false },
        { name: '🔨 Ban Member', value: '`!ban @user [reason]`\nPermanently bans member and purges 7 days of spam. Requires **Ban Members**.', inline: false },
        { name: '🔇 Mute / Timeout Member', value: '`!mute @user [duration] [reason]`\nRestricts messaging, reactions, and voice chat. Durations: `60s`, `5m`, `10m`, `1h`, `1d`, `7d` (default 10m). Requires **Timeout Members**.', inline: false },
        { name: '🔊 Unmute Member', value: '`!unmute @user [reason]`\nLifts timeout immediately. Requires **Timeout Members**.', inline: false },
        { name: '🧹 Clear / Purge Messages', value: '`!clear <1-100>`\nBulk deletes recent channel messages. Requires **Manage Messages**.', inline: false }
      )
      .setFooter({ text: 'All sanctions issue confirmation embeds and archive to #mod-logs' })
      .setTimestamp();

    return message.channel.send({ embeds: [helpEmbed] });
  }

  // 1. KICK COMMAND: !kick @user [reason]
  if (lower.startsWith('!kick')) {
    // 1. Moderator Permission Check
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply('❌ **Permission Denied:** You need the **Kick Members** permission to execute this command.');
    }
    // 2. Bot Permission Check
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply('❌ **Bot Configuration Error:** The bot lacks **Kick Members** permission. Please grant the bot **Kick Members** in Server Settings.');
    }

    const target = message.mentions.members.first();
    if (!target) {
      return message.reply('⚠️ **Usage:** `!kick @user [reason]`\nExample: `!kick @Viper_Striker99 Insubordination during tournament match`');
    }

    if (target.id === message.author.id) {
      return message.reply('❌ You cannot kick yourself.');
    }
    if (target.id === client.user.id) {
      return message.reply('❌ The bot cannot kick itself.');
    }
    if (!target.kickable) {
      return message.reply('❌ **Hierarchy Error:** Cannot kick this user. Their highest role is equal to or higher than the bot\'s role.');
    }
    if (message.member.roles.highest.position <= target.roles.highest.position && message.guild.ownerId !== message.author.id) {
      return message.reply('❌ **Hierarchy Error:** You cannot kick this user because your highest role is not strictly above theirs.');
    }

    const reason = content.split(' ').slice(2).join(' ') || 'Disciplinary violation & team conduct';

    try {
      await target.kick(reason);

      // Confirmation Embed to Channel
      const kickEmbed = new EmbedBuilder()
        .setColor(CRIMSON_COLOR)
        .setTitle('🛡️ MEMBER KICKED FROM SERVER')
        .setDescription(`**${target.user.tag}** was removed by staff moderation.`)
        .addFields(
          { name: 'Target User', value: `<@${target.id}> (${target.user.tag})`, inline: true },
          { name: 'Moderator', value: `${message.author} (${message.author.tag})`, inline: true },
          { name: 'Action', value: '👢 Guild Kick (Can rejoin via valid invite)', inline: true },
          { name: 'Disciplinary Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'La Academia Staff Moderation Log • Confirmation Verified' })
        .setTimestamp();

      await message.channel.send({ embeds: [kickEmbed] });
      await logToModChannel(message.guild, kickEmbed);
      return;
    } catch (err) {
      return message.reply(`❌ Failed to kick user: ${err.message}`);
    }
  }

  // 2. BAN COMMAND: !ban @user [reason]
  if (lower.startsWith('!ban')) {
    // 1. Moderator Permission Check
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('❌ **Permission Denied:** You need the **Ban Members** permission to execute this command.');
    }
    // 2. Bot Permission Check
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('❌ **Bot Configuration Error:** The bot lacks **Ban Members** permission. Please grant the bot **Ban Members** in Server Settings.');
    }

    const target = message.mentions.members.first();
    if (!target) {
      return message.reply('⚠️ **Usage:** `!ban @user [reason]`\nExample: `!ban @ToxicTroll Severe match-fixing & toxicity`');
    }

    if (target.id === message.author.id) {
      return message.reply('❌ You cannot ban yourself.');
    }
    if (target.id === client.user.id) {
      return message.reply('❌ The bot cannot ban itself.');
    }
    if (!target.bannable) {
      return message.reply('❌ **Hierarchy Error:** Cannot ban this user. Their highest role is equal to or higher than the bot\'s role.');
    }
    if (message.member.roles.highest.position <= target.roles.highest.position && message.guild.ownerId !== message.author.id) {
      return message.reply('❌ **Hierarchy Error:** You cannot ban this user because your highest role is not strictly above theirs.');
    }

    const reason = content.split(' ').slice(2).join(' ') || 'Severe community violation & zero-tolerance breach';

    try {
      await target.ban({ reason, deleteMessageSeconds: 604800 }); // Purge 7 days of spam

      // Confirmation Embed to Channel
      const banEmbed = new EmbedBuilder()
        .setColor(DARK_RED_COLOR)
        .setTitle('🔨 MEMBER PERMANENTLY BANNED')
        .setDescription(`**${target.user.tag}** was permanently blacklisted from **LA ACADEMIA**.`)
        .addFields(
          { name: 'Target User', value: `<@${target.id}> (${target.user.tag})`, inline: true },
          { name: 'Moderator', value: `${message.author} (${message.author.tag})`, inline: true },
          { name: 'Action', value: '🔨 Permanent Guild Ban & 7-Day Message Cleanup', inline: true },
          { name: 'Disciplinary Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'La Academia Server Blacklist • Irrevocable Sanction' })
        .setTimestamp();

      await message.channel.send({ embeds: [banEmbed] });
      await logToModChannel(message.guild, banEmbed);
      return;
    } catch (err) {
      return message.reply(`❌ Failed to ban user: ${err.message}`);
    }
  }

  // 3. MUTE / TIMEOUT COMMAND: !mute @user [duration] [reason]
  if (lower.startsWith('!mute') || lower.startsWith('!timeout')) {
    // 1. Moderator Permission Check
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ **Permission Denied:** You need **Timeout Members** (Moderate Members) permission to mute users.');
    }
    // 2. Bot Permission Check
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ **Bot Configuration Error:** The bot lacks **Timeout Members** permission. Please grant the bot **Moderate Members** in Server Settings.');
    }

    const target = message.mentions.members.first();
    if (!target) {
      return message.reply('⚠️ **Usage:** `!mute @user [duration] [reason]`\nExample: `!mute @Viper_Striker99 10m Voice spam in competitive lobby`\nSupported durations: `60s`, `5m`, `10m`, `1h`, `1d`, `7d` (default: `10m`)');
    }

    if (target.id === message.author.id) {
      return message.reply('❌ You cannot mute yourself.');
    }
    if (target.id === client.user.id) {
      return message.reply('❌ The bot cannot mute itself.');
    }
    if (!target.moderatable) {
      return message.reply('❌ **Hierarchy Error:** Cannot mute this user due to role hierarchy or server ownership.');
    }
    if (message.member.roles.highest.position <= target.roles.highest.position && message.guild.ownerId !== message.author.id) {
      return message.reply('❌ **Hierarchy Error:** You cannot mute this user because your highest role is not strictly above theirs.');
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

    const reason = rawArgs.slice(reasonIndex).join(' ') || 'Disciplinary timeout for disruptive behavior';

    try {
      await target.timeout(durationMs, reason);

      const expiresUnix = Math.floor((Date.now() + durationMs) / 1000);
      // Confirmation Embed to Channel
      const muteEmbed = new EmbedBuilder()
        .setColor(GOLD_COLOR)
        .setTitle('🔇 MEMBER TIMED OUT / MUTED')
        .setDescription(`**${target.user.tag}** was placed on communication timeout by staff moderation.`)
        .addFields(
          { name: 'Target User', value: `<@${target.id}> (${target.user.tag})`, inline: true },
          { name: 'Duration', value: `⏱️ **${durationLabel}**`, inline: true },
          { name: 'Expires', value: `<t:${expiresUnix}:R>`, inline: true },
          { name: 'Moderator', value: `${message.author} (${message.author.tag})`, inline: true },
          { name: 'Restrictions', value: 'Restricted from sending messages, reactions, and speaking in voice comms.', inline: true },
          { name: 'Disciplinary Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'La Academia Staff Moderation Log • Timeout Active' })
        .setTimestamp();

      await message.channel.send({ embeds: [muteEmbed] });
      await logToModChannel(message.guild, muteEmbed);
      return;
    } catch (err) {
      return message.reply(`❌ Failed to timeout user: ${err.message}`);
    }
  }

  // 4. UNMUTE COMMAND: !unmute @user [reason]
  if (lower.startsWith('!unmute')) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ **Permission Denied:** You need **Timeout Members** permission to unmute users.');
    }
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ **Bot Configuration Error:** The bot lacks **Timeout Members** permission.');
    }

    const target = message.mentions.members.first();
    if (!target) {
      return message.reply('⚠️ **Usage:** `!unmute @user [reason]`\nExample: `!unmute @Viper_Striker99 Timeout served & apology accepted`');
    }

    if (!target.moderatable) {
      return message.reply('❌ **Hierarchy Error:** Cannot unmute this user due to role hierarchy.');
    }

    const reason = content.split(' ').slice(2).join(' ') || 'Timeout lifted by staff moderation';

    try {
      await target.timeout(null, reason);

      // Confirmation Embed to Channel
      const unmuteEmbed = new EmbedBuilder()
        .setColor(EMERALD_COLOR)
        .setTitle('🔊 MEMBER TIMEOUT REMOVED / UNMUTED')
        .setDescription(`**${target.user.tag}** has had their timeout lifted.`)
        .addFields(
          { name: 'Target User', value: `<@${target.id}> (${target.user.tag})`, inline: true },
          { name: 'Moderator', value: `${message.author}`, inline: true },
          { name: 'Permissions', value: '✅ Full text chat and voice privileges restored.', inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'La Academia Staff Moderation Log • Sanction Lifted' })
        .setTimestamp();

      await message.channel.send({ embeds: [unmuteEmbed] });
      await logToModChannel(message.guild, unmuteEmbed);
      return;
    } catch (err) {
      return message.reply(`❌ Failed to unmute user: ${err.message}`);
    }
  }

  // 5. CLEAR / PURGE: !clear <number>
  if (lower.startsWith('!clear') || lower.startsWith('!purge')) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('❌ **Permission Denied:** You need **Manage Messages** permission.');
    }
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('❌ **Bot Configuration Error:** The bot lacks **Manage Messages** permission.');
    }

    const args = content.split(' ');
    const amount = parseInt(args[1], 10);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply('⚠️ **Usage:** `!clear <1-100>` (e.g. `!clear 10`)');
    }

    try {
      const fetched = await message.channel.messages.fetch({ limit: Math.min(amount + 1, 100) });
      const deleted = await message.channel.bulkDelete(fetched, true);
      const purgedCount = Math.max(0, deleted.size - 1);
      const confirmMsg = await message.channel.send(`🧹 Purged **${purgedCount}** messages from this channel.`);
      setTimeout(() => confirmMsg.delete().catch(() => {}), 4000);
      return;
    } catch (err) {
      return message.reply(`❌ Error purging messages: ${err.message}`);
    }
  }
});

// ==========================================
// 2. SLASH COMMAND ROUTER (/kick, /ban, /mute, /unmute, /clear, /ping)
// ==========================================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;

  if (commandName === 'ping') {
    return interaction.reply({ content: `🏓 Pong! (Gateway Latency: ${client.ws.ping}ms)`, ephemeral: true });
  }

  // /kick
  if (commandName === 'kick') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({ content: '❌ You need **Kick Members** permission.', ephemeral: true });
    }
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({ content: '❌ The bot lacks **Kick Members** permission.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'Disciplinary violation';
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) return interaction.reply({ content: '❌ Member not found in this guild.', ephemeral: true });
    if (!targetMember.kickable) return interaction.reply({ content: '❌ Cannot kick user due to role hierarchy.', ephemeral: true });

    await targetMember.kick(reason);

    const embed = new EmbedBuilder()
      .setColor(CRIMSON_COLOR)
      .setTitle('🛡️ MEMBER KICKED FROM SERVER')
      .setDescription(`**${targetUser.tag}** was removed by staff moderation.`)
      .addFields(
        { name: 'Target User', value: `<@${targetUser.id}>`, inline: true },
        { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Reason', value: reason, inline: false }
      )
      .setFooter({ text: 'Staff Moderation Log • Confirmation Verified' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    await logToModChannel(interaction.guild, embed);
  }

  // /ban
  else if (commandName === 'ban') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: '❌ You need **Ban Members** permission.', ephemeral: true });
    }
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: '❌ The bot lacks **Ban Members** permission.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'Disciplinary violation';
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) return interaction.reply({ content: '❌ Member not found in this guild.', ephemeral: true });
    if (!targetMember.bannable) return interaction.reply({ content: '❌ Cannot ban user due to role hierarchy.', ephemeral: true });

    await targetMember.ban({ reason, deleteMessageSeconds: 604800 });

    const embed = new EmbedBuilder()
      .setColor(DARK_RED_COLOR)
      .setTitle('🔨 MEMBER PERMANENTLY BANNED')
      .setDescription(`**${targetUser.tag}** was blacklisted by staff moderation.`)
      .addFields(
        { name: 'Target User', value: `<@${targetUser.id}>`, inline: true },
        { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Reason', value: reason, inline: false }
      )
      .setFooter({ text: 'Server Blacklist • Confirmation Verified' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    await logToModChannel(interaction.guild, embed);
  }

  // /mute
  else if (commandName === 'mute') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: '❌ You need **Timeout Members** permission.', ephemeral: true });
    }
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: '❌ The bot lacks **Timeout Members** permission.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('target');
    const durationStr = interaction.options.getString('duration') || '10m';
    const reason = interaction.options.getString('reason') || 'Violation of team rules & discipline';

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) return interaction.reply({ content: '❌ Member not found in this guild.', ephemeral: true });
    if (!targetMember.moderatable) return interaction.reply({ content: '❌ Cannot mute this user due to role hierarchy.', ephemeral: true });

    const durationMap = {
      '60s': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '10m': 10 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
    };
    const durationMs = durationMap[durationStr] || 10 * 60 * 1000;

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
      .setFooter({ text: 'Staff Moderation Log • Confirmation Verified' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    await logToModChannel(interaction.guild, embed);
  }

  // /unmute
  else if (commandName === 'unmute') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: '❌ You need **Timeout Members** permission.', ephemeral: true });
    }
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: '❌ The bot lacks **Timeout Members** permission.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'Timeout lifted';
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember || !targetMember.moderatable) {
      return interaction.reply({ content: '❌ Cannot unmute this user.', ephemeral: true });
    }

    await targetMember.timeout(null, reason);

    const embed = new EmbedBuilder()
      .setColor(EMERALD_COLOR)
      .setTitle('🔊 MEMBER TIMEOUT REMOVED / UNMUTED')
      .setDescription(`**${targetUser.tag}** has had their timeout lifted.`)
      .addFields(
        { name: 'Target User', value: `<@${targetUser.id}>`, inline: true },
        { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Reason', value: reason, inline: false }
      )
      .setFooter({ text: 'Staff Moderation Log • Confirmation Verified' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    await logToModChannel(interaction.guild, embed);
  }

  // /clear
  else if (commandName === 'clear') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: '❌ You need **Manage Messages** permission.', ephemeral: true });
    }
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: '❌ The bot lacks **Manage Messages** permission.', ephemeral: true });
    }

    const amount = interaction.options.getInteger('amount');
    const fetched = await interaction.channel.messages.fetch({ limit: amount });
    const deleted = await interaction.channel.bulkDelete(fetched, true);

    await interaction.reply({ content: `🧹 Purged **${deleted.size}** messages.`, ephemeral: true });
  }
});

if (!process.env.DISCORD_TOKEN) {
  console.warn('⚠️ No DISCORD_TOKEN found in .env. Please copy .env.example to .env and configure your bot credentials.');
} else {
  client.login(process.env.DISCORD_TOKEN);
}
