import React, { useState } from 'react';
import { 
  SelfAssignableRole, 
  DiscordMember, 
  RoleAuditEntry,
  RoleCategory
} from '../types';
import { 
  Shield, 
  UserCheck, 
  Check, 
  Plus, 
  Trash2, 
  Terminal, 
  Send, 
  Sparkles, 
  Bell, 
  Gamepad2, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Radio,
  Layers,
  Crown,
  Award,
  Lock,
  FolderTree
} from 'lucide-react';
import { sendDiscordWebhook } from '../utils/discordEmbed';

interface RoleManagerProps {
  roles: SelfAssignableRole[];
  members: DiscordMember[];
  onToggleUserRole: (roleId: string) => void;
  onAdminAssignRole: (memberId: string, roleId: string) => void;
  onAdminRemoveRole: (memberId: string, roleId: string) => void;
  userRoles: string[];
  auditLogs: RoleAuditEntry[];
  onPostRoleEmbedToSimulator: (channelId: string, content: string, embed: any, actionButtons?: any[]) => void;
  webhookUrl?: string;
  onOpenWebhookModal?: () => void;
}

export const RoleManager: React.FC<RoleManagerProps> = ({
  roles,
  members,
  onToggleUserRole,
  onAdminAssignRole,
  onAdminRemoveRole,
  userRoles,
  auditLogs,
  onPostRoleEmbedToSimulator,
  webhookUrl = '',
  onOpenWebhookModal,
}) => {
  const [activeTab, setActiveTab] = useState<'hierarchy-layout' | 'self-assign' | 'admin-manage' | 'reaction-embed' | 'commands'>('hierarchy-layout');
  
  // Admin selector state
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[3]?.id || members[0]?.id);
  const [selectedRoleToAssign, setSelectedRoleToAssign] = useState<string>(roles[0]?.id || '');
  
  // Interactive test command box
  const [commandInput, setCommandInput] = useState('');
  const [commandFeedback, setCommandFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Webhook dispatch status
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0];

  const categories: RoleCategory[] = [
    'Management & Staff',
    'Competitive Squad Tiers',
    'Position Tags',
    'Community & Utility',
    'Game Interests',
    'Position',
    'Notifications',
    'Platform',
  ];

  const handleTestCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.trim();
    if (!cmd) return;

    const lower = cmd.toLowerCase();

    // Ping command handler test
    if (lower === '!ping' || lower === '/ping') {
      setCommandFeedback({
        type: 'success',
        message: '🏓 Pong! (Bot Command Handler active • Latency: 22ms)',
      });
      setCommandInput('');
      return;
    }

    // !role join <role> or /role join <role>
    if (lower.startsWith('!role join') || lower.startsWith('/role join')) {
      const query = lower.replace('!role join', '').replace('/role join', '').trim();
      const matchedRole = roles.find((r) => 
        r.name.toLowerCase().includes(query) || 
        r.id.toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query)
      );

      if (matchedRole) {
        if (!matchedRole.isSelfAssignable) {
          setCommandFeedback({
            type: 'error',
            message: `❌ Role "${matchedRole.name}" is restricted and cannot be self-assigned.`,
          });
        } else {
          onToggleUserRole(matchedRole.id);
          const hasIt = userRoles.includes(matchedRole.id);
          setCommandFeedback({
            type: 'success',
            message: hasIt 
              ? `✅ Removed role "${matchedRole.name}" from your profile.`
              : `✅ Assigned role "${matchedRole.name}" to your profile!`,
          });
        }
      } else {
        setCommandFeedback({
          type: 'error',
          message: `❌ Could not find a self-assignable role matching "${query}". Try "!roles" to see available roles.`,
        });
      }
      setCommandInput('');
      return;
    }

    // !role leave <role> or /role leave <role>
    if (lower.startsWith('!role leave') || lower.startsWith('/role leave')) {
      const query = lower.replace('!role leave', '').replace('/role leave', '').trim();
      const matchedRole = roles.find((r) => 
        r.name.toLowerCase().includes(query) || 
        r.id.toLowerCase().includes(query)
      );

      if (matchedRole && userRoles.includes(matchedRole.id)) {
        onToggleUserRole(matchedRole.id);
        setCommandFeedback({
          type: 'success',
          message: `✅ Successfully left role "${matchedRole.name}".`,
        });
      } else {
        setCommandFeedback({
          type: 'error',
          message: `❌ You do not currently have the role "${query}".`,
        });
      }
      setCommandInput('');
      return;
    }

    // Admin commands: !role add @User <role> or !role remove @User <role>
    if (lower.startsWith('!role add') || lower.startsWith('/role assign')) {
      const parts = cmd.split(' ');
      if (parts.length < 4) {
        setCommandFeedback({
          type: 'error',
          message: 'Syntax: `!role add @Username RoleName` (e.g. `!role add @ShadowPress Center Back (CB)`)',
        });
        return;
      }
      const targetUser = parts[2].replace('@', '');
      const roleQuery = parts.slice(3).join(' ').toLowerCase();

      const member = members.find((m) => 
        m.username.toLowerCase().includes(targetUser.toLowerCase()) ||
        m.displayName.toLowerCase().includes(targetUser.toLowerCase())
      );
      const role = roles.find((r) => r.name.toLowerCase().includes(roleQuery));

      if (!member) {
        setCommandFeedback({ type: 'error', message: `❌ Member "${targetUser}" not found in server.` });
        return;
      }
      if (!role) {
        setCommandFeedback({ type: 'error', message: `❌ Role "${roleQuery}" not found.` });
        return;
      }

      onAdminAssignRole(member.id, role.id);
      setCommandFeedback({
        type: 'success',
        message: `🛡️ [ADMIN ACTION] Successfully granted role "${role.name}" to <@${member.username}>.`,
      });
      setCommandInput('');
      return;
    }

    if (lower.startsWith('!role remove') || lower.startsWith('/role revoke')) {
      const parts = cmd.split(' ');
      if (parts.length < 4) {
        setCommandFeedback({
          type: 'error',
          message: 'Syntax: `!role remove @Username RoleName`',
        });
        return;
      }
      const targetUser = parts[2].replace('@', '');
      const roleQuery = parts.slice(3).join(' ').toLowerCase();

      const member = members.find((m) => 
        m.username.toLowerCase().includes(targetUser.toLowerCase()) ||
        m.displayName.toLowerCase().includes(targetUser.toLowerCase())
      );
      const role = roles.find((r) => r.name.toLowerCase().includes(roleQuery));

      if (!member) {
        setCommandFeedback({ type: 'error', message: `❌ Member "${targetUser}" not found.` });
        return;
      }
      if (!role) {
        setCommandFeedback({ type: 'error', message: `❌ Role "${roleQuery}" not found.` });
        return;
      }

      onAdminRemoveRole(member.id, role.id);
      setCommandFeedback({
        type: 'success',
        message: `🛡️ [ADMIN ACTION] Successfully revoked role "${role.name}" from <@${member.username}>.`,
      });
      setCommandInput('');
      return;
    }

    // Availability quick tests
    if (lower.startsWith('!avail') || lower.startsWith('/avail')) {
      if (lower.includes('in')) {
        setCommandFeedback({ type: 'success', message: '🟢 [AVAILABILITY] Marked as AVAILABLE / IN for tonight\'s matchday!' });
      } else if (lower.includes('late')) {
        setCommandFeedback({ type: 'info', message: '🟡 [AVAILABILITY] Marked as LATE (15m). Reserve starter notified.' });
      } else if (lower.includes('out')) {
        setCommandFeedback({ type: 'error', message: '🔴 [AVAILABILITY] Marked as OUT for tonight. Bench reserve promoted.' });
      } else {
        setCommandFeedback({ type: 'info', message: '📅 Availability Commands: `!avail in`, `!avail late [time]`, `!avail out`, `/availability poll`' });
      }
      setCommandInput('');
      return;
    }

    // Attendance checkin
    if (lower === '!checkin' || lower === '/checkin') {
      setCommandFeedback({ type: 'success', message: '✅ [ATTENDANCE] Checked in present for voice comms! Attendance rate: 100%.' });
      setCommandInput('');
      return;
    }

    if (lower.startsWith('/attendance') || lower.startsWith('!attendance')) {
      setCommandFeedback({ type: 'info', message: '🎙️ [ATTENDANCE ROLL CALL] Roll call active in 🔊 First XI Comms. Starters: 9/11 checked in.' });
      setCommandInput('');
      return;
    }

    // Lineups quick test
    if (lower.startsWith('!lineup') || lower.startsWith('/lineup')) {
      setCommandFeedback({
        type: 'info',
        message: '📋 [MATCHDAY LINEUP // 4-3-3 HOLDING]\n• GK: Bastion_Wall (90)\n• Defense: Aero_Wing (LB), Vortex_Anchor [C] (CB), Iron_Colossus_27 (CB), Blitz_Pace (RB)\n• Midfield: Kinetix_Press (CDM), ShadowPress_99 (CM), Silva_Maestro (CAM)\n• Attack: Shadow_Drift (LW), Grimm_Apex (ST), Solar_Volt (RW)',
      });
      setCommandInput('');
      return;
    }

    // Role Assist
    if (lower.startsWith('/role assist') || lower.startsWith('!role assist')) {
      setCommandFeedback({
        type: 'success',
        message: '✨ [ROLE ASSISTANT] Recommended roles for your profile:\n1. Position: 🛡️ Center Back (CB)\n2. Notifications: 🔔 Matchday Pings\n3. Platform: 🌐 Crossplay Star\nClick "Apply Recommended Roles" in Bot Simulator or toggle in User Self-Assignment tab.',
      });
      setCommandInput('');
      return;
    }

    if (lower.startsWith('/role audit') || lower.startsWith('!role audit')) {
      setCommandFeedback({
        type: 'info',
        message: '🔍 [ROLE AUDIT] 2 members missing position roles (Iron_Colossus_27, ShadowPress_99). 1 member missing notification pings.',
      });
      setCommandInput('');
      return;
    }

    if (lower === '!roles' || lower === '/roles') {
      const roleList = roles.map((r) => `• ${r.emoji} **${r.name}** [${r.category}]`).join('\n');
      setCommandFeedback({
        type: 'info',
        message: `📋 Available Roles in LA ACADEMIA:\n${roleList}`,
      });
      setCommandInput('');
      return;
    }

    setCommandFeedback({
      type: 'info',
      message: `Available commands: \`!ping\`, \`!role join <role>\`, \`!role leave <role>\`, \`!role add @user <role>\`, \`!role remove @user <role>\`, \`!roles\``,
    });
  };

  const handleDispatchRolePanel = async () => {
    setIsDispatching(true);
    setDispatchStatus(null);

    const embed = {
      title: '🎭 LA ACADEMIA // SELF-ASSIGNABLE ROLE DIRECTORY',
      description: 'Click any button below to instantly toggle roles on your profile. You can also self-assign positions, notification preferences, and platform tags:',
      color: 0xE11D48,
      fields: [
        {
          name: '⚽ Primary Positions',
          value: '• `🛡️ Center Back (CB)` - Anchor & aerial clearance\n• `⚡ Defensive Mid (CDM)` - Press & turnover release\n• `🎯 Attacking Mid (CAM)` - Vision & half-space spacing\n• `🔥 Striker (ST)` - Box finishing & channel runs',
          inline: false,
        },
        {
          name: '🔔 Notification Pings',
          value: '• `🔔 Matchday Pings` - Tournament starting calls\n• `⚔️ Scrim Alerts` - Friendly scrims & trials\n• `📢 Club Announcements` - Decrees & roster updates',
          inline: false,
        },
        {
          name: '🎮 Game Interests & Platform',
          value: '• `⚽ FC27 Pro Clubs`\n• `🏆 Competitive AFH League`\n• `🌐 Crossplay Star`',
          inline: false,
        },
      ],
      footer: { text: 'Automated Role Management • Click to toggle instantly' },
    };

    const actionButtons = [
      { id: 'btn-role-fc27', label: '⚽ FC27 Pro Clubs', style: 'primary', action: 'toggle_role', playerId: 'role-fc27' },
      { id: 'btn-role-cb', label: '🛡️ Center Back (CB)', style: 'secondary', action: 'toggle_role', playerId: 'role-cb' },
      { id: 'btn-role-cdm', label: '⚡ Defensive Mid (CDM)', style: 'secondary', action: 'toggle_role', playerId: 'role-cdm' },
      { id: 'btn-role-cam', label: '🎯 Attacking Mid (CAM)', style: 'secondary', action: 'toggle_role', playerId: 'role-cam' },
      { id: 'btn-role-matchday', label: '🔔 Matchday Pings', style: 'primary', action: 'toggle_role', playerId: 'role-matchday' },
      { id: 'btn-role-scrims', label: '⚔️ Scrim Alerts', style: 'primary', action: 'toggle_role', playerId: 'role-scrims' },
      { id: 'btn-role-crossplay', label: '🌐 Crossplay Star', style: 'success', action: 'toggle_role', playerId: 'role-crossplay' },
    ];

    // Post to Bot Simulator channel
    onPostRoleEmbedToSimulator(
      'role-select',
      '🏷️ **COMMUNITY ROLES & NOTIFICATION PREFERENCES**\nSelf-assign roles below to customize your Discord profile & alerts:',
      embed,
      actionButtons
    );

    // If webhook configured, send to real Discord!
    if (webhookUrl.trim()) {
      const payload = {
        username: 'Academia Role Bot',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=role-bot',
        content: '🏷️ **LA ACADEMIA // SELF-ASSIGNABLE ROLES**\nUse buttons or commands (`/role join`, `!role join`) to self-assign your roles:',
        embeds: [embed],
      };
      const res = await sendDiscordWebhook(webhookUrl.trim(), payload);
      if (res.success) {
        setDispatchStatus('Successfully dispatched to both Simulator and live Discord channel!');
      } else {
        setDispatchStatus(`Sent to Simulator, but Webhook returned: ${res.message}`);
      }
    } else {
      setDispatchStatus('Posted to Simulator #role-select channel! (Connect Webhook to dispatch to live Discord).');
    }

    setIsDispatching(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-rose-950/40 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-[11px] font-mono font-semibold text-rose-400">
              DISCORD BOT ROLE ARCHITECTURE
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-zinc-400 font-mono">Self-Assignment &amp; Admin Hierarchy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Role Management Console
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Manage self-assignable roles for community members (Positions, Notification alerts, Game interests) and administrative role assignment/revocation with audit logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDispatchRolePanel}
            disabled={isDispatching}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isDispatching ? 'Dispatching...' : 'Dispatch Role Panel to Discord'}</span>
          </button>
        </div>
      </div>

      {dispatchStatus && (
        <div className="p-3 bg-zinc-900 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{dispatchStatus}</span>
          </div>
          <button onClick={() => setDispatchStatus(null)} className="text-zinc-500 hover:text-white cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('hierarchy-layout')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'hierarchy-layout'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Server Architecture &amp; Hierarchy</span>
        </button>

        <button
          onClick={() => setActiveTab('self-assign')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'self-assign'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>User Self-Assignment (Positions &amp; Alerts)</span>
        </button>

        <button
          onClick={() => setActiveTab('admin-manage')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'admin-manage'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Administrator Role Controls</span>
        </button>

        <button
          onClick={() => setActiveTab('reaction-embed')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'reaction-embed'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Reaction Roles Embed Preview</span>
        </button>

        <button
          onClick={() => setActiveTab('commands')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'commands'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Command Handler &amp; Reference</span>
        </button>
      </div>

      {/* Quick Interactive Command Sandbox */}
      <div className="bg-[#1e1f22] border border-zinc-800 rounded-xl p-4 shadow-inner">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
            <Terminal className="w-4 h-4 text-rose-400" />
            <span>Interactive Bot Command Test Runner</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            Try: <code className="text-amber-300">!ping</code>, <code className="text-rose-400">!role join Center Back (CB)</code>, or <code className="text-rose-400">!roles</code>
          </span>
        </div>

        <form onSubmit={handleTestCommand} className="flex gap-2">
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Type command: !ping, !role join <role>, !role leave <role>, !role add @User <role>..."
            className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold cursor-pointer border border-zinc-700 transition-colors"
          >
            Execute Command
          </button>
        </form>

        {commandFeedback && (
          <div
            className={`mt-2.5 p-2.5 rounded-lg text-xs font-mono whitespace-pre-line border ${
              commandFeedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                : commandFeedback.type === 'error'
                ? 'bg-rose-950/40 border-rose-700/50 text-rose-300'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300'
            }`}
          >
            {commandFeedback.message}
          </div>
        )}
      </div>

      {/* TAB 0: SERVER ARCHITECTURE & ROLE HIERARCHY */}
      {activeTab === 'hierarchy-layout' && (
        <div className="space-y-6">
          {/* Top Quick Actions Bar */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 font-mono text-[10px] font-bold border border-rose-800/40">
                  FC27 PRO CLUBS MULTIVERSE
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-xs text-zinc-400 font-mono">Battle-Tested Deployment Blueprint</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                Official Server Channels &amp; Role Architecture
              </h3>
              <p className="text-xs text-zinc-400 max-w-2xl mt-0.5">
                Ready-to-use hierarchy for competitive Pro Clubs. Copy and paste directly into your Discord server settings or bot configuration.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const roleText = `1. Management & Staff
* Owner (Full server and team control)
* Head Coach / Manager (Tactics, lineups, matchday decisions)
* Assistant Coach / Scout (Trial evaluations and recruitment)

2. Competitive Squad Tiers
* First Team (Starting XI / primary roster for league matches)
* Academy / Reserves (Development squad, second-string)
* Trialist (Active applicants currently trying out)

3. Position Tags (Self-Assign or Coach-Assigned)
* Goalkeeper (GK)
* Center Back (CB)
* Fullback (LB / RB)
* Defensive Midfielder (CDM / DM)
* Central Midfielder (CM)
* Attacking Midfielder (CAM)
* Winger (LW / RW)
* Striker (ST)

4. Community & Utility
* Verified Member (Passed onboarding)
* Matchday Ping (For league game notifications)
* Content / Streamer (For community streams and media)`;
                  navigator.clipboard.writeText(roleText);
                  setCopyFeedback('Role Hierarchy copied to clipboard!');
                  setTimeout(() => setCopyFeedback(null), 3000);
                }}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <Copy className="w-3.5 h-3.5 text-rose-400" />
                <span>Copy Role Hierarchy</span>
              </button>

              <button
                onClick={() => {
                  const layoutText = `📌 ┃ INFORMATION
* 📢 ┃ announcements
* 📜 ┃ rules-and-info
* 🤖 ┃ bot-commands
* 👑 ┃ roles-and-pings

💬 ┃ COMMUNITY
* 💬 ┃ general-chat
* 🎬 ┃ media-and-clips
* 📈 ┃ achievements

⚽ ┃ FIRST TEAM (Locked to 1st Team role)
* 📋 ┃ matchday-lineups
* 🧠 ┃ tactics-and-meta
* 💬 ┃ squad-chat

🛡️ ┃ ACADEMY & TRIALS
* 📝 ┃ apply-for-tryouts
* 💬 ┃ academy-chat
* 📊 ┃ trial-feedback

🎙️ ┃ VOICE CHANNELS
* 🔊 ┃ Match Room A (First Team)
* 🔊 ┃ Match Room B (Academy)
* 🔊 ┃ Tactical Review
* 🔊 ┃ Lobby / Chill

🔒 ┃ STAFF HQ (Locked to Management roles)
* 🔒 ┃ staff-announcements
* 📝 ┃ recruitment-logs
* 🛡️ ┃ mod-logs
* 🔊 ┃ Management Briefing`;
                  navigator.clipboard.writeText(layoutText);
                  setCopyFeedback('Server Layout copied to clipboard!');
                  setTimeout(() => setCopyFeedback(null), 3000);
                }}
                className="px-3.5 py-2 rounded-lg bg-rose-900/60 hover:bg-rose-800/70 text-xs font-semibold text-rose-200 border border-rose-700/50 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <FolderTree className="w-3.5 h-3.5 text-rose-400" />
                <span>Copy Server Layout</span>
              </button>
            </div>
          </div>

          {copyFeedback && (
            <div className="p-3 bg-zinc-900 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{copyFeedback}</span>
              </div>
              <button onClick={() => setCopyFeedback(null)} className="text-zinc-500 hover:text-white cursor-pointer">
                &times;
              </button>
            </div>
          )}

          {/* Grid: Left = Role Hierarchy, Right = Server Channel Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Role Hierarchy (4 Tiers) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>1. Role Hierarchy (Top to Bottom)</span>
                </h4>
                <span className="text-[11px] font-mono text-zinc-500">4 Tiers • 17 Roles</span>
              </div>

              {/* Tier 1: Management & Staff */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-xs font-bold text-white uppercase tracking-wide">1. Management &amp; Staff</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/40">
                    Administrator
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-rose-400">👑 Owner</span>
                      <p className="text-[11px] text-zinc-400">Full server and team control</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">Tier 1</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-rose-300">📋 Head Coach / Manager</span>
                      <p className="text-[11px] text-zinc-400">Tactics, lineups, matchday decisions</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">Tier 1</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-orange-400">🔍 Assistant Coach / Scout</span>
                      <p className="text-[11px] text-zinc-400">Trial evaluations and recruitment</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">Tier 1</span>
                  </div>
                </div>
              </div>

              {/* Tier 2: Competitive Squad Tiers */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-white uppercase tracking-wide">2. Competitive Squad Tiers</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40">
                    Roster Status
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-amber-400">⭐ First Team</span>
                      <p className="text-[11px] text-zinc-400">Starting XI / primary roster for league matches</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">Tier 2</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-400">🛡️ Academy / Reserves</span>
                      <p className="text-[11px] text-zinc-400">Development squad, second-string</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">Tier 2</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-yellow-400">📝 Trialist</span>
                      <p className="text-[11px] text-zinc-400">Active applicants currently trying out</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">Tier 2</span>
                  </div>
                </div>
              </div>

              {/* Tier 3: Position Tags */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-white uppercase tracking-wide">3. Position Tags</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                    Self-Assign / Coach
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-bold text-amber-300">🧤 Goalkeeper (GK)</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-bold text-emerald-400">🛡️ Center Back (CB)</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-bold text-cyan-400">⚡ Fullback (LB / RB)</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-bold text-sky-400">🔒 Def Mid (CDM / DM)</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-bold text-indigo-400">🎯 Central Mid (CM)</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-bold text-purple-400">🧠 Attack Mid (CAM)</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-bold text-pink-400">💨 Winger (LW / RW)</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-bold text-rose-400">🔥 Striker (ST)</span>
                  </div>
                </div>
              </div>

              {/* Tier 4: Community & Utility */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span className="text-xs font-bold text-white uppercase tracking-wide">4. Community &amp; Utility</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    Utility
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-400">✅ Verified Member</span>
                      <p className="text-[11px] text-zinc-400">Passed onboarding &amp; server verification</p>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-yellow-400">🔔 Matchday Ping</span>
                      <p className="text-[11px] text-zinc-400">For league game notifications &amp; callouts</p>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-purple-400">🎬 Content / Streamer</span>
                      <p className="text-[11px] text-zinc-400">For community streams and media highlights</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Server Channel Layout (Categories & Channels) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-rose-400" />
                  <span>2. Discord Server Channel Layout</span>
                </h4>
                <span className="text-[11px] font-mono text-zinc-500">6 Categories • 21 Channels</span>
              </div>

              {/* 1. INFORMATION */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">📌 ┃ INFORMATION</span>
                  <span className="text-[10px] font-mono text-zinc-500">Public Read-Only</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-zinc-300">📢 announcements</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-zinc-300">📜 rules-and-info</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-zinc-300">🤖 bot-commands</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-zinc-300">👑 roles-and-pings</span>
                  </div>
                </div>
              </div>

              {/* 2. COMMUNITY */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">💬 ┃ COMMUNITY</span>
                  <span className="text-[10px] font-mono text-zinc-500">Verified Members</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-zinc-300">💬 general-chat</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-zinc-300">🎬 media-and-clips</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-zinc-300">📈 achievements</span>
                  </div>
                </div>
              </div>

              {/* 3. FIRST TEAM (Locked) */}
              <div className="bg-zinc-900/70 border border-amber-900/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-amber-300">⚽ ┃ FIRST TEAM</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 font-mono border border-amber-800/40 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-amber-400" />
                      <span>Locked to 1st Team</span>
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-amber-300">📋 matchday-lineups</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-amber-300">🧠 tactics-and-meta</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-amber-300">💬 squad-chat</span>
                  </div>
                </div>
              </div>

              {/* 4. ACADEMY & TRIALS */}
              <div className="bg-zinc-900/70 border border-blue-900/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300">🛡️ ┃ ACADEMY &amp; TRIALS</span>
                  <span className="text-[10px] font-mono text-zinc-500">Recruits &amp; Dev</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-blue-300">📝 apply-for-tryouts</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-blue-300">💬 academy-chat</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-blue-300">📊 trial-feedback</span>
                  </div>
                </div>
              </div>

              {/* 5. VOICE CHANNELS */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">🎙️ ┃ VOICE CHANNELS</span>
                  <span className="text-[10px] font-mono text-zinc-500">Comms Hub</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-emerald-400">🔊 Match Room A (First Team)</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-emerald-400">🔊 Match Room B (Academy)</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-zinc-300">🔊 Tactical Review</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-zinc-300">🔊 Lobby / Chill</span>
                  </div>
                </div>
              </div>

              {/* 6. STAFF HQ (Locked) */}
              <div className="bg-zinc-900/70 border border-rose-900/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-rose-300">🔒 ┃ STAFF HQ</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 font-mono border border-rose-800/40 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-rose-400" />
                      <span>Locked to Management</span>
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-rose-400">🔒 staff-announcements</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-rose-400">📝 recruitment-logs</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-rose-400">🛡️ mod-logs</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                    <span className="font-mono text-rose-400">🔊 Management Briefing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: USER SELF-ASSIGNMENT */}
      {activeTab === 'self-assign' && (
        <div className="space-y-6">
          {/* Active Profile Tray */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Your Current Discord Profile &amp; Active Roles</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Logged in as <strong className="text-white">Manager_Cap</strong> • Click any role card below to toggle it on or off.
                </p>
              </div>

              <div className="text-xs font-mono text-zinc-400">
                {userRoles.length} Roles Assigned
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800/80">
              {userRoles.length === 0 ? (
                <span className="text-xs text-zinc-500 italic">No self-assigned roles yet. Click any role below!</span>
              ) : (
                userRoles.map((rId) => {
                  const role = roles.find((r) => r.id === rId);
                  if (!role) return null;
                  return (
                    <span
                      key={role.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm"
                      style={{
                        backgroundColor: `${role.color}20`,
                        border: `1px solid ${role.color}60`,
                        color: role.color,
                      }}
                    >
                      <span>{role.emoji}</span>
                      <span>{role.name}</span>
                      <button
                        onClick={() => onToggleUserRole(role.id)}
                        className="ml-1 hover:text-white cursor-pointer opacity-70 hover:opacity-100"
                        title="Remove role"
                      >
                        &times;
                      </button>
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {/* Categorized Role Grids */}
          {categories.map((cat) => {
            const catRoles = roles.filter((r) => r.category === cat);
            if (catRoles.length === 0) return null;

            return (
              <div key={cat} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-2">
                    {cat === 'Management & Staff' && <Crown className="w-4 h-4 text-rose-400" />}
                    {cat === 'Competitive Squad Tiers' && <Award className="w-4 h-4 text-amber-400" />}
                    {cat === 'Position Tags' && <Shield className="w-4 h-4 text-emerald-400" />}
                    {cat === 'Community & Utility' && <Users className="w-4 h-4 text-sky-400" />}
                    {cat === 'Game Interests' && <Gamepad2 className="w-4 h-4 text-rose-400" />}
                    {cat === 'Position' && <Shield className="w-4 h-4 text-emerald-400" />}
                    {cat === 'Notifications' && <Bell className="w-4 h-4 text-amber-400" />}
                    {cat === 'Platform' && <Users className="w-4 h-4 text-teal-400" />}
                    <span>{cat}</span>
                  </h3>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {catRoles.length} Available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catRoles.map((role) => {
                    const isAssigned = userRoles.includes(role.id);
                    return (
                      <button
                        key={role.id}
                        onClick={() => onToggleUserRole(role.id)}
                        className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                          isAssigned
                            ? 'bg-zinc-900/90 border-rose-500/80 shadow-md ring-1 ring-rose-500/30'
                            : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/70'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
                                {role.emoji}
                              </span>
                              <div>
                                <div className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                                  {role.name}
                                </div>
                                <div className="text-[10px] font-mono text-zinc-400">
                                  ID: {role.id}
                                </div>
                              </div>
                            </div>

                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs ${
                                isAssigned
                                  ? 'bg-rose-600 border-rose-500 text-white'
                                  : 'border-zinc-700 text-transparent group-hover:text-zinc-500'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          </div>

                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {role.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold"
                            style={{
                              backgroundColor: `${role.color}15`,
                              color: role.color,
                            }}
                          >
                            {isAssigned ? 'Assigned' : 'Click to Self-Assign'}
                          </span>
                          <span className="text-zinc-500 font-mono">
                            {role.memberCount || 0} members
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: ADMINISTRATOR ROLE CONTROLS */}
      {activeTab === 'admin-manage' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Admin Assignment Controls */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-rose-500" />
                  <h3 className="text-base font-bold text-white">Administrator Role Assignment</h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                  MANAGE_ROLES GRANTED
                </span>
              </div>

              {/* Step 1: Pick Target Member */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  1. Select Target Member
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {members.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMemberId(m.id)}
                      className={`text-left p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${
                        selectedMemberId === m.id
                          ? 'bg-rose-950/40 border-rose-500 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <img
                        src={m.avatar}
                        alt={m.username}
                        className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800"
                      />
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{m.displayName}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">@{m.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Member's Active Roles & Modify */}
              {selectedMember && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300">
                      Roles currently assigned to <strong className="text-rose-400">{selectedMember.username}</strong>:
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      {selectedMember.roles.length} roles
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedMember.roles.length === 0 ? (
                      <span className="text-xs text-zinc-500 italic">No roles currently assigned.</span>
                    ) : (
                      selectedMember.roles.map((rId) => {
                        const r = roles.find((role) => role.id === rId);
                        if (!r) return null;
                        return (
                          <span
                            key={r.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-xs text-zinc-200"
                          >
                            <span>{r.emoji}</span>
                            <span>{r.name}</span>
                            <button
                              onClick={() => onAdminRemoveRole(selectedMember.id, r.id)}
                              className="text-zinc-500 hover:text-rose-400 cursor-pointer ml-1"
                              title="Revoke role as admin"
                            >
                              &times;
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Grant New Role */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  2. Select Role to Assign or Revoke
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedRoleToAssign}
                    onChange={(e) => setSelectedRoleToAssign(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.emoji} {r.name} ({r.category})
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onAdminAssignRole(selectedMember.id, selectedRoleToAssign)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Grant Role</span>
                    </button>
                    <button
                      onClick={() => onAdminRemoveRole(selectedMember.id, selectedRoleToAssign)}
                      className="px-4 py-2 bg-zinc-800 hover:bg-rose-900 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer border border-zinc-700 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revoke</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Real-time Audit Logs */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-md h-full flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-rose-400" />
                  <span>Role Action Audit Log</span>
                </h3>
                <span className="text-[11px] font-mono text-zinc-500">
                  {auditLogs.length} events logged
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[460px] pr-1">
                {auditLogs.length === 0 ? (
                  <div className="text-xs text-zinc-500 py-6 text-center italic">
                    No role actions logged yet in this session.
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-lg text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            log.action === 'add'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : log.action === 'remove'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {log.action.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="text-zinc-300">
                        <span className="font-semibold text-white">{log.actor}</span>
                        {log.action === 'add' ? ' granted ' : log.action === 'remove' ? ' revoked ' : ' toggled '}
                        <strong className="text-rose-400">{log.roleName}</strong>
                        {log.action !== 'self_join' && log.action !== 'self_leave' && (
                          <span> for <strong className="text-white">@{log.targetUser}</strong></span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REACTION ROLES EMBED PREVIEW */}
      {activeTab === 'reaction-embed' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-[#313338] border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="text-xs text-zinc-400 mb-3 flex items-center justify-between">
              <span>Discord Live Embed Preview (Channel: <strong>#role-select</strong>)</span>
              <span className="font-mono text-emerald-400">Component Type: Buttons &amp; Select Menu</span>
            </div>

            {/* Embedded simulated Discord message */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-700 flex items-center justify-center font-bold text-white text-xs shrink-0">
                BOT
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">Academia Bot</span>
                  <span className="px-1 py-0.2 bg-[#5865f2] text-[10px] font-bold text-white rounded font-mono">BOT</span>
                  <span className="text-xs text-zinc-500 font-mono">Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <p className="text-sm text-zinc-200 mt-1 whitespace-pre-line leading-relaxed">
                  🏷️ <strong>SELF-ASSIGNABLE ROLES // INTERACTIVE SELECTION PANEL</strong>{'\n'}
                  Click any button below to instantly toggle roles on your profile. Administrators can also use <code className="bg-zinc-800 px-1 py-0.5 rounded text-rose-300">/role assign</code> or <code className="bg-zinc-800 px-1 py-0.5 rounded text-rose-300">/role revoke</code>.
                </p>

                {/* Embed */}
                <div className="mt-3 rounded-lg bg-[#2b2d31] border-l-4 border-rose-600 p-4 shadow-sm max-w-xl">
                  <div className="text-base font-bold text-white mb-1.5">
                    🎭 COMMUNITY ROLES &amp; NOTIFICATION PREFERENCES
                  </div>
                  <div className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed mb-3">
                    Customize your server profile by selecting your Pro Clubs positional archetypes and notification preferences below:
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 my-2 border-t border-zinc-700/40 pt-2.5 text-xs">
                    <div>
                      <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
                        ⚽ Primary Positions
                      </div>
                      <div className="text-zinc-200 space-y-0.5 font-mono text-[11px]">
                        <div>• 🛡️ Center Back (CB) - Anchor &amp; aerial clearance</div>
                        <div>• ⚡ Defensive Mid (CDM) - Press &amp; turnover release</div>
                        <div>• 🎯 Attacking Mid (CAM) - Vision &amp; half-space spacing</div>
                        <div>• 🔥 Striker (ST) - Box finishing &amp; channel runs</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
                        🔔 Notification Pings
                      </div>
                      <div className="text-zinc-200 space-y-0.5 font-mono text-[11px]">
                        <div>• 🔔 Matchday Pings - Tournament starting calls</div>
                        <div>• ⚔️ Scrim Alerts - Friendly training &amp; scrim alerts</div>
                        <div>• 📢 Club Announcements - Decrees &amp; roster updates</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-700/40 text-[10px] text-zinc-400 font-mono">
                    Interactive Role Manager • Click buttons to toggle
                  </div>
                </div>

                {/* Buttons */}
                <div className="mt-3 flex flex-wrap gap-2 max-w-xl">
                  {roles.slice(0, 7).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onToggleUserRole(r.id)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                        userRoles.includes(r.id)
                          ? 'bg-rose-600 text-white font-bold ring-1 ring-white/30'
                          : 'bg-[#4e5058] hover:bg-[#6d6f78] text-zinc-100'
                      }`}
                    >
                      <span>{r.emoji}</span>
                      <span>{r.name}</span>
                      {userRoles.includes(r.id) && <Check className="w-3 h-3 text-white ml-0.5" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleDispatchRolePanel}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Dispatch this Role Embed to Discord Channels</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: COMMAND REFERENCE */}
      {activeTab === 'commands' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-white">Discord Bot Command Handler Specification</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Both prefix commands (<code className="text-rose-400">!</code>) and Slash commands (<code className="text-rose-400">/</code>) are implemented in the bot codebase:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Prefix Commands */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg space-y-3">
                <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  <span>Prefix Commands (Default: !)</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="font-mono font-bold text-white">!ping</div>
                    <div className="text-zinc-400 text-[11px]">Responds with &quot;Pong! 🏓&quot; and bot roundtrip latency.</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-white">!role join &lt;role_name&gt;</div>
                    <div className="text-zinc-400 text-[11px]">Self-assigns an open role (e.g. <code>!role join CB</code> or <code>!role join Matchday</code>).</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-white">!role leave &lt;role_name&gt;</div>
                    <div className="text-zinc-400 text-[11px]">Removes a self-assigned role from your profile.</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-white">!role add @User &lt;role_name&gt;</div>
                    <div className="text-zinc-400 text-[11px]">Administrator command: grants any role to another user. Checks <code>ManageRoles</code> permission.</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-white">!role remove @User &lt;role_name&gt;</div>
                    <div className="text-zinc-400 text-[11px]">Administrator command: revokes role from user. Checks <code>ManageRoles</code>.</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-white">!avail [in | late | out]</div>
                    <div className="text-zinc-400 text-[11px]">Matchday RSVP: mark yourself available, late (with note), or out.</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-white">!checkin</div>
                    <div className="text-zinc-400 text-[11px]">Log presence in voice comms for matchday session attendance.</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-white">!lineup</div>
                    <div className="text-zinc-400 text-[11px]">Display 11v11 starting sheet, backline, midfield engine, and attack.</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-white">!roles</div>
                    <div className="text-zinc-400 text-[11px]">Displays full directory of available self-assignable roles.</div>
                  </div>
                </div>
              </div>

              {/* Slash Commands */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Slash Commands (Discord API v10)</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="font-mono font-bold text-white">/ping</div>
                    <div className="text-zinc-400 text-[11px]">Slash command returning &quot;Pong! 🏓&quot; with websocket heartbeat.</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-white">/availability poll</div>
                    <div className="text-zinc-400 text-[11px]">Interactive poll with buttons [🟢 In] [🟡 Late] [🔴 Out].</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-white">/attendance [call | summary]</div>
                    <div className="text-zinc-400 text-[11px]">Launch voice lobby roll call check-in or inspect attendance rates.</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-white">/lineup [433 | 4231 | 352]</div>
                    <div className="text-zinc-400 text-[11px]">Generate 11v11 pitch tactical formation with starting starters.</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-white">/role assist</div>
                    <div className="text-zinc-400 text-[11px]">Recruit wizard recommending roles tailored to build &amp; playstyle.</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-white">/role audit</div>
                    <div className="text-zinc-400 text-[11px]">Staff command: finds recruits missing positional or ping roles.</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-white">/role assign target:@user role:&lt;role&gt;</div>
                    <div className="text-zinc-400 text-[11px]">Administrator slash command with Discord member and role selectors.</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-white">/role revoke target:@user role:&lt;role&gt;</div>
                    <div className="text-zinc-400 text-[11px]">Administrator slash command to revoke role with audit log.</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-white">/trial submit</div>
                    <div className="text-zinc-400 text-[11px]">Recruitment card dispatch for FC27 Pro Clubs Multiverse.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
