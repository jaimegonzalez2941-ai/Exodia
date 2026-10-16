import React, { useState, useRef, useEffect } from 'react';
import { DiscordMessage, PlayerTrialCard, Position, ModerationAuditEntry } from '../types';
import { 
  Hash, 
  Send, 
  Terminal, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  Award,
  Users,
  Compass,
  Zap,
  Shield,
  Volume2,
  CalendarCheck,
  Clock,
  LayoutGrid,
  HelpCircle,
  Check,
  UserCheck,
  Gavel,
  Trash2,
  UserX,
  VolumeX,
  ShieldAlert,
  Lock,
  AlertTriangle,
  LifeBuoy,
  ExternalLink
} from 'lucide-react';

interface DiscordSimulatorProps {
  messages: DiscordMessage[];
  onSendMessage: (msg: Partial<DiscordMessage>) => void;
  players: PlayerTrialCard[];
  onPromotePlayer: (playerId: string, targetTier: 'first-xi' | 'dev-squad' | 'trial-pool') => void;
  onOpenCardBuilder: () => void;
  onOpenRoles?: () => void;
  onClearMessages?: (channelId: string, count: number) => void;
  onModerateUser?: (action: 'kick' | 'ban' | 'mute' | 'unmute', targetUser: string, reason: string, duration?: string) => void;
  moderationLogs?: ModerationAuditEntry[];
}

