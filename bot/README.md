# 🛡️ LA ACADEMIA // DISCORD MODERATION BOT

Production Discord.js v14 bot providing moderation commands with full confirmation messaging to the channel.

---

## ⚡ Moderation Commands

| Command | Type | Required Permission | Description & Confirmation |
| :--- | :--- | :--- | :--- |
| `!kick @user [reason]` / `/kick` | Moderation | **Kick Members** | Kicks member from guild; posts rich embed confirmation with moderator and reason. |
| `!ban @user [reason]` / `/ban` | Moderation | **Ban Members** | Permanently bans member and purges 7 days of messages; posts blacklist embed confirmation. |
| `!mute @user [duration] [reason]` / `/mute` | Moderation | **Timeout Members** (`ModerateMembers`) | Restricts messaging, voice chat, and reactions; posts embed confirmation with expiration. |
| `!unmute @user [reason]` / `/unmute` | Moderation | **Timeout Members** | Lifts active timeout; restores chat permissions with confirmation embed. |
| `!clear <1-100>` / `/clear` | Moderation | **Manage Messages** | Bulk purges channel messages with auto-deleting confirmation. |
| `!ping` / `/ping` | Utility | None | Health check returning latency and handler state. |

---

## 🔑 Permissions & Privileged Intents (CRITICAL)

### 1. Discord Developer Portal Privileged Gateway Intents
In the **Bot** tab of your Discord Application:
- [x] **SERVER MEMBERS INTENT** (Required for hierarchy inspection, timeouts, kicks, and bans)
- [x] **MESSAGE CONTENT INTENT** (Required for prefix commands: `!kick`, `!ban`, `!mute`, `!ping`)

### 2. OAuth2 Permissions
Generate the Bot Invite with permissions integer: `1101927935014`
This grants:
- **Kick Members** (0x2)
- **Ban Members** (0x4)
- **Moderate Members / Timeout** (1 << 40 / 1099511627776)
- **Manage Messages** (0x2000)
- **Manage Roles** (0x10000000)
- **View Channel** (0x400)
- **Send Messages** (0x800)
- **Embed Links** (0x4000)
- **Read Message History** (0x10000)
- **Use Application Commands** (0x80000000)

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure .env credentials
cp .env.example .env
# Set DISCORD_TOKEN, CLIENT_ID, and GUILD_ID

# 3. Register Slash Commands
npm run deploy

# 4. Start Standalone Moderation Bot
npm start
# Or start full Multiverse Bot:
npm run multiverse
```
