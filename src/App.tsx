import React, { useState, useEffect } from 'react';
import { PlayerTrialCard, DiscordMessage, SquadTier, SelfAssignableRole, DiscordMember, RoleAuditEntry, ModerationAuditEntry, FC27PlayerStats } from './types';
import { INITIAL_PLAYERS, INITIAL_DISCORD_MESSAGES, INITIAL_ROLES, INITIAL_MEMBERS } from './data/initialData';
import { Navigation } from './components/Navigation';
import { DiscordSimulator } from './components/DiscordSimulator';
import { RoleManager } from './components/RoleManager';
import { TrialCardBuilder } from './components/TrialCardBuilder';
import { SquadArchitecture } from './components/SquadArchitecture';
import { TacticalDirectives } from './components/TacticalDirectives';
import { BotCodeGenerator } from './components/BotCodeGenerator';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { FC27StatsExplorer } from './components/FC27StatsExplorer';
import { WebhookModal } from './components/WebhookModal';
import { createTrialCardEmbed } from './utils/discordEmbed';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'roles' | 'builder' | 'squad' | 'tactics' | 'bot-code' | 'analytics' | 'fc27-stats'>('simulator');
  const [prefillPlayerStats, setPrefillPlayerStats] = useState<FC27PlayerStats | null>(null);
  
  // Persisted Players
  const [players, setPlayers] = useState<PlayerTrialCard[]>(() => {
    try {
      const saved = localStorage.getItem('la_academia_players');
      return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
    } catch {
      return INITIAL_PLAYERS;
    }
  });

  // Roles State
  const [roles, setRoles] = useState<SelfAssignableRole[]>(() => {
    try {
      const saved = localStorage.getItem('la_academia_roles');
      return saved ? JSON.parse(saved) : INITIAL_ROLES;
    } catch {
      return INITIAL_ROLES;
    }
  });

  // Members State
  const [members, setMembers] = useState<DiscordMember[]>(() => {
    try {
      const saved = localStorage.getItem('la_academia_members');
      return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
    } catch {
      return INITIAL_MEMBERS;
    }
  });

  // Current User's Self-Assigned Roles (simulated logged in user Manager_Cap)
  const [userRoles, setUserRoles] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('la_academia_user_roles');
      return saved ? JSON.parse(saved) : ['role-fc27', 'role-afh', 'role-cb', 'role-matchday'];
    } catch {
      return ['role-fc27', 'role-afh', 'role-cb', 'role-matchday'];
    }
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<RoleAuditEntry[]>(() => {
    try {
      const saved = localStorage.getItem('la_academia_audit_logs');
      return saved ? JSON.parse(saved) : [
        {
          id: 'log-init-1',
          action: 'add',
          actor: 'Manager_Cap',
          targetUser: 'Vortex_Anchor',
          roleId: 'role-cb',
          roleName: 'Center Back (CB)',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'log-init-2',
          action: 'self_join',
          actor: 'ShadowPress_99',
          targetUser: 'ShadowPress_99',
          roleId: 'role-cdm',
          roleName: 'Defensive Mid (CDM)',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
        },
      ];
    } catch {
      return [];
    }
  });

  // Moderation Audit Logs State
  const [moderationLogs, setModerationLogs] = useState<ModerationAuditEntry[]>(() => {
    try {
      const saved = localStorage.getItem('la_academia_moderation_logs');
      return saved ? JSON.parse(saved) : [
        {
          id: 'mod-init-1',
          action: 'warn',
          actor: 'Manager_Cap (Staff)',
          targetUser: 'Viper_Striker99',
          reason: 'Spamming mic during 11v11 competitive scrim match',
          channelId: 'match-lineups',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'mod-init-2',
          action: 'clear',
          actor: 'Manager_Cap (Staff)',
          reason: 'Cleared test bot output messages',
          channelId: 'bot-commands',
          count: 5,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
    } catch {
      return [];
    }
  });

  // Persisted Messages
  const [messages, setMessages] = useState<DiscordMessage[]>(() => {
    try {
      const saved = localStorage.getItem('la_academia_messages');
      return saved ? JSON.parse(saved) : INITIAL_DISCORD_MESSAGES;
    } catch {
      return INITIAL_DISCORD_MESSAGES;
    }
  });

  // Webhook Configuration
  const [webhookUrl, setWebhookUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('la_academia_webhook') || '';
    } catch {
      return '';
    }
  });

  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('la_academia_players', JSON.stringify(players));
    } catch (e) {
      console.warn('Failed to persist players:', e);
    }
  }, [players]);

  useEffect(() => {
    try {
      localStorage.setItem('la_academia_roles', JSON.stringify(roles));
    } catch (e) {
      console.warn('Failed to persist roles:', e);
    }
  }, [roles]);

  useEffect(() => {
    try {
      localStorage.setItem('la_academia_members', JSON.stringify(members));
    } catch (e) {
      console.warn('Failed to persist members:', e);
    }
  }, [members]);

  useEffect(() => {
    try {
      localStorage.setItem('la_academia_user_roles', JSON.stringify(userRoles));
    } catch (e) {
      console.warn('Failed to persist user roles:', e);
    }
  }, [userRoles]);

  useEffect(() => {
    try {
      localStorage.setItem('la_academia_audit_logs', JSON.stringify(auditLogs));
    } catch (e) {
      console.warn('Failed to persist audit logs:', e);
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('la_academia_moderation_logs', JSON.stringify(moderationLogs));
    } catch (e) {
      console.warn('Failed to persist moderation logs:', e);
    }
  }, [moderationLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('la_academia_messages', JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to persist messages:', e);
    }
  }, [messages]);

  const handleSaveWebhook = (url: string) => {
    setWebhookUrl(url);
    try {
      localStorage.setItem('la_academia_webhook', url);
    } catch (e) {
      console.warn('Failed to persist webhook:', e);
    }
  };

  const handleToggleUserRole = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    const hasRole = userRoles.includes(roleId);
    const newRoles = hasRole ? userRoles.filter((id) => id !== roleId) : [...userRoles, roleId];
    setUserRoles(newRoles);

    // Update role member count
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id === roleId) {
          const currentCount = r.memberCount || 0;
          return { ...r, memberCount: hasRole ? Math.max(0, currentCount - 1) : currentCount + 1 };
        }
        return r;
      })
    );

    // Log audit entry
    if (role) {
      const entry: RoleAuditEntry = {
        id: `audit-${Date.now()}`,
        action: hasRole ? 'self_leave' : 'self_join',
        actor: 'Manager_Cap',
        targetUser: 'Manager_Cap',
        roleId: role.id,
        roleName: role.name,
        timestamp: new Date().toISOString(),
      };
      setAuditLogs((prev) => [entry, ...prev]);
    }
  };

  const handleAdminAssignRole = (memberId: string, roleId: string) => {
    const member = members.find((m) => m.id === memberId);
    const role = roles.find((r) => r.id === roleId);
    if (!member || !role) return;

    if (!member.roles.includes(roleId)) {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, roles: [...m.roles, roleId] } : m))
      );

      // Update role count
      setRoles((prev) =>
        prev.map((r) => (r.id === roleId ? { ...r, memberCount: (r.memberCount || 0) + 1 } : r))
      );

      const entry: RoleAuditEntry = {
        id: `audit-${Date.now()}`,
        action: 'add',
        actor: 'Manager_Cap (Admin)',
        targetUser: member.username,
        roleId: role.id,
        roleName: role.name,
        timestamp: new Date().toISOString(),
      };
      setAuditLogs((prev) => [entry, ...prev]);

      // Announce in role-select or announcements
      handlePostToSimulator(
        'role-select',
        `🛡️ **ADMIN ROLE ASSIGNMENT:** <@${member.username}> was granted the role **${role.emoji} ${role.name}**.`,
        {
          title: '📋 ROLE ASSIGNMENT AUDIT',
          description: `Staff member **Manager_Cap** assigned **${role.name}** to **${member.displayName}**.`,
          color: 0x10B981,
          fields: [
            { name: 'Target User', value: `@${member.username}`, inline: true },
            { name: 'Role Granted', value: `${role.emoji} ${role.name} (${role.category})`, inline: true },
          ],
          footer: { text: 'La Academia Role Hierarchy Ops' },
        }
      );
    }
  };

  const handleAdminRemoveRole = (memberId: string, roleId: string) => {
    const member = members.find((m) => m.id === memberId);
    const role = roles.find((r) => r.id === roleId);
    if (!member || !role) return;

    if (member.roles.includes(roleId)) {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, roles: m.roles.filter((r) => r !== roleId) } : m))
      );

      setRoles((prev) =>
        prev.map((r) => (r.id === roleId ? { ...r, memberCount: Math.max(0, (r.memberCount || 0) - 1) } : r))
      );

      const entry: RoleAuditEntry = {
        id: `audit-${Date.now()}`,
        action: 'remove',
        actor: 'Manager_Cap (Admin)',
        targetUser: member.username,
        roleId: role.id,
        roleName: role.name,
        timestamp: new Date().toISOString(),
      };
      setAuditLogs((prev) => [entry, ...prev]);

      handlePostToSimulator(
        'role-select',
        `🛡️ **ADMIN ROLE REVOCATION:** Role **${role.emoji} ${role.name}** was revoked from <@${member.username}>.`,
        {
          title: '📋 ROLE REVOCATION AUDIT',
          description: `Staff member **Manager_Cap** removed **${role.name}** from **${member.displayName}**.`,
          color: 0xEF4444,
          footer: { text: 'La Academia Role Hierarchy Ops' },
        }
      );
    }
  };

  const handleSendMessage = (msg: Partial<DiscordMessage>) => {
    const newMsg: DiscordMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      channelId: msg.channelId || 'bot-commands',
      content: msg.content || '',
      embeds: msg.embeds,
      actionButtons: msg.actionButtons,
      reactions: msg.reactions,
      author: msg.author || {
        name: 'Manager_Cap',
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=ManagerCap',
        roleColor: '#38bdf8',
      },
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const handlePostTrialCardToSimulator = (player: PlayerTrialCard) => {
    setPlayers((prev) => [player, ...prev]);

    const embed = createTrialCardEmbed(player);
    const trialMsg: DiscordMessage = {
      id: `msg-trial-${Date.now()}`,
      channelId: 'trial-submission',
      author: {
        name: player.gamertag,
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${player.gamertag}`,
        roleColor: '#94a3b8',
      },
      content: `/trial submit --pos=${player.position} --ovr=${player.overallRating}`,
      embeds: [embed],
      actionButtons: [
        {
          id: `btn-approve-dev-${player.id}`,
          label: 'Approve to Dev Squad',
          style: 'success',
          action: 'promote_dev',
          playerId: player.id,
        },
        {
          id: `btn-callup-first-${player.id}`,
          label: 'Fast-Track First XI',
          style: 'primary',
          action: 'promote_first',
          playerId: player.id,
        },
        {
          id: `btn-assign-roles-${player.id}`,
          label: 'Assign Trial Roles',
          style: 'secondary',
          action: 'open_roles',
          playerId: player.id,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, trialMsg]);
    setActiveTab('simulator');
  };

  const handlePromotePlayer = (playerId: string, targetTier: SquadTier) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            tier: targetTier,
            contractStatus:
              targetTier === 'first-xi'
                ? 'Active First XI'
                : targetTier === 'dev-squad'
                ? 'Development Contract'
                : 'Evaluating',
          };
        }
        return p;
      })
    );

    const player = players.find((p) => p.id === playerId);
    if (player) {
      handlePostToSimulator(
        'announcements',
        `📢 **ROSTER UPDATE:** <@${player.discordTag}> has officially been assigned to **${
          targetTier === 'first-xi' ? 'First XI (AFH Premier Squad)' : targetTier === 'dev-squad' ? 'La Academia (Dev Squad)' : 'Trial Evaluation Pool'
        }**.`,
        {
          title: `⚔️ SQUAD CONTRACT: ${player.gamertag}`,
          description: `Player assigned to tier: **${targetTier.toUpperCase()}**`,
          color: targetTier === 'first-xi' ? 0xF59E0B : targetTier === 'dev-squad' ? 0xE11D48 : 0x3B82F6,
          fields: [
            { name: 'Position & OVR', value: `${player.position} (${player.overallRating} OVR)`, inline: true },
            { name: 'Archetype', value: player.archetype, inline: true },
          ],
          footer: { text: 'La Academia Multiverse Roster Ops' },
        }
      );
    }
  };

  const handleEvaluatePlayer = (playerId: string, score: number, notes: string, newTier?: SquadTier) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            trialScore: score,
            notes: notes || p.notes,
            tier: newTier || p.tier,
            contractStatus:
              newTier === 'first-xi'
                ? 'Active First XI'
                : newTier === 'dev-squad'
                ? 'Development Contract'
                : p.contractStatus,
          };
        }
        return p;
      })
    );

    const player = players.find((p) => p.id === playerId);
    if (player) {
      handlePostToSimulator(
        'trial-submission',
        `📋 **OFFICIAL SCOUT REVIEW FILED** for <@${player.discordTag}>:`,
        {
          title: `🎯 SCOUTING REPORT: ${player.gamertag} [${score.toFixed(1)} / 10]`,
          description: notes || 'Recruit evaluated under matchday trial conditions.',
          color: score >= 9.0 ? 0xF59E0B : 0xE11D48,
          fields: [
            { name: 'Position & Archetype', value: `${player.position} • ${player.archetype}`, inline: true },
            { name: 'Contract Assignment', value: newTier ? `Promoted to **${newTier.toUpperCase()}**` : player.contractStatus, inline: true },
            { name: 'Vocal Comms Verification', value: player.vocalMic ? '✅ Verified Vocal Line Anchor' : '🔇 No Comms', inline: false },
          ],
          footer: { text: 'La Academia Multiverse Scouting Directorate' },
        }
      );
    }
  };

  const handlePostToSimulator = (channel: string, content: string, embed: any, actionButtons?: any[]) => {
    handleSendMessage({
      channelId: channel,
      content,
      embeds: [embed],
      actionButtons,
      author: {
        name: 'Academia Bot',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
        isBot: true,
        roleColor: '#e11d48',
        tag: 'BOT',
      },
    });
  };

  const handleClearMessages = (channelId: string, count: number) => {
    setMessages((prev) => {
      // Find all indices of messages in this channel
      const channelMsgIndices: number[] = [];
      prev.forEach((msg, idx) => {
        if (msg.channelId === channelId) {
          channelMsgIndices.push(idx);
        }
      });

      // Target the last 'count' messages in this channel
      const indicesToRemove = new Set(channelMsgIndices.slice(Math.max(0, channelMsgIndices.length - count)));
      return prev.filter((_, idx) => !indicesToRemove.has(idx));
    });

    const entry: ModerationAuditEntry = {
      id: `mod-${Date.now()}`,
      action: 'clear',
      actor: 'Manager_Cap (Staff)',
      reason: `Purged ${count} messages via !clear command`,
      channelId,
      count,
      timestamp: new Date().toISOString(),
    };
    setModerationLogs((prev) => [entry, ...prev]);
  };

  const handleModerateUser = (action: 'kick' | 'ban' | 'mute' | 'unmute', targetUser: string, reason: string, duration?: string) => {
    const cleanUser = targetUser.replace('@', '');

    // Record moderation audit log
    const entry: ModerationAuditEntry = {
      id: `mod-${Date.now()}`,
      action,
      actor: 'Manager_Cap (Staff)',
      targetUser: cleanUser,
      reason: reason || 'Violation of team rules & discipline',
      duration: duration || (action === 'mute' ? '10m' : undefined),
      timestamp: new Date().toISOString(),
    };
    setModerationLogs((prev) => [entry, ...prev]);

    // If target is in active members list, remove them for kick/ban
    if (action === 'kick' || action === 'ban') {
      setMembers((prev) => prev.filter((m) => m.username.toLowerCase() !== cleanUser.toLowerCase()));
    }

    const title = 
      action === 'ban' ? '🔨 MEMBER PERMANENTLY BANNED' :
      action === 'kick' ? '👢 MEMBER KICKED FROM GUILD' :
      action === 'mute' ? '🔇 MEMBER TIMED OUT / MUTED' :
      '🔊 MEMBER TIMEOUT REMOVED / UNMUTED';

    const color = 
      action === 'ban' ? 0x991B1B :
      action === 'kick' ? 0xEF4444 :
      action === 'mute' ? 0xF59E0B :
      0x10B981;

    const sanctionLabel = 
      action === 'ban' ? 'Permanent Ban & Blacklist' :
      action === 'kick' ? 'Guild Kick (Can Rejoin)' :
      action === 'mute' ? `Communication Timeout (${duration || '10m'})` :
      'Timeout Lifted (Voice/Chat Restored)';

    const fields: any[] = [
      { name: 'Target User', value: `<@${cleanUser}> (${cleanUser})`, inline: true },
      { name: 'Enforcing Staff', value: 'Manager_Cap (Staff)', inline: true },
      { name: 'Sanction Type', value: sanctionLabel, inline: true },
    ];

    if (action === 'mute' && duration) {
      fields.push({ name: 'Duration', value: `⏱️ ${duration}`, inline: true });
    }

    fields.push({ name: 'Reason', value: reason || 'Violation of team rules & discipline', inline: false });

    // Automatically post staff enforcement embed into #mod-logs
    handlePostToSimulator(
      'mod-logs',
      `🛡️ **STAFF ENFORCEMENT AUDIT: ${action.toUpperCase()} EXECUTED**`,
      {
        title,
        description: `Staff member **Manager_Cap** executed **${action.toUpperCase()}** against <@${cleanUser}>.`,
        color,
        fields,
        footer: { text: 'La Academia Staff Moderation Directorate • Discord Audit Log' },
        timestamp: new Date().toISOString(),
      }
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-rose-900 selection:text-white">
      {/* Primary Top Bar (Clean, no rebrand banner) */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openWebhookModal={() => setIsWebhookModalOpen(true)}
        hasWebhookConfigured={Boolean(webhookUrl)}
        openBuilder={() => setActiveTab('builder')}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'simulator' && (
          <DiscordSimulator
            messages={messages}
            onSendMessage={handleSendMessage}
            players={players}
            onPromotePlayer={handlePromotePlayer}
            onOpenCardBuilder={() => setActiveTab('builder')}
            onOpenRoles={() => setActiveTab('roles')}
            onClearMessages={handleClearMessages}
            onModerateUser={handleModerateUser}
            moderationLogs={moderationLogs}
          />
        )}

        {activeTab === 'roles' && (
          <RoleManager
            roles={roles}
            members={members}
            onToggleUserRole={handleToggleUserRole}
            onAdminAssignRole={handleAdminAssignRole}
            onAdminRemoveRole={handleAdminRemoveRole}
            userRoles={userRoles}
            auditLogs={auditLogs}
            onPostRoleEmbedToSimulator={handlePostToSimulator}
            webhookUrl={webhookUrl}
            onOpenWebhookModal={() => setIsWebhookModalOpen(true)}
          />
        )}

        {activeTab === 'builder' && (
          <TrialCardBuilder
            onPostToSimulator={handlePostTrialCardToSimulator}
            webhookUrl={webhookUrl}
            onOpenWebhookModal={() => setIsWebhookModalOpen(true)}
            prefillStats={prefillPlayerStats}
          />
        )}

        {activeTab === 'squad' && (
          <SquadArchitecture
            players={players}
            onPromotePlayer={handlePromotePlayer}
            onOpenCardBuilder={() => setActiveTab('builder')}
            onEvaluatePlayer={handleEvaluatePlayer}
          />
        )}

        {activeTab === 'analytics' && (
          <PerformanceDashboard
            players={players}
            onPromotePlayer={handlePromotePlayer}
            onPostToSimulator={handlePostToSimulator}
            webhookUrl={webhookUrl}
          />
        )}

        {activeTab === 'fc27-stats' && (
          <FC27StatsExplorer
            onAutoFillTrialCard={(stats) => {
              setPrefillPlayerStats(stats);
              setActiveTab('builder');
            }}
            onPostToSimulator={handlePostToSimulator}
            webhookUrl={webhookUrl}
          />
        )}

        {activeTab === 'tactics' && (
          <TacticalDirectives
            onPostToSimulator={handlePostToSimulator}
            webhookUrl={webhookUrl}
          />
        )}

        {activeTab === 'bot-code' && (
          <BotCodeGenerator
            webhookUrl={webhookUrl}
            onSaveWebhookUrl={handleSaveWebhook}
          />
        )}
      </main>

      {/* Webhook Configuration Modal */}
      <WebhookModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        webhookUrl={webhookUrl}
        onSaveWebhookUrl={handleSaveWebhook}
      />

      {/* Clean Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-6 text-zinc-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">La Academia // FC27</span>
            <span>&bull;</span>
            <span>First XI • Dev Squad • Trial Pool</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Discord.js v14 Integration</span>
            <span>&bull;</span>
            <span>Availability, Attendance &amp; Matchday Ops</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

