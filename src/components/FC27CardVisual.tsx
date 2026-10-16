import React from 'react';
import { PlayerTrialCard } from '../types';
import { Shield, Zap, Sparkles, Mic, MicOff, Award } from 'lucide-react';

interface FC27CardVisualProps {
  player: PlayerTrialCard;
  compact?: boolean;
}

export const FC27CardVisual: React.FC<FC27CardVisualProps> = ({ player, compact = false }) => {
  const getPositionColor = (pos: string) => {
    switch (pos) {
      case 'CB':
      case 'LB':
      case 'RB':
        return 'from-amber-500/20 to-rose-600/30 text-amber-300 border-amber-500/40';
      case 'CDM':
      case 'CM':
      case 'CAM':
        return 'from-rose-500/20 to-red-600/30 text-rose-300 border-rose-500/40';
      case 'ST':
      case 'LW':
      case 'RW':
        return 'from-red-500/20 to-orange-600/30 text-red-300 border-red-500/40';
      default:
        return 'from-emerald-500/20 to-teal-600/30 text-emerald-300 border-emerald-500/40';
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'first-xi':
        return { label: 'FIRST XI • AFH COMP', color: 'text-amber-400 bg-amber-950/70 border-amber-500/30' };
      case 'dev-squad':
        return { label: 'LA ACADEMIA • DEV SQUAD', color: 'text-rose-400 bg-rose-950/70 border-rose-500/30' };
      default:
        return { label: 'TRIAL EVALUATION POOL', color: 'text-blue-400 bg-blue-950/70 border-blue-500/30' };
    }
  };

  const tierInfo = getTierBadge(player.tier);

  if (compact) {
    return (
      <div className="relative rounded-lg border border-rose-900/60 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-3 overflow-hidden shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-rose-950/80 border border-rose-600/40 flex flex-col items-center justify-center text-center">
              <span className="text-base font-extrabold text-white leading-none tabular-nums">{player.overallRating}</span>
              <span className="text-[10px] font-bold text-rose-400 leading-none">{player.position}</span>
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-wide truncate max-w-[140px]">{player.gamertag}</div>
              <div className="text-[11px] text-zinc-400 truncate max-w-[140px]">{player.archetype}</div>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-[10px] px-2 py-0.5 rounded border ${tierInfo.color} font-mono font-medium`}>
              {player.position}
            </span>
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-6 gap-1 text-center font-mono text-[10px] border-t border-zinc-800/80 pt-2 text-zinc-300">
          <div><span className="text-zinc-500 block text-[8px]">PAC</span>{player.stats.pace}</div>
          <div><span className="text-zinc-500 block text-[8px]">SHO</span>{player.stats.shooting}</div>
          <div><span className="text-zinc-500 block text-[8px]">PAS</span>{player.stats.passing}</div>
          <div><span className="text-zinc-500 block text-[8px]">DRI</span>{player.stats.dribbling}</div>
          <div><span className="text-zinc-500 block text-[8px]">DEF</span>{player.stats.defending}</div>
          <div><span className="text-zinc-500 block text-[8px]">PHY</span>{player.stats.physical}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[340px] mx-auto rounded-xl p-0.5 bg-gradient-to-b from-rose-500/50 via-zinc-800/80 to-rose-950/80 shadow-2xl">
      {/* Background card container */}
      <div className="relative rounded-[10px] overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-5 text-zinc-100 border border-zinc-800/60">
        
        {/* Top Holographic Sheen & Club Header */}
        <div className="flex items-start justify-between border-b border-rose-900/40 pb-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-rose-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              LA ACADEMIA // FC27
            </div>
            <div className="text-[10px] text-zinc-400 font-mono tracking-tight mt-0.5">
              THE11 &times; HORROR XI PEDIGREE
            </div>
          </div>
          <div className="px-2 py-0.5 rounded border text-[9px] font-mono tracking-wider font-semibold border-rose-500/40 bg-rose-950/40 text-rose-300">
            {player.tier === 'first-xi' ? 'PREMIER TIER' : player.tier === 'dev-squad' ? 'DEV SQUAD' : 'TRIALIST'}
          </div>
        </div>

        {/* Player OVR & Avatar Area */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black tracking-tight text-white tabular-nums drop-shadow-md">
              {player.overallRating}
            </span>
            <span className={`text-base font-extrabold px-2 py-0.5 rounded border mt-0.5 tracking-wider ${getPositionColor(player.position)}`}>
              {player.position}
            </span>
            {player.secondaryPosition && (
              <span className="text-[10px] text-zinc-400 font-mono mt-1">
                SEC: {player.secondaryPosition}
              </span>
            )}
          </div>

          {/* Player Emblem / Crest Silhouette */}
          <div className="relative w-24 h-24 rounded-lg bg-gradient-to-br from-rose-950/60 via-zinc-900 to-zinc-950 border border-rose-800/50 flex flex-col items-center justify-center shadow-inner overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:8px_8px] opacity-20"></div>
            {player.position === 'CB' ? (
              <Shield className="w-10 h-10 text-rose-400 drop-shadow" />
            ) : player.position === 'CDM' ? (
              <Zap className="w-10 h-10 text-amber-400 drop-shadow" />
            ) : (
              <Sparkles className="w-10 h-10 text-red-400 drop-shadow" />
            )}
            <div className="mt-1 text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
              {player.height} • {player.weight}
            </div>
          </div>
        </div>

        {/* Player Name & Archetype Banner */}
        <div className="mt-4 text-center">
          <h3 className="text-xl font-black tracking-tight text-white uppercase drop-shadow truncate">
            {player.gamertag}
          </h3>
          <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-rose-950/80 border border-rose-600/40 text-[11px] font-semibold text-rose-200">
            {player.archetype}
          </div>
        </div>

        {/* Core FC27 Hexagonal Stat Grid */}
        <div className="mt-4 bg-zinc-900/80 border border-zinc-800 rounded-lg p-2.5">
          <div className="grid grid-cols-6 gap-1 text-center font-mono">
            <div className="border-r border-zinc-800 last:border-none">
              <span className="text-[9px] text-zinc-400 block">PAC</span>
              <span className="text-sm font-bold text-white tabular-nums">{player.stats.pace}</span>
            </div>
            <div className="border-r border-zinc-800 last:border-none">
              <span className="text-[9px] text-zinc-400 block">SHO</span>
              <span className="text-sm font-bold text-white tabular-nums">{player.stats.shooting}</span>
            </div>
            <div className="border-r border-zinc-800 last:border-none">
              <span className="text-[9px] text-zinc-400 block">PAS</span>
              <span className="text-sm font-bold text-white tabular-nums">{player.stats.passing}</span>
            </div>
            <div className="border-r border-zinc-800 last:border-none">
              <span className="text-[9px] text-zinc-400 block">DRI</span>
              <span className="text-sm font-bold text-white tabular-nums">{player.stats.dribbling}</span>
            </div>
            <div className="border-r border-zinc-800 last:border-none">
              <span className="text-[9px] text-zinc-400 block">DEF</span>
              <span className="text-sm font-bold text-white tabular-nums">{player.stats.defending}</span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-400 block">PHY</span>
              <span className="text-sm font-bold text-white tabular-nums">{player.stats.physical}</span>
            </div>
          </div>
        </div>

        {/* PlayStyles+ Badges */}
        <div className="mt-3">
          <div className="text-[10px] font-mono text-zinc-400 flex items-center justify-between mb-1.5">
            <span>SIGNATURE PLAYSTYLES</span>
            <span className="text-rose-400 font-bold">{player.playstyles.length} Active</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {player.playstyles.map((style, idx) => (
              <span
                key={idx}
                className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                  style.includes('+')
                    ? 'bg-rose-950/90 text-rose-200 border-rose-500/60 font-semibold'
                    : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60'
                }`}
              >
                {style}
              </span>
            ))}
          </div>
        </div>

        {/* Vocal Mic & Competitive Badge Footer */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            {player.vocalMic ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Mic className="w-3.5 h-3.5" /> Vocal Comms Anchor
              </span>
            ) : (
              <span className="flex items-center gap-1 text-zinc-500">
                <MicOff className="w-3.5 h-3.5" /> No Mic
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-rose-400 font-mono text-[10px]">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>{player.trialScore ? `RATING: ${player.trialScore}/10` : 'PENDING EVAL'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
