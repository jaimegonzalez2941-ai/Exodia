import React, { useState, useEffect } from 'react';
import { PlayerTrialCard, Position, FC27PlayerStats } from '../types';
import { FC27CardVisual } from './FC27CardVisual';
import { createTrialCardEmbed, sendDiscordWebhook } from '../utils/discordEmbed';
import { Send, Copy, Check, Sparkles, Shield, Zap, Compass, Radio, CheckCircle2 } from 'lucide-react';

interface TrialCardBuilderProps {
  onPostToSimulator: (player: PlayerTrialCard) => void;
  webhookUrl: string;
  onOpenWebhookModal: () => void;
  prefillStats?: FC27PlayerStats | null;
}

export const TrialCardBuilder: React.FC<TrialCardBuilderProps> = ({
  onPostToSimulator,
  webhookUrl,
  onOpenWebhookModal,
  prefillStats,
}) => {
  const [gamertag, setGamertag] = useState('Valiant_Anchor');
  const [discordTag, setDiscordTag] = useState('Valiant#4011');
  const [eaId, setEaId] = useState('ValiantAnchor_FC');
  const [position, setPosition] = useState<Position>('CB');
  const [secondaryPosition, setSecondaryPosition] = useState<Position | ''>('CDM');
  const [archetype, setArchetype] = useState('Anchor Defensive Colossus');
  const [overallRating, setOverallRating] = useState(89);
  const [height, setHeight] = useState("6'3\"");
  const [weight, setWeight] = useState('194 lbs');
  const [vocalMic, setVocalMic] = useState(true);
  const [competitiveExperience, setCompetitiveExperience] = useState(
    'ACL Division 1 starter, ex-Horror XI tryouts, experienced vocal anchor in 4-back line systems.'
  );

  const [stats, setStats] = useState({
    pace: 83,
    shooting: 40,
    passing: 79,
    dribbling: 72,
    defending: 92,
    physical: 93,
  });

  const [playstyles, setPlaystyles] = useState<string[]>([
    'Aerial+',
    'Anticipate+',
    'Bruiser',
    'Block',
    'Power Header',
  ]);

  const [importedNotice, setImportedNotice] = useState<string | null>(null);

  // Sync when prefillStats changes
  useEffect(() => {
    if (prefillStats) {
      setGamertag(prefillStats.gamertag);
      if (prefillStats.eaId) setEaId(prefillStats.eaId);
      if (prefillStats.discordTag) setDiscordTag(prefillStats.discordTag);
      setPosition(prefillStats.position);
      setOverallRating(prefillStats.overallRating);
      if (prefillStats.archetype) setArchetype(prefillStats.archetype);
      if (prefillStats.playstyles && prefillStats.playstyles.length > 0) {
        setPlaystyles(prefillStats.playstyles);
      }
      setCompetitiveExperience(
        `FC27 Pro Clubs Telemetry: ${prefillStats.matchesPlayed} caps, ${prefillStats.averageMatchRating} AMR, ${prefillStats.goals}G/${prefillStats.assists}A, ${prefillStats.tacklesMade} tackles (${prefillStats.tacklesSuccessRate}% success), ${prefillStats.cleanSheets} clean sheets. Verified via Pro Clubs API.`
      );
      setImportedNotice(`Imported FC27 Stats for ${prefillStats.gamertag} (${prefillStats.overallRating} OVR ${prefillStats.position})`);
      setTimeout(() => setImportedNotice(null), 5000);
    }
  }, [prefillStats]);

  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  // Preset Handlers aligned with prompt requirements
  const applyPreset = (preset: 'cb' | 'cdm' | 'cam') => {
    if (preset === 'cb') {
      setPosition('CB');
      setSecondaryPosition('CDM');
      setArchetype('Anchor Defensive Colossus');
      setOverallRating(90);
      setHeight("6'3\"");
      setWeight('195 lbs');
      setVocalMic(true);
      setStats({ pace: 82, shooting: 40, passing: 78, dribbling: 72, defending: 93, physical: 94 });
      setPlaystyles(['Aerial+', 'Anticipate+', 'Bruiser', 'Block', 'Power Header']);
      setCompetitiveExperience('AFH League veteran, vocal backline anchor with 90%+ aerial clearance rate.');
    } else if (preset === 'cdm') {
      setPosition('CDM');
      setSecondaryPosition('CM');
      setArchetype('Relentless Engine & Press Enforcer');
      setOverallRating(89);
      setHeight("5'11\"");
      setWeight('162 lbs');
      setVocalMic(true);
      setStats({ pace: 85, shooting: 68, passing: 88, dribbling: 82, defending: 90, physical: 91 });
      setPlaystyles(['Intercept+', 'Relentless+', 'Pinged Pass+', 'Press Proven', 'Slide Tackle']);
      setCompetitiveExperience('the11 Dev Squad alumnus, relentless counter-press coverage and 1.5s transition passing.');
    } else if (preset === 'cam') {
      setPosition('CAM');
      setSecondaryPosition('CM');
      setArchetype('Tempo Visionary / Box-to-Box');
      setOverallRating(91);
      setHeight("5'9\"");
      setWeight('150 lbs');
      setVocalMic(true);
      setStats({ pace: 87, shooting: 84, passing: 94, dribbling: 92, defending: 62, physical: 76 });
      setPlaystyles(['Incisive Pass+', 'Tiki Taka+', 'First Touch+', 'Long Ball Pass', 'Trivela']);
      setCompetitiveExperience('ACL Champions Cup finalist, specialized in half-space overloads and tempo modulation.');
    }
  };

  const currentCard: PlayerTrialCard = {
    id: `p-custom-${Date.now()}`,
    gamertag: gamertag || 'Unnamed_Recruit',
    discordTag: discordTag || 'Recruit#0000',
    eaId: eaId || 'Recruit_FC',
    tier: 'trial-pool',
    position,
    secondaryPosition: secondaryPosition ? (secondaryPosition as Position) : undefined,
    archetype,
    overallRating,
    height,
    weight,
    stats,
    playstyles,
    competitiveExperience,
    vocalMic,
    contractStatus: 'Evaluating',
    submittedAt: new Date().toISOString(),
  };

  const handlePostToDiscordSimulator = () => {
    onPostToSimulator(currentCard);
    setDispatchStatus({
      type: 'success',
      message: 'Trial card posted to simulated #trial-submission channel!',
    });
    setTimeout(() => setDispatchStatus(null), 4000);
  };

  const handleDispatchRealWebhook = async () => {
    if (!webhookUrl) {
      onOpenWebhookModal();
      return;
    }

    setIsDispatching(true);
    setDispatchStatus(null);
    const embed = createTrialCardEmbed(currentCard);
    const payload = {
      username: 'Academia Bot #0027',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
      content: `🚨 **NEW TRIAL CARD SUBMISSION** from <@${discordTag}> in **#trial-submission**`,
      embeds: [embed],
    };

    const res = await sendDiscordWebhook(webhookUrl, payload);
    setIsDispatching(false);
    if (res.success) {
      setDispatchStatus({ type: 'success', message: 'Dispatched to real Discord channel successfully!' });
    } else {
      setDispatchStatus({ type: 'error', message: res.message });
    }
  };

  const handleCopyJson = () => {
    const embed = createTrialCardEmbed(currentCard);
    navigator.clipboard.writeText(JSON.stringify({ embeds: [embed] }, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopyMarkdown = () => {
    const md = `🩸 **LA ACADEMIA // TRIAL CARD: ${currentCard.gamertag}**
🎮 **Discord:** \`${currentCard.discordTag}\` | **EA ID:** \`${currentCard.eaId}\`
🛡️ **Position:** ${currentCard.position}${currentCard.secondaryPosition ? ` / ${currentCard.secondaryPosition}` : ''} • **${currentCard.overallRating} OVR**
🏗️ **Archetype:** ${currentCard.archetype} (${currentCard.height}, ${currentCard.weight})
🎙️ **Vocal Mic:** ${currentCard.vocalMic ? 'Active Vocal Comms' : 'No Mic'}
📊 **FC27 Stats:** PAC \`${currentCard.stats.pace}\` | SHO \`${currentCard.stats.shooting}\` | PAS \`${currentCard.stats.passing}\` | DRI \`${currentCard.stats.dribbling}\` | DEF \`${currentCard.stats.defending}\` | PHY \`${currentCard.stats.physical}\`
✨ **Signature PlayStyles+:** ${currentCard.playstyles.map((p) => `\`${p}\``).join(' ')}
🏆 **Competitive Experience:** ${currentCard.competitiveExperience}
📋 **Target:** Trial Pool &rarr; La Academia Dev Squad / First XI`;

    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header text */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-rose-500 font-mono text-xs uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          Recruitment Trial Card Submission
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
          FC27 Pro Clubs Trial Card Generator
        </h1>
        <p className="text-sm text-zinc-400 mt-1 max-w-3xl">
          Build and dispatch your official trial card to <span className="text-rose-400 font-semibold">#trial-submission</span>. 
          Currently scouting Anchor CBs, Relentless CDMs, and Tempo Visionary CAM/CMs for the upcoming league campaign.
        </p>
      </div>

      {importedNotice && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{importedNotice}</span>
          </div>
          <span className="text-[11px] text-emerald-400/80 font-mono">Synced from FC27 Stats API</span>
        </div>
      )}

      {/* Preset Fast Selectors */}
      <div className="mb-8 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
        <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-rose-400" />
          Recommended Scouting Archetype Presets (Click to Auto-Configure)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => applyPreset('cb')}
            className="flex items-start gap-3 p-3 rounded-lg border border-zinc-700/80 bg-zinc-950 hover:border-rose-500/80 hover:bg-zinc-900 transition-all text-left cursor-pointer group"
          >
            <div className="p-2 rounded bg-amber-950/60 border border-amber-600/40 text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-rose-300">
                Center Back (CB) Anchor
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                6&apos;3&quot; // 195 lbs // Aerial+ &amp; Anticipate+ // Vocal Line Keystone
              </div>
            </div>
          </button>

          <button
            onClick={() => applyPreset('cdm')}
            className="flex items-start gap-3 p-3 rounded-lg border border-zinc-700/80 bg-zinc-950 hover:border-rose-500/80 hover:bg-zinc-900 transition-all text-left cursor-pointer group"
          >
            <div className="p-2 rounded bg-rose-950/60 border border-rose-600/40 text-rose-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-rose-300">
                Defensive Mid (CDM) Press
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                5&apos;11&quot; // 162 lbs // Intercept+ &amp; Relentless+ // 1.5s Ball Retention
              </div>
            </div>
          </button>

          <button
            onClick={() => applyPreset('cam')}
            className="flex items-start gap-3 p-3 rounded-lg border border-zinc-700/80 bg-zinc-950 hover:border-rose-500/80 hover:bg-zinc-900 transition-all text-left cursor-pointer group"
          >
            <div className="p-2 rounded bg-red-950/60 border border-red-600/40 text-red-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-rose-300">
                Playmaker (CAM / CM)
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                5&apos;9&quot; // 150 lbs // Incisive Pass+ &amp; Tiki Taka+ // Half-Space Spacing
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Left, Card Visual Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Controls */}
        <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-6">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-base font-bold text-white tracking-wide">
              Player Identity &amp; Physical Dimensions
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Identity details displayed in Discord embed and bot verification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                GamerTag / Pro Clubs Handle
              </label>
              <input
                type="text"
                value={gamertag}
                onChange={(e) => setGamertag(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                placeholder="e.g. Anchor_Pro27"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Discord Tag
              </label>
              <input
                type="text"
                value={discordTag}
                onChange={(e) => setDiscordTag(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                placeholder="e.g. Vortex#1234"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                EA ID (Crossplay)
              </label>
              <input
                type="text"
                value={eaId}
                onChange={(e) => setEaId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                placeholder="e.g. Vortex_EA"
              />
            </div>
          </div>

          {/* Position & Physical Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Primary Pos</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as Position)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              >
                <option value="CB">CB (Center Back)</option>
                <option value="CDM">CDM (Defensive Mid)</option>
                <option value="CAM">CAM (Attacking Mid)</option>
                <option value="CM">CM (Central Mid)</option>
                <option value="ST">ST (Striker)</option>
                <option value="LB">LB (Left Back)</option>
                <option value="RB">RB (Right Back)</option>
                <option value="LW">LW (Left Wing)</option>
                <option value="RW">RW (Right Wing)</option>
                <option value="GK">GK (Goalkeeper)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Secondary Pos</label>
              <select
                value={secondaryPosition}
                onChange={(e) => setSecondaryPosition(e.target.value as Position | '')}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              >
                <option value="">None</option>
                <option value="CDM">CDM</option>
                <option value="CB">CB</option>
                <option value="CM">CM</option>
                <option value="CAM">CAM</option>
                <option value="RB">RB</option>
                <option value="LB">LB</option>
                <option value="LW">LW</option>
                <option value="RW">RW</option>
                <option value="ST">ST</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Height</label>
              <input
                type="text"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                placeholder="6'3&quot;"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Weight</label>
              <input
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                placeholder="195 lbs"
              />
            </div>
          </div>

          {/* Archetype & Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">Archetype Name</label>
              <input
                type="text"
                value={archetype}
                onChange={(e) => setArchetype(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                placeholder="e.g. Anchor Colossus"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Overall OVR ({overallRating})
              </label>
              <input
                type="range"
                min="80"
                max="95"
                value={overallRating}
                onChange={(e) => setOverallRating(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
          </div>

          {/* 6 Core Attributes */}
          <div className="border-t border-zinc-800 pt-4">
            <div className="text-xs font-bold text-zinc-300 mb-3 flex items-center justify-between">
              <span>FC27 CORE ATTRIBUTES</span>
              <span className="text-zinc-400 font-mono text-[11px]">Adjust to match your in-game build</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'] as const).map((key) => (
                <div key={key} className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-mono uppercase text-zinc-400">{key.slice(0, 3)}</span>
                    <span className="font-mono font-bold text-white tabular-nums">{stats[key]}</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="99"
                    value={stats[key]}
                    onChange={(e) => setStats({ ...stats, [key]: Number(e.target.value) })}
                    className="w-full accent-rose-500 h-1.5"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* PlayStyles Multi-Select */}
          <div className="border-t border-zinc-800 pt-4">
            <div className="text-xs font-bold text-zinc-300 mb-2">
              SIGNATURE PLAYSTYLES &amp; PLAYSTYLES+
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Aerial+',
                'Anticipate+',
                'Intercept+',
                'Relentless+',
                'Pinged Pass+',
                'Incisive Pass+',
                'Tiki Taka+',
                'First Touch+',
                'Bruiser',
                'Block',
                'Slide Tackle',
                'Press Proven',
                'Long Ball Pass',
                'Power Header',
                'Finesse Shot+',
              ].map((ps) => {
                const isSelected = playstyles.includes(ps);
                return (
                  <button
                    key={ps}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setPlaystyles(playstyles.filter((p) => p !== ps));
                      } else {
                        setPlaystyles([...playstyles, ps]);
                      }
                    }}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-rose-950 text-rose-200 border-rose-500 font-semibold'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {ps}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mic & Experience */}
          <div className="border-t border-zinc-800 pt-4 space-y-4">
            <div className="flex items-center gap-3">
              <input
                id="mic-checkbox"
                type="checkbox"
                checked={vocalMic}
                onChange={(e) => setVocalMic(e.target.checked)}
                className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
              />
              <label htmlFor="mic-checkbox" className="text-xs text-zinc-300 cursor-pointer">
                <span className="font-bold text-white">Vocal Mic Active:</span> Confirms ability to anchor the backline/midfield with live voice communications in Discord during matchdays.
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Competitive Experience (Horror XI, the11, AFH, ACL, VFL)
              </label>
              <textarea
                rows={3}
                value={competitiveExperience}
                onChange={(e) => setCompetitiveExperience(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                placeholder="List your previous competitive teams, league divisions, and match readiness..."
              />
            </div>
          </div>

          {/* Action Dispatches */}
          <div className="border-t border-zinc-800 pt-5 space-y-3">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handlePostToDiscordSimulator}
                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs tracking-wide transition-colors shadow cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Post in Discord Simulator (#trial-submission)</span>
              </button>

              <button
                onClick={handleDispatchRealWebhook}
                disabled={isDispatching}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded border border-rose-600/70 bg-rose-950/40 hover:bg-rose-900/40 text-rose-200 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                title="Send real Discord embed to your server"
              >
                <Radio className={`w-4 h-4 ${isDispatching ? 'animate-spin' : ''}`} />
                <span>{isDispatching ? 'Dispatching...' : 'Dispatch to Live Discord'}</span>
              </button>

              <button
                onClick={handleCopyMarkdown}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors cursor-pointer"
                title="Copy formatted Discord Markdown to paste directly in Discord"
              >
                {copiedMarkdown ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedMarkdown ? 'Copied' : 'Discord MD'}</span>
              </button>

              <button
                onClick={handleCopyJson}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors cursor-pointer"
                title="Copy embed JSON payload"
              >
                {copiedJson ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedJson ? 'Copied' : 'JSON'}</span>
              </button>
            </div>

            {/* Status Alert Banner */}
            {dispatchStatus && (
              <div
                className={`p-3 rounded text-xs border ${
                  dispatchStatus.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                    : 'bg-red-950/60 border-red-700/60 text-red-300'
                }`}
              >
                {dispatchStatus.message}
              </div>
            )}
          </div>
        </div>

        {/* Live Card Preview Column */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-24 w-full">
            <div className="text-center mb-3">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                Real-Time Pro Clubs Card Preview
              </span>
            </div>

            <FC27CardVisual player={currentCard} />

            <div className="mt-4 p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400">
              <div className="font-semibold text-zinc-200 mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                Scouting Evaluation Criteria
              </div>
              <ul className="space-y-1 text-[11px] list-disc list-inside text-zinc-400">
                <li><strong className="text-zinc-300">CB:</strong> Height &ge; 6&apos;2&quot;, Aerial+ priority, backline communication.</li>
                <li><strong className="text-zinc-300">CDM:</strong> Intercept+, Relentless+, 90%+ pass accuracy under press.</li>
                <li><strong className="text-zinc-300">CAM:</strong> Vision, spacing, first-time delivery into target channels.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