export const DiscordSimulator: React.FC<DiscordSimulatorProps> = ({
  messages,
  onSendMessage,
  players,
  onPromotePlayer,
  onOpenCardBuilder,
  onOpenRoles,
  onClearMessages,
  onModerateUser,
  moderationLogs = [],
}) => {
  const [activeChannel, setActiveChannel] = useState<string>('bot-commands');
  const [inputValue, setInputValue] = useState('');
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [executedButtonIds, setExecutedButtonIds] = useState<string[]>([]);
  const [showModModal, setShowModModal] = useState(false);
  const [modTargetInput, setModTargetInput] = useState('@Viper_Striker99');
  const [modReasonInput, setModReasonInput] = useState('Spamming mic & matchday insubordination');
  const [modActionSelect, setModActionSelect] = useState<'kick' | 'ban' | 'mute' | 'unmute'>('mute');
  const [modDurationSelect, setModDurationSelect] = useState<string>('10m');
  const [purgeCountSelect, setPurgeCountSelect] = useState<number>(5);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Availability State for simulated matchday
  const [availList, setAvailList] = useState<{ user: string; status: 'in' | 'late' | 'out'; note?: string }[]>([
    { user: 'Manager_Cap', status: 'in' },
    { user: 'Vortex_Anchor', status: 'in' },
    { user: 'Titan_Reyes', status: 'in' },
    { user: 'Silva_Maestro', status: 'late', note: '15m late (work)' },
    { user: 'Iron_Colossus_27', status: 'in' },
    { user: 'ShadowPress_99', status: 'in' },
  ]);

  // Attendance Tracker for active session
  const [checkedInUsers, setCheckedInUsers] = useState<string[]>([
    'Vortex_Anchor',
    'Manager_Cap',
    'Titan_Reyes',
  ]);

  const serverCategories = [
    {
      id: 'cat-info',
      title: '📌 ┃ INFORMATION',
      channels: [
        { id: 'announcements', name: '📢 ┃ announcements', desc: 'Official club announcements & matchday decrees', unread: false },
        { id: 'rules-and-info', name: '📜 ┃ rules-and-info', desc: 'Server rules, member conduct & team bylaws', unread: false },
        { id: 'bot-commands', name: '🤖 ┃ bot-commands', desc: 'Prefix & slash command sandbox runner', unread: false },
        { id: 'roles-and-pings', name: '👑 ┃ roles-and-pings', desc: 'Self-assignable roles & notification badges', unread: false },
      ],
    },
    {
      id: 'cat-community',
      title: '💬 ┃ COMMUNITY',
      channels: [
        { id: 'general-chat', name: '💬 ┃ general-chat', desc: 'Community lobby & competitive banter', unread: false },
        { id: 'media-and-clips', name: '🎬 ┃ media-and-clips', desc: 'Highlight reels, match clips & Twitch streams', unread: false },
        { id: 'achievements', name: '📈 ┃ achievements', desc: 'Tournament trophies & division milestones', unread: false },
      ],
    },
    {
      id: 'cat-firstteam',
      title: '⚽ ┃ FIRST TEAM',
      lockRole: '1st Team',
      channels: [
        { id: 'matchday-lineups', name: '📋 ┃ matchday-lineups', desc: 'Starting 11 lineup, attendance & tactical roles', unread: true },
        { id: 'tactics-and-meta', name: '🧠 ┃ tactics-and-meta', desc: 'Anchor specs, CDM press coverage & Meta directives', unread: false },
        { id: 'squad-chat', name: '💬 ┃ squad-chat', desc: 'First Team private matchday coordination', unread: false },
      ],
    },
    {
      id: 'cat-academy',
      title: '🛡️ ┃ ACADEMY & TRIALS',
      channels: [
        { id: 'apply-for-tryouts', name: '📝 ┃ apply-for-tryouts', desc: 'Submit recruit trial cards & evaluations', unread: false },
        { id: 'academy-chat', name: '💬 ┃ academy-chat', desc: 'La Academia dev squad fixture preparation', unread: false },
        { id: 'trial-feedback', name: '📊 ┃ trial-feedback', desc: 'Trial evaluation scorecards & scout notes', unread: false },
      ],
    },
    {
      id: 'cat-staff',
      title: '🔒 ┃ STAFF HQ',
      lockRole: 'Management',
      channels: [
        { id: 'staff-announcements', name: '🔒 ┃ staff-announcements', desc: 'Executive leadership notices & contracts', unread: false },
        { id: 'recruitment-logs', name: '📝 ┃ recruitment-logs', desc: 'Scouting logs & player evaluation dossiers', unread: false },
        { id: 'mod-logs', name: '🛡️ ┃ mod-logs', desc: 'Staff enforcement logs (!kick, !ban, !clear)', unread: false },
      ],
    },
  ];

  const voiceChannels = [
    { id: 'vc-match-a', name: '🔊 ┃ Match Room A (First Team)', activeUsers: checkedInUsers.length },
    { id: 'vc-match-b', name: '🔊 ┃ Match Room B (Academy)', activeUsers: 4 },
    { id: 'vc-tactical', name: '🔊 ┃ Tactical Review', activeUsers: 0 },
    { id: 'vc-lobby', name: '🔊 ┃ Lobby / Chill', activeUsers: 2 },
    { id: 'vc-staff', name: '🔊 ┃ Management Briefing', activeUsers: 1, locked: true },
  ];

  // Flattened channel list
  const channels = serverCategories.flatMap((cat) => cat.channels);

  const slashCommands = [
    { cmd: '!ping', desc: 'Responds with Pong! and bot latency' },
    { cmd: '/ping', desc: 'Slash ping latency test' },
    { cmd: '!kick @user reason', desc: 'Kick a member from the server with reason' },
    { cmd: '/kick', desc: 'Slash command: kick user with logged reason' },
    { cmd: '!ban @user reason', desc: 'Permanently ban a member from the server' },
    { cmd: '/ban', desc: 'Slash command: ban user with logged reason' },
    { cmd: '!mute @user 10m reason', desc: 'Timeout/mute a member (60s, 5m, 10m, 1h, 1d)' },
    { cmd: '/mute', desc: 'Slash command: timeout user with duration & reason' },
    { cmd: '!unmute @user reason', desc: 'Remove timeout / unmute a member' },
    { cmd: '/unmute', desc: 'Slash command: lift timeout from user' },
    { cmd: '!clear 5', desc: 'Delete specified number of messages (bulk clear)' },
    { cmd: '/clear', desc: 'Slash command: bulk delete messages (1-100)' },
    { cmd: '/modlogs', desc: 'View staff moderation disciplinary logs' },
    { cmd: '/availability poll', desc: 'Launch interactive matchday availability poll' },
    { cmd: '!avail in', desc: 'Confirm availability for tonight\'s matchday (🟢 In)' },
    { cmd: '!avail late 15m', desc: 'Mark yourself late (🟡 Late 15m)' },
    { cmd: '!avail out', desc: 'Mark yourself unavailable (🔴 Out)' },
    { cmd: '/attendance call', desc: 'Start roll call check-in for voice lobby' },
    { cmd: '!checkin', desc: 'Check in present for current matchday session' },
    { cmd: '/attendance summary', desc: 'View squad session attendance %' },
    { cmd: '/lineup first-xi', desc: 'Generate 11v11 matchday pitch formation' },
    { cmd: '/lineup 433', desc: 'Set 4-3-3 Attack formation with roles' },
    { cmd: '/role assist', desc: 'Interactive wizard: suggests roles based on build' },
    { cmd: '/role audit', desc: 'Staff tool: finds members missing roles' },
    { cmd: '!role join [role]', desc: 'Self-assign a role (e.g. !role join CB)' },
    { cmd: '!role leave [role]', desc: 'Remove a self-assigned role' },
    { cmd: '!role add @user [role]', desc: 'Admin command: grant role to member' },
    { cmd: '!roles', desc: 'List all self-assignable server roles' },
    { cmd: '/setwelcome', desc: 'Customize welcome message for member joins' },
    { cmd: '/trial', desc: 'Open FC27 trial card builder or submit build' },
    { cmd: '/roster first-xi', desc: 'Display premier tournament starting lineup' },
    { cmd: '/tactics', desc: 'Display mandatory team tactical directives' },
    { cmd: '/help', desc: 'Show all bot commands' },
  ];

  const channelAliases: Record<string, string[]> = {
    'roles-and-pings': ['role-select', 'roles-and-pings', 'roles'],
    'apply-for-tryouts': ['trial-submission', 'apply-for-tryouts'],
    'matchday-lineups': ['match-lineups', 'matchday-lineups', 'availability-check'],
    'tactics-and-meta': ['tactics-board', 'tactics-and-meta'],
    'squad-chat': ['first-xi', 'squad-chat'],
    'academy-chat': ['dev-squad', 'academy-chat'],
  };

  const channelMessages = messages.filter((m) => {
    if (m.channelId === activeChannel) return true;
    const aliases = channelAliases[activeChannel];
    if (aliases && aliases.includes(m.channelId)) return true;
    return false;
  });

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length, activeChannel]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if ((val.startsWith('/') || val.startsWith('!')) && !val.includes(' ')) {
      setShowSlashMenu(true);
    } else {
      setShowSlashMenu(false);
    }
  };

  const executeCommand = (cmdText: string) => {
    const text = cmdText.trim();
    setInputValue('');
    setShowSlashMenu(false);

    // Add user message to active channel
    onSendMessage({
      channelId: activeChannel,
      content: text,
      author: {
        name: 'Manager_Cap',
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=ManagerCap',
        roleColor: '#38bdf8',
      },
    });

    // Process Bot Response
    setTimeout(() => {
      handleBotSlashResponse(text);
    }, 350);
  };

  const handleSimulateMemberJoin = () => {
    const recruitNames = ['Viper_Striker99', 'Nexus_Anchor_27', 'Phantom_Maestro', 'Kaiser_CB', 'Aura_Midfielder'];
    const chosen = recruitNames[Math.floor(Math.random() * recruitNames.length)];
    const count = 42 + Math.floor(Math.random() * 20);

    onSendMessage({
      channelId: 'welcome',
      author: {
        name: 'Academia Bot',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
        isBot: true,
        roleColor: '#e11d48',
        tag: 'BOT',
      },
      content: `👋 Welcome <@${chosen}> to **LA ACADEMIA // FC27**! You are recruit **#${count}**.`,
      embeds: [
        {
          title: `🩸 NEW RECRUIT ONBOARDING: ${chosen}`,
          description: `Welcome to the **Pro Clubs Multiverse**! Submit your trial card in **#trial-submission** to earn your contract.`,
          color: 0xE11D48,
          fields: [
            { name: 'Step 1: Build Trial Card', value: 'Create your CB Anchor, CDM Press, or CAM Spacing build.', inline: true },
            { name: 'Step 2: Self-Assign Roles', value: 'Head to **#role-select** to get your position & ping roles.', inline: true },
          ],
          footer: { text: `Recruit #${count} • Automated Welcome Bot (guildMemberAdd)` },
          timestamp: new Date().toISOString(),
        },
      ],
      actionButtons: [
        { id: `btn-welcome-builder-${Date.now()}`, label: 'Open Card Builder', style: 'primary', action: 'open_builder' },
        { id: `btn-welcome-roles-${Date.now()}`, label: 'Self-Assign Roles', style: 'secondary', action: 'open_roles' },
      ],
    });

    setActiveChannel('welcome');
  };

  const handleBotSlashResponse = (cmd: string) => {
    const rawTrim = cmd.trim();
    let lower = rawTrim.toLowerCase();

    // 0. Intelligent helper triggers for user inquiries
    if (
      lower.includes("where do i past") ||
      lower.includes("where do i paste") ||
      lower.includes("where to paste") ||
      lower.includes("where do i type") ||
      lower.includes("how do i run commands")
    ) {
      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        embeds: [
          {
            title: '📍 WHERE TO PASTE & RUN DISCORD BOT COMMANDS',
            description: 'You can run commands in **3 different places** depending on whether you are using this web simulator or your real Discord server:',
            color: 0x38BDF8,
            fields: [
              {
                name: '1️⃣ IN THIS WEB APP (BOT SIMULATOR)',
                value: '• Click into the **chat input bar at the bottom of this screen** (labeled *"Message #bot-commands..."*).\n• Paste or type any command: `!stats`, `!club`, `!ping`, `/availability poll`.\n• Press **Enter** or click the **Send (Paper Plane)** button.\n• *Shortcut:* Click any of the **Quick Test Chips** right below the input box!',
                inline: false,
              },
              {
                name: '2️⃣ IN REAL DISCORD (YOUR SERVER)',
                value: '• Open your real Discord app and go to your server.\n• Click into any channel where the bot has send permissions (e.g. `#bot-commands` or `#general`).\n• Click the Discord message input bar, paste your command (e.g. `!stats Vortex_Anchor` or `!club`), and press **Enter**.\n• For slash commands, type `/` to open the Discord slash command menu.',
                inline: false,
              },
              {
                name: '3️⃣ IN YOUR SYSTEM TERMINAL (TO START THE BOT)',
                value: '• Open Terminal / PowerShell / Command Prompt in your bot project folder.\n• Run `node deploy-commands.js` to register slash commands.\n• Run `node multiverse-bot.js` to keep the bot online 24/7.',
                inline: false,
              },
            ],
            footer: { text: 'La Academia Multiverse Hub • Click quick buttons below to test now' },
            timestamp: new Date().toISOString(),
          },
        ],
        actionButtons: [
          { id: `btn-test-ping-${Date.now()}`, label: '🧪 Test !ping', style: 'primary', action: 'run_ping' },
          { id: `btn-test-stats-${Date.now()}`, label: '📊 Test !stats', style: 'success', action: 'run_stats' },
          { id: `btn-test-club-${Date.now()}`, label: '🏆 Test !club', style: 'secondary', action: 'run_club' },
          { id: `btn-test-avail-${Date.now()}`, label: '📅 Test /avail', style: 'primary', action: 'run_avail' },
        ],
      });
      return;
    }

    if (
      lower.includes("bot isn't responding") ||
      lower.includes("bot is not responding") ||
      lower.includes("bot not responding") ||
      lower.includes("not responding") ||
      lower.includes("bot offline") ||
      lower.includes("bot won't reply") ||
      lower.includes("bot broken") ||
      lower.includes("bot not working")
    ) {
      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        embeds: [
          {
            title: '🛠️ DISCORD BOT TROUBLESHOOTING // FIX NON-RESPONSIVE BOT',
            description: 'In this web simulator, **the bot is 100% active and online**! If your bot is not responding in your **real Discord server**, here are the 4 common causes and instant fixes:',
            color: 0xF59E0B,
            fields: [
              {
                name: '🚨 1. TURN ON "MESSAGE CONTENT INTENT" (90% of failures)',
                value: 'By default, Discord hides message text from bots. Go to **[Discord Developer Portal](https://discord.com/developers/applications)** &rarr; Your App &rarr; **Bot** tab &rarr; Scroll to **Privileged Gateway Intents** &rarr; Enable **MESSAGE CONTENT INTENT** &rarr; Save & restart the bot.',
                inline: false,
              },
              {
                name: '🔌 2. WEBHOOK VS. FULL BOT APPLICATION',
                value: 'A **Discord Webhook** is one-way (can only send trial cards from the website to Discord). A webhook **cannot** listen to chat or reply to commands. You must run the bot code (`node multiverse-bot.js`) for an interactive bot.',
                inline: false,
              },
              {
                name: '⚡ 3. REGISTER SLASH COMMANDS',
                value: 'If slash commands like `/availability` or `/stats` do not appear or say *"This interaction failed"*, run `node deploy-commands.js` to register them with Discord REST API.',
                inline: false,
              },
              {
                name: '🛡️ 4. CHANNEL PERMISSIONS',
                value: 'Make sure your Bot Role has: **View Channel**, **Send Messages**, **Embed Links**, and **Read Message History** in the channel where you are typing.',
                inline: false,
              },
            ],
            footer: { text: 'Click "Open Diagnostics Checklist" below for full step-by-step walkthrough' },
            timestamp: new Date().toISOString(),
          },
        ],
        actionButtons: [
          { id: `btn-diag-${Date.now()}`, label: '🔍 Open Diagnostics Checklist', style: 'primary', action: 'open_diagnostics' },
          { id: `btn-ping-${Date.now()}`, label: '🏓 Send !ping Test', style: 'success', action: 'run_ping' },
        ],
      });
      return;
    }

    // Auto-normalize prefixless common commands (e.g. typing "stats", "club", "ping", "help")
    if (lower === 'ping') lower = '!ping';
    else if (lower === 'stats' || lower.startsWith('stats ')) lower = '!' + lower;
    else if (lower === 'club' || lower === 'clubstats') lower = '!club';
    else if (lower === 'matches' || lower === 'fixtures') lower = '!matches';
    else if (lower === 'meta') lower = '!meta';
    else if (lower === 'help') lower = '/help';
    else if (lower === 'lineup' || lower.startsWith('lineup ')) lower = '/lineup' + lower.substring(6);
    else if (lower === 'avail' || lower === 'availability') lower = '/availability poll';

    // 1. Basic Command Handler: !ping or /ping -> Pong!
    if (lower === '!ping' || lower === '/ping') {
      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        content: 'Pong! 🏓 (Roundtrip Latency: 21ms | Gateway Heartbeat: 18ms | Command Handler: Active)',
      });
      return;
    }

    // 2. AVAILABILITY COMMANDS
    if (lower.startsWith('/availability poll') || lower === '!avail poll' || lower === '/availability') {
      const inCount = availList.filter((a) => a.status === 'in').length;
      const lateCount = availList.filter((a) => a.status === 'late').length;
      const outCount = availList.filter((a) => a.status === 'out').length;

      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        content: '📅 **MATCHDAY AVAILABILITY RSVP // OFFICIAL CALLOUT**\n<@&Matchday Pings> Tonight\'s tournament lobby opens at 20:30 UTC. Confirm your status below:',
        embeds: [
          {
            title: '⚽ TONIGHT\'S MATCHDAY AVAILABILITY ROSTER',
            description: 'Click an RSVP button below to lock in your availability status for lineup selection:',
            color: 0x10B981,
            fields: [
              {
                name: `🟢 Available / In (${inCount})`,
                value: availList.filter((a) => a.status === 'in').map((a) => `• ${a.user}`).join('\n') || '*None yet*',
                inline: true,
              },
              {
                name: `🟡 Late (${lateCount})`,
                value: availList.filter((a) => a.status === 'late').map((a) => `• ${a.user} *(${a.note || '15m'})*`).join('\n') || '*None*',
                inline: true,
              },
              {
                name: `🔴 Unavailable / Out (${outCount})`,
                value: availList.filter((a) => a.status === 'out').map((a) => `• ${a.user}`).join('\n') || '*None*',
                inline: true,
              },
              {
                name: '📋 Quorum Status',
                value: inCount >= 11 ? '✅ **11+ Starters Secured!** Full squad confirmed.' : `⚠️ **Need ${11 - inCount} more starters** for full 11v11 lineup.`,
                inline: false,
              },
            ],
            footer: { text: 'La Academia Matchday Availability Protocol • React or use /avail' },
            timestamp: new Date().toISOString(),
          },
        ],
        actionButtons: [
          { id: `btn-avail-in-${Date.now()}`, label: '🟢 Available (In)', style: 'success', action: 'avail_in' },
          { id: `btn-avail-late-${Date.now()}`, label: '🟡 Arriving Late', style: 'secondary', action: 'avail_late' },
          { id: `btn-avail-out-${Date.now()}`, label: '🔴 Unavailable (Out)', style: 'danger', action: 'avail_out' },
        ],
      });
      return;
    }

    if (lower.startsWith('!avail in') || lower === '/availability in') {
      setAvailList((prev) => {
        const filtered = prev.filter((a) => a.user !== 'Manager_Cap');
        return [...filtered, { user: 'Manager_Cap', status: 'in' }];
      });
      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        content: '✅ **AVAILABILITY CONFIRMED:** <@Manager_Cap> marked as **🟢 AVAILABLE / IN** for tonight\'s matchday fixture!',
      });
      return;
    }

    if (lower.startsWith('!avail late') || lower.startsWith('/availability late')) {
      const note = cmd.replace(/(!avail late|\/availability late)/i, '').trim() || '15m late';
      setAvailList((prev) => {
        const filtered = prev.filter((a) => a.user !== 'Manager_Cap');
        return [...filtered, { user: 'Manager_Cap', status: 'late', note }];
      });
      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        content: `🟡 **LATE NOTICE FILED:** <@Manager_Cap> will arrive late (${note}). Reserve starter notified.`,
      });
      return;
    }

    if (lower.startsWith('!avail out') || lower === '/availability out') {
      setAvailList((prev) => {
        const filtered = prev.filter((a) => a.user !== 'Manager_Cap');
        return [...filtered, { user: 'Manager_Cap', status: 'out' }];
      });
      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        content: '🔴 **UNAVAILABLE RECORDED:** <@Manager_Cap> marked as **OUT** for tonight. Dev Squad reserve promoted to match sheet.',
      });
      return;
    }

    // 3. ATTENDANCE COMMANDS
    if (lower.startsWith('/attendance call') || lower === '!attendance call' || lower === '/attendance') {
      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        content: '📢 **MATCHDAY VOICE ATTENDANCE ROLL CALL**\nAll starters and bench reserves must check in now. Click below or type `!checkin`:',
        embeds: [
          {
            title: '🎙️ LIVE SESSION ATTENDANCE CHECK-IN',
            description: 'Attendance is mandatory for competitive league starting XI eligibility. Tracked for AFH tournament rosters.',
            color: 0x3B82F6,
            fields: [
              {
                name: `Checked-In Members (${checkedInUsers.length})`,
                value: checkedInUsers.map((u) => `• ✅ <@${u}>`).join('\n') || '*Waiting for check-ins*',
                inline: true,
              },
              {
                name: 'Session Info',
                value: '• Match: AFH Premier Matchday 7\n• Voice Channel: 🔊 First XI Comms\n• Cutoff: 10 mins before kickoff',
                inline: true,
              },
            ],
            footer: { text: 'Automated Attendance Protocol • /attendance' },
            timestamp: new Date().toISOString(),
          },
        ],
        actionButtons: [
          { id: `btn-checkin-${Date.now()}`, label: '✅ Check In Present', style: 'primary', action: 'checkin_btn' },
        ],
      });
      return;
    }

    if (lower === '!checkin' || lower === '/checkin') {
      if (!checkedInUsers.includes('Manager_Cap')) {
        setCheckedInUsers((prev) => [...prev, 'Manager_Cap']);
      }
      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        content: '✅ **ATTENDANCE LOGGED:** <@Manager_Cap> checked in present for voice comms! Attendance rate: **100% (Last 10 Matches)**.',
      });
      return;
    }

    if (lower.startsWith('/attendance summary') || lower === '!attendance summary') {
      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        embeds: [
          {
            title: '📊 SQUAD ATTENDANCE & PUNCTUALITY AUDIT',
            description: 'Season attendance records across First XI and Dev Squad members:',
            color: 0x10B981,
            fields: [
              { name: '🛡️ Vortex_Anchor (CB)', value: '100% (14/14 fixtures) • Iron Man', inline: true },
              { name: '⚡ Kinetix_Press (CDM)', value: '93% (13/14 fixtures)', inline: true },
              { name: '🎯 Silva_Maestro (CAM)', value: '86% (12/14 fixtures)', inline: true },
              { name: '🔥 Titan_Reyes (CB)', value: '92% (13/14 fixtures)', inline: true },
              { name: '⚡ ShadowPress_99 (CDM)', value: '100% (6/6 trials)', inline: true },
              { name: '📈 Squad Attendance Average', value: '**94.2%** (Exceeds AFH Premier threshold 85%)', inline: false },
            ],
            footer: { text: 'La Academia Attendance Directorate' },
          },
        ],
      });
      return;
    }

    // 4. LINEUPS & FORMATION COMMANDS
    if (lower.startsWith('/lineup') || lower.startsWith('!lineup') || lower.startsWith('!formation')) {
      const is4231 = lower.includes('4231');
      const is352 = lower.includes('352');
      const formationName = is4231 ? '4-2-3-1 Balanced' : is352 ? '3-5-2 High Press' : '4-3-3 Holding (Default)';

      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        content: `⚔️ **OFFICIAL MATCHDAY LINEUP POSTED** // Formation: **${formationName}**\nAll starters report to 🔊 First XI Comms.`,
        embeds: [
          {
            title: `📋 MATCHDAY STARTING XI // ${formationName.toUpperCase()}`,
            description: 'Tactical deployment for upcoming tournament matchday fixture:',
            color: 0xF59E0B,
            fields: [
              {
                name: '🧤 Goalkeeper (GK)',
                value: '• **Bastion_Wall** (90 OVR) - 6\'6" Cross Stopper',
                inline: false,
              },
              {
                name: '🛡️ Defense (Back 4)',
                value: '• **LB:** Aero_Wing (88 OVR)\n• **CB:** **Vortex_Anchor** [C] (92 OVR, Aerial+)\n• **CB:** **Iron_Colossus_27** (88 OVR, Anchor Keystone)\n• **RB:** Blitz_Pace (89 OVR)',
                inline: false,
              },
              {
                name: '⚡ Midfield Engine (Holding & Playmaker)',
                value: '• **CDM:** **Kinetix_Press** (91 OVR, Relentless+)\n• **CDM / CM:** **ShadowPress_99** (87 OVR, Intercept+)\n• **CAM:** **Silva_Maestro** (93 OVR, Incisive Pass+)',
                inline: false,
              },
              {
                name: '🎯 Attack (Front 3)',
                value: '• **LW:** Shadow_Drift (89 OVR)\n• **ST:** **Grimm_Apex** (92 OVR, Finisher)\n• **RW:** Solar_Volt (88 OVR)',
                inline: false,
              },
              {
                name: '💺 Bench & Reserves',
                value: '• Titan_Reyes (CB), Solari_Nexus (CAM), Valiant_Anchor (CB)',
                inline: false,
              },
            ],
            footer: { text: 'La Academia Matchday Tactical Sheet • /lineup' },
            timestamp: new Date().toISOString(),
          },
        ],
        actionButtons: [
          { id: `btn-confirm-lineup-${Date.now()}`, label: '✅ Confirm Starter Spot', style: 'primary', action: 'confirm_starter' },
          { id: `btn-tactics-${Date.now()}`, label: 'View Positional Directives', style: 'secondary', action: 'view_tactics' },
        ],
      });
      return;
    }

    // 5. ROLE ASSIGNMENT ASSISTANCE COMMANDS
    if (lower.startsWith('/role assist') || lower.startsWith('!role assist') || lower.startsWith('/role suggest')) {
      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        content: '🤖 **ROLE ASSIGNMENT ASSISTANT // RECRUIT ONBOARDING WIZARD**\nAnalyzing your player profile, physical attributes, and competitive preferences...',
        embeds: [
          {
            title: '✨ RECOMMENDED ROLES FOR YOUR PROFILE',
            description: 'Based on your playstyle and availability, we have generated your customized role bundle:',
            color: 0x8B5CF6,
            fields: [
              {
                name: '1. Primary Position Role: `🛡️ Center Back (CB)`',
                value: 'Recommended because you indicated 6\'3"+ physical height and Aerial clearance focus. Grants access to `#defense-tactics`.',
                inline: false,
              },
              {
                name: '2. Notification Role: `🔔 Matchday Pings`',
                value: 'Ensures you get tagged when starters are called for AFH league tournaments and fixtures.',
                inline: false,
              },
              {
                name: '3. Community Role: `⚽ FC27 Pro Clubs` & `🌐 Crossplay Star`',
                value: 'Grants access to 11v11 lobby chat and cross-platform matchmaking squad lobbies.',
                inline: false,
              },
            ],
            footer: { text: 'Role Assistant Engine • Click button to apply all recommended roles' },
          },
        ],
        actionButtons: [
          { id: `btn-apply-rec-roles-${Date.now()}`, label: '✨ Apply Recommended Roles', style: 'success', action: 'apply_rec_roles' },
          { id: `btn-open-role-mgr-${Date.now()}`, label: 'Open Role Manager', style: 'secondary', action: 'open_roles' },
        ],
      });
      return;
    }

    if (lower.startsWith('/role audit') || lower.startsWith('!role audit')) {
      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        embeds: [
          {
            title: '🔍 SERVER ROLE HIERARCHY AUDIT REPORT',
            description: 'Staff inspection of member role assignments and missing mandatory tags:',
            color: 0xEF4444,
            fields: [
              {
                name: '⚠️ Missing Position Roles (2 Members)',
                value: '• <@Iron_Colossus_27> (Needs `Center Back (CB)`)\n• <@ShadowPress_99> (Needs `Defensive Mid (CDM)`)',
                inline: false,
              },
              {
                name: '⚠️ Missing Notification Pings (1 Member)',
                value: '• <@Titan_Reyes> (Missing `Matchday Pings`)',
                inline: false,
              },
              {
                name: '✅ Fully Configured Members',
                value: '• Manager_Cap, Vortex_Anchor, Silva_Maestro (100% compliant)',
                inline: false,
              },
            ],
            footer: { text: 'Manager Role Audit • Click below to auto-assign missing roles' },
          },
        ],
        actionButtons: [
          { id: `btn-fix-missing-roles-${Date.now()}`, label: '⚡ Auto-Assign Missing Roles', style: 'primary', action: 'auto_fix_roles' },
        ],
      });
      return;
    }

    // Role commands: !role join, !role leave, !roles
    if (lower.startsWith('!role join') || lower.startsWith('/role join')) {
      const roleQuery = lower.replace(/(!role join|\/role join)/i, '').trim() || 'Center Back (CB)';
      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        content: `✅ **ROLE ASSIGNED:** Successfully granted role **${roleQuery}** to <@Manager_Cap>! Notification channel access unlocked.`,
      });
      return;
    }

    if (lower.startsWith('!role leave') || lower.startsWith('/role leave')) {
      const roleQuery = lower.replace(/(!role leave|\/role leave)/i, '').trim() || 'Matchday Pings';
      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        content: `✅ **ROLE REMOVED:** Removed role **${roleQuery}** from <@Manager_Cap>'s profile.`,
      });
      return;
    }

    if (lower === '!roles' || lower === '/roles') {
      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        embeds: [
          {
            title: '📋 LA ACADEMIA // SELF-ASSIGNABLE ROLE DIRECTORY',
            description: 'Use `!role join <role>` or click buttons in **#role-select** to toggle:',
            color: 0xE11D48,
            fields: [
              { name: '⚽ Positions', value: '`Center Back (CB)`, `Defensive Mid (CDM)`, `Attacking Mid (CAM)`, `Striker (ST)`', inline: false },
              { name: '🔔 Notifications', value: '`Matchday Pings`, `Scrim Alerts`, `Club Announcements`', inline: false },
              { name: '🎮 Interests & Platform', value: '`FC27 Pro Clubs`, `Competitive AFH League`, `Crossplay Star`', inline: false },
            ],
            footer: { text: 'Type !role join <role> to self-assign' },
          },
        ],
      });
      return;
    }

    // Customizable Welcome Message Handler
    if (lower.startsWith('/setwelcome') || lower.startsWith('!setwelcome')) {
      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        embeds: [
          {
            title: '⚙️ WELCOME MESSAGE CONFIGURATION UPDATED',
            description: 'Custom welcome message template successfully saved for new member entrance (`guildMemberAdd`).',
            color: 0x10B981,
            fields: [
              { name: 'Target Channel', value: '#welcome-lobby', inline: true },
              { name: 'Custom Template', value: '`👋 Welcome {user} to {server}! You are recruit #{memberCount}. Check #trial-submission!`', inline: false },
              { name: 'Dynamic Tags Supported', value: '• `{user}` Mention\n• `{username}` Handle\n• `{server}` Server Name\n• `{memberCount}` Total Members', inline: false },
            ],
            footer: { text: 'Automated Welcome System Active' },
          },
        ],
      });
      return;
    }

    if (lower === '/trial' || lower === '/trial submit') {
      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        embeds: [
          {
            title: '📋 OPEN RECRUITMENT TRIAL CARD DISPATCH',
            description: 'To submit your trial card for **LA ACADEMIA Pro Clubs Multiverse**, use the in-app builder or post your specs here.',
            color: 0xE11D48,
            fields: [
              {
                name: 'Scouting Needs',
                value: '• **CB Anchor:** 6\'3"+ with Aerial+ and vocal mic.\n• **CDM Press:** Intercept+ / Relentless+ with 1.5s ball retention.\n• **CAM / CM:** Tempo vision and half-space spacing.',
              },
            ],
            footer: { text: 'La Academia Multiverse Scouting Gateway' },
          },
        ],
        actionButtons: [
          {
            id: 'open-card-builder',
            label: 'Open FC27 Card Builder',
            style: 'primary',
            action: 'open_builder',
          },
        ],
      });
    } else if (lower.startsWith('/roster')) {
      const tierParam = lower.includes('dev') ? 'dev-squad' : lower.includes('trial') ? 'trial-pool' : 'first-xi';
      const tierTitle = tierParam === 'first-xi' ? 'FIRST XI // PREMIER SQUAD' : tierParam === 'dev-squad' ? 'LA ACADEMIA // DEV SQUAD' : 'TRIAL EVALUATION POOL';
      const squadPlayers = players.filter((p) => p.tier === tierParam);

      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        embeds: [
          {
            title: `⚔️ SQUAD ARCHITECTURE: ${tierTitle}`,
            description: `Active roster capacity: **${squadPlayers.length} players registered**.`,
            color: tierParam === 'first-xi' ? 0xF59E0B : tierParam === 'dev-squad' ? 0xE11D48 : 0x3B82F6,
            fields: squadPlayers.map((p) => ({
              name: `${p.position} • ${p.gamertag} (${p.overallRating} OVR)`,
              value: `Build: \`${p.archetype}\` | Specs: ${p.height}, ${p.weight} | Mic: ${p.vocalMic ? '✅' : '🔇'}\nExp: *${p.competitiveExperience.slice(0, 75)}...*`,
              inline: false,
            })),
            footer: { text: 'La Academia Multiverse Roster Registry' },
          },
        ],
      });
    } else if (lower === '/tactics') {
      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        embeds: [
          {
            title: '🛡️ LA ACADEMIA // COMPETITIVE TACTICAL DIRECTIVES',
            description: 'Mandatory tactical directives for First XI & Dev Squad league fixtures:',
            color: 0xE11D48,
            fields: [
              {
                name: 'Center Backs (CB) - Anchor Protocol',
                value: 'Hold the offside trap line. Win 100% of aerial clearance battles. Vocal defensive line coordination on set-pieces.',
              },
              {
                name: 'Defensive Midfielders (CDM) - Relentless Press Protocol',
                value: 'Relentless press coverage. Retain possession under 1v2 counter-press. Lay off to CAM in under 1.5s.',
              },
              {
                name: 'Attacking Midfielders (CAM/CM) - Tactical Spacing',
                value: 'Occupy the half-spaces between opposition CDM and CB. High-tempo circulation and late third-man edge-of-the-box runs.',
              },
            ],
            footer: { text: 'La Academia Playbook v27' },
          },
        ],
      });
    } else if (lower.startsWith('!clear') || lower.startsWith('/clear') || lower.startsWith('!purge')) {
      // CLEAR / PURGE MESSAGES COMMAND
      const parts = cmd.trim().split(/\s+/);
      const amountStr = parts[1] || '5';
      const amount = parseInt(amountStr, 10);
      if (isNaN(amount) || amount < 1) {
        onSendMessage({
          channelId: activeChannel,
          author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
          content: '⚠️ **Usage:** `!clear <number>` (e.g. `!clear 5` to delete last 5 messages)',
        });
        return;
      }

      const countToClear = Math.min(amount, 50);
      if (onClearMessages) {
        onClearMessages(activeChannel, countToClear);
      }

      onSendMessage({
        channelId: activeChannel,
        author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
        embeds: [
          {
            title: '🧹 CHANNEL MESSAGES CLEARED',
            description: `Successfully purged the last **${countToClear}** messages from <#${activeChannel}>.`,
            color: 0x10B981,
            fields: [
              { name: 'Channel', value: `#${activeChannel}`, inline: true },
              { name: 'Purged By', value: '<@Manager_Cap> (Staff)', inline: true },
              { name: 'Message Count', value: `${countToClear} messages`, inline: true },
            ],
            footer: { text: 'Bulk message deletion executed • Audit entry created' },
            timestamp: new Date().toISOString(),
          },
        ],
      });
      return;
    } else if (lower.startsWith('!kick') || lower.startsWith('/kick')) {
      // KICK COMMAND: !kick @user reason
      const parts = cmd.trim().split(/\s+/);
      const targetArg = parts[1];
      const reasonArg = parts.slice(2).join(' ') || 'Unsportsmanlike conduct & scrimmage insubordination';

      if (!targetArg) {
        onSendMessage({
          channelId: activeChannel,
          author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
          embeds: [
            {
              title: '⚠️ USAGE: !kick @user reason',
              description: 'Removes a member from the server with a logged disciplinary cause:',
              color: 0xF59E0B,
              fields: [
                { name: 'Prefix Command', value: '`!kick @user reason`', inline: true },
                { name: 'Slash Command', value: '`/kick target:@user reason:...`', inline: true },
                { name: 'Example', value: '`!kick @Viper_Striker99 Unexcused tournament no-show`', inline: false },
              ],
              footer: { text: 'Requires Staff / Kick Members permission' },
            },
          ],
        });
        return;
      }

      const targetUser = targetArg.replace(/[<@!>]/g, '');
      if (onModerateUser) {
        onModerateUser('kick', targetUser, reasonArg);
      }

      onSendMessage({
        channelId: activeChannel,
        author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
        content: `👢 **MEMBER KICKED:** <@${targetUser}> has been removed from **LA ACADEMIA**.`,
        embeds: [
          {
            title: '🛡️ DISCIPLINARY SANCTION // MEMBER KICKED',
            description: `User **${targetUser}** was kicked by staff moderation.`,
            color: 0xEF4444,
            fields: [
              { name: 'Target User', value: `<@${targetUser}>`, inline: true },
              { name: 'Enforcing Staff', value: '<@Manager_Cap> (Staff)', inline: true },
              { name: 'Sanction Type', value: '👢 Guild Kick (Can rejoin via invite)', inline: true },
              { name: 'Disciplinary Reason', value: reasonArg, inline: false },
            ],
            footer: { text: `Audit logged to #mod-logs • Action ID #${Date.now().toString().slice(-4)}` },
            timestamp: new Date().toISOString(),
          },
        ],
      });
      return;
    } else if (lower.startsWith('!ban') || lower.startsWith('/ban')) {
      // BAN COMMAND: !ban @user reason
      const parts = cmd.trim().split(/\s+/);
      const targetArg = parts[1];
      const reasonArg = parts.slice(2).join(' ') || 'Severe match-fixing, toxicity, or tournament breach';

      if (!targetArg) {
        onSendMessage({
          channelId: activeChannel,
          author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
          embeds: [
            {
              title: '⚠️ USAGE: !ban @user reason',
              description: 'Permanently blacklists a member and revokes all multiverse squad access:',
              color: 0x991B1B,
              fields: [
                { name: 'Prefix Command', value: '`!ban @user reason`', inline: true },
                { name: 'Slash Command', value: '`/ban target:@user reason:...`', inline: true },
                { name: 'Example', value: '`!ban @ToxicRecruit Exploiting glitch during league cup`', inline: false },
              ],
              footer: { text: 'Requires Administrator / Ban Members permission' },
            },
          ],
        });
        return;
      }

      const targetUser = targetArg.replace(/[<@!>]/g, '');
      if (onModerateUser) {
        onModerateUser('ban', targetUser, reasonArg);
      }

      onSendMessage({
        channelId: activeChannel,
        author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
        content: `🔨 **MEMBER PERMANENTLY BANNED:** <@${targetUser}> has been blacklisted from the server.`,
        embeds: [
          {
            title: '⚖️ SERVER BLACKLIST // PERMANENT BAN EXECUTED',
            description: `User **${targetUser}** has been permanently banned from **LA ACADEMIA** and all competitive divisions.`,
            color: 0x991B1B,
            fields: [
              { name: 'Target User', value: `<@${targetUser}>`, inline: true },
              { name: 'Enforcing Staff', value: '<@Manager_Cap> (Admin)', inline: true },
              { name: 'Sanction Type', value: '🔨 Permanent Ban & Role Strip', inline: true },
              { name: 'Disciplinary Reason', value: reasonArg, inline: false },
            ],
            footer: { text: `Irrevocable • Action archived in #mod-logs` },
            timestamp: new Date().toISOString(),
          },
        ],
      });
      return;
    } else if (lower.startsWith('!mute') || lower.startsWith('/mute') || lower.startsWith('!timeout') || lower.startsWith('/timeout')) {
      // MUTE / TIMEOUT COMMAND: !mute @user [duration] [reason]
      const parts = cmd.trim().split(/\s+/);
      const targetArg = parts[1];

      if (!targetArg) {
        onSendMessage({
          channelId: activeChannel,
          author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
          embeds: [
            {
              title: '⚠️ USAGE: !mute @user [duration] [reason]',
              description: 'Places a member on communication timeout to restrict text and voice channel access:',
              color: 0xF59E0B,
              fields: [
                { name: 'Prefix Command', value: '`!mute @user [duration] [reason]`', inline: true },
                { name: 'Slash Command', value: '`/mute target:@user duration:... reason:...`', inline: true },
                { name: 'Supported Durations', value: '`60s`, `5m`, `10m`, `1h`, `1d`, `7d` (Default: `10m`)', inline: false },
                { name: 'Example', value: '`!mute @Viper_Striker99 10m Voice comms spam & matchday toxicity`', inline: false },
              ],
              footer: { text: 'Requires Staff / Timeout Members (Moderate Members) permission' },
            },
          ],
        });
        return;
      }

      const targetUser = targetArg.replace(/[<@!>]/g, '');
      const rawArgs = parts.slice(2);
      let durationStr = '10m';
      let reasonIndex = 0;
      if (rawArgs[0] && /^(\d+)(s|m|h|d|w)$/i.test(rawArgs[0])) {
        durationStr = rawArgs[0];
        reasonIndex = 1;
      }
      const reasonArg = rawArgs.slice(reasonIndex).join(' ') || 'Disciplinary violation & matchday disruption';

      if (onModerateUser) {
        onModerateUser('mute', targetUser, reasonArg, durationStr);
      }

      onSendMessage({
        channelId: activeChannel,
        author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
        content: `🔇 **MEMBER MUTED:** <@${targetUser}> has been placed on timeout for **${durationStr}**.`,
        embeds: [
          {
            title: '🛡️ DISCIPLINARY SANCTION // MEMBER TIMED OUT',
            description: `User **${targetUser}** has been placed in timeout by staff moderation. Cannot send messages or speak in voice comms.`,
            color: 0xF59E0B,
            fields: [
              { name: 'Target User', value: `<@${targetUser}>`, inline: true },
              { name: 'Duration', value: `⏱️ **${durationStr}**`, inline: true },
              { name: 'Enforcing Staff', value: '<@Manager_Cap> (Staff)', inline: true },
              { name: 'Sanction Type', value: '🔇 Server Timeout (Communication Block)', inline: true },
              { name: 'Disciplinary Reason', value: reasonArg, inline: false },
            ],
            footer: { text: `Audit logged to #mod-logs • Action ID #${Date.now().toString().slice(-4)}` },
            timestamp: new Date().toISOString(),
          },
        ],
      });
      return;
    } else if (lower.startsWith('!unmute') || lower.startsWith('/unmute')) {
      // UNMUTE COMMAND: !unmute @user [reason]
      const parts = cmd.trim().split(/\s+/);
      const targetArg = parts[1];

      if (!targetArg) {
        onSendMessage({
          channelId: activeChannel,
          author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
          embeds: [
            {
              title: '⚠️ USAGE: !unmute @user [reason]',
              description: 'Removes active timeout and immediately restores text & voice chat permissions:',
              color: 0x10B981,
              fields: [
                { name: 'Prefix Command', value: '`!unmute @user [reason]`', inline: true },
                { name: 'Slash Command', value: '`/unmute target:@user reason:...`', inline: true },
                { name: 'Example', value: '`!unmute @Viper_Striker99 Timeout served & apology accepted`', inline: false },
              ],
              footer: { text: 'Requires Staff / Moderate Members permission' },
            },
          ],
        });
        return;
      }

      const targetUser = targetArg.replace(/[<@!>]/g, '');
      const reasonArg = parts.slice(2).join(' ') || 'Timeout lifted by staff moderation';

      if (onModerateUser) {
        onModerateUser('unmute', targetUser, reasonArg);
      }

      onSendMessage({
        channelId: activeChannel,
        author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
        content: `🔊 **TIMEOUT REMOVED:** <@${targetUser}> has been unmuted.`,
        embeds: [
          {
            title: '✨ SANCTION LIFTED // MEMBER UNMUTED',
            description: `User **${targetUser}** has had their timeout removed. Full voice and chat permissions have been restored.`,
            color: 0x10B981,
            fields: [
              { name: 'Target User', value: `<@${targetUser}>`, inline: true },
              { name: 'Enforcing Staff', value: '<@Manager_Cap> (Staff)', inline: true },
              { name: 'Action', value: '🔊 Timeout Revoked (Full Access)', inline: true },
              { name: 'Reason', value: reasonArg, inline: false },
            ],
            footer: { text: `Audit logged to #mod-logs • Permissions Restored` },
            timestamp: new Date().toISOString(),
          },
        ],
      });
      return;
    } else if (lower === '/modlogs' || lower === '!modlogs') {
      const logs = moderationLogs || [];
      onSendMessage({
        channelId: activeChannel,
        author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
        embeds: [
          {
            title: '📜 STAFF MODERATION AUDIT LOGS',
            description: `Recorded **${logs.length}** disciplinary actions in server ledger:`,
            color: 0xEF4444,
            fields: logs.slice(0, 6).map((l, i) => ({
              name: `${i + 1}. [${l.action.toUpperCase()}] ${l.targetUser ? `@${l.targetUser}` : `#${l.channelId || 'general'}`}`,
              value: `Staff: **${l.actor}** | Reason: *${l.reason}* | Time: ${new Date(l.timestamp).toLocaleTimeString()}`,
              inline: false,
            })),
            footer: { text: 'La Academia Staff Security & Audit Stream' },
            timestamp: new Date().toISOString(),
          },
        ],
      });
      return;
    } else if (lower.startsWith('!stats') || lower.startsWith('/stats')) {
      const parts = cmd.trim().split(/\s+/);
      const query = parts[1] ? parts[1].replace(/[<@!>]/g, '') : 'Vortex_Anchor';
      const qLower = query.toLowerCase();

      // Database of FC27 verified player metrics
      const knownProfiles: Record<string, any> = {
        vortex_anchor: {
          gamertag: 'Vortex_Anchor',
          eaId: 'VortexAnchor_FC',
          position: 'Center Back (CB)',
          rating: 92,
          caps: 148,
          amr: 9.2,
          tackles: '382 (86.4%)',
          passes: '1,840 (89.1%)',
          cleanSheets: 68,
          motm: 34,
          playstyles: '`Aerial+` `Anticipate+` `Bruiser` `Block`',
          tier: 'First XI (Championship)',
        },
        kinetix_press: {
          gamertag: 'Kinetix_Press',
          eaId: 'Kinetix_Press_EA',
          position: 'Defensive Mid (CDM)',
          rating: 91,
          caps: 139,
          amr: 9.1,
          tackles: '412 (84.8%)',
          passes: '2,410 (92.4%)',
          cleanSheets: 61,
          motm: 28,
          playstyles: '`Intercept+` `Relentless+` `Pinged Pass+`',
          tier: 'First XI (Championship)',
        },
        silva_maestro: {
          gamertag: 'Silva_Maestro',
          eaId: 'Silva_Maestro_FC',
          position: 'Attacking Mid (CAM)',
          rating: 90,
          caps: 131,
          amr: 9.0,
          tackles: '84 (68.2%)',
          passes: '2,190 (91.8%)',
          cleanSheets: 42,
          motm: 31,
          playstyles: '`Incisive Pass+` `Tiki Taka+` `First Touch+`',
          tier: 'First XI (Championship)',
        },
        grimm_apex: {
          gamertag: 'Grimm_Apex',
          eaId: 'GrimmApex_ST',
          position: 'Striker (ST)',
          rating: 91,
          caps: 142,
          amr: 8.9,
          tackles: '32 (54.1%)',
          passes: '1,120 (83.6%)',
          cleanSheets: 0,
          motm: 39,
          playstyles: '`Finesse Shot+` `Aerial+` `Acrobatic`',
          tier: 'First XI (Championship)',
        },
        titan_reyes: {
          gamertag: 'Titan_Reyes',
          eaId: 'Titan_Reyes_FC',
          position: 'Center Back (CB)',
          rating: 89,
          caps: 94,
          amr: 8.7,
          tackles: '224 (81.2%)',
          passes: '1,040 (86.2%)',
          cleanSheets: 38,
          motm: 14,
          playstyles: '`Bruiser+` `Anticipate` `Aerial`',
          tier: 'Dev Squad (Reserves)',
        },
        iron_colossus_27: {
          gamertag: 'Iron_Colossus_27',
          eaId: 'IronColossus_27',
          position: 'Center Back (CB)',
          rating: 88,
          caps: 62,
          amr: 8.5,
          tackles: '154 (79.8%)',
          passes: '680 (84.1%)',
          cleanSheets: 24,
          motm: 8,
          playstyles: '`Aerial+` `Anticipate+` `Bruiser`',
          tier: 'Trial Pool',
        },
        shadowpress_99: {
          gamertag: 'ShadowPress_99',
          eaId: 'ShadowPress_99',
          position: 'Defensive Mid (CDM)',
          rating: 87,
          caps: 54,
          amr: 8.6,
          tackles: '168 (82.1%)',
          passes: '890 (88.7%)',
          cleanSheets: 21,
          motm: 9,
          playstyles: '`Intercept+` `Relentless` `Pinged Pass`',
          tier: 'Trial Pool',
        },
        bastion_wall: {
          gamertag: 'Bastion_Wall',
          eaId: 'BastionWall_GK',
          position: 'Goalkeeper (GK)',
          rating: 90,
          caps: 118,
          amr: 8.8,
          tackles: '14 (92.8%)',
          passes: '840 (81.4%)',
          cleanSheets: 56,
          motm: 19,
          playstyles: '`Far Reach+` `Cross Claimer+` `Rush Out`',
          tier: 'First XI (Championship)',
        },
      };

      const foundKey = Object.keys(knownProfiles).find(k => k.includes(qLower) || qLower.includes(k));
      const profile = foundKey ? knownProfiles[foundKey] : {
        gamertag: query,
        eaId: `${query}_FC`,
        position: 'Scouted Recruit',
        rating: 86,
        caps: 44,
        amr: 8.3,
        tackles: '98 (77.5%)',
        passes: '510 (85.0%)',
        cleanSheets: 14,
        motm: 4,
        playstyles: '`Anticipate` `Aerial` `Bruiser`',
        tier: 'Trial Candidate',
      };
      
      onSendMessage({
        channelId: activeChannel,
        author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
        embeds: [
          {
            title: `📊 FC27 PLAYER STATS // ${profile.gamertag.toUpperCase()}`,
            description: `Verified career telemetry from **EA Sports FC27 Pro Clubs Network**:`,
            color: 0x10B981,
            fields: [
              { name: 'Position', value: `🛡️ ${profile.position}`, inline: true },
              { name: 'OVR Rating', value: `⭐ ${profile.rating} OVR`, inline: true },
              { name: 'Squad Tier', value: `🏅 ${profile.tier}`, inline: true },
              { name: 'Matches (Caps)', value: `${profile.caps} Matches`, inline: true },
              { name: 'Average Rating (AMR)', value: `📈 ${profile.amr} / 10.0`, inline: true },
              { name: 'Tackles Won', value: `${profile.tackles}`, inline: true },
              { name: 'Pass Accuracy', value: `${profile.passes}`, inline: true },
              { name: 'Clean Sheets', value: `${profile.cleanSheets} Clean Sheets`, inline: true },
              { name: 'MOTM Awards', value: `${profile.motm} Awards`, inline: true },
              { name: 'Equipped PlayStyles', value: profile.playstyles, inline: false },
            ],
            footer: { text: `Source: /api/fc27/player/stats?gamertag=${encodeURIComponent(profile.gamertag)} • Crossplay Gen 5` },
            timestamp: new Date().toISOString(),
          },
        ],
      });
      return;
    } else if (lower === '!club' || lower === '/club' || lower === '!clubstats' || lower === '/clubstats') {
      onSendMessage({
        channelId: activeChannel,
        author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
        embeds: [
          {
            title: '🏆 LA ACADEMIA FC27 // OFFICIAL PRO CLUBS TELEMETRY',
            description: 'Live club metrics from EA Sports FC27 Pro Clubs API (`/api/fc27/club/stats`):',
            color: 0xE11D48,
            fields: [
              { name: 'Division Level', value: 'Division 1 (Championship Tier)', inline: true },
              { name: 'Skill Rating', value: '2,480 SR', inline: true },
              { name: 'Overall Record', value: '142W - 18D - 24L (77.2% Win Rate)', inline: true },
              { name: 'Goals (GF / GA)', value: '512 Scored / 168 Conceded (+344 GD)', inline: true },
              { name: 'Clean Sheets', value: '76 Clean Sheets', inline: true },
              { name: 'Form & Streak', value: '🔥 4-Game Win Streak • W-W-W-D-W', inline: true },
              { name: 'Platform', value: 'Crossplay (PC / PS5 / Xbox Series X)', inline: true },
              { name: 'Registered Squad', value: '28 Players (First XI & Dev Squad)', inline: true },
            ],
            footer: { text: 'Source: /api/fc27/club/stats • Verified EA Endpoint' },
            timestamp: new Date().toISOString(),
          },
        ],
      });
      return;
    } else if (lower === '!matches' || lower === '/matches' || lower === '!fixtures' || lower === '/fixtures') {
      onSendMessage({
        channelId: activeChannel,
        author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
        embeds: [
          {
            title: '📅 RECENT MATCHDAY RESULTS // LA ACADEMIA FC27',
            description: 'Recent league & cup match fixtures against rival Pro Clubs (`/api/fc27/club/matches`):',
            color: 0x3B82F6,
            fields: [
              { name: '🟢 4 - 1 vs Viper Esports FC', value: 'AFH Premier Division • Top: Vortex_Anchor (9.6 AMR • 7 Clearances)', inline: false },
              { name: '🟢 3 - 0 vs Apex Syndicate', value: 'Major Tournament Cup • Top: Kinetix_Press (9.4 AMR • 11 Interceptions)', inline: false },
              { name: '🟡 2 - 2 vs Titanium FC', value: 'AFH Premier Division • Top: Silva_Maestro (9.1 AMR • 2 Key Assists)', inline: false },
              { name: '🟢 5 - 0 vs Redline Ultras', value: 'Squad Scrim • Top: Grimm_Apex (9.8 AMR • Hat-trick 3 Goals)', inline: false },
              { name: '🟢 3 - 1 vs Overlord Gaming', value: 'AFH Premier Division • Top: ShadowPress_99 (8.9 AMR • 8 Tackles)', inline: false },
            ],
            footer: { text: 'Source: /api/fc27/club/matches • Live Matchday Stream' },
            timestamp: new Date().toISOString(),
          },
        ],
      });
      return;
    } else if (lower.startsWith('!top') || lower.startsWith('/top') || lower.startsWith('!leaderboard') || lower.startsWith('/leaderboard')) {
      const parts = cmd.trim().split(/\s+/);
      const cat = parts[1] ? parts[1].toLowerCase() : 'amr';
      const catTitle = cat === 'goals' ? 'Top Goalscorers' : cat === 'assists' ? 'Top Assists' : cat === 'tackles' ? 'Tackles Won' : cat === 'cleansheets' ? 'Clean Sheets' : 'Average Match Rating (AMR)';

      onSendMessage({
        channelId: activeChannel,
        author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
        embeds: [
          {
            title: `🏆 FC27 ROSTER LEADERBOARD // ${catTitle.toUpperCase()}`,
            description: `Official squad metrics from \`/api/fc27/leaderboard?category=${cat}\`:`,
            color: 0xF59E0B,
            fields: [
              { name: '🥇 1. Vortex_Anchor (CB)', value: '⭐ 9.2 AMR • 148 Caps • 382 Tackles • 68 Clean Sheets', inline: false },
              { name: '🥈 2. Kinetix_Press (CDM)', value: '⭐ 9.1 AMR • 139 Caps • 412 Tackles • 31 Assists', inline: false },
              { name: '🥉 3. Silva_Maestro (CAM)', value: '⭐ 9.0 AMR • 131 Caps • 46 Goals • 72 Assists', inline: false },
              { name: '4. Grimm_Apex (ST)', value: '⭐ 8.9 AMR • 142 Caps • 114 Goals • 39 MOTM', inline: false },
              { name: '5. Bastion_Wall (GK)', value: '⭐ 8.8 AMR • 118 Caps • 56 Clean Sheets', inline: false },
            ],
            footer: { text: 'Filter via !top amr | !top goals | !top assists | !top tackles' },
            timestamp: new Date().toISOString(),
          },
        ],
      });
      return;
    } else if (lower === '!meta' || lower === '/meta') {
      onSendMessage({
        channelId: activeChannel,
        author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
        embeds: [
          {
            title: '🧠 FC27 PRO CLUBS META BUILDS // TITLE UPDATE 3.1',
            description: 'Optimal competitive archetypes and mandatory PlayStyles (`/api/fc27/meta`):',
            color: 0x8B5CF6,
            fields: [
              {
                name: '🛡️ Center Back (CB): Keystone Anchor',
                value: '• **Specs:** 6\'3" // 194 lbs\n• **PlayStyles:** `Aerial+`, `Anticipate+`, `Bruiser`\n• **Directive:** Hold high offside line, 95 Defending cap',
                inline: false,
              },
              {
                name: '⚡ Defensive Mid (CDM): Relentless Ball-Winning Pivot',
                value: '• **Specs:** 5\'11" // 165 lbs\n• **PlayStyles:** `Intercept+`, `Relentless+`, `Pinged Pass+`\n• **Directive:** Central passing lane interception, outlet to CAM',
                inline: false,
              },
              {
                name: '🎯 Attacking Mid (CAM): Half-Space Tempo Agility',
                value: '• **Specs:** 5\'9" // 152 lbs\n• **PlayStyles:** `Incisive Pass+`, `Tiki Taka+`, `First Touch+`\n• **Directive:** Quick turn & through-ball trigger, edge of box threat',
                inline: false,
              },
              {
                name: '🔥 Striker (ST): Apex Aerial Finisher',
                value: '• **Specs:** 6\'1" // 178 lbs\n• **PlayStyles:** `Finesse Shot+`, `Aerial+`, `Power Shot`\n• **Directive:** Near-post corner runs, back-to-goal layoffs',
                inline: false,
              },
            ],
            footer: { text: 'La Academia Meta Strategy Directorate • /api/fc27/meta' },
            timestamp: new Date().toISOString(),
          },
        ],
      });
      return;
    } else {
      // Default help directory
      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        embeds: [
          {
            title: '🤖 LA ACADEMIA BOT // COMMAND DIRECTORY',
            description: 'Full list of slash commands, FC27 Stats API commands, moderation actions, and prefix (`!`) triggers:',
            color: 0x94A3B8,
            fields: [
              { name: '⚽ FC27 STATS API COMMANDS', value: '• `!stats [gamertag]` / `/stats` — Player career telemetry & PlayStyles\n• `!club` / `/club` — Division 1 record, streak & win rate\n• `!matches` / `/matches` — Recent fixture scorelines & star performers\n• `!top [amr|goals|tackles]` — Squad performance leaderboard\n• `!meta` / `/meta` — Title Update 3.1 Pro Clubs meta builds', inline: false },
              { name: '🛡️ STAFF MODERATION', value: '• `!kick @user [reason]` / `/kick` — Disciplinary guild kick\n• `!ban @user [reason]` / `/ban` — Permanent ban & role strip\n• `!mute @user [duration] [reason]` / `/mute` — Timeout member (60s to 7d)\n• `!unmute @user` / `/unmute` — Lift member timeout\n• `!clear [number]` / `/clear` — Bulk purge 1-50 channel messages\n• `/modlogs` — Disciplinary incident audit stream', inline: false },
              { name: '📅 MATCHDAY OPERATIONS', value: '• `/availability poll` / `!avail in` — RSVP: in, late, or out\n• `/attendance call` / `!checkin` — Voice comms roll call check-in\n• `/lineup [433|4231|352]` — Generate pitch formation', inline: false },
              { name: '🏷️ ROLES & COMMUNITY', value: '• `/role assist` & `/role audit` — Self-assign onboarding & audit\n• `!role join [role]` / `!roles` — Self-assign positions & pings\n• `/setwelcome` — Configure entrance greeting template\n• `/trial` & `/roster [tier]` — Submit trial card or view matrix', inline: false },
            ],
            footer: { text: 'Academia Bot #0027 • FC27 Pro Clubs Multiverse' },
          },
        ],
      });
    }
  };

  const handleActionButtonClick = (btn: { id: string; action: string; playerId?: string; label?: string }) => {
    setExecutedButtonIds((prev) => [...prev, btn.id]);

    if (btn.action === 'avail_in') {
      setAvailList((prev) => [...prev.filter((a) => a.user !== 'Manager_Cap'), { user: 'Manager_Cap', status: 'in' }]);
      onSendMessage({
        channelId: activeChannel,
        author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
        content: '🟢 **RSVP RECORDED:** <@Manager_Cap> confirmed **AVAILABLE** for tonight\'s matchday!',
      });
    } else if (btn.action === 'avail_late') {
      setAvailList((prev) => [...prev.filter((a) => a.user !== 'Manager_Cap'), { user: 'Manager_Cap', status: 'late', note: '15m late' }]);
      onSendMessage({
        channelId: activeChannel,
        author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
        content: '🟡 **RSVP RECORDED:** <@Manager_Cap> marked as **LATE (15m)**.',
      });
    } else if (btn.action === 'avail_out') {
      setAvailList((prev) => [...prev.filter((a) => a.user !== 'Manager_Cap'), { user: 'Manager_Cap', status: 'out' }]);
      onSendMessage({
        channelId: activeChannel,
        author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
        content: '🔴 **RSVP RECORDED:** <@Manager_Cap> marked as **OUT** for tonight.',
      });
    } else if (btn.action === 'checkin_btn') {
      if (!checkedInUsers.includes('Manager_Cap')) setCheckedInUsers((prev) => [...prev, 'Manager_Cap']);
      onSendMessage({
        channelId: activeChannel,
        author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
        content: '✅ **CHECK-IN LOGGED:** <@Manager_Cap> checked in present in voice comms!',
      });
    } else if (btn.action === 'apply_rec_roles') {
      onSendMessage({
        channelId: activeChannel,
        author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
        content: '✨ **ROLE BUNDLE APPLIED:** Assigned roles `🛡️ Center Back (CB)`, `🔔 Matchday Pings`, and `🌐 Crossplay Star` to your profile!',
      });
    } else if (btn.action === 'auto_fix_roles') {
      onSendMessage({
        channelId: activeChannel,
        author: { name: 'Academia Bot', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot', isBot: true, roleColor: '#e11d48', tag: 'BOT' },
        content: '⚡ **ROLE AUDIT FIXED:** Auto-assigned missing positional & matchday roles to 3 members! Hierarchy 100% synchronized.',
      });
    } else if (btn.action === 'open_roles' && onOpenRoles) {
      onOpenRoles();
    } else if (btn.action === 'promote_dev' && btn.playerId) {
      onPromotePlayer(btn.playerId, 'dev-squad');
      const player = players.find((p) => p.id === btn.playerId);
      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        content: `✅ **CONTRACT OFFERED:** <@${player?.discordTag || btn.playerId}> has been promoted from **Trial Pool** to **La Academia (Dev Squad)**! Welcome to the feeder squad.`,
      });
    } else if (btn.action === 'promote_first' && btn.playerId) {
      onPromotePlayer(btn.playerId, 'first-xi');
      const player = players.find((p) => p.id === btn.playerId);
      onSendMessage({
        channelId: activeChannel,
        author: {
          name: 'Academia Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
          isBot: true,
          roleColor: '#e11d48',
          tag: 'BOT',
        },
        content: `🏆 **CALLUP ALERT:** <@${player?.discordTag || btn.playerId}> has been fast-tracked to the premier **First XI** starting roster! Championship pedigree confirmed.`,
      });
    } else if (btn.action === 'open_builder') {
      onOpenCardBuilder();
    } else if (btn.action === 'open_diagnostics') {
      setShowDiagnosticsModal(true);
    } else if (btn.action === 'run_ping') {
      executeCommand('!ping');
    } else if (btn.action === 'run_stats') {
      executeCommand('!stats Vortex_Anchor');
    } else if (btn.action === 'run_club') {
      executeCommand('!club');
    } else if (btn.action === 'run_avail') {
      executeCommand('/availability poll');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Container simulating Discord window */}
      <div className="rounded-2xl border border-zinc-800 bg-[#313338] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[720px]">
        {/* Discord Channels Sidebar */}
        <div className="md:col-span-4 lg:col-span-3 bg-[#2b2d31] border-r border-[#1f2023] flex flex-col">
          {/* Server Header */}
          <div className="h-14 border-b border-[#1f2023] px-4 flex items-center justify-between shadow-sm bg-[#2b2d31]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-700 flex items-center justify-center font-black text-white text-xs shadow">
                LA
              </div>
              <div className="truncate">
                <div className="text-sm font-bold text-white leading-tight truncate">
                  LA ACADEMIA // FC27
                </div>
                <div className="text-[10px] text-rose-400 font-medium">
                  Verified Multiverse Server
                </div>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" title="Bot Connected" />
          </div>

          {/* Channels List */}
          <div className="p-3 space-y-4 flex-1 overflow-y-auto">
            {serverCategories.map((category) => (
              <div key={category.id}>
                <div className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase px-2 mb-1.5 flex items-center justify-between">
                  <span className="truncate">{category.title}</span>
                  {category.lockRole && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-amber-400 font-mono font-bold border border-zinc-700/60 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-amber-400" />
                      <span>{category.lockRole.toUpperCase()}</span>
                    </span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {category.channels.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => setActiveChannel(ch.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer text-left ${
                        activeChannel === ch.id
                          ? ch.id === 'mod-logs'
                            ? 'bg-rose-950/70 text-rose-200 border border-rose-800/60 font-semibold'
                            : 'bg-[#404249] text-white font-semibold'
                          : 'text-zinc-400 hover:bg-[#35373c] hover:text-zinc-200'
                      }`}
                    >
                      <Hash className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span className="truncate flex-1">{ch.name}</span>
                      {ch.id === 'mod-logs' && (
                        <span className="text-[10px] text-rose-400 font-mono font-bold bg-rose-950/60 px-1 rounded">
                          {moderationLogs.length}
                        </span>
                      )}
                      {ch.unread && activeChannel !== ch.id && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Voice Channel Simulation */}
            <div className="pt-2 border-t border-[#1f2023]/60 space-y-1">
              <div className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase px-2 mb-1.5 flex items-center justify-between">
                <span>🎙️ ┃ VOICE CHANNELS</span>
              </div>
              {voiceChannels.map((vc) => (
                <div
                  key={vc.id}
                  className="px-2.5 py-1.5 rounded text-xs text-zinc-300 flex items-center justify-between bg-[#1e1f22]/50 hover:bg-[#1e1f22] transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate text-[11px]">{vc.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {vc.locked && <Lock className="w-2.5 h-2.5 text-zinc-500" />}
                    <span className="text-[10px] font-mono text-emerald-400">
                      {vc.activeUsers > 0 ? `${vc.activeUsers} online` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discord User Profile Bar */}
          <div className="h-14 bg-[#232428] px-3 flex items-center justify-between border-t border-[#1f2023]">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-rose-900 border border-rose-500 flex items-center justify-center font-bold text-xs text-white">
                  M
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#232428]" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight">
                  Manager_Cap
                </div>
                <div className="text-[10px] text-zinc-400 leading-tight">
                  #0027 • Scout Lead
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Discord Chat & Embed Stream */}
        <div className="md:col-span-8 lg:col-span-9 bg-[#313338] flex flex-col h-[720px]">
          {/* Channel Header Bar */}
          <div className="h-14 border-b border-[#1f2023] px-6 flex items-center justify-between bg-[#313338] shadow-sm">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-zinc-400" />
              <span className="font-bold text-white text-sm">{activeChannel}</span>
              <span className="text-zinc-600 text-xs">|</span>
              <span className="text-xs text-zinc-400 hidden sm:inline">
                {channels.find((c) => c.id === activeChannel)?.desc}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDiagnosticsModal(true)}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-600/60 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                title="Troubleshoot why bot is not responding in Discord"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">Bot Not Responding?</span>
              </button>

              <button
                onClick={() => setShowModModal(true)}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-900/60 hover:bg-rose-800/70 text-rose-200 border border-rose-600/50 flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                title="Open Discord Staff Moderation Console"
              >
                <Gavel className="w-3.5 h-3.5 text-rose-400" />
                <span>Mod Hub</span>
              </button>

              <button
                onClick={handleSimulateMemberJoin}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1 cursor-pointer transition-colors"
                title="Simulate guildMemberAdd event with customizable welcome message"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulate Join</span>
              </button>

              <button
                onClick={() => executeCommand('/availability poll')}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-800/60 hover:bg-emerald-700/60 text-emerald-200 border border-emerald-600/50 flex items-center gap-1 cursor-pointer"
                title="Launch Matchday Availability Poll"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Avail Poll</span>
              </button>

              <button
                onClick={() => executeCommand('/lineup first-xi')}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-800/60 hover:bg-amber-700/60 text-amber-200 border border-amber-600/50 flex items-center gap-1 cursor-pointer"
                title="Generate 11v11 Match Lineup"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Lineup</span>
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {channelMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-4 group">
                <img
                  src={msg.author.avatar}
                  alt={msg.author.name}
                  className="w-10 h-10 rounded-full shrink-0 border border-zinc-700/60 bg-zinc-800"
                />
                <div className="flex-1 min-w-0">
                  {/* Author Name and Timestamp */}
                  <div className="flex items-center gap-2">
                    <span
                      className="font-bold text-sm tracking-wide"
                      style={{ color: msg.author.roleColor || '#ffffff' }}
                    >
                      {msg.author.name}
                    </span>
                    {msg.author.isBot && (
                      <span className="px-1 py-0.2 bg-[#5865f2] text-[10px] font-bold text-white rounded font-mono">
                        BOT
                      </span>
                    )}
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Message Content */}
                  {msg.content && (
                    <div className="text-sm text-zinc-200 mt-1 whitespace-pre-line leading-relaxed">
                      {msg.content}
                    </div>
                  )}

                  {/* Discord Embeds */}
                  {msg.embeds && msg.embeds.map((embed, idx) => (
                    <div
                      key={idx}
                      className="mt-2.5 max-w-2xl rounded-lg bg-[#2b2d31] border-l-4 p-4 shadow-sm"
                      style={{ borderLeftColor: embed.color ? `#${embed.color.toString(16).padStart(6, '0')}` : '#e11d48' }}
                    >
                      {embed.title && (
                        <div className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
                          <span>{embed.title}</span>
                        </div>
                      )}

                      {embed.description && (
                        <div className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed mb-3">
                          {embed.description}
                        </div>
                      )}

                      {embed.fields && embed.fields.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2 border-t border-zinc-700/40 pt-2.5">
                          {embed.fields.map((f, fIdx) => (
                            <div key={fIdx} className={f.inline ? 'col-span-1' : 'col-span-1 sm:col-span-2'}>
                              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
                                {f.name}
                              </div>
                              <div className="text-xs text-zinc-200 whitespace-pre-line leading-normal">
                                {f.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {embed.footer && (
                        <div className="mt-3 pt-2 border-t border-zinc-700/40 text-[10px] text-zinc-400 font-mono">
                          {embed.footer.text}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Interactive Action Buttons */}
                  {msg.actionButtons && msg.actionButtons.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {msg.actionButtons.map((btn) => {
                        const isExecuted = executedButtonIds.includes(btn.id);
                        return (
                          <button
                            key={btn.id}
                            disabled={isExecuted}
                            onClick={() => !isExecuted && handleActionButtonClick(btn)}
                            className={`px-3 py-1.5 rounded text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 ${
                              isExecuted
                                ? 'bg-zinc-800 text-emerald-400 border border-emerald-600/50 opacity-85 cursor-default'
                                : btn.style === 'success'
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                                : btn.style === 'primary'
                                ? 'bg-[#5865f2] hover:bg-[#4752c4] text-white cursor-pointer'
                                : btn.style === 'danger'
                                ? 'bg-rose-700 hover:bg-rose-600 text-white cursor-pointer'
                                : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100 cursor-pointer'
                            }`}
                          >
                            <CheckCircle2 className={`w-3.5 h-3.5 ${isExecuted ? 'text-emerald-400' : ''}`} />
                            <span>{isExecuted ? `${btn.label} (Done)` : btn.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Reactions */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.reactions.map((r, rIdx) => (
                        <span
                          key={rIdx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#2b2d31] border border-zinc-700/80 text-xs text-zinc-300 font-mono"
                        >
                          <span>{r.emoji}</span>
                          <span className="font-semibold text-[11px]">{r.count}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Slash/Prefix Command Autocomplete Popover */}
          {showSlashMenu && (
            <div className="mx-4 mb-2 bg-[#2b2d31] border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-20">
              <div className="px-3 py-1.5 bg-[#1e1f22] text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-rose-400" />
                <span>Available Commands (Click to Execute)</span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-zinc-700/50">
                {slashCommands
                  .filter((sc) => sc.cmd.toLowerCase().startsWith(inputValue.toLowerCase()))
                  .map((sc) => (
                    <button
                      key={sc.cmd}
                      onClick={() => executeCommand(sc.cmd)}
                      className="w-full px-3 py-2 text-left hover:bg-[#35373c] flex items-center justify-between text-xs cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-rose-400 group-hover:text-rose-300">
                          {sc.cmd}
                        </span>
                        <span className="text-zinc-400 truncate max-w-xs">{sc.desc}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Discord Chat Input Box */}
          <div className="p-4 bg-[#313338] border-t border-[#1f2023]">
            {/* Top helper bar with explicit instructions */}
            <div className="mb-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                <Terminal className="w-3.5 h-3.5 text-rose-400" />
                <span>Command Bar:</span>
                <span className="text-[11px] text-zinc-400 font-normal hidden sm:inline">
                  Paste or type commands below &amp; press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono border border-zinc-700 text-zinc-200">Enter</kbd>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (navigator?.clipboard?.readText) {
                        const text = await navigator.clipboard.readText();
                        if (text) setInputValue(text);
                      }
                    } catch {
                      // Fallback focus input
                    }
                  }}
                  className="text-[11px] text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer bg-zinc-800/90 hover:bg-zinc-700 px-2 py-0.5 rounded border border-zinc-700 transition-colors shadow-sm"
                  title="Paste copied command into the input box"
                >
                  <span>📋 Paste Command</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDiagnosticsModal(true)}
                  className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer bg-amber-950/60 hover:bg-amber-900/70 px-2 py-0.5 rounded border border-amber-800/60 transition-colors"
                  title="Check why your Discord bot is not responding"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>Bot Not Responding?</span>
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputValue.trim()) {
                  executeCommand(inputValue);
                }
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder={`Paste command here (e.g. !stats, !club, !ping, /availability poll, !matches)... Press Enter to send`}
                className="w-full bg-[#383a40] text-zinc-100 placeholder-zinc-500 text-sm rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="absolute right-2.5 p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                title="Send command"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-2.5 space-y-1.5 text-[11px]">
              {/* Row 1: FC27 Stats API Quick Commands */}
              <div className="flex flex-wrap items-center gap-1.5 text-zinc-400">
                <span className="font-bold text-rose-400 uppercase text-[10px] tracking-wider">⚽ FC27 Stats:</span>
                <button
                  onClick={() => executeCommand('!stats Vortex_Anchor')}
                  className="hover:text-emerald-300 cursor-pointer font-mono font-bold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/50"
                  title="Lookup player telemetry"
                >
                  !stats
                </button>
                <button
                  onClick={() => executeCommand('!club')}
                  className="hover:text-rose-300 cursor-pointer font-mono font-bold text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-800/50"
                  title="Lookup club Div 1 metrics"
                >
                  !club
                </button>
                <button
                  onClick={() => executeCommand('!matches')}
                  className="hover:text-blue-300 cursor-pointer font-mono font-bold text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-800/50"
                  title="View recent match scores"
                >
                  !matches
                </button>
                <button
                  onClick={() => executeCommand('!top amr')}
                  className="hover:text-amber-300 cursor-pointer font-mono font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/50"
                  title="View top AMR leaderboard"
                >
                  !top
                </button>
                <button
                  onClick={() => executeCommand('!meta')}
                  className="hover:text-purple-300 cursor-pointer font-mono font-bold text-purple-400 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-800/50"
                  title="View Title Update 3.1 meta builds"
                >
                  !meta
                </button>
              </div>

              {/* Row 2: Matchday & Bot Diagnostics */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 text-zinc-500">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-zinc-400 uppercase text-[10px] tracking-wider">🛡️ Mod &amp; Ops:</span>
                  <button
                    onClick={() => executeCommand('!mute @Viper_Striker99 10m Mic spam & tournament argument')}
                    className="hover:text-amber-300 cursor-pointer font-mono font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/50"
                    title="Timeout/mute user for 10 minutes"
                  >
                    !mute
                  </button>
                  <button
                    onClick={() => executeCommand('!unmute @Viper_Striker99 Timeout served')}
                    className="hover:text-emerald-300 cursor-pointer font-mono font-bold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/50"
                    title="Lift timeout from user"
                  >
                    !unmute
                  </button>
                  <button
                    onClick={() => executeCommand('!kick @Viper_Striker99 Inactivity during squad scrim')}
                    className="hover:text-orange-300 cursor-pointer font-mono font-bold text-orange-400 bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-800/50"
                    title="Kick user command"
                  >
                    !kick
                  </button>
                  <button
                    onClick={() => executeCommand('!ban @ToxicRecruit Match-fixing and cheating')}
                    className="hover:text-rose-300 cursor-pointer font-mono font-bold text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-800/50"
                    title="Ban user command"
                  >
                    !ban
                  </button>
                  <button
                    onClick={() => executeCommand('!clear 5')}
                    className="hover:text-emerald-400 cursor-pointer font-mono font-bold text-zinc-400 hover:bg-zinc-800 px-1 rounded"
                    title="Bulk clear 5 messages"
                  >
                    !clear 5
                  </button>
                  <button
                    onClick={() => executeCommand('!ping')}
                    className="hover:text-amber-300 cursor-pointer font-mono font-bold text-amber-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-700"
                    title="Test bot latency"
                  >
                    !ping
                  </button>
                  <button
                    onClick={() => executeCommand('/help')}
                    className="hover:text-rose-400 cursor-pointer font-mono font-semibold text-zinc-400 hover:bg-zinc-800 px-1 rounded"
                    title="Show all commands"
                  >
                    /help
                  </button>
                </div>
                <div className="font-mono text-zinc-500 hidden lg:block text-[10px]">
                  Press Enter to send
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Moderation Hub Modal */}
      {showModModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#2b2d31] border border-zinc-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100">
            {/* Modal Header */}
            <div className="p-4 bg-[#1e1f22] border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-900/60 border border-rose-600/50 flex items-center justify-center">
                  <Gavel className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Discord Staff Moderation Hub</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 font-mono font-bold border border-rose-800/40">
                      ADMIN / MOD
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Execute <code className="text-zinc-300">!mute</code>, <code className="text-zinc-300">!unmute</code>, <code className="text-zinc-300">!kick</code>, <code className="text-zinc-300">!ban</code>, and <code className="text-zinc-300">!clear</code> directly with audit logging.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Section 1: Member Moderation (Mute / Unmute / Kick / Ban) */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {modActionSelect === 'mute' ? (
                      <VolumeX className="w-4 h-4 text-amber-400" />
                    ) : modActionSelect === 'unmute' ? (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <UserX className="w-4 h-4 text-rose-400" />
                    )}
                    <span className="font-bold text-xs uppercase tracking-wide text-zinc-200">
                      Disciplinary Sanctions
                    </span>
                  </div>
                  <div className="grid grid-cols-4 rounded-lg bg-zinc-950 p-0.5 border border-zinc-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setModActionSelect('mute')}
                      className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer text-center ${
                        modActionSelect === 'mute'
                          ? 'bg-amber-600 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      🔇 Mute
                    </button>
                    <button
                      type="button"
                      onClick={() => setModActionSelect('unmute')}
                      className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer text-center ${
                        modActionSelect === 'unmute'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      🔊 Unmute
                    </button>
                    <button
                      type="button"
                      onClick={() => setModActionSelect('kick')}
                      className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer text-center ${
                        modActionSelect === 'kick'
                          ? 'bg-orange-600 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      👢 Kick
                    </button>
                    <button
                      type="button"
                      onClick={() => setModActionSelect('ban')}
                      className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer text-center ${
                        modActionSelect === 'ban'
                          ? 'bg-rose-700 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      🔨 Ban
                    </button>
                  </div>
                </div>

                {/* Duration selector when Mute is active */}
                {modActionSelect === 'mute' && (
                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1.5 animate-in fade-in">
                    <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Timeout Duration (Communication Restriction)</span>
                      <span className="font-mono text-white text-[10px] bg-amber-950 px-1.5 py-0.2 rounded border border-amber-800/60">
                        {modDurationSelect}
                      </span>
                    </label>
                    <div className="grid grid-cols-6 gap-1.5 text-xs">
                      {[
                        { label: '60s', value: '60s' },
                        { label: '5m', value: '5m' },
                        { label: '10m', value: '10m' },
                        { label: '1h', value: '1h' },
                        { label: '24h', value: '1d' },
                        { label: '7d', value: '1w' },
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setModDurationSelect(item.value)}
                          className={`py-1 rounded font-mono text-[11px] font-bold border transition-all cursor-pointer ${
                            modDurationSelect === item.value
                              ? 'bg-amber-600 border-amber-400 text-white shadow-sm'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Target User Mention
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={modTargetInput}
                        onChange={(e) => setModTargetInput(e.target.value)}
                        placeholder="@username"
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                      />
                      <select
                        onChange={(e) => setModTargetInput(e.target.value)}
                        value={modTargetInput}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-300 focus:outline-none focus:border-rose-500 cursor-pointer"
                      >
                        <option value="@Viper_Striker99">@Viper_Striker99</option>
                        <option value="@Titan_Reyes">@Titan_Reyes</option>
                        <option value="@ShadowPress_99">@ShadowPress_99</option>
                        <option value="@ToxicRecruit">@ToxicRecruit</option>
                        <option value="@Troll_01">@Troll_01</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Disciplinary Reason (Logged to #mod-logs)
                    </label>
                    <input
                      type="text"
                      value={modReasonInput}
                      onChange={(e) => setModReasonInput(e.target.value)}
                      placeholder="Reason for disciplinary action..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const cmd = 
                        modActionSelect === 'mute'
                          ? `!mute ${modTargetInput} ${modDurationSelect} ${modReasonInput}`
                          : modActionSelect === 'unmute'
                          ? `!unmute ${modTargetInput} ${modReasonInput}`
                          : `!${modActionSelect} ${modTargetInput} ${modReasonInput}`;
                      executeCommand(cmd);
                      setShowModModal(false);
                    }}
                    className={`w-full py-2.5 rounded-lg text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      modActionSelect === 'ban'
                        ? 'bg-rose-700 hover:bg-rose-600 border border-rose-500/50'
                        : modActionSelect === 'kick'
                        ? 'bg-orange-600 hover:bg-orange-500 border border-orange-500/50'
                        : modActionSelect === 'unmute'
                        ? 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/50'
                        : 'bg-amber-600 hover:bg-amber-500 border border-amber-500/50'
                    }`}
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    <span>
                      Execute {modActionSelect.toUpperCase()} (
                      {modActionSelect === 'mute'
                        ? `!mute ${modTargetInput} ${modDurationSelect}`
                        : modActionSelect === 'unmute'
                        ? `!unmute ${modTargetInput}`
                        : `!${modActionSelect} ${modTargetInput}`
                      })
                    </span>
                  </button>
                </div>
              </div>

              {/* Section 2: Bulk Message Clear (!clear) */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs uppercase tracking-wide text-zinc-200">
                    Bulk Message Purge (!clear)
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Delete recent messages from the active channel (<code className="text-zinc-300">#{activeChannel}</code>) to clean up spam or bot test commands.
                </p>

                <div className="flex items-center gap-2">
                  {[3, 5, 10, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPurgeCountSelect(num)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        purgeCountSelect === num
                          ? 'bg-emerald-600 border-emerald-400 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {num} msgs
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    executeCommand(`!clear ${purgeCountSelect}`);
                    setShowModModal(false);
                  }}
                  className="w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs border border-emerald-500/50 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge Last {purgeCountSelect} Messages in #{activeChannel}</span>
                </button>
              </div>

              {/* Section 3: Recent Mod Audit Stream */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Recent Mod Logs ({moderationLogs.length})</span>
                  </span>
                  <button
                    onClick={() => {
                      executeCommand('/modlogs');
                      setShowModModal(false);
                    }}
                    className="text-[11px] text-rose-400 hover:underline cursor-pointer font-semibold"
                  >
                    View in Chat →
                  </button>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {moderationLogs.slice(0, 4).map((log) => (
                    <div
                      key={log.id}
                      className="p-2 rounded bg-zinc-900 border border-zinc-800/80 text-[11px] flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <span className={`font-mono font-bold px-1 rounded mr-1.5 text-[10px] ${
                          log.action === 'ban' ? 'bg-rose-950 text-rose-300' :
                          log.action === 'kick' ? 'bg-amber-950 text-amber-300' :
                          'bg-emerald-950 text-emerald-300'
                        }`}>
                          {log.action.toUpperCase()}
                        </span>
                        <span className="text-zinc-300 font-semibold">{log.targetUser ? `@${log.targetUser}` : `#${log.channelId}`}</span>
                        <span className="text-zinc-500 ml-1.5 italic truncate">{log.reason}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#1e1f22] border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setShowModModal(false)}
                className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOT TROUBLESHOOTING & DIAGNOSTICS MODAL */}
      {showDiagnosticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#2b2d31] border border-zinc-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-[#1f2023] bg-[#1e1f22] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">
                    Discord Bot Troubleshooting &amp; Diagnostics
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Resolve &quot;Bot isn&apos;t responding&quot; or &quot;This interaction failed&quot; in your server
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDiagnosticsModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-zinc-300">
              {/* Alert Notice */}
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-2 text-sm text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Why isn&apos;t your bot responding in Discord?</span>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Discord bots require 4 specific settings to reply to chat messages, availability polls, and slash commands. Follow the checklist below to fix it immediately:
                </p>
              </div>

              {/* Diagnostic 1: Privileged Gateway Intents */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-950 text-rose-400 border border-rose-600/50 flex items-center justify-center text-[11px] font-mono font-bold">1</span>
                    <span>Turn ON &quot;Message Content Intent&quot; (Most Common Issue!)</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 font-semibold">
                    90% of failures
                  </span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  By default, Discord hides all chat message content from bots for privacy. If this intent is OFF, your bot receives <strong>empty blank messages</strong>, meaning commands like <code className="text-rose-400 font-mono">!ping</code>, <code className="text-rose-400 font-mono">!avail in</code>, or <code className="text-rose-400 font-mono">!stats</code> can never trigger!
                </p>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1 font-mono text-[11px] text-zinc-300">
                  <div className="text-zinc-400 font-semibold">How to enable:</div>
                  <div>1. Go to <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-rose-400 underline inline-flex items-center gap-0.5">discord.com/developers/applications <ExternalLink className="w-3 h-3" /></a></div>
                  <div>2. Select your Bot Application &rarr; click <strong>Bot</strong> in the left sidebar.</div>
                  <div>3. Scroll down to <strong>Privileged Gateway Intents</strong>.</div>
                  <div>4. Toggle ON <strong className="text-emerald-400">MESSAGE CONTENT INTENT</strong> and <strong className="text-emerald-400">SERVER MEMBERS INTENT</strong>.</div>
                  <div>5. Click <strong className="text-white">Save Changes</strong> and restart your bot.</div>
                </div>
              </div>

              {/* Diagnostic 2: Webhook vs Bot */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-950 text-blue-400 border border-blue-600/50 flex items-center justify-center text-[11px] font-mono font-bold">2</span>
                    <span>Webhook vs. Real Discord Bot Application</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60 font-semibold">
                    Common Confusion
                  </span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  A <strong>Discord Webhook URL</strong> is a one-way channel speaker. It can post trial cards and announcements from this website into Discord, but <strong>webhooks CANNOT listen to user chat</strong> or respond to commands.
                </p>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  To have a live bot that responds to chat commands and buttons, you must run the Discord.js bot script (<code className="text-blue-400 font-mono">node multiverse-bot.js</code>) on your computer or a 24/7 hosting provider (e.g. Render, Railway, or VPS).
                </p>
              </div>

              {/* Diagnostic 3: Slash Commands Registration */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-950 text-amber-400 border border-amber-600/50 flex items-center justify-center text-[11px] font-mono font-bold">3</span>
                    <span>Register Slash Commands (<code className="font-mono text-amber-300">deploy-commands.js</code>)</span>
                  </span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  If slash commands like <code className="text-amber-400 font-mono">/availability</code>, <code className="text-amber-400 font-mono">/lineup</code>, or <code className="text-amber-400 font-mono">/stats</code> do not appear in Discord or say &quot;The application did not respond&quot;, you must register them with Discord&apos;s REST API:
                </p>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 font-mono text-[11px] text-emerald-400">
                  node deploy-commands.js
                </div>
              </div>

              {/* Diagnostic 4: Channel Permissions */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-600/50 flex items-center justify-center text-[11px] font-mono font-bold">4</span>
                    <span>Channel Permissions in <code className="font-mono text-emerald-300">#main</code></span>
                  </span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  In your Discord Server Settings &rarr; Channels &rarr; <code className="text-emerald-400 font-mono">#main</code> &rarr; Permissions:
                  Ensure the Bot Role has:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800 text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View Channel</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800 text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Send Messages</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800 text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Embed Links</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800 text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Read Message History</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#1e1f22] border-t border-zinc-800 flex items-center justify-between">
              <button
                onClick={() => {
                  executeCommand('/availability poll');
                  setShowDiagnosticsModal(false);
                }}
                className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Test Avail Poll in Simulator</span>
              </button>

              <button
                onClick={() => setShowDiagnosticsModal(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 cursor-pointer"
              >
                Got It, Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
