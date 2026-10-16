/**
 * LA ACADEMIA // SLASH COMMAND DEPLOYMENT SCRIPT
 * Registers slash commands with the Discord API v10
 * Run: node deploy-commands.js
 */

import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const commands = [
  // 1. Basic command handler test
  new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong! and gateway latency'),

  // 2. Moderation: /kick
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server with a logged disciplinary reason')
    .addUserOption(opt => opt.setName('target').setDescription('The member to kick').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Disciplinary reason')),

  // 3. Moderation: /ban
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Permanently ban a member and purge recent messages')
    .addUserOption(opt => opt.setName('target').setDescription('The member to ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Disciplinary reason')),

  // 4. Moderation: /mute
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

  // 5. Moderation: /unmute
  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove timeout / unmute a member immediately')
    .addUserOption(opt => opt.setName('target').setDescription('The member to unmute').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for lifting timeout')),

  // 6. Moderation: /clear
  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Bulk delete messages from the channel (1-100)')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages to delete').setRequired(true).setMinValue(1).setMaxValue(100)),

  // 7. Mod help
  new SlashCommandBuilder()
    .setName('modhelp')
    .setDescription('Display moderation command reference and syntax guide'),
].map(cmd => cmd.toJSON());

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.error('❌ Missing DISCORD_TOKEN or CLIENT_ID in your .env file.');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function deploy() {
  try {
    console.log('🔄 Registering moderation slash commands with Discord API...');
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`✅ Successfully deployed ${commands.length} slash commands to guild ${process.env.GUILD_ID}!`);
    } else {
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log(`✅ Successfully deployed ${commands.length} global slash commands!`);
    }
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
}

deploy();
