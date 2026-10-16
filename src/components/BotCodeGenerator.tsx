import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Terminal, 
  ExternalLink, 
  ShieldCheck, 
  Download, 
  Send, 
  Sparkles, 
  Radio, 
  HelpCircle, 
  Users, 
  Hash, 
  CheckCircle2, 
  Layers,
  HeartHandshake,
  MessageSquare,
  Settings,
  Palette,
  Trophy,
  Flame,
  Zap,
  Calendar,
  Award,
  AlertTriangle
} from 'lucide-react';
import { sendDiscordWebhook, createAnnouncementEmbed, createTrialCardEmbed } from '../utils/discordEmbed';
import { INITIAL_PLAYERS } from '../data/initialData';

interface BotCodeGeneratorProps {
  webhookUrl?: string;
  onSaveWebhookUrl?: (url: string) => void;
}

export const BotCodeGenerator: React.FC<BotCodeGeneratorProps> = ({
  webhookUrl = '',
  onSaveWebhookUrl,
}) => {
  const [integrationMode, setIntegrationMode] = useState<'welcome' | 'webhook' | 'bot' | 'structure' | 'fc27-api'>('bot');
  const [selectedFile, setSelectedFile] = useState<'welcome-bot' | 'bot' | 'moderation' | 'deploy' | 'pkg' | 'env' | 'readme'>('moderation');
  const [copied, setCopied] = useState(false);
  const [clientId, setClientId] = useState('');
  const [botInviteUrl, setBotInviteUrl] = useState('');

  // FC27 Stats Bot Mode State
  const [fc27BotCodeTab, setFc27BotCodeTab] = useState<'service' | 'slash' | 'curl' | 'env'>('service');
  const [fc27EndpointTest, setFc27EndpointTest] = useState<string>('/api/fc27/club/stats');
  const [fc27TestOutput, setFc27TestOutput] = useState<string>('Click "Send Live Request" below to inspect live response from FC27 Stats API...');
  const [isTestingFc27, setIsTestingFc27] = useState(false);
  const [copiedFc27Snippet, setCopiedFc27Snippet] = useState(false);

  // Welcome Customizer State
  const [welcomeChannelName, setWelcomeChannelName] = useState('welcome-lobby');
  const [welcomeTemplate, setWelcomeTemplate] = useState('👋 Welcome {user} to **{server}**! You are recruit **#{memberCount}**.');
  const [welcomeEmbedTitle, setWelcomeEmbedTitle] = useState('🩸 WELCOME TO {server} // PRO CLUBS MULTIVERSE');
  const [welcomeEmbedDesc, setWelcomeEmbedDesc] = useState('Welcome recruit! Submit your build card in **#trial-submission** to earn your contract.');
  const [welcomeColor, setWelcomeColor] = useState('#E11D48');
  const [sendDM, setSendDM] = useState(false);
  const [welcomeStatus, setWelcomeStatus] = useState<string | null>(null);

  // Webhook quick tester state
  const [inputWebhook, setInputWebhook] = useState(webhookUrl);
  const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSending, setIsSending] = useState(false);

  const calculateInviteUrl = (id: string) => {
    setClientId(id);
    if (id.trim()) {
      // Permissions integer: 1101927935014
      // Explicitly includes:
      // - Kick Members (0x2)
      // - Ban Members (0x4)
      // - Moderate / Timeout Members (0x10000000000 / 1099511627776)
      // - Manage Messages (0x2000)
      // - Manage Roles (0x10000000)
      // - View Channel (0x400)
      // - Send Messages (0x800)
      // - Embed Links (0x4000)
      // - Attach Files (0x8000)
      // - Read Message History (0x10000)
      // - Use Slash Commands (0x80000000)
      const permissions = '1101927935014';
      setBotInviteUrl(
        `https://discord.com/api/oauth2/authorize?client_id=${id.trim()}&permissions=${permissions}&scope=bot%20applications.commands`
      );
    } else {
      setBotInviteUrl('');
    }
  };

  const handleSaveWebhook = () => {
    if (onSaveWebhookUrl) {
      onSaveWebhookUrl(inputWebhook.trim());
      setTestStatus({ type: 'success', message: 'Webhook URL saved into your browser storage!' });
      setTimeout(() => setTestStatus(null), 3000);
    }
  };

  const handleTestPing = async () => {
    const target = inputWebhook.trim();
    if (!target) {
      setTestStatus({ type: 'error', message: 'Please enter a webhook URL first.' });
      return;
    }

    setIsSending(true);
    setTestStatus(null);

    const res = await sendDiscordWebhook(target, {
      username: 'Academia Bot #0027',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
      content: 'Pong! 🏓 (Command test: `!ping` & Webhook pipeline verified).',
    });

    setIsSending(false);
    if (res.success) {
      setTestStatus({ type: 'success', message: 'Delivered! Look at your Discord channel to confirm the message.' });
      if (onSaveWebhookUrl) onSaveWebhookUrl(target);
    } else {
      setTestStatus({ type: 'error', message: res.message });
    }
  };

  const handleDispatchWelcomeTest = async () => {
    const target = inputWebhook.trim();
    if (!target) {
      setWelcomeStatus('Please configure your Discord Webhook URL in Method 1 to test live dispatch.');
      return;
    }

    setIsSending(true);
    const mockRecruit = 'Valiant_Anchor';
    const serverName = 'LA ACADEMIA // FC27';
    const memberCount = '42';

    const formattedContent = welcomeTemplate
      .replace(/{user}/g, `@${mockRecruit}`)
      .replace(/{username}/g, mockRecruit)
      .replace(/{server}/g, serverName)
      .replace(/{memberCount}/g, memberCount);

    const formattedTitle = welcomeEmbedTitle
      .replace(/{server}/g, serverName)
      .replace(/{username}/g, mockRecruit);

    const formattedDesc = welcomeEmbedDesc
      .replace(/{server}/g, serverName)
      .replace(/{username}/g, mockRecruit);

    const hexInt = parseInt(welcomeColor.replace('#', ''), 16) || 0xE11D48;

    const payload = {
      username: 'Academia Welcome Bot',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=welcome-bot',
      content: formattedContent,
      embeds: [
        {
          title: formattedTitle,
          description: formattedDesc,
          color: hexInt,
          thumbnail: { url: `https://api.dicebear.com/7.x/identicon/svg?seed=${mockRecruit}` },
          fields: [
            { name: '🎯 Step 1: Trial Card', value: 'Submit your build in **#trial-submission**.', inline: true },
            { name: '🎙️ Step 2: Voice Comms', value: 'Active mic mandatory for competitive fixtures.', inline: true },
          ],
          footer: { text: `Recruit #${memberCount} • Automated Welcome Message` },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const res = await sendDiscordWebhook(target, payload);
    setIsSending(false);
    if (res.success) {
      setWelcomeStatus('Delivered custom welcome embed to your Discord channel successfully!');
    } else {
      setWelcomeStatus(`Error: ${res.message}`);
    }
  };

  // Welcome bot code
  const welcomeBotCode = `/**
 * CUSTOMIZABLE DISCORD WELCOME BOT (Discord.js v14)
 * Automatically greets new members upon arrival (guildMemberAdd)
 * Features dynamic placeholders, channel configuration, and /setwelcome command.
 */

import { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  PermissionFlagsBits
} from 'discord.js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const CONFIG_FILE = './welcome-config.json';

// Default configuration with custom template placeholders
const defaultConfig = {
  welcomeChannelId: '', // Leave empty to use guild's systemChannel or first text channel
  welcomeMessage: '${welcomeTemplate.replace(/'/g, "\\'")}',
  embedEnabled: true,
  embedTitle: '${welcomeEmbedTitle.replace(/'/g, "\\'")}',
  embedDescription: '${welcomeEmbedDesc.replace(/'/g, "\\'")}',
  embedColor: '${welcomeColor}',
  sendDM: ${sendDM},
  dmMessage: 'Hey {username}! Welcome to **{server}**. Head to the server and submit your trial card!',
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return { ...defaultConfig, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) };
    }
  } catch (err) {
    console.error('Error reading welcome config:', err);
  }
  return defaultConfig;
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

let config = loadConfig();

// Initialize Client with GUILD_MEMBERS intent (CRITICAL)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // REQUIRED: Must enable "Server Members Intent" in Developer Portal!
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // REQUIRED for !ping and !setwelcome prefix commands
  ],
});

// Helper: Replace dynamic tags
function formatText(template, member) {
  if (!template) return '';
  return template
    .replace(/{user}/g, \`<@\${member.id}>\`)
    .replace(/{username}/g, member.user.username)
    .replace(/{server}/g, member.guild.name)
    .replace(/{memberCount}/g, member.guild.memberCount.toString());
}

client.once('ready', () => {
  console.log(\`✅ Welcome Bot online as \${client.user.tag}!\`);
  console.log('Listening for new member arrivals (guildMemberAdd)...');
});

// ==========================================
// 1. EVENT: guildMemberAdd (New Member Joins)
// ==========================================
client.on('guildMemberAdd', async (member) => {
  console.log(\`[JOIN] \${member.user.tag} joined \${member.guild.name}\`);

  // Resolve target welcome channel
  const channel = config.welcomeChannelId 
    ? member.guild.channels.cache.get(config.welcomeChannelId)
    : member.guild.systemChannel || member.guild.channels.cache.find(c => c.name.includes('welcome') || c.name.includes('general'));

  if (!channel) {
    console.warn(\`No welcome channel found in \${member.guild.name}\`);
    return;
  }

  // Format customizable text
  const content = formatText(config.welcomeMessage, member);
  const payload = { content };

  if (config.embedEnabled) {
    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(formatText(config.embedTitle, member))
      .setDescription(formatText(config.embedDescription, member))
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🎯 Step 1: Trial Card', value: 'Submit your build in **#trial-submission**.', inline: true },
        { name: '🎙️ Step 2: Voice Comms', value: 'Active mic mandatory for competitive matchday fixtures.', inline: true }
      )
      .setFooter({ text: \`Recruit #\${member.guild.memberCount} • Automated Welcome System\` })
      .setTimestamp();

    payload.embeds = [embed];
  }

  // Send to public channel
  try {
    await channel.send(payload);
  } catch (err) {
    console.error('Failed to send welcome message to channel:', err);
  }

  // Optional: Send Direct Message (DM) to new member
  if (config.sendDM) {
    try {
      await member.send({ content: formatText(config.dmMessage, member) });
    } catch {
      console.log(\`Could not DM \${member.user.tag} (DMs closed)\`);
    }
  }
});

// ==========================================
// 2. COMMAND HANDLERS (!ping and !setwelcome)
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Basic Command Handler: responds with 'Pong!'
  if (message.content.toLowerCase() === '!ping') {
    return message.reply('Pong! 🏓');
  }

  // Prefix Command: Customize welcome message on the fly
  if (message.content.startsWith('!setwelcome')) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('❌ You must have **Manage Server** permission to customize welcome settings.');
    }

    const newTemplate = message.content.slice('!setwelcome'.length).trim();
    if (!newTemplate) {
      return message.reply('Usage: \`!setwelcome 👋 Welcome {user} to {server}! You are recruit #{memberCount}.\`');
    }

    config.welcomeMessage = newTemplate;
    config.welcomeChannelId = message.channel.id;
    saveConfig(config);

    return message.reply(\`✅ Welcome message updated for channel <#\${message.channel.id}>!\\nTemplate: \`\${config.welcomeMessage}\`\`);
  }
});

// ==========================================
// 3. SLASH COMMAND HANDLER (/setwelcome, /ping)
// ==========================================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'ping') {
    return interaction.reply({ content: 'Pong! 🏓', ephemeral: true });
  }

  if (commandName === 'setwelcome') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: '❌ You need Manage Server permissions.', ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel');
    const msg = interaction.options.getString('message');
    const color = interaction.options.getString('color');

    if (channel) config.welcomeChannelId = channel.id;
    if (msg) config.welcomeMessage = msg;
    if (color) config.embedColor = color;
    saveConfig(config);

    return interaction.reply({
      content: \`✅ Welcome settings updated! Target channel: <#\${config.welcomeChannelId || interaction.channelId}>\`,
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
`;

  // Multiverse bot code
  const botCode = `/**
 * LA ACADEMIA // FC27 Pro Clubs Multiverse Discord Bot
 * Production Bot built with Discord.js v14
 * Handles: !ping, availability, attendance, lineups, role assistance & admin management.
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
    GatewayIntentBits.MessageContent, // Required for !ping and prefix commands
    GatewayIntentBits.GuildMembers,   // Required for role management and attendance
  ],
  partials: [Partials.Channel, Partials.Message],
});

const CRIMSON_COLOR = 0xE11D48;
const GOLD_COLOR = 0xF59E0B;
const EMERALD_COLOR = 0x10B981;

// In-memory availability & attendance tracking
const availabilityMap = new Map();
const sessionAttendance = new Set();

client.once('ready', () => {
  console.log(\`✅ Academia Bot is online as \${client.user?.tag}!\`);
  client.user?.setActivity('FC27 Trials & Matchdays', { type: 3 });
});

// ==========================================
// 1. PREFIX COMMAND HANDLER (!ping, !role, etc.)
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const content = message.content.trim();
  const lower = content.toLowerCase();

  // Basic Command Handler: responds with 'Pong!' on !ping
  if (lower === '!ping') {
    return message.reply('Pong! 🏓 (Command Handler: Operational)');
  }

  // Availability commands: !avail in, !avail late, !avail out
  if (lower === '!avail in') {
    availabilityMap.set(message.author.id, { user: message.author.username, status: 'in' });
    return message.reply('🟢 **AVAILABILITY CONFIRMED:** You are marked **IN** for tonight\\'s matchday!');
  }
  if (lower.startsWith('!avail late')) {
    const note = content.slice(11).trim() || '15m late';
    availabilityMap.set(message.author.id, { user: message.author.username, status: 'late', note });
    return message.reply(\`🟡 **LATE NOTICE FILED:** Marked as arriving late (\${note}).\`);
  }
  if (lower === '!avail out') {
    availabilityMap.set(message.author.id, { user: message.author.username, status: 'out' });
    return message.reply('🔴 **UNAVAILABLE RECORDED:** Marked as **OUT** for tonight.');
  }

  // Attendance checkin
  if (lower === '!checkin') {
    sessionAttendance.add(message.author.id);
    return message.reply(\`✅ **ATTENDANCE LOGGED:** \${message.author.username} checked in present for voice comms!\`);
  }

  // Lineup quick display
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

  // Self-Assign Role: !role join <role> / !role leave <role>
  if (lower.startsWith('!role join')) {
    const roleName = content.slice(10).trim();
    const role = message.guild.roles.cache.find(r => r.name.toLowerCase().includes(roleName.toLowerCase()));
    if (!role) return message.reply(\`❌ Role "\${roleName}" not found.\`);

    try {
      await message.member.roles.add(role);
      return message.reply(\`✅ Assigned role **\${role.name}** to your profile!\`);
    } catch (err) {
      return message.reply('❌ Could not add role. Ensure bot has **Manage Roles** permission.');
    }
  }

  if (lower.startsWith('!role leave')) {
    const roleName = content.slice(11).trim();
    const role = message.guild.roles.cache.find(r => r.name.toLowerCase().includes(roleName.toLowerCase()));
    if (!role) return message.reply(\`❌ Role "\${roleName}" not found.\`);

    try {
      await message.member.roles.remove(role);
      return message.reply(\`✅ Removed role **\${role.name}** from your profile.\`);
    } catch (err) {
      return message.reply('❌ Could not remove role.');
    }
  }

  // Admin Role Management: !role add @user <role> / !role remove @user <role>
  if (lower.startsWith('!role add')) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return message.reply('❌ You need **Manage Roles** permission to assign roles to others.');
    }
    const target = message.mentions.members.first();
    if (!target) return message.reply('Syntax: \`!role add @User RoleName\`');
    const roleQuery = content.split(' ').slice(3).join(' ');
    const role = message.guild.roles.cache.find(r => r.name.toLowerCase().includes(roleQuery.toLowerCase()));
    if (!role) return message.reply(\`❌ Role "\${roleQuery}" not found.\`);

    await target.roles.add(role);
    return message.reply(\`🛡️ [ADMIN ACTION] Granted **\${role.name}** to \${target.user.username}.\`);
  }

  if (lower.startsWith('!role remove')) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return message.reply('❌ You need **Manage Roles** permission.');
    }
    const target = message.mentions.members.first();
    if (!target) return message.reply('Syntax: \`!role remove @User RoleName\`');
    const roleQuery = content.split(' ').slice(3).join(' ');
    const role = message.guild.roles.cache.find(r => r.name.toLowerCase().includes(roleQuery.toLowerCase()));
    if (!role) return message.reply(\`❌ Role "\${roleQuery}" not found.\`);

    await target.roles.remove(role);
    return message.reply(\`🛡️ [ADMIN ACTION] Revoked **\${role.name}** from \${target.user.username}.\`);
  }

  if (lower === '!roles') {
    return message.reply('📋 Available Self-Assignable Roles: \`Center Back (CB)\`, \`Defensive Mid (CDM)\`, \`Attacking Mid (CAM)\`, \`Striker (ST)\`, \`Matchday Pings\`, \`Scrim Alerts\`, \`FC27 Pro Clubs\`. Use \`!role join <name>\` to self-assign!');
  }

  // ==========================================
  // MODERATION COMMANDS: !kick, !ban, !mute, !unmute, !clear
  // ==========================================
  // !kick @user [reason]
  if (lower.startsWith('!kick')) {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply('❌ You do not have permission to kick members (Requires **Kick Members**).');
    }
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply('❌ The bot lacks **Kick Members** permission. Please grant the bot **Kick Members** in Server Settings.');
    }
    const target = message.mentions.members.first();
    if (!target) {
      return message.reply('⚠️ **Usage:** \`!kick @user [reason]\`\\nExample: \`!kick @Viper_Striker99 Inactivity during matchday\`');
    }
    if (target.id === message.author.id) {
      return message.reply('❌ You cannot kick yourself.');
    }
    if (target.id === client.user.id) {
      return message.reply('❌ The bot cannot kick itself.');
    }
    if (!target.kickable) {
      return message.reply('❌ Cannot kick this user. Their role hierarchy is higher or equal to the bot.');
    }
    const reason = content.split(' ').slice(2).join(' ') || 'Disciplinary violation & squad conduct';
    try {
      await target.kick(reason);
      const kickEmbed = new EmbedBuilder()
        .setColor(CRIMSON_COLOR)
        .setTitle('🛡️ MEMBER KICKED FROM SERVER')
        .setDescription(\`**\${target.user.tag}** was removed by staff moderation.\`)
        .addFields(
          { name: 'Target User', value: \`<@\${target.id}> (\${target.user.tag})\`, inline: true },
          { name: 'Moderator', value: \`\${message.author}\`, inline: true },
          { name: 'Action', value: '👢 Guild Kick (Can rejoin via valid invite)', inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'La Academia Staff Moderation Log • Confirmation Verified' })
        .setTimestamp();

      return message.channel.send({ embeds: [kickEmbed] });
    } catch (err) {
      return message.reply(\`❌ Failed to kick user: \${err.message}\`);
    }
  }

  // !ban @user [reason]
  if (lower.startsWith('!ban')) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('❌ You do not have permission to ban members (Requires **Ban Members**).');
    }
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('❌ The bot lacks **Ban Members** permission. Please grant the bot **Ban Members** in Server Settings.');
    }
    const target = message.mentions.members.first();
    if (!target) {
      return message.reply('⚠️ **Usage:** \`!ban @user [reason]\`\\nExample: \`!ban @ToxicTroll Severe match fixing\`');
    }
    if (target.id === message.author.id) {
      return message.reply('❌ You cannot ban yourself.');
    }
    if (target.id === client.user.id) {
      return message.reply('❌ The bot cannot ban itself.');
    }
    if (!target.bannable) {
      return message.reply('❌ Cannot ban this user. Their role hierarchy is higher or equal to the bot.');
    }
    const reason = content.split(' ').slice(2).join(' ') || 'Severe violation of community rules';
    try {
      await target.ban({ reason, deleteMessageSeconds: 604800 });
      const banEmbed = new EmbedBuilder()
        .setColor(0x991B1B)
        .setTitle('🔨 MEMBER PERMANENTLY BANNED')
        .setDescription(\`**\${target.user.tag}** was permanently banned by staff moderation.\`)
        .addFields(
          { name: 'Target User', value: \`<@\${target.id}> (\${target.user.tag})\`, inline: true },
          { name: 'Moderator', value: \`\${message.author}\`, inline: true },
          { name: 'Action', value: '🔨 Permanent Guild Ban & 7-Day Message Cleanup', inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'La Academia Server Blacklist • Confirmation Verified' })
        .setTimestamp();

      return message.channel.send({ embeds: [banEmbed] });
    } catch (err) {
      return message.reply(\`❌ Failed to ban user: \${err.message}\`);
    }
  }

  // !mute @user [duration] [reason]
  if (lower.startsWith('!mute') || lower.startsWith('!timeout')) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ You need **Timeout Members** permission to mute.');
    }
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ The bot lacks **Timeout Members** permission.');
    }
    const target = message.mentions.members.first();
    if (!target) {
      return message.reply('⚠️ **Usage:** \`!mute @user [duration] [reason]\`\\nExample: \`!mute @Viper_Striker99 10m Voice spam\`\\nDurations: \`60s\`, \`5m\`, \`10m\`, \`1h\`, \`1d\`, \`7d\` (default: \`10m\`)');
    }
    if (!target.moderatable) {
      return message.reply('❌ Cannot mute this user due to role hierarchy.');
    }
    const rawArgs = content.split(' ').slice(2);
    let durationMs = 10 * 60 * 1000;
    let durationLabel = '10 Minutes';
    let reasonIndex = 0;
    if (rawArgs[0] && /^(\\d+)(s|m|h|d|w)$/i.test(rawArgs[0])) {
      const match = rawArgs[0].match(/^(\\d+)(s|m|h|d|w)$/i);
      const val = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      if (unit === 's') { durationMs = val * 1000; durationLabel = \`\${val} Second(s)\`; }
      else if (unit === 'm') { durationMs = val * 60 * 1000; durationLabel = \`\${val} Minute(s)\`; }
      else if (unit === 'h') { durationMs = val * 60 * 60 * 1000; durationLabel = \`\${val} Hour(s)\`; }
      else if (unit === 'd') { durationMs = val * 24 * 60 * 60 * 1000; durationLabel = \`\${val} Day(s)\`; }
      else if (unit === 'w') { durationMs = val * 7 * 24 * 60 * 60 * 1000; durationLabel = \`\${val} Week(s)\`; }
      reasonIndex = 1;
    }
    const reason = rawArgs.slice(reasonIndex).join(' ') || 'Matchday comms disruption & team discipline';
    try {
      await target.timeout(durationMs, reason);
      const muteEmbed = new EmbedBuilder()
        .setColor(0xF59E0B)
        .setTitle('🔇 MEMBER TIMED OUT / MUTED')
        .setDescription(\`**\${target.user.tag}** was placed in timeout by staff moderation.\`)
        .addFields(
          { name: 'Target User', value: \`<@\${target.id}> (\${target.user.tag})\`, inline: true },
          { name: 'Duration', value: durationLabel, inline: true },
          { name: 'Moderator', value: \`\${message.author}\`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'La Academia Staff Moderation Log • Communication Restricted' })
        .setTimestamp();

      return message.channel.send({ embeds: [muteEmbed] });
    } catch (err) {
      return message.reply(\`❌ Failed to timeout user: \${err.message}\`);
    }
  }

  // !unmute @user [reason]
  if (lower.startsWith('!unmute')) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ You need **Timeout Members** permission to unmute.');
    }
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ The bot lacks **Timeout Members** permission.');
    }
    const target = message.mentions.members.first();
    if (!target) {
      return message.reply('⚠️ **Usage:** \`!unmute @user [reason]\`\\nExample: \`!unmute @Viper_Striker99 Timeout served\`');
    }
    if (!target.moderatable) {
      return message.reply('❌ Cannot unmute this user due to role hierarchy.');
    }
    const reason = content.split(' ').slice(2).join(' ') || 'Timeout lifted by staff moderation';
    try {
      await target.timeout(null, reason);
      const unmuteEmbed = new EmbedBuilder()
        .setColor(0x10B981)
        .setTitle('🔊 MEMBER TIMEOUT REMOVED / UNMUTED')
        .setDescription(\`**\${target.user.tag}** has had their timeout lifted.\`)
        .addFields(
          { name: 'Target User', value: \`<@\${target.id}> (\${target.user.tag})\`, inline: true },
          { name: 'Moderator', value: \`\${message.author}\`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'La Academia Staff Moderation Log • Permissions Restored' })
        .setTimestamp();

      return message.channel.send({ embeds: [unmuteEmbed] });
    } catch (err) {
      return message.reply(\`❌ Failed to unmute user: \${err.message}\`);
    }
  }

  // !clear <number> / !purge <number>
  if (lower.startsWith('!clear') || lower.startsWith('!purge')) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('❌ You need **Manage Messages** permission to clear messages.');
    }
    const args = content.split(' ');
    const amount = parseInt(args[1], 10);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply('⚠️ **Usage:** \`!clear <number>\` (1-100, e.g. \`!clear 5\`)');
    }
    try {
      // Bulk delete limit
      const fetched = await message.channel.messages.fetch({ limit: Math.min(amount + 1, 100) });
      const deleted = await message.channel.bulkDelete(fetched, true);
      const purgedCount = Math.max(0, deleted.size - 1);
      const confirmMsg = await message.channel.send(\`🧹 Successfully deleted **\${purgedCount}** messages.\`);
      setTimeout(() => confirmMsg.delete().catch(() => {}), 4000);
      return;
    } catch (err) {
      return message.reply(\`❌ Error clearing messages: \${err.message}. (Note: Discord cannot bulk delete messages older than 14 days).\`);
    }
  }
});

// ==========================================
// 2. SLASH COMMAND ROUTER & INTERACTION HANDLER
// ==========================================
client.on('interactionCreate', async (interaction) => {
  // Handle Slash Commands
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    if (commandName === 'ping') {
      await interaction.reply({ content: 'Pong! 🏓 (Gateway Latency: ' + client.ws.ping + 'ms)', ephemeral: true });
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
        .setDescription('Confirm your availability for tonight\\'s competitive fixture:')
        .addFields(
          { name: '🟢 Available', value: 'Click In button to RSVP', inline: true },
          { name: '🟡 Late', value: 'Click Late button to notify', inline: true },
          { name: '🔴 Out', value: 'Click Out if unavailable', inline: true }
        );

      await interaction.reply({ embeds: [embed], components: [row] });
    }

    // Attendance Call
    else if (commandName === 'attendance') {
      const sub = interaction.options.getSubcommand();
      if (sub === 'call') {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('checkin_btn').setLabel('✅ Check In Present').setStyle(ButtonStyle.Primary)
        );
        const embed = new EmbedBuilder()
          .setColor(CRIMSON_COLOR)
          .setTitle('🎙️ VOICE ATTENDANCE ROLL CALL')
          .setDescription('Starters and bench reserves must check in now for voice comms lobby.');

        await interaction.reply({ embeds: [embed], components: [row] });
      } else if (sub === 'summary') {
        await interaction.reply({ content: \`📊 Active Session Attendance: \${sessionAttendance.size} players checked in.\` });
      }
    }

    // Lineup
    else if (commandName === 'lineup') {
      const formation = interaction.options.getString('formation') || '4-3-3';
      const embed = new EmbedBuilder()
        .setColor(GOLD_COLOR)
        .setTitle(\`📋 OFFICIAL STARTING LINEUP // \${formation.toUpperCase()}\`)
        .setDescription('Tactical deployment for tonight\\'s competitive matchday fixture:')
        .addFields(
          { name: '🧤 Goalkeeper (GK)', value: '• Bastion_Wall (90 OVR)' },
          { name: '🛡️ Backline', value: '• LB: Aero_Wing • CB: Vortex_Anchor [C] • CB: Iron_Colossus_27 • RB: Blitz_Pace' },
          { name: '⚡ Midfield', value: '• CDM: Kinetix_Press • CM: ShadowPress_99 • CAM: Silva_Maestro' },
          { name: '🎯 Attack', value: '• LW: Shadow_Drift • ST: Grimm_Apex • RW: Solar_Volt' }
        );

      await interaction.reply({ embeds: [embed] });
    }

    // Role Assist
    else if (commandName === 'role') {
      const sub = interaction.options.getSubcommand();
      if (sub === 'assist') {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('apply_rec_roles').setLabel('✨ Apply Recommended Roles').setStyle(ButtonStyle.Success)
        );
        const embed = new EmbedBuilder()
          .setColor(0x8B5CF6)
          .setTitle('🤖 ROLE ASSIGNMENT ASSISTANT // RECRUIT WIZARD')
          .setDescription('Recommended roles based on tactical squad requirements:')
          .addFields(
            { name: '1. Position Role', value: '\`Center Back (CB)\` or \`Defensive Mid (CDM)\`' },
            { name: '2. Notification Role', value: '\`Matchday Pings\` (Tournament notifications)' },
            { name: '3. Community Role', value: '\`FC27 Pro Clubs\` & \`Crossplay Star\`' }
          );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      } else if (sub === 'audit') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
          return interaction.reply({ content: '❌ You need **Manage Roles** permission.', ephemeral: true });
        }
        await interaction.reply({ content: '🔍 **Role Audit:** Checked guild members. Run \`!roles\` or inspect member list for unassigned recruits.' });
      }
    }

    // Moderation Slash Commands: /kick, /ban, /clear
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
        .setDescription(\`**\${targetUser.tag}** was kicked by staff moderation.\`)
        .addFields(
          { name: 'Target User', value: \`<@\${targetUser.id}>\`, inline: true },
          { name: 'Moderator', value: \`<@\${interaction.user.id}>\`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        );
      await interaction.reply({ embeds: [embed] });
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
      await targetMember.ban({ reason });
      const embed = new EmbedBuilder()
        .setColor(0x991B1B)
        .setTitle('🔨 MEMBER PERMANENTLY BANNED')
        .setDescription(\`**\${targetUser.tag}** was blacklisted by staff moderation.\`)
        .addFields(
          { name: 'Target User', value: \`<@\${targetUser.id}>\`, inline: true },
          { name: 'Moderator', value: \`<@\${interaction.user.id}>\`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        );
      await interaction.reply({ embeds: [embed] });
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
        .setColor(0xF59E0B)
        .setTitle('🔇 MEMBER TIMED OUT / MUTED')
        .setDescription(\`**\${targetUser.tag}** was placed on communication timeout.\`)
        .addFields(
          { name: 'Target User', value: \`<@\${targetUser.id}>\`, inline: true },
          { name: 'Duration', value: \`⏱️ **\${durationStr}**\`, inline: true },
          { name: 'Moderator', value: \`<@\${interaction.user.id}>\`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'La Academia Staff Moderation Log' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
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
        .setColor(0x10B981)
        .setTitle('🔊 MEMBER TIMEOUT REMOVED / UNMUTED')
        .setDescription(\`**\${targetUser.tag}** has had their timeout removed.\`)
        .addFields(
          { name: 'Target User', value: \`<@\${targetUser.id}>\`, inline: true },
          { name: 'Moderator', value: \`<@\${interaction.user.id}>\`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'La Academia Staff Moderation Log' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
    else if (commandName === 'clear') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: '❌ You need **Manage Messages** permission.', ephemeral: true });
      }
      const amount = interaction.options.getInteger('amount') || 5;
      const deleted = await interaction.channel.bulkDelete(amount, true);
      await interaction.reply({ content: \`🧹 Successfully deleted **\${deleted.size}** messages.\`, ephemeral: true });
    }

    // FC27 Pro Clubs Stats Commands
    else if (commandName === 'stats') {
      const gamertag = interaction.options.getString('gamertag') || 'Vortex_Anchor';
      const embed = new EmbedBuilder()
        .setColor(0x10B981)
        .setTitle(\`📊 FC27 PLAYER STATS // \${gamertag.toUpperCase()}\`)
        .setDescription('Verified career telemetry from EA Sports FC27 Pro Clubs API:')
        .addFields(
          { name: 'OVR Rating', value: '⭐ 92 OVR', inline: true },
          { name: 'Position', value: '🛡️ Center Back (CB)', inline: true },
          { name: 'Matches', value: '148 Caps', inline: true },
          { name: 'Average Rating (AMR)', value: '9.2 / 10.0', inline: true },
          { name: 'Tackles Won', value: '382 (86.4%)', inline: true },
          { name: 'Clean Sheets', value: '68', inline: true },
          { name: 'PlayStyles', value: '\`Aerial+\` \`Anticipate+\` \`Bruiser\`', inline: false }
        )
        .setFooter({ text: 'Source: /api/fc27/player/stats' });
      await interaction.reply({ embeds: [embed] });
    }
    else if (commandName === 'club') {
      const embed = new EmbedBuilder()
        .setColor(0xE11D48)
        .setTitle('🏆 LA ACADEMIA // OFFICIAL FC27 PRO CLUBS RECORD')
        .setDescription('Division 1 Championship standing & team telemetry:')
        .addFields(
          { name: 'Division', value: 'Division 1 (Elite)', inline: true },
          { name: 'Skill Rating', value: '2,480 SR', inline: true },
          { name: 'Record', value: '142W - 18D - 24L (77.2% WR)', inline: true },
          { name: 'Goal Diff', value: '+344 (512 GF / 168 GA)', inline: true },
          { name: 'Clean Sheets', value: '76 Clean Sheets', inline: true },
          { name: 'Current Streak', value: '🔥 4-Game Win Streak', inline: true }
        )
        .setFooter({ text: 'Source: /api/fc27/club/stats' });
      await interaction.reply({ embeds: [embed] });
    }
    else if (commandName === 'matches') {
      const embed = new EmbedBuilder()
        .setColor(0x3B82F6)
        .setTitle('📅 RECENT MATCH FIXTURES // LA ACADEMIA')
        .setDescription('Recent tournament and league match results:')
        .addFields(
          { name: '🟢 4 - 1 vs Viper Esports FC', value: 'AFH Premier • Star: Vortex_Anchor (9.6 AMR)' },
          { name: '🟢 3 - 0 vs Apex Syndicate', value: 'Major Tournament Cup • Star: Kinetix_Press (9.4 AMR)' },
          { name: '🟡 2 - 2 vs Titanium FC', value: 'AFH Premier • Star: Silva_Maestro (9.1 AMR)' }
        )
        .setFooter({ text: 'Source: /api/fc27/club/matches' });
      await interaction.reply({ embeds: [embed] });
    }
    else if (commandName === 'leaderboard') {
      const cat = interaction.options.getString('category') || 'amr';
      const embed = new EmbedBuilder()
        .setColor(0xF59E0B)
        .setTitle(\`🏆 SQUAD PERFORMANCE LEADERBOARD // \${cat.toUpperCase()}\`)
        .addFields(
          { name: '🥇 1. Vortex_Anchor (CB)', value: '⭐ 9.2 AMR • 382 Tackles • 68 Clean Sheets' },
          { name: '🥈 2. Kinetix_Press (CDM)', value: '⭐ 9.1 AMR • 412 Tackles • 31 Assists' },
          { name: '🥉 3. Silva_Maestro (CAM)', value: '⭐ 9.0 AMR • 46 Goals • 72 Assists' }
        )
        .setFooter({ text: 'Source: /api/fc27/leaderboard' });
      await interaction.reply({ embeds: [embed] });
    }
    else if (commandName === 'meta') {
      const embed = new EmbedBuilder()
        .setColor(0x8B5CF6)
        .setTitle('🧠 FC27 META ARCHETYPES // TITLE UPDATE 3.1')
        .addFields(
          { name: '🛡️ CB Keystone Anchor', value: "6'3\\" / 194 lbs • \`Aerial+\`, \`Anticipate+\`, \`Bruiser\`" },
          { name: '⚡ CDM Ball-Winning Pivot', value: "5'11\\" / 165 lbs • \`Intercept+\`, \`Relentless+\`, \`Pinged Pass+\`" },
          { name: '🎯 CAM Half-Space Tempo', value: "5'9\\" / 152 lbs • \`Incisive Pass+\`, \`Tiki Taka+\`, \`First Touch+\`" },
          { name: '🔥 ST Apex Finisher', value: "6'1\\" / 178 lbs • \`Finesse Shot+\`, \`Aerial+\`, \`Power Shot\`" }
        )
        .setFooter({ text: 'Source: /api/fc27/meta' });
      await interaction.reply({ embeds: [embed] });
    }
  }

  // Handle Interactive Buttons (Availability & Attendance)
  if (interaction.isButton()) {
    if (interaction.customId === 'avail_in') {
      availabilityMap.set(interaction.user.id, { user: interaction.user.username, status: 'in' });
      await interaction.reply({ content: '🟢 Confirmed **AVAILABLE** for matchday!', ephemeral: true });
    } else if (interaction.customId === 'avail_late') {
      availabilityMap.set(interaction.user.id, { user: interaction.user.username, status: 'late' });
      await interaction.reply({ content: '🟡 Marked as **LATE** for matchday.', ephemeral: true });
    } else if (interaction.customId === 'avail_out') {
      availabilityMap.set(interaction.user.id, { user: interaction.user.username, status: 'out' });
      await interaction.reply({ content: '🔴 Marked as **OUT** for tonight.', ephemeral: true });
    } else if (interaction.customId === 'checkin_btn') {
      sessionAttendance.add(interaction.user.id);
      await interaction.reply({ content: '✅ Checked in present for voice comms!', ephemeral: true });
    } else if (interaction.customId === 'apply_rec_roles') {
      await interaction.reply({ content: '✨ Recommended roles requested! Check your profile.', ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
`;

  const deployCode = `import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const commands = [
  // 1. Basic command handler test
  new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong! and latency'),

  // 2. Availability command
  new SlashCommandBuilder()
    .setName('availability')
    .setDescription('Manage matchday RSVP availability polls and statuses')
    .addStringOption(opt => 
      opt.setName('status')
        .setDescription('Your availability status')
        .addChoices(
          { name: '🟢 Available (In)', value: 'in' },
          { name: '🟡 Late (15m)', value: 'late' },
          { name: '🔴 Unavailable (Out)', value: 'out' }
        )
    ),

  // 3. Attendance command with subcommands
  new SlashCommandBuilder()
    .setName('attendance')
    .setDescription('Voice comms attendance tracking and session roll calls')
    .addSubcommand(sub => sub.setName('call').setDescription('Initiate voice lobby roll call'))
    .addSubcommand(sub => sub.setName('summary').setDescription('View session attendance records')),

  // 4. Lineups command
  new SlashCommandBuilder()
    .setName('lineup')
    .setDescription('Display official 11v11 matchday pitch formation')
    .addStringOption(opt => 
      opt.setName('formation')
        .setDescription('Formation style')
        .addChoices(
          { name: '4-3-3 Holding (Default)', value: '4-3-3' },
          { name: '4-2-3-1 Balanced', value: '4-2-3-1' },
          { name: '3-5-2 High Press', value: '3-5-2' }
        )
    ),

  // 5. Role assistance and management
  new SlashCommandBuilder()
    .setName('role')
    .setDescription('Role management and recruit onboarding assistance')
    .addSubcommand(sub => sub.setName('assist').setDescription('Get recommended roles based on your build'))
    .addSubcommand(sub => sub.setName('audit').setDescription('Staff audit for missing roles and compliance')),

  // 6. Recruitment trial submission
  new SlashCommandBuilder()
    .setName('trial')
    .setDescription('Submit or inspect an FC27 trial card'),

  // 7. Tactical directives
  new SlashCommandBuilder().setName('tactics').setDescription('View mandatory team tactical directives'),

  // 8. Moderation commands (!kick, !ban, !mute, !unmute, !clear)
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server with a logged reason')
    .addUserOption(opt => opt.setName('target').setDescription('The member to kick').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Disciplinary reason')),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Permanently ban a member from the server')
    .addUserOption(opt => opt.setName('target').setDescription('The member to ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Disciplinary reason')),

  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout / mute a member to prevent typing and talking')
    .addUserOption(opt => opt.setName('target').setDescription('The member to mute').setRequired(true))
    .addStringOption(opt =>
      opt.setName('duration')
        .setDescription('Duration of timeout (default: 10m)')
        .setRequired(false)
        .addChoices(
          { name: '60 Seconds (1m)', value: '60s' },
          { name: '5 Minutes', value: '5m' },
          { name: '10 Minutes', value: '10m' },
          { name: '1 Hour', value: '1h' },
          { name: '1 Day (24h)', value: '1d' },
          { name: '1 Week (7d)', value: '1w' }
        )
    )
    .addStringOption(opt => opt.setName('reason').setDescription('Disciplinary reason')),

  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove timeout / unmute a member immediately')
    .addUserOption(opt => opt.setName('target').setDescription('The member to unmute').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for lifting timeout')),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Bulk delete messages from the channel (1-100)')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages to delete').setRequired(true).setMinValue(1).setMaxValue(100)),

  // 9. FC27 Pro Clubs Stats Commands
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Lookup FC27 player career telemetry and PlayStyles')
    .addStringOption(opt => opt.setName('gamertag').setDescription('Gamertag or EA ID to query').setRequired(false)),

  new SlashCommandBuilder()
    .setName('club')
    .setDescription('Display official Division 1 club record, streak, and win rate'),

  new SlashCommandBuilder()
    .setName('matches')
    .setDescription('Display recent matchday fixtures and scorelines'),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Display squad performance leaderboard across competitive metrics')
    .addStringOption(opt =>
      opt.setName('category')
        .setDescription('Leaderboard metric')
        .addChoices(
          { name: 'Average Match Rating (AMR)', value: 'amr' },
          { name: 'Top Goals', value: 'goals' },
          { name: 'Top Assists', value: 'assists' },
          { name: 'Tackles Won', value: 'tackles' },
          { name: 'Clean Sheets', value: 'cleansheets' }
        )
    ),

  new SlashCommandBuilder()
    .setName('meta')
    .setDescription('Display Title Update 3.1 meta builds for CB, CDM, CAM, ST'),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function deploy() {
  try {
    console.log('🔄 Registering commands with Discord API...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ Commands successfully deployed!');
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
}

deploy();
`;

  const pkgCode = `{
  "name": "la-academia-discord-bot",
  "version": "1.0.0",
  "description": "Production Moderation & Community Discord Bot for La Academia FC27",
  "main": "multiverse-bot.js",
  "type": "module",
  "scripts": {
    "start": "node multiverse-bot.js",
    "mod": "node moderation-bot.js",
    "welcome": "node welcome-bot.js",
    "deploy": "node deploy-commands.js"
  },
  "dependencies": {
    "discord.js": "^14.16.3",
    "dotenv": "^16.4.5"
  }
}
`;

  const envCode = `DISCORD_TOKEN="YOUR_DISCORD_BOT_TOKEN_FROM_DEVELOPER_PORTAL"
CLIENT_ID="YOUR_APPLICATION_CLIENT_ID"
GUILD_ID="YOUR_DISCORD_SERVER_ID"
`;

  const readmeCode = `# 🩸 LA ACADEMIA // DISCORD BOT & MODERATION SUITE

### 🛡️ Core Moderation Engine
- 👢 **Kick Members (\`!kick @user [reason]\` / \`/kick\`):**
  - Removes a member from the server with a logged disciplinary reason.
  - Verifies moderator has **Kick Members** permission.
  - Verifies bot has **Kick Members** permission and role hierarchy precedence (\`target.kickable\`).
  - Sends immediate rich confirmation embed to the current channel and logs to \`#mod-logs\`.

- 🔨 **Ban Members (\`!ban @user [reason]\` / \`/ban\`):**
  - Permanently bans a member and purges 7 days of spam messages.
  - Verifies moderator has **Ban Members** permission.
  - Verifies bot has **Ban Members** permission and role hierarchy precedence (\`target.bannable\`).
  - Sends immediate rich confirmation embed to the channel and logs to \`#mod-logs\`.

- 🔇 **Mute / Timeout (\`!mute @user [duration] [reason]\` / \`/mute\`):**
  - Restricts member communication across all text and voice channels.
  - Supported durations: \`60s\`, \`5m\`, \`10m\`, \`1h\`, \`1d\`, \`7d\` (Default: \`10m\`).
  - Verifies moderator and bot both have **Timeout Members** (\`ModerateMembers\`) permission.
  - Sends rich confirmation embed with live timestamp expiration countdown.

- 🔊 **Unmute (\`!unmute @user [reason]\` / \`/unmute\`):**
  - Immediately lifts timeout and restores full text & voice chat permissions.
  - Sends confirmation embed to channel.

- 🧹 **Bulk Purge (\`!clear <1-100>\` / \`/clear\`):**
  - Cleans up spam messages from the channel with an auto-deleting confirmation.

### 📋 Additional Features
- 🏓 **Basic Command Handler:** Responds to \`!ping\` and \`/ping\` with \`Pong!\` and gateway latency.
- 🚪 **Automatic Welcome:** Greets new members when they join (\`guildMemberAdd\`).
- 🏷️ **Role Management:** Self-assign positional and alert roles (\`!role join\`, \`!roles\`).
- 📅 **Matchday RSVP & Attendance:** \`!avail in\`, \`!avail late\`, \`!checkin\`, \`/availability\`, \`/lineup\`.

---

### 1. Developer Portal Setup & Permissions (CRITICAL)
1. Go to **https://discord.com/developers/applications**
2. Select your Application $\\rightarrow$ **Bot** tab on the left.
3. Under **Privileged Gateway Intents**, enable:
   - ✅ **SERVER MEMBERS INTENT** (Mandatory for kicks, bans, and muting members!)
   - ✅ **MESSAGE CONTENT INTENT** (Mandatory for prefix commands like \`!kick\`, \`!ban\`, \`!mute\`, \`!ping\`)
4. Under **OAuth2 $\\rightarrow$ URL Generator**, select scopes \`bot\` and \`applications.commands\` with permissions:
   - ✅ **Kick Members** (0x2)
   - ✅ **Ban Members** (0x4)
   - ✅ **Moderate Members / Timeout** (1 << 40 / 1099511627776)
   - ✅ **Manage Messages** (0x2000)
   - ✅ **Manage Roles** (0x10000000)
   - ✅ **Send Messages & Embed Links**
   *(Pre-computed Permissions Integer: \`1101927935014\`)*

---

### 2. Quick Start
\`\`\`bash
# 1. Install dependencies
npm install

# 2. Register slash commands (/kick, /ban, /mute, /unmute, /clear, /ping)
node deploy-commands.js

# 3. Start the Moderation Bot
node moderation-bot.js
# Or start the Full Multiverse Bot
node multiverse-bot.js
\`\`\`
`;

  const moderationBotCode = `/**
 * LA ACADEMIA // STANDALONE MODERATION BOT (Discord.js v14)
 * Production-ready Moderation Engine: Kick, Ban, Mute (Timeout), Unmute, Clear, and Ping
 *
 * Required Gateway Intents:
 * - GatewayIntentBits.Guilds
 * - GatewayIntentBits.GuildMessages
 * - GatewayIntentBits.MessageContent (Required for prefix commands: !kick, !ban, !mute, !clear)
 * - GatewayIntentBits.GuildMembers (Required for member fetching, hierarchy checks & timeouts)
 *
 * Required Bot Permissions:
 * - Kick Members (0x2)
 * - Ban Members (0x4)
 * - Moderate Members / Timeout (1 << 40)
 * - Manage Messages (0x2000)
 * - Send Messages (0x800)
 * - Embed Links (0x4000)
 * - Read Message History (0x10000)
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
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel, Partials.Message],
});

const CRIMSON_COLOR = 0xE11D48;
const GOLD_COLOR = 0xF59E0B;
const EMERALD_COLOR = 0x10B981;
const DARK_RED_COLOR = 0x991B1B;

// Helper: Dispatch audit record to #mod-logs if present
async function logToModChannel(guild, embed) {
  try {
    const modChannel = guild.channels.cache.find(
      c => c.name === 'mod-logs' || c.name === 'moderation-logs' || c.name === 'staff-logs'
    );
    if (modChannel && modChannel.isTextBased()) {
      await modChannel.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error('Audit log dispatch notice:', err.message);
  }
}

client.once('ready', () => {
  console.log(\`🛡️ Academia Moderation Bot is ONLINE as \${client.user?.tag}!\`);
  console.log('✅ Listening for commands: !kick, !ban, !mute, !unmute, !clear, !ping');
  client.user?.setActivity('Staff Moderation & Discipline', { type: 3 });
});

// ==========================================
// 1. PREFIX COMMANDS (!kick, !ban, !mute, !unmute, !clear, !ping)
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  const content = message.content.trim();
  const lower = content.toLowerCase();

  // Basic Command Handler: !ping
  if (lower === '!ping') {
    return message.reply(\`🏓 Pong! (Gateway Latency: \${client.ws.ping}ms • Moderation Handler: Operational)\`);
  }

  // Help command: !modhelp
  if (lower === '!modhelp' || lower === '!mod') {
    const helpEmbed = new EmbedBuilder()
      .setColor(CRIMSON_COLOR)
      .setTitle('🛡️ LA ACADEMIA // MODERATION COMMAND REFERENCE')
      .setDescription('Available staff moderation commands with full channel confirmations:')
      .addFields(
        { name: '👢 Kick Member', value: '\`!kick @user [reason]\`\\nRemoves member from server. Requires **Kick Members**.', inline: false },
        { name: '🔨 Ban Member', value: '\`!ban @user [reason]\`\\nPermanently bans member and cleans up 7 days of messages. Requires **Ban Members**.', inline: false },
        { name: '🔇 Mute / Timeout', value: '\`!mute @user [duration] [reason]\`\\nRestricts messaging, reactions, and voice chat. Durations: \`60s\`, \`5m\`, \`10m\`, \`1h\`, \`1d\`, \`7d\` (default 10m). Requires **Timeout Members**.', inline: false },
        { name: '🔊 Unmute Member', value: '\`!unmute @user [reason]\`\\nLifts timeout immediately. Requires **Timeout Members**.', inline: false },
        { name: '🧹 Clear / Purge Messages', value: '\`!clear <1-100>\`\\nBulk deletes recent channel messages. Requires **Manage Messages**.', inline: false }
      )
      .setFooter({ text: 'All sanctions issue confirmation embeds and archive to #mod-logs' })
      .setTimestamp();

    return message.channel.send({ embeds: [helpEmbed] });
  }

  // 1. KICK COMMAND: !kick @user [reason]
  if (lower.startsWith('!kick')) {
    // 1. Check Moderator Permission
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply('❌ **Permission Denied:** You need the **Kick Members** permission to kick users.');
    }
    // 2. Check Bot Permission
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply('❌ **Bot Configuration Error:** The bot lacks **Kick Members** permission. Please update the bot\\'s role permissions in Server Settings.');
    }

    const target = message.mentions.members.first();
    if (!target) {
      return message.reply('⚠️ **Usage:** \`!kick @user [reason]\`\\nExample: \`!kick @Viper_Striker99 Insubordination during tournament scrim\`');
    }

    if (target.id === message.author.id) {
      return message.reply('❌ You cannot kick yourself.');
    }
    if (target.id === client.user.id) {
      return message.reply('❌ The bot cannot kick itself.');
    }
    if (!target.kickable) {
      return message.reply('❌ **Hierarchy Error:** Cannot kick this user. Their highest role is equal to or higher than the bot\\'s role.');
    }
    if (message.member.roles.highest.position <= target.roles.highest.position && message.guild.ownerId !== message.author.id) {
      return message.reply('❌ **Hierarchy Error:** You cannot kick this user because your highest role is not strictly above theirs.');
    }

    const reason = content.split(' ').slice(2).join(' ') || 'Disciplinary violation & team conduct';

    try {
      await target.kick(reason);

      const kickEmbed = new EmbedBuilder()
        .setColor(CRIMSON_COLOR)
        .setTitle('🛡️ MEMBER KICKED FROM SERVER')
        .setDescription(\`**\${target.user.tag}** was removed by staff moderation.\`)
        .addFields(
          { name: 'Target User', value: \`<@\${target.id}> (\${target.user.tag})\`, inline: true },
          { name: 'Moderator', value: \`\${message.author} (\${message.author.tag})\`, inline: true },
          { name: 'Action', value: '👢 Guild Kick (Can rejoin via valid invite)', inline: true },
          { name: 'Disciplinary Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'La Academia Staff Moderation Log • Confirmation Verified' })
        .setTimestamp();

      await message.channel.send({ embeds: [kickEmbed] });
      await logToModChannel(message.guild, kickEmbed);
      return;
    } catch (err) {
      return message.reply(\`❌ Failed to kick user: \${err.message}\`);
    }
  }

  // 2. BAN COMMAND: !ban @user [reason]
  if (lower.startsWith('!ban')) {
    // 1. Check Moderator Permission
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('❌ **Permission Denied:** You need the **Ban Members** permission to ban users.');
    }
    // 2. Check Bot Permission
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('❌ **Bot Configuration Error:** The bot lacks **Ban Members** permission. Please update the bot\\'s role permissions in Server Settings.');
    }

    const target = message.mentions.members.first();
    if (!target) {
      return message.reply('⚠️ **Usage:** \`!ban @user [reason]\`\\nExample: \`!ban @ToxicTroll Severe match fixing & toxicity\`');
    }

    if (target.id === message.author.id) {
      return message.reply('❌ You cannot ban yourself.');
    }
    if (target.id === client.user.id) {
      return message.reply('❌ The bot cannot ban itself.');
    }
    if (!target.bannable) {
      return message.reply('❌ **Hierarchy Error:** Cannot ban this user. Their highest role is equal to or higher than the bot\\'s role.');
    }
    if (message.member.roles.highest.position <= target.roles.highest.position && message.guild.ownerId !== message.author.id) {
      return message.reply('❌ **Hierarchy Error:** You cannot ban this user because your highest role is not strictly above theirs.');
    }

    const reason = content.split(' ').slice(2).join(' ') || 'Severe community violation & zero-tolerance breach';

    try {
      await target.ban({ reason, deleteMessageSeconds: 604800 }); // Purges 7 days of spam

      const banEmbed = new EmbedBuilder()
        .setColor(DARK_RED_COLOR)
        .setTitle('🔨 MEMBER PERMANENTLY BANNED')
        .setDescription(\`**\${target.user.tag}** was permanently blacklisted from **LA ACADEMIA**.\`)
        .addFields(
          { name: 'Target User', value: \`<@\${target.id}> (\${target.user.tag})\`, inline: true },
          { name: 'Moderator', value: \`\${message.author} (\${message.author.tag})\`, inline: true },
          { name: 'Action', value: '🔨 Permanent Guild Ban & 7-Day Message Cleanup', inline: true },
          { name: 'Disciplinary Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'La Academia Server Blacklist • Irrevocable Sanction' })
        .setTimestamp();

      await message.channel.send({ embeds: [banEmbed] });
      await logToModChannel(message.guild, banEmbed);
      return;
    } catch (err) {
      return message.reply(\`❌ Failed to ban user: \${err.message}\`);
    }
  }

  // 3. MUTE / TIMEOUT COMMAND: !mute @user [duration] [reason]
  if (lower.startsWith('!mute') || lower.startsWith('!timeout')) {
    // 1. Check Moderator Permission
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ **Permission Denied:** You need **Timeout Members** (Moderate Members) permission to mute users.');
    }
    // 2. Check Bot Permission
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ **Bot Configuration Error:** The bot lacks **Timeout Members** permission. Please grant the bot **Moderate Members** in Server Settings.');
    }

    const target = message.mentions.members.first();
    if (!target) {
      return message.reply('⚠️ **Usage:** \`!mute @user [duration] [reason]\`\\nExample: \`!mute @Viper_Striker99 10m Voice spam in competitive lobby\`\\nSupported durations: \`60s\`, \`5m\`, \`10m\`, \`1h\`, \`1d\`, \`7d\` (default: \`10m\`)');
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

    if (rawArgs[0] && /^(\\d+)(s|m|h|d|w)$/i.test(rawArgs[0])) {
      const match = rawArgs[0].match(/^(\\d+)(s|m|h|d|w)$/i);
      const val = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      if (unit === 's') { durationMs = val * 1000; durationLabel = \`\${val} Second(s)\`; }
      else if (unit === 'm') { durationMs = val * 60 * 1000; durationLabel = \`\${val} Minute(s)\`; }
      else if (unit === 'h') { durationMs = val * 60 * 60 * 1000; durationLabel = \`\${val} Hour(s)\`; }
      else if (unit === 'd') { durationMs = val * 24 * 60 * 60 * 1000; durationLabel = \`\${val} Day(s)\`; }
      else if (unit === 'w') { durationMs = val * 7 * 24 * 60 * 60 * 1000; durationLabel = \`\${val} Week(s)\`; }
      reasonIndex = 1;
    }

    const reason = rawArgs.slice(reasonIndex).join(' ') || 'Disciplinary timeout for disruptive behavior';

    try {
      await target.timeout(durationMs, reason);

      const expiresUnix = Math.floor((Date.now() + durationMs) / 1000);
      const muteEmbed = new EmbedBuilder()
        .setColor(GOLD_COLOR)
        .setTitle('🔇 MEMBER TIMED OUT / MUTED')
        .setDescription(\`**\${target.user.tag}** was placed on communication timeout by staff moderation.\`)
        .addFields(
          { name: 'Target User', value: \`<@\${target.id}> (\${target.user.tag})\`, inline: true },
          { name: 'Duration', value: \`⏱️ **\${durationLabel}**\`, inline: true },
          { name: 'Expires', value: \`<t:\${expiresUnix}:R>\`, inline: true },
          { name: 'Moderator', value: \`\${message.author} (\${message.author.tag})\`, inline: true },
          { name: 'Restrictions', value: 'Restricted from sending messages, reactions, and speaking in voice comms.', inline: true },
          { name: 'Disciplinary Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'La Academia Staff Moderation Log • Timeout Active' })
        .setTimestamp();

      await message.channel.send({ embeds: [muteEmbed] });
      await logToModChannel(message.guild, muteEmbed);
      return;
    } catch (err) {
      return message.reply(\`❌ Failed to timeout user: \${err.message}\`);
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
      return message.reply('⚠️ **Usage:** \`!unmute @user [reason]\`\\nExample: \`!unmute @Viper_Striker99 Timeout served & apology accepted\`');
    }

    if (!target.moderatable) {
      return message.reply('❌ **Hierarchy Error:** Cannot unmute this user due to role hierarchy.');
    }

    const reason = content.split(' ').slice(2).join(' ') || 'Timeout lifted by staff moderation';

    try {
      await target.timeout(null, reason);

      const unmuteEmbed = new EmbedBuilder()
        .setColor(EMERALD_COLOR)
        .setTitle('🔊 MEMBER TIMEOUT REMOVED / UNMUTED')
        .setDescription(\`**\${target.user.tag}** has had their timeout lifted.\`)
        .addFields(
          { name: 'Target User', value: \`<@\${target.id}> (\${target.user.tag})\`, inline: true },
          { name: 'Moderator', value: \`\${message.author}\`, inline: true },
          { name: 'Permissions', value: '✅ Full text chat and voice privileges restored.', inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'La Academia Staff Moderation Log • Sanction Lifted' })
        .setTimestamp();

      await message.channel.send({ embeds: [unmuteEmbed] });
      await logToModChannel(message.guild, unmuteEmbed);
      return;
    } catch (err) {
      return message.reply(\`❌ Failed to unmute user: \${err.message}\`);
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
      return message.reply('⚠️ **Usage:** \`!clear <1-100>\` (e.g. \`!clear 10\`)');
    }

    try {
      const fetched = await message.channel.messages.fetch({ limit: Math.min(amount + 1, 100) });
      const deleted = await message.channel.bulkDelete(fetched, true);
      const purgedCount = Math.max(0, deleted.size - 1);
      const confirmMsg = await message.channel.send(\`🧹 Purged **\${purgedCount}** messages from this channel.\`);
      setTimeout(() => confirmMsg.delete().catch(() => {}), 4000);
      return;
    } catch (err) {
      return message.reply(\`❌ Error purging messages: \${err.message}\`);
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
    return interaction.reply({ content: \`🏓 Pong! (Gateway Latency: \${client.ws.ping}ms)\`, ephemeral: true });
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

    if (!targetMember) return interaction.reply({ content: '❌ Member not found.', ephemeral: true });
    if (!targetMember.kickable) return interaction.reply({ content: '❌ Cannot kick user due to role hierarchy.', ephemeral: true });

    await targetMember.kick(reason);

    const embed = new EmbedBuilder()
      .setColor(CRIMSON_COLOR)
      .setTitle('🛡️ MEMBER KICKED FROM SERVER')
      .setDescription(\`**\${targetUser.tag}** was removed by staff moderation.\`)
      .addFields(
        { name: 'Target User', value: \`<@\${targetUser.id}>\`, inline: true },
        { name: 'Moderator', value: \`<@\${interaction.user.id}>\`, inline: true },
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

    if (!targetMember) return interaction.reply({ content: '❌ Member not found.', ephemeral: true });
    if (!targetMember.bannable) return interaction.reply({ content: '❌ Cannot ban user due to role hierarchy.', ephemeral: true });

    await targetMember.ban({ reason, deleteMessageSeconds: 604800 });

    const embed = new EmbedBuilder()
      .setColor(DARK_RED_COLOR)
      .setTitle('🔨 MEMBER PERMANENTLY BANNED')
      .setDescription(\`**\${targetUser.tag}** was blacklisted by staff moderation.\`)
      .addFields(
        { name: 'Target User', value: \`<@\${targetUser.id}>\`, inline: true },
        { name: 'Moderator', value: \`<@\${interaction.user.id}>\`, inline: true },
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
    if (!targetMember) return interaction.reply({ content: '❌ Member not found.', ephemeral: true });
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
      .setDescription(\`**\${targetUser.tag}** was placed on communication timeout.\`)
      .addFields(
        { name: 'Target User', value: \`<@\${targetUser.id}>\`, inline: true },
        { name: 'Duration', value: \`⏱️ **\${durationStr}**\`, inline: true },
        { name: 'Moderator', value: \`<@\${interaction.user.id}>\`, inline: true },
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
      .setDescription(\`**\${targetUser.tag}** has had their timeout lifted.\`)
      .addFields(
        { name: 'Target User', value: \`<@\${targetUser.id}>\`, inline: true },
        { name: 'Moderator', value: \`<@\${interaction.user.id}>\`, inline: true },
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

    await interaction.reply({ content: \`🧹 Purged **\${deleted.size}** messages.\`, ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
`;

  const getActiveCode = () => {
    switch (selectedFile) {
      case 'welcome-bot': return welcomeBotCode;
      case 'bot': return botCode;
      case 'moderation': return moderationBotCode;
      case 'deploy': return deployCode;
      case 'pkg': return pkgCode;
      case 'env': return envCode;
      case 'readme': return readmeCode;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertTag = (tag: string) => {
    setWelcomeTemplate((prev) => `${prev} ${tag}`);
  };

  // ==========================================
  // FC27 STATS API BOT MODULE CODE TEMPLATES
  // ==========================================
  const fc27ServiceCode = `/**
 * FC27 PRO CLUBS STATS API SERVICE
 * Connects Discord Bot to EA Sports FC27 Pro Clubs endpoints
 */

const API_BASE_URL = process.env.FC27_API_BASE_URL || 'http://localhost:3000';

export interface FC27ClubStats {
  clubId: string;
  name: string;
  division: number;
  skillRating: number;
  overallRecord: { wins: number; ties: number; losses: number; winRate: number };
  goalsScored: number;
  goalsConceded: number;
  goalDifference: number;
  cleanSheets: number;
  form: string[];
  currentStreak: string;
  platform: string;
  membersCount: number;
}

export interface FC27PlayerStats {
  gamertag: string;
  eaId: string;
  position: string;
  overallRating: number;
  matchesPlayed: number;
  goals: number;
  assists: number;
  averageMatchRating: number;
  tacklesMade: number;
  tacklesSuccessRate: number;
  passesMade: number;
  passSuccessRate: number;
  cleanSheets: number;
  manOfTheMatch: number;
  archetype: string;
  playstyles: string[];
  contractTier: string;
}

// 1. Fetch Official Club Stats & Division 1 Record
export async function getClubStats(clubId = 'la-academia-fc27'): Promise<FC27ClubStats> {
  const res = await fetch(\`\${API_BASE_URL}/api/fc27/club/stats?clubId=\${encodeURIComponent(clubId)}\`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch club stats');
  return data.data;
}

// 2. Fetch Player Career Telemetry & PlayStyles
export async function getPlayerStats(gamertag: string): Promise<FC27PlayerStats> {
  const res = await fetch(\`\${API_BASE_URL}/api/fc27/player/stats?gamertag=\${encodeURIComponent(gamertag)}\`);
  const data = await res.json();
  if (!data.success || !data.player) throw new Error(data.error || 'Player not found in FC27 network');
  return data.player;
}

// 3. Fetch Recent Matchday Fixtures
export async function getRecentMatches(limit = 5) {
  const res = await fetch(\`\${API_BASE_URL}/api/fc27/club/matches?limit=\${limit}\`);
  const data = await res.json();
  return data.matches || [];
}

// 4. Fetch Squad Performance Leaderboard
export async function getLeaderboard(category = 'amr') {
  const res = await fetch(\`\${API_BASE_URL}/api/fc27/leaderboard?category=\${category}\`);
  const data = await res.json();
  return data.leaderboard || [];
}

// 5. Fetch Title Update 3.1 Meta Archetype Builds
export async function getMetaDirectives() {
  const res = await fetch(\`\${API_BASE_URL}/api/fc27/meta\`);
  const data = await res.json();
  return data.metaArchetypes || [];
}
`;

  const fc27SlashCode = `/**
 * DISCORD.JS v14 SLASH COMMAND HANDLERS FOR FC27 STATS API
 * Handles /stats, /club, /matches, /leaderboard, /meta
 */

import { EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import * as FC27 from './fc27-stats-service.js';

export async function handleFC27Interaction(interaction: ChatInputCommandInteraction) {
  const { commandName } = interaction;

  // 1. /stats [gamertag]
  if (commandName === 'stats') {
    await interaction.deferReply();
    const query = interaction.options.getString('gamertag') || interaction.user.username;
    try {
      const p = await FC27.getPlayerStats(query);
      const embed = new EmbedBuilder()
        .setColor(0x10B981)
        .setTitle(\`📊 FC27 PLAYER STATS // \${p.gamertag.toUpperCase()}\`)
        .setDescription('Verified career telemetry from EA Sports FC27 Pro Clubs Network:')
        .addFields(
          { name: 'Position', value: \`🛡️ \${p.position}\`, inline: true },
          { name: 'OVR Rating', value: \`⭐ \${p.overallRating} OVR\`, inline: true },
          { name: 'Squad Tier', value: \`🏅 \${p.contractTier}\`, inline: true },
          { name: 'Matches (Caps)', value: \`\${p.matchesPlayed} Matches\`, inline: true },
          { name: 'Average Rating (AMR)', value: \`📈 \${p.averageMatchRating} / 10.0\`, inline: true },
          { name: 'Goals / Assists', value: \`⚽ \${p.goals}G • \${p.assists}A\`, inline: true },
          { name: 'Tackles Won', value: \`\${p.tacklesMade} (\${p.tacklesSuccessRate}%)\`, inline: true },
          { name: 'Pass Accuracy', value: \`\${p.passesMade} (\${p.passSuccessRate}%)\`, inline: true },
          { name: 'Clean Sheets', value: \`\${p.cleanSheets} Clean Sheets\`, inline: true },
          { name: 'PlayStyles', value: p.playstyles.map((ps: string) => \`\\\`\${ps}\\\`\`).join(' '), inline: false }
        )
        .setFooter({ text: 'EA Sports FC27 Pro Clubs API • Crossplay Gen 5' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
      await interaction.editReply({ content: \`⚠️ \${err.message}\` });
    }
  }

  // 2. /club
  else if (commandName === 'club') {
    await interaction.deferReply();
    try {
      const c = await FC27.getClubStats();
      const embed = new EmbedBuilder()
        .setColor(0xE11D48)
        .setTitle(\`🏆 \${c.name} // OFFICIAL PRO CLUBS TELEMETRY\`)
        .setDescription(\`Official standing in Division \${c.division} (\${c.platform}):\`)
        .addFields(
          { name: 'Division Level', value: \`Division \${c.division} (Elite)\`, inline: true },
          { name: 'Skill Rating', value: \`\${c.skillRating} SR\`, inline: true },
          { name: 'Record', value: \`\${c.overallRecord.wins}W - \${c.overallRecord.ties}D - \${c.overallRecord.losses}L (\${c.overallRecord.winRate}%)\`, inline: true },
          { name: 'Goal Difference', value: \`+\${c.goalDifference} (\${c.goalsScored} GF / \${c.goalsConceded} GA)\`, inline: true },
          { name: 'Clean Sheets', value: \`\${c.cleanSheets} Clean Sheets\`, inline: true },
          { name: 'Current Streak', value: c.currentStreak, inline: true },
          { name: 'Form (Last 5)', value: c.form.join(' • '), inline: true },
          { name: 'Roster Size', value: \`\${c.membersCount} Players Registered\`, inline: true }
        )
        .setFooter({ text: 'La Academia Performance Directorate • /api/fc27/club/stats' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
      await interaction.editReply({ content: \`⚠️ \${err.message}\` });
    }
  }

  // 3. /matches
  else if (commandName === 'matches') {
    await interaction.deferReply();
    try {
      const matches = await FC27.getRecentMatches(5);
      const embed = new EmbedBuilder()
        .setColor(0x3B82F6)
        .setTitle('📅 RECENT MATCHDAY FIXTURES // LA ACADEMIA FC27')
        .setDescription('Recent competitive fixtures and opponent scorelines:')
        .addFields(
          matches.map((m: any) => ({
            name: \`\${m.result === 'win' ? '🟢' : m.result === 'draw' ? '🟡' : '🔴'} \${m.scoreHome} - \${m.scoreAway} vs \${m.opponentClub}\`,
            value: \`\${m.competition} • Star: **\${m.topPerformer.gamertag}** (\${m.topPerformer.rating} AMR)\`,
            inline: false
          }))
        )
        .setFooter({ text: 'Source: /api/fc27/club/matches' });

      await interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
      await interaction.editReply({ content: \`⚠️ \${err.message}\` });
    }
  }
}
`;

  const fc27CurlCode = `# 1. Query Official Club Division 1 Record
curl -X GET "http://localhost:3000/api/fc27/club/stats?clubId=la-academia-fc27"

# 2. Query Player Career Stats & PlayStyles
curl -X GET "http://localhost:3000/api/fc27/player/stats?gamertag=Vortex_Anchor"

# 3. Query Recent Matchday Fixtures
curl -X GET "http://localhost:3000/api/fc27/club/matches?limit=5"

# 4. Query Squad Leaderboards (amr, goals, assists, tackles, cleansheets)
curl -X GET "http://localhost:3000/api/fc27/leaderboard?category=amr"

# 5. Query Title Update 3.1 Pro Clubs Meta Builds
curl -X GET "http://localhost:3000/api/fc27/meta"
`;

  const fc27EnvCode = `# Discord Bot & FC27 API Configuration
DISCORD_TOKEN="YOUR_BOT_TOKEN_HERE"
CLIENT_ID="YOUR_CLIENT_ID_HERE"
GUILD_ID="YOUR_GUILD_ID_HERE"

# Base URL for the FC27 Pro Clubs Stats API Proxy (defaults to http://localhost:3000)
FC27_API_BASE_URL="http://localhost:3000"
`;

  const handleTestFc27Endpoint = async (endpoint: string) => {
    setIsTestingFc27(true);
    setFc27TestOutput('Sending HTTP GET request...');
    try {
      const res = await fetch(endpoint);
      const json = await res.json();
      setFc27TestOutput(JSON.stringify(json, null, 2));
    } catch (err: any) {
      setFc27TestOutput(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsTestingFc27(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="text-xs font-mono text-rose-500 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          Discord Bot Studio &amp; Welcome Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
          Customizable Welcome Bot &amp; Command Handler
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-3xl">
          Automatically welcome new members when they join your server with customizable templates, rich embeds, and instant command handlers (`!ping` &rarr; `Pong!`).
        </p>
      </div>

      {/* Universal Hosting Zip Banner */}
      <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-rose-950/40 border border-zinc-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <span>Ready-to-Deploy Hosting Package (`la-academia-fc27-deployment.zip`)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
                Universal Cloud Package
              </span>
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Single standalone zip configured for Render, Railway, Vercel, Docker, VPS, and Heroku. Includes Dockerfile, Procfile, build scripts &amp; Express API.
            </div>
          </div>
        </div>
        <a
          href="/api/download-zip"
          download="la-academia-fc27-deployment.zip"
          className="shrink-0 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer hover:shadow-rose-900/30"
        >
          <Download className="w-4 h-4" />
          <span>Download Hosting Zip</span>
        </a>
      </div>

      {/* Segmented Mode Selector */}
      <div className="mb-8 p-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl flex flex-wrap gap-2">
        <button
          onClick={() => setIntegrationMode('welcome')}
          className={`flex-1 min-w-[200px] py-3 px-4 rounded-lg text-left transition-all cursor-pointer ${
            integrationMode === 'welcome'
              ? 'bg-rose-950 border border-rose-600/60 text-white shadow'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <HeartHandshake className="w-4 h-4 text-rose-400" />
            <span>1. Welcome Bot Customizer</span>
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">
            Auto-welcome on join &bull; Custom template placeholders &bull; Live test
          </div>
        </button>

        <button
          onClick={() => setIntegrationMode('webhook')}
          className={`flex-1 min-w-[200px] py-3 px-4 rounded-lg text-left transition-all cursor-pointer ${
            integrationMode === 'webhook'
              ? 'bg-rose-950 border border-rose-600/60 text-white shadow'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>2. Instant Webhook Dispatch</span>
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">
            30-second setup &bull; Zero code &bull; Send cards straight to Discord
          </div>
        </button>

        <button
          onClick={() => setIntegrationMode('bot')}
          className={`flex-1 min-w-[200px] py-3 px-4 rounded-lg text-left transition-all cursor-pointer ${
            integrationMode === 'bot'
              ? 'bg-rose-950 border border-rose-600/60 text-white shadow'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>3. Discord.js Code Exporter</span>
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">
            Full Node.js codebase &bull; !ping handler &bull; OAuth2 invite generator
          </div>
        </button>

        <button
          onClick={() => setIntegrationMode('structure')}
          className={`flex-1 min-w-[200px] py-3 px-4 rounded-lg text-left transition-all cursor-pointer ${
            integrationMode === 'structure'
              ? 'bg-rose-950 border border-rose-600/60 text-white shadow'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>4. Server Channels &amp; Roles</span>
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">
            #welcome-lobby, #trial-submission, and role hierarchy
          </div>
        </button>

        <button
          onClick={() => setIntegrationMode('fc27-api')}
          className={`flex-1 min-w-[200px] py-3 px-4 rounded-lg text-left transition-all cursor-pointer ${
            integrationMode === 'fc27-api'
              ? 'bg-rose-950 border border-rose-600/60 text-white shadow'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>5. FC27 Stats API Bot Module</span>
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">
            REST API client &bull; /stats &amp; /club commands &bull; Live test runner
          </div>
        </button>
      </div>

      {/* MODE 1: WELCOME BOT CUSTOMIZER */}
      {integrationMode === 'welcome' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Customizer Settings Left */}
            <div className="lg:col-span-7 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Settings className="w-4 h-4 text-rose-400" />
                    <span>Welcome Message Template Settings</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Triggered automatically when a user joins the server (`guildMemberAdd`).
                  </p>
                </div>
              </div>

              {/* Channel Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Target Welcome Channel
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 font-mono text-sm">#</span>
                  <input
                    type="text"
                    value={welcomeChannelName}
                    onChange={(e) => setWelcomeChannelName(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                    placeholder="welcome-lobby"
                  />
                </div>
              </div>

              {/* Message Template */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Welcome Message Template
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">Dynamic placeholders below</span>
                </div>
                <textarea
                  rows={3}
                  value={welcomeTemplate}
                  onChange={(e) => setWelcomeTemplate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-xs text-white font-mono focus:outline-none focus:border-rose-500 leading-relaxed"
                />

                {/* Placeholder Chips */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase mr-1">Insert tag:</span>
                  {[
                    { tag: '{user}', desc: 'User Mention' },
                    { tag: '{username}', desc: 'Username' },
                    { tag: '{server}', desc: 'Server Name' },
                    { tag: '{memberCount}', desc: 'Member Count' },
                  ].map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => insertTag(item.tag)}
                      className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-rose-300 border border-zinc-700 text-[11px] font-mono cursor-pointer transition-colors"
                      title={item.desc}
                    >
                      {item.tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Embed Customization */}
              <div className="pt-3 border-t border-zinc-800 space-y-4">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-rose-400" />
                  <span>Rich Embed Card Customization</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1 font-medium">Embed Title</label>
                    <input
                      type="text"
                      value={welcomeEmbedTitle}
                      onChange={(e) => setWelcomeEmbedTitle(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1 font-medium">Accent Color (Hex)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={welcomeColor}
                        onChange={(e) => setWelcomeColor(e.target.value)}
                        className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={welcomeColor}
                        onChange={(e) => setWelcomeColor(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 mb-1 font-medium">Embed Description</label>
                  <textarea
                    rows={2}
                    value={welcomeEmbedDesc}
                    onChange={(e) => setWelcomeEmbedDesc(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="dmToggle"
                    checked={sendDM}
                    onChange={(e) => setSendDM(e.target.checked)}
                    className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                  />
                  <label htmlFor="dmToggle" className="text-xs text-zinc-300 cursor-pointer">
                    Also send a personalized welcome Direct Message (DM) to the member
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-zinc-800 flex flex-wrap gap-3">
                <button
                  onClick={handleDispatchWelcomeTest}
                  disabled={isSending}
                  className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending...' : 'Test Send Welcome Message to Live Discord'}</span>
                </button>
              </div>

              {welcomeStatus && (
                <div className="p-3 rounded bg-zinc-950 border border-zinc-700 text-xs text-zinc-200">
                  {welcomeStatus}
                </div>
              )}
            </div>

            {/* Live Discord Mockup Right */}
            <div className="lg:col-span-5">
              <div className="sticky top-24">
                <div className="text-center mb-2">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                    Live Discord Welcome Message Preview
                  </span>
                </div>

                {/* Simulated Discord Message Bubble */}
                <div className="rounded-xl border border-zinc-800 bg-[#313338] p-4 text-zinc-100 shadow-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 border-b border-zinc-700/60 pb-2">
                    <Hash className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="font-semibold text-white">{welcomeChannelName}</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <img
                      src="https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot"
                      alt="Bot"
                      className="w-10 h-10 rounded-full bg-zinc-800 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-rose-400">Academia Bot</span>
                        <span className="px-1 py-0.2 bg-[#5865f2] text-[9px] font-bold text-white rounded font-mono">
                          BOT
                        </span>
                        <span className="text-[10px] text-zinc-500">Today at 12:00 PM</span>
                      </div>

                      {/* Content text */}
                      <div className="text-xs text-zinc-200 mt-1 leading-relaxed">
                        {welcomeTemplate
                          .replace(/{user}/g, '@Valiant_Anchor')
                          .replace(/{username}/g, 'Valiant_Anchor')
                          .replace(/{server}/g, 'LA ACADEMIA // FC27')
                          .replace(/{memberCount}/g, '42')}
                      </div>

                      {/* Embed box */}
                      <div
                        className="mt-2.5 rounded bg-[#2b2d31] border-l-4 p-3 shadow text-xs space-y-2"
                        style={{ borderLeftColor: welcomeColor }}
                      >
                        <div className="font-bold text-white text-sm">
                          {welcomeEmbedTitle
                            .replace(/{server}/g, 'LA ACADEMIA // FC27')
                            .replace(/{username}/g, 'Valiant_Anchor')}
                        </div>
                        <div className="text-zinc-300 text-[11px] leading-relaxed">
                          {welcomeEmbedDesc
                            .replace(/{server}/g, 'LA ACADEMIA // FC27')
                            .replace(/{username}/g, 'Valiant_Anchor')}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-700/50 text-[11px]">
                          <div>
                            <span className="text-zinc-400 font-bold block">🎯 Step 1: Trial Card</span>
                            <span className="text-zinc-300">Submit build in #trial-submission</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 font-bold block">🎙️ Step 2: Voice Comms</span>
                            <span className="text-zinc-300">Active mic for match fixtures</span>
                          </div>
                        </div>

                        <div className="text-[9px] text-zinc-500 font-mono pt-1 border-t border-zinc-700/40">
                          Recruit #42 • Automated Welcome System
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
                  <strong className="text-zinc-200 block mb-0.5">💡 Did you know?</strong>
                  In Discord, moderators can update this message anytime using <code className="text-rose-400 font-mono">/setwelcome</code> or <code className="text-rose-400 font-mono">!setwelcome</code> without modifying code or restarting the bot.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: INSTANT WEBHOOK */}
      {integrationMode === 'webhook' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="w-7 h-7 rounded-full bg-rose-950 border border-rose-600/50 text-rose-300 font-bold text-xs flex items-center justify-center mb-2">1</div>
              <h3 className="text-sm font-bold text-white">Right-Click Channel</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                In your Discord server, right-click <span className="text-rose-400 font-mono">#welcome-lobby</span> or <span className="text-rose-400 font-mono">#trial-submission</span> and select <strong>Edit Channel</strong>.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="w-7 h-7 rounded-full bg-rose-950 border border-rose-600/50 text-rose-300 font-bold text-xs flex items-center justify-center mb-2">2</div>
              <h3 className="text-sm font-bold text-white">Click Integrations</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Click <strong>Integrations</strong> on the left sidebar &rarr; click <strong>Webhooks</strong> &rarr; click <strong>New Webhook</strong>.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="w-7 h-7 rounded-full bg-rose-950 border border-rose-600/50 text-rose-300 font-bold text-xs flex items-center justify-center mb-2">3</div>
              <h3 className="text-sm font-bold text-white">Copy Webhook URL</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Name it <span className="text-rose-400 font-mono">Academia Bot</span> and click <strong>Copy Webhook URL</strong>.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="w-7 h-7 rounded-full bg-rose-950 border border-rose-600/50 text-rose-300 font-bold text-xs flex items-center justify-center mb-2">4</div>
              <h3 className="text-sm font-bold text-white">Paste &amp; Test Live</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Paste the URL into the test box below and click <strong>Send Test Ping</strong> to verify.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/90 border border-rose-900/40 shadow-xl space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Discord Webhook URL
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={inputWebhook}
                  onChange={(e) => setInputWebhook(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/123456789012345678/abcdef..."
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-rose-500"
                />
                <button
                  onClick={handleSaveWebhook}
                  className="px-4 py-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold cursor-pointer border border-zinc-700 transition-colors whitespace-nowrap"
                >
                  Save URL
                </button>
              </div>
            </div>

            {testStatus && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                  testStatus.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                    : 'bg-red-950/60 border-red-700/60 text-red-300'
                }`}
              >
                {testStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <HelpCircle className="w-4 h-4 text-red-400 shrink-0" />}
                <span>{testStatus.message}</span>
              </div>
            )}

            <div className="pt-2 border-t border-zinc-800 flex flex-wrap gap-3">
              <button
                onClick={handleTestPing}
                disabled={isSending}
                className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Test Ping (!ping test)</span>
              </button>
            </div>
          </div>

          {/* Webhook vs Real Bot Notice */}
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
            <div className="font-bold flex items-center gap-2 text-amber-300 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Bot isn&apos;t responding to chat commands in your server?</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              <strong>Webhooks are one-way speakers:</strong> They can send matchday cards and announcements into Discord, but they <em>cannot listen to messages or reply to user chat</em>. If you want a bot that responds to <code className="text-amber-300 font-mono">!ping</code>, <code className="text-amber-300 font-mono">!avail in</code>, or <code className="text-amber-300 font-mono">/lineup</code>, switch to <strong>Mode 3 (Discord.js Code Exporter)</strong> and run the bot script with <strong>Message Content Intent</strong> enabled.
            </p>
          </div>
        </div>
      )}

      {/* MODE 3: FULL DISCORD BOT SOURCE CODE */}
      {integrationMode === 'bot' && (
        <div className="space-y-8">
          <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>1-Click OAuth2 Bot Invite Link Generator</span>
            </div>
            <p className="text-xs text-zinc-400 mb-4 max-w-2xl">
              Enter your Discord Application Client ID from the Discord Developer Portal to generate an instant invite URL:
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                placeholder="Enter Application Client ID (e.g. 132456789012345678)"
                value={clientId}
                onChange={(e) => calculateInviteUrl(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 font-mono"
              />

              {botInviteUrl ? (
                <a
                  href={botInviteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Authorize &amp; Invite Bot to Server</span>
                </a>
              ) : (
                <button
                  disabled
                  className="px-4 py-2 rounded bg-zinc-800 text-zinc-500 text-xs font-medium whitespace-nowrap cursor-not-allowed"
                >
                  Enter Client ID Above
                </button>
              )}
            </div>

            {/* Required Moderation Permissions Breakdown */}
            <div className="mt-4 pt-3 border-t border-zinc-800/80">
              <div className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                <span>Pre-Configured Bot Permissions (Integer: <code className="text-rose-400 font-mono">1101927935014</code>)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Kick Members (0x2)', active: true },
                  { label: 'Ban Members (0x4)', active: true },
                  { label: 'Moderate Members / Timeout (1<<40)', active: true },
                  { label: 'Manage Messages (0x2000)', active: true },
                  { label: 'Manage Roles (0x10000000)', active: true },
                  { label: 'Send Messages (0x800)', active: true },
                  { label: 'Embed Links (0x4000)', active: true },
                  { label: 'Read Message History (0x10000)', active: true },
                  { label: 'Slash Commands (0x80000000)', active: true },
                ].map((p, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-950 border border-zinc-800 text-emerald-400"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                    {p.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Code Viewer with Multiple File Tabs */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
            <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                {[
                  { id: 'moderation', name: '🛡️ moderation-bot.js' },
                  { id: 'bot', name: 'multiverse-bot.js' },
                  { id: 'welcome-bot', name: 'welcome-bot.js' },
                  { id: 'deploy', name: 'deploy-commands.js' },
                  { id: 'pkg', name: 'package.json' },
                  { id: 'env', name: '.env.example' },
                  { id: 'readme', name: 'README.md' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedFile(tab.id as any)}
                    className={`px-3 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer ${
                      selectedFile === tab.id
                        ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCopyCode}
                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <div className="p-5 overflow-x-auto max-h-[500px] text-xs font-mono text-zinc-300 leading-relaxed bg-zinc-950">
              <pre>
                <code>{getActiveCode()}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* MODE 4: RECOMMENDED SERVER STRUCTURE */}
      {integrationMode === 'structure' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Hash className="w-4 h-4 text-rose-400" />
              <span>Recommended Channel Architecture</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
                <span className="font-mono text-rose-400 font-bold">#welcome-lobby</span>
                <span className="text-zinc-400 block text-[11px] mt-0.5">Automated arrival greetings with custom embed and recruit number.</span>
              </div>
              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
                <span className="font-mono text-rose-400 font-bold">#trial-submission</span>
                <span className="text-zinc-400 block text-[11px] mt-0.5">Where recruits post their FC27 trial cards (Anchor CB, Relentless CDM, Vision CAM).</span>
              </div>
              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
                <span className="font-mono text-amber-400 font-bold">#first-xi</span>
                <span className="text-zinc-400 block text-[11px] mt-0.5">Starting roster for premier AFH league tournament matches.</span>
              </div>
              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
                <span className="font-mono text-rose-400 font-bold">#dev-squad</span>
                <span className="text-zinc-400 block text-[11px] mt-0.5">La Academia feeder squad lobby and squad development matches.</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Recommended Role Hierarchy</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-400">@First XI</span>
                  <span className="text-zinc-400 block text-[11px]">Premier starters (Championship tournament division).</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-950 text-amber-300 rounded border border-amber-600/40">Tier 1</span>
              </div>
              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-rose-400">@La Academia (Dev Squad)</span>
                  <span className="text-zinc-400 block text-[11px]">Feeder squad under development contracts.</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-950 text-rose-300 rounded border border-rose-600/40">Tier 2</span>
              </div>
              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-400">@Trialist</span>
                  <span className="text-zinc-400 block text-[11px]">Recruits in evaluation lobby awaiting match trials.</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-950 text-blue-300 rounded border border-blue-600/40">Tier 3</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 5: FC27 STATS API BOT MODULE */}
      {integrationMode === 'fc27-api' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Header Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-emerald-950/40 border border-zinc-800 space-y-3 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-semibold text-emerald-400">
                PRO CLUBS REST API INTEGRATION
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-400 font-mono">EA Sports FC27 Live Telemetry</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Connect Your Discord Bot to the FC27 Pro Clubs Stats API
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
              Enable your Discord bot to query live club standings, look up recruit career telemetry with equipped PlayStyles, stream recent fixtures, and post division leaderboards into your server channels.
            </p>
          </div>

          {/* Live Endpoint Tester */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Interactive Endpoint Test Runner</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Select an endpoint below or customize the query string to test real server responses:
                </p>
              </div>

              {/* Endpoint Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { label: 'Club Record', ep: '/api/fc27/club/stats' },
                  { label: 'Player (Vortex)', ep: '/api/fc27/player/stats?gamertag=Vortex_Anchor' },
                  { label: 'Matches', ep: '/api/fc27/club/matches' },
                  { label: 'Leaderboard', ep: '/api/fc27/leaderboard?category=amr' },
                  { label: 'Meta Builds', ep: '/api/fc27/meta' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setFc27EndpointTest(preset.ep);
                      handleTestFc27Endpoint(preset.ep);
                    }}
                    className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                      fc27EndpointTest === preset.ep
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Request Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-[10px]">GET</span>
                <input
                  type="text"
                  value={fc27EndpointTest}
                  onChange={(e) => setFc27EndpointTest(e.target.value)}
                  className="flex-1 bg-transparent border-none text-white focus:outline-none font-mono text-xs"
                />
              </div>

              <button
                onClick={() => handleTestFc27Endpoint(fc27EndpointTest)}
                disabled={isTestingFc27}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isTestingFc27 ? 'Fetching...' : 'Send Live Request'}
              </button>
            </div>

            {/* Response Preview Box */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-inner">
              <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 py-2 flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>Response Output</span>
                <span className="text-[10px] text-emerald-400 font-semibold">200 OK &bull; JSON</span>
              </div>
              <div className="p-4 max-h-64 overflow-y-auto font-mono text-xs text-emerald-400 bg-[#0c0d0e]">
                <pre>{fc27TestOutput}</pre>
              </div>
            </div>
          </div>

          {/* Code Workspace */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="border-b border-zinc-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-zinc-900">
              <div className="flex items-center gap-2 overflow-x-auto">
                {[
                  { id: 'service', name: 'fc27-stats-service.ts' },
                  { id: 'slash', name: 'stats-slash-commands.ts' },
                  { id: 'curl', name: 'curl-examples.sh' },
                  { id: 'env', name: '.env config' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFc27BotCodeTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer ${
                      fc27BotCodeTab === tab.id
                        ? 'bg-zinc-800 text-emerald-400 font-bold border border-zinc-700'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  const content =
                    fc27BotCodeTab === 'service'
                      ? fc27ServiceCode
                      : fc27BotCodeTab === 'slash'
                      ? fc27SlashCode
                      : fc27BotCodeTab === 'curl'
                      ? fc27CurlCode
                      : fc27EnvCode;
                  navigator.clipboard.writeText(content);
                  setCopiedFc27Snippet(true);
                  setTimeout(() => setCopiedFc27Snippet(false), 2000);
                }}
                className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow"
              >
                {copiedFc27Snippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFc27Snippet ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <div className="p-5 overflow-x-auto max-h-[500px] text-xs font-mono text-zinc-300 leading-relaxed bg-zinc-950">
              <pre>
                <code>
                  {fc27BotCodeTab === 'service'
                    ? fc27ServiceCode
                    : fc27BotCodeTab === 'slash'
                    ? fc27SlashCode
                    : fc27BotCodeTab === 'curl'
                    ? fc27CurlCode
                    : fc27EnvCode}
                </code>
              </pre>
            </div>
          </div>

          {/* Visual Discord Card Mockups */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
              <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span>Discord Output: `/stats Vortex_Anchor`</span>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950 border-l-4 border-l-emerald-500 border border-zinc-800/80 space-y-2 text-xs">
                <div className="font-bold text-emerald-400 text-sm">📊 FC27 PLAYER STATS // VORTEX_ANCHOR</div>
                <p className="text-[11px] text-zinc-400">Verified career telemetry from EA Sports FC27 Pro Clubs Network:</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div><span className="text-zinc-500 block">Position</span><span className="text-white font-bold">🛡️ Center Back (CB)</span></div>
                  <div><span className="text-zinc-500 block">OVR Rating</span><span className="text-white font-bold">⭐ 92 OVR</span></div>
                  <div><span className="text-zinc-500 block">Matches</span><span className="text-white font-bold">148 Caps</span></div>
                  <div><span className="text-zinc-500 block">Average Rating</span><span className="text-emerald-400 font-bold">📈 9.2 / 10.0</span></div>
                  <div><span className="text-zinc-500 block">Tackles Won</span><span className="text-white font-bold">382 (86.4%)</span></div>
                  <div><span className="text-zinc-500 block">Clean Sheets</span><span className="text-white font-bold">68 Clean Sheets</span></div>
                </div>
                <div className="pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 font-mono">
                  Source: /api/fc27/player/stats &bull; Crossplay Gen 5
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
              <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>Discord Output: `/club`</span>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950 border-l-4 border-l-rose-500 border border-zinc-800/80 space-y-2 text-xs">
                <div className="font-bold text-rose-400 text-sm">🏆 LA ACADEMIA FC27 // OFFICIAL RECORD</div>
                <p className="text-[11px] text-zinc-400">Current competitive standing in Division 1 (Crossplay):</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div><span className="text-zinc-500 block">Division Level</span><span className="text-white font-bold">Division 1 (Elite)</span></div>
                  <div><span className="text-zinc-500 block">Skill Rating</span><span className="text-white font-bold">2,480 SR</span></div>
                  <div><span className="text-zinc-500 block">Overall Record</span><span className="text-white font-bold">142W - 18D - 24L (77.2%)</span></div>
                  <div><span className="text-zinc-500 block">Goal Difference</span><span className="text-white font-bold">+344 (512 GF / 168 GA)</span></div>
                  <div><span className="text-zinc-500 block">Clean Sheets</span><span className="text-white font-bold">76 Clean Sheets</span></div>
                  <div><span className="text-zinc-500 block">Current Streak</span><span className="text-amber-400 font-bold">🔥 4-Game Win Streak</span></div>
                </div>
                <div className="pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 font-mono">
                  Source: /api/fc27/club/stats &bull; Verified EA Endpoint
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
