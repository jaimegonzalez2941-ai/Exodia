import React, { useState } from 'react';
import { INITIAL_TACTICAL_DIRECTIVES } from '../data/initialData';
import { TacticalDirective } from '../types';
import { Shield, Zap, Compass, Send, CheckCircle2, Radio } from 'lucide-react';
import { sendDiscordWebhook } from '../utils/discordEmbed';

interface TacticalDirectivesProps {
  onPostToSimulator: (channel: string, content: string, embed: any) => void;
  webhookUrl: string;
}

export const TacticalDirectives: React.FC<TacticalDirectivesProps> = ({
  onPostToSimulator,
  webhookUrl,
}) => {
  const directives = INITIAL_TACTICAL_DIRECTIVES;
  const [selectedFormation, setSelectedFormation] = useState<'4-2-3-1' | '4-3-3'>('4-2-3-1');
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const handleDispatchTactics = async () => {
    const embed = {
      title: '🛡️ LA ACADEMIA // COMPETITIVE TACTICAL DIRECTIVES',
      description: `Official match directives for **LA ACADEMIA** (FC27 Pro Clubs Multiverse) under formation **${selectedFormation}**.`,
      color: 0xE11D48,
      fields: directives.map((d) => ({
        name: `${d.position} • ${d.roleTitle}`,
        value: `**Specs:** \`${d.buildSpecs}\`\n**PlayStyles+:** \`${d.keyPlayStyles.join(', ')}\`\n**Tactical Instruction:** ${d.tacticalInstruction}`,
        inline: false,
      })),
      footer: { text: 'La Academia Tactical Board v27' },
    };

    onPostToSimulator('tactics-board', '📢 Updated Tactical Directives issued by Management:', embed);

    if (webhookUrl) {
      await sendDiscordWebhook(webhookUrl, {
        username: 'Academia Bot #0027',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
        embeds: [embed],
      });
      setDispatchStatus('Dispatched to live Discord and simulator #tactics-board!');
    } else {
      setDispatchStatus('Posted to simulated #tactics-board channel!');
    }

    setTimeout(() => setDispatchStatus(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-xs font-mono text-rose-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Tactical Architecture // FC27
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Competitive Directives &amp; Pitch Setup
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            Strict positional requirements for our upcoming league campaign. Every recruit must match
            the archetype specs, playstyle profiles, and vocal communication standards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-1 rounded bg-zinc-900 border border-zinc-800 flex items-center gap-1">
            <button
              onClick={() => setSelectedFormation('4-2-3-1')}
              className={`px-3 py-1 text-xs font-medium rounded cursor-pointer transition-colors ${
                selectedFormation === '4-2-3-1'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              4-2-3-1 Holding
            </button>
            <button
              onClick={() => setSelectedFormation('4-3-3')}
              className={`px-3 py-1 text-xs font-medium rounded cursor-pointer transition-colors ${
                selectedFormation === '4-3-3'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              4-3-3 Balanced
            </button>
          </div>

          <button
            onClick={handleDispatchTactics}
            className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch to Discord</span>
          </button>
        </div>
      </div>

      {dispatchStatus && (
        <div className="mb-6 p-3 rounded bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{dispatchStatus}</span>
        </div>
      )}

      {/* Main Grid: Directives List Left, Visual Tactical Pitch Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Tactical Requirements Accordion/Cards */}
        <div className="lg:col-span-7 space-y-4">
          {directives.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-rose-900/60 flex items-center justify-center font-bold text-rose-400 text-sm">
                    {item.position === 'CB' ? (
                      <Shield className="w-5 h-5" />
                    ) : item.position === 'CDM' ? (
                      <Zap className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Compass className="w-5 h-5 text-rose-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white tracking-wide">
                      {item.roleTitle}
                    </div>
                    <div className="text-xs text-rose-400 font-mono">
                      {item.position} • {item.buildSpecs}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                    item.scoutingPriority === 'Critical'
                      ? 'bg-rose-950/80 border-rose-600/50 text-rose-300 font-bold'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                  }`}
                >
                  {item.scoutingPriority} Priority
                </span>
              </div>

              {/* Instructions */}
              <div className="mt-3.5 text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded border border-zinc-800/80">
                <strong className="text-zinc-200">Tactical Directives:</strong> {item.tacticalInstruction}
              </div>

              {/* Playstyles Required */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Mandatory PlayStyles+:</span>
                {item.keyPlayStyles.map((ps, psIdx) => (
                  <span
                    key={psIdx}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                      ps.includes('+')
                        ? 'bg-rose-950/90 border-rose-600/60 text-rose-200 font-semibold'
                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300'
                    }`}
                  >
                    {ps}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Visual Tactical Pitch */}
        <div className="lg:col-span-5 bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
          <div className="text-center mb-3">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              Live Tactical Pitch ({selectedFormation})
            </span>
          </div>

          {/* Football Pitch Graphic */}
          <div className="relative w-full aspect-[3/4] max-w-[340px] mx-auto rounded-xl bg-gradient-to-b from-emerald-950 via-emerald-900 to-zinc-950 border-2 border-emerald-700/40 p-4 shadow-2xl overflow-hidden">
            {/* Pitch Markings */}
            <div className="absolute inset-x-4 top-4 bottom-4 border border-emerald-500/30 rounded-lg pointer-events-none">
              {/* Half-way line */}
              <div className="absolute inset-x-0 top-1/2 border-t border-emerald-500/30 -translate-y-1/2"></div>
              {/* Center Circle */}
              <div className="absolute top-1/2 left-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-500/30"></div>
              {/* Penalty box top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-12 border-b border-x border-emerald-500/30 rounded-b"></div>
              {/* Penalty box bottom */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-12 border-t border-x border-emerald-500/30 rounded-t"></div>
            </div>

            {/* Tactical Pins */}
            <div className="relative h-full flex flex-col justify-between py-2 text-white">
              {/* Striker */}
              <div className="flex justify-center">
                <div className="bg-rose-950/90 border border-rose-500/80 px-2.5 py-1 rounded-md text-center shadow">
                  <div className="text-[10px] font-bold text-rose-300 leading-none">Grimm_Apex</div>
                  <div className="text-[8px] font-mono text-zinc-400">ST • Clinical</div>
                </div>
              </div>

              {/* Attacking Midfield (CAM, LW, RW) */}
              <div className="flex justify-around items-center px-1">
                <div className="bg-zinc-900/90 border border-zinc-700 px-2 py-0.5 rounded text-center text-[9px]">
                  LW
                </div>
                <div className="bg-rose-950/90 border border-rose-500/80 px-2.5 py-1 rounded-md text-center shadow ring-1 ring-rose-500/40">
                  <div className="text-[10px] font-bold text-rose-300 leading-none">Silva_Maestro</div>
                  <div className="text-[8px] font-mono text-zinc-400">CAM • Spacing</div>
                </div>
                <div className="bg-zinc-900/90 border border-zinc-700 px-2 py-0.5 rounded text-center text-[9px]">
                  RW
                </div>
              </div>

              {/* Defensive Midfield (CDMs) */}
              <div className="flex justify-center gap-6">
                <div className="bg-rose-950/90 border border-rose-500/80 px-2.5 py-1 rounded-md text-center shadow ring-1 ring-amber-500/40">
                  <div className="text-[10px] font-bold text-amber-300 leading-none">Kinetix_Press</div>
                  <div className="text-[8px] font-mono text-zinc-400">CDM • 1.5s Press</div>
                </div>
                <div className="bg-zinc-900/90 border border-zinc-700 px-2.5 py-1 rounded-md text-center">
                  <div className="text-[10px] font-bold text-zinc-300 leading-none">Dev / Trialist</div>
                  <div className="text-[8px] font-mono text-zinc-400">CDM • Anchor</div>
                </div>
              </div>

              {/* Defensive Line (LB, CB, CB, RB) */}
              <div className="flex justify-between items-center px-1">
                <div className="bg-zinc-900/90 border border-zinc-700 px-2 py-0.5 rounded text-center text-[9px]">
                  LB
                </div>
                <div className="bg-rose-950/90 border border-rose-500/80 px-2 py-1 rounded-md text-center shadow ring-1 ring-rose-500/40">
                  <div className="text-[10px] font-bold text-rose-300 leading-none">Vortex_Anchor</div>
                  <div className="text-[8px] font-mono text-zinc-400">CB • Aerial+</div>
                </div>
                <div className="bg-zinc-900/90 border border-zinc-700 px-2 py-1 rounded-md text-center">
                  <div className="text-[10px] font-bold text-zinc-300 leading-none">Titan_Reyes</div>
                  <div className="text-[8px] font-mono text-zinc-400">CB • Anchor</div>
                </div>
                <div className="bg-zinc-900/90 border border-zinc-700 px-2 py-0.5 rounded text-center text-[9px]">
                  RB
                </div>
              </div>

              {/* Goalkeeper */}
              <div className="flex justify-center">
                <div className="bg-zinc-950/90 border border-emerald-500/80 px-2.5 py-1 rounded-md text-center shadow">
                  <div className="text-[10px] font-bold text-emerald-300 leading-none">Bastion_Wall</div>
                  <div className="text-[8px] font-mono text-zinc-400">GK • 6&apos;6&quot;</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
            <span className="font-bold text-white">Press Trigger Rule:</span> When opposition plays back to their keeper or center backs, our CDM press triggers synchronously. Our CB anchor steps up 5 yards to compress the midfield space.
          </div>
        </div>
      </div>
    </div>
  );
};
