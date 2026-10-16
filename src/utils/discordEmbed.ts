import { PlayerTrialCard } from '../types';

export function createTrialCardEmbed(player: PlayerTrialCard) {
  const getPositionEmoji = (pos: string) => {
    switch (pos) {
      case 'CB': return '🛡️';
      case 'CDM': return '⚡';
      case 'CAM':
      case 'CM': return '🎯';
      case 'ST': return '⚡';
      case 'GK': return '🧤';
      default: return '⚽';
    }
  };

  return {
    title: `🩸 LA ACADEMIA // TRIAL CARD: ${player.gamertag}`,
    description: `Official trial submission for **LA ACADEMIA Pro Clubs Multiverse** (FC27).\nRecruit Archetype: **${player.archetype}**`,
    color: 0xE11D48, // Crimson brand color
    fields: [
      {
        name: 'Position & Rating',
        value: `${getPositionEmoji(player.position)} **${player.position}**${player.secondaryPosition ? ` / ${player.secondaryPosition}` : ''} • **${player.overallRating} OVR**`,
        inline: true,
      },
      {
        name: 'Physical Build',
        value: `📏 **${player.height}** • ⚖️ **${player.weight}**`,
        inline: true,
      },
      {
        name: 'Vocal Comms',
        value: player.vocalMic ? '🎙️ **Active Vocal Mic (Line Anchor)**' : '🔇 No Mic',
        inline: true,
      },
      {
        name: 'Core Attributes (FC27)',
        value: `**PAC** \`${player.stats.pace}\` | **SHO** \`${player.stats.shooting}\` | **PAS** \`${player.stats.passing}\`\n**DRI** \`${player.stats.dribbling}\` | **DEF** \`${player.stats.defending}\` | **PHY** \`${player.stats.physical}\``,
        inline: false,
      },
      {
        name: 'Signature PlayStyles+',
        value: player.playstyles.length > 0 ? player.playstyles.map(p => `\`${p}\``).join('  ') : 'Standard Build',
        inline: false,
      },
      {
        name: 'Competitive Pedigree & Experience',
        value: player.competitiveExperience || 'Open lobby recruit',
        inline: false,
      },
      {
        name: 'Identity Credentials',
        value: `🎮 **EA ID:** \`${player.eaId || 'N/A'}\` • 💬 **Discord:** \`${player.discordTag || 'N/A'}\``,
        inline: false,
      },
      {
        name: 'Squad Architecture Status',
        value: `Target: **${player.tier === 'first-xi' ? 'First XI (Tournament Roster)' : player.tier === 'dev-squad' ? 'La Academia (Dev Squad)' : 'Trial Evaluation Pool'}** • Status: \`${player.contractStatus}\``,
        inline: false,
      },
    ],
    footer: {
      text: 'La Academia Multiverse Management • FC27 Competitive • #trial-submission',
      icon_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
    },
    timestamp: new Date().toISOString(),
  };
}

export function createAnnouncementEmbed() {
  return {
    title: '🩸 LA ACADEMIA // THE REBRAND IS LIVE 🩸',
    description: 'From the ashes of **the11** and the championship pedigree of **Horror XI**, we enter our next era for FC27: **LA ACADEMIA**.\n\nWe are no longer just a club. We are a **Pro Clubs Multiverse**—a complete competitive structure designed to scout, train, and deploy high-tier players into competitive leagues.',
    color: 0xE11D48,
    fields: [
      {
        name: '⚔️ SQUAD ARCHITECTURE',
        value: '• **First XI:** The premier tournament starting squad (AFH & Major Comp).\n• **La Academia (Dev Squad):** Feeder roster competing in development leagues and internal derbies.\n• **Trial Pool:** Open evaluation lobby for all new recruits looking to earn a contract.',
      },
      {
        name: '🎯 OPEN RECRUITMENT TRIALS',
        value: 'We are actively scouting disciplined players for our upcoming league campaign:\n• **Center Backs (CB):** Anchor builds, aerial clearance, vocal defensive line anchors.\n• **Defensive Midfielders (CDM):** Relentless press coverage, pass retention under pressure.\n• **Attacking Midfielders / Box-to-Box (CAM / CM):** Fast tempo, vision, and tactical spacing.',
      },
      {
        name: '🔗 SUBMISSION INSTRUCTIONS',
        value: 'Submit your trial card in **#trial-submission** with your build, archetype, and competitive experience.',
      },
    ],
    footer: {
      text: 'La Academia Multiverse // FC27 Competitive',
    },
    timestamp: new Date().toISOString(),
  };
}

export async function sendDiscordWebhook(webhookUrl: string, payload: any): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.trim()) {
    return { success: false, message: 'Please enter a valid Discord Webhook URL' };
  }

  // First try via server proxy
  try {
    const res = await fetch('/api/discord/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl, payload }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, message: 'Dispatched to Discord server successfully!' };
    } else {
      throw new Error(data.error || 'Server proxy failed, trying direct dispatch');
    }
  } catch (_err) {
    // Fallback: direct browser fetch
    try {
      const directRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (directRes.ok || directRes.status === 204) {
        return { success: true, message: 'Dispatched directly to Discord webhook!' };
      }
      return { success: false, message: `Discord returned HTTP status ${directRes.status}` };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to dispatch to Discord webhook' };
    }
  }
}
