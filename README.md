# 🩸 LA ACADEMIA // FC27 Pro Clubs Multiverse Platform

Production-ready Discord Community Hub, Squad Roster Matrix, Interactive Tactics Board, FC27 Pro Clubs Stats API, and Discord Bot integration platform for **LA ACADEMIA**.

---

## 🚀 Quick Deployment Guide

### Option 1: Render (Recommended - Free & Easy)
1. Unzip the project or upload it to your GitHub repository.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** &rarr; **Web Service**.
3. Connect your repository (or use Public Git repository).
4. Configure the settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Click **Deploy Web Service**. Render will automatically detect the port from `process.env.PORT`.

---

### Option 2: Railway
1. Go to [Railway.app](https://railway.app) and create a **New Project**.
2. Select **Deploy from GitHub repo** or upload directory using Railway CLI (`railway up`).
3. Railway will automatically detect `package.json`, run `npm install && npm run build`, and execute `npm start`.

---

### Option 3: Docker Deployment (Any Cloud / VPS / Coolify / CapRover)
Build and run the production image:
```bash
# Build the Docker image
docker build -t la-academia-fc27 .

# Run container on port 3000
docker run -d -p 3000:3000 --name academia-hub la-academia-fc27
```

---

### Option 4: VPS / Ubuntu Server (with PM2)
```bash
# 1. Install Node.js 20+ and PM2
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 2. Extract files & install dependencies
unzip la-academia-fc27-deployment.zip -d /var/www/la-academia
cd /var/www/la-academia
npm install
npm run build

# 3. Start with PM2
pm2 start "npm start" --name "la-academia"
pm2 save
pm2 startup
```

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server (Frontend + Express API with hot-reload)
npm run dev

# App runs at: http://localhost:3000
```

---

## 📋 Available Scripts

- `npm run dev` - Starts full-stack dev server via `tsx server.ts` with Vite middlewares.
- `npm run build` - Builds production frontend assets to `/dist`.
- `npm start` - Runs the production server (`tsx server.ts`) serving the built frontend and backend API.
- `npm run lint` - Type checks TypeScript code with `tsc --noEmit`.

---

## 🛡️ Discord Bot Moderation Commands & Permissions

The bot includes comprehensive moderation commands with role hierarchy enforcement and embed confirmations:

### Commands Reference

| Action | Slash Command | Prefix Command | Required Moderator Permission | Required Bot Permission |
| :--- | :--- | :--- | :--- | :--- |
| **Mute / Timeout** | `/mute target:@user duration:[60s\|5m\|10m\|1h\|1d\|1w] reason:...` | `!mute @user [duration] [reason]` | `Timeout Members` (`ModerateMembers`) | `Moderate Members` |
| **Unmute** | `/unmute target:@user reason:...` | `!unmute @user [reason]` | `Timeout Members` (`ModerateMembers`) | `Moderate Members` |
| **Kick** | `/kick target:@user reason:...` | `!kick @user [reason]` | `Kick Members` (`KickMembers`) | `Kick Members` |
| **Ban** | `/ban target:@user reason:...` | `!ban @user [reason]` | `Ban Members` (`BanMembers`) | `Ban Members` |
| **Clear Messages** | `/clear amount:[1-100]` | `!clear [1-100]` | `Manage Messages` (`ManageMessages`) | `Manage Messages` |
| **Audit Logs** | `/modlogs` | `!modlogs` | `View Audit Log` / Staff | `Send Messages`, `Embed Links` |

### Required Bot Permissions Setup
In Discord Developer Portal &rarr; Your Application &rarr; **Bot**:
- Enable **Message Content Intent** under *Privileged Gateway Intents*.
- Under OAuth2 URL Generator &rarr; Bot Permissions:
  - `Kick Members` (Bit `0x2`)
  - `Ban Members` (Bit `0x4`)
  - `Moderate Members` / `Timeout Members` (Bit `0x10000000000`)
  - `Manage Messages` (Bit `0x2000`)
  - `Send Messages`, `Embed Links`, `Read Message History`

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:
```bash
PORT=3000
NODE_ENV=production
# Optional: Real Discord Webhook URL for trial card notifications
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
# Optional: Discord Bot Token if running Discord.js bot externally
DISCORD_BOT_TOKEN=""
CLIENT_ID=""
GUILD_ID=""
```
