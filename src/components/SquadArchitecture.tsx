import React, { useState } from 'react';
import { PlayerTrialCard, SquadTier, Position } from '../types';
import { FC27CardVisual } from './FC27CardVisual';
import { 
  Shield, 
  Zap, 
  Compass, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Users
} from 'lucide-react';

interface SquadArchitectureProps {
  players: PlayerTrialCard[];
  onPromotePlayer: (playerId: string, targetTier: SquadTier) => void;
  onOpenCardBuilder: () => void;
  onEvaluatePlayer?: (playerId: string, score: number, notes: string, newTier?: SquadTier) => void;
}

export const SquadArchitecture: React.FC<SquadArchitectureProps> = ({
  players,
  onPromotePlayer,
  onOpenCardBuilder,
  onEvaluatePlayer,
}) => {
  const [selectedTier, setSelectedTier] = useState<SquadTier | 'all'>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectedPlayer, setInspectedPlayer] = useState<PlayerTrialCard | null>(null);
  const [evaluatingPlayer, setEvaluatingPlayer] = useState<PlayerTrialCard | null>(null);
  const [evalScore, setEvalScore] = useState(8.8);
  const [evalNotes, setEvalNotes] = useState('');
  const [evalTierDecision, setEvalTierDecision] = useState<SquadTier | 'keep'>('keep');

  const filteredPlayers = players.filter((p) => {
    const matchesTier = selectedTier === 'all' || p.tier === selectedTier;
    const matchesPos = positionFilter === 'all' || p.position === positionFilter;
    const matchesQuery = 
      p.gamertag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.archetype.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.competitiveExperience.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesPos && matchesQuery;
  });

  const firstXI = players.filter((p) => p.tier === 'first-xi');
  const devSquad = players.filter((p) => p.tier === 'dev-squad');
  const trialPool = players.filter((p) => p.tier === 'trial-pool');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-xs font-mono text-rose-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            Pro Clubs Multiverse Architecture
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Squad Hierarchy &amp; Contract Registry
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            From the championship pedigree of Horror XI &amp; the11 to FC27: A complete 3-tier structure 
            designed to scout, train in development leagues, and deploy into major AFH tournaments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCardBuilder}
            className="px-4 py-2 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recruit New Trialist</span>
          </button>
        </div>
      </div>

      {/* 3 Tier Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Tier 1: First XI */}
        <div 
          onClick={() => setSelectedTier('first-xi')}
          className={`p-5 rounded-xl border transition-all cursor-pointer ${
            selectedTier === 'first-xi'
              ? 'bg-amber-950/40 border-amber-500/80 ring-1 ring-amber-500/50'
              : 'bg-zinc-900/70 border-zinc-800 hover:border-amber-600/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-amber-400 uppercase">
              TIER 1 • PREMIER SQUAD
            </span>
            <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
              {firstXI.length} Players
            </span>
          </div>
          <h3 className="text-lg font-black text-white mt-1">First XI</h3>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            The premier tournament starting squad. Competes in AFH Major Comp &amp; Championship finals. 
            Carries the Horror XI &amp; the11 legacy.
          </p>
          <div className="mt-3 text-[11px] font-mono text-amber-300/80 flex items-center gap-1">
            <span>Avg OVR:</span>
            <span className="font-bold tabular-nums">
              {(firstXI.reduce((acc, p) => acc + p.overallRating, 0) / (firstXI.length || 1)).toFixed(1)}
            </span>
          </div>
        </div>

        {/* Tier 2: La Academia (Dev Squad) */}
        <div 
          onClick={() => setSelectedTier('dev-squad')}
          className={`p-5 rounded-xl border transition-all cursor-pointer ${
            selectedTier === 'dev-squad'
              ? 'bg-rose-950/40 border-rose-500/80 ring-1 ring-rose-500/50'
              : 'bg-zinc-900/70 border-zinc-800 hover:border-rose-600/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-rose-400 uppercase">
              TIER 2 • FEEDER ROSTER
            </span>
            <span className="text-xs font-mono font-bold text-rose-400 tabular-nums">
              {devSquad.length} Players
            </span>
          </div>
          <h3 className="text-lg font-black text-white mt-1">La Academia (Dev Squad)</h3>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Feeder roster competing in development leagues and squad test fixtures. 
            Immediate pipeline for major tournament callups.
          </p>
          <div className="mt-3 text-[11px] font-mono text-rose-300/80 flex items-center gap-1">
            <span>Avg OVR:</span>
            <span className="font-bold tabular-nums">
              {(devSquad.reduce((acc, p) => acc + p.overallRating, 0) / (devSquad.length || 1)).toFixed(1)}
            </span>
          </div>
        </div>

        {/* Tier 3: Trial Pool */}
        <div 
          onClick={() => setSelectedTier('trial-pool')}
          className={`p-5 rounded-xl border transition-all cursor-pointer ${
            selectedTier === 'trial-pool'
              ? 'bg-blue-950/40 border-blue-500/80 ring-1 ring-blue-500/50'
              : 'bg-zinc-900/70 border-zinc-800 hover:border-blue-600/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-blue-400 uppercase">
              TIER 3 • EVALUATION LOBBY
            </span>
            <span className="text-xs font-mono font-bold text-blue-400 tabular-nums">
              {trialPool.length} Recruits
            </span>
          </div>
          <h3 className="text-lg font-black text-white mt-1">Trial Pool</h3>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Open evaluation lobby for all new recruits looking to earn a contract. 
            Evaluated via trial card submissions in #trial-submission and match trials.
          </p>
          <div className="mt-3 text-[11px] font-mono text-blue-300/80 flex items-center gap-1">
            <span>Actively Scouting:</span>
            <span className="font-bold">CB Anchor, CDM Press, CAM</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Tier Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
          <button
            onClick={() => setSelectedTier('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              selectedTier === 'all'
                ? 'bg-rose-600 text-white font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Squads ({players.length})
          </button>
          <button
            onClick={() => setSelectedTier('first-xi')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              selectedTier === 'first-xi'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            First XI ({firstXI.length})
          </button>
          <button
            onClick={() => setSelectedTier('dev-squad')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              selectedTier === 'dev-squad'
                ? 'bg-rose-600 text-white font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Dev Squad ({devSquad.length})
          </button>
          <button
            onClick={() => setSelectedTier('trial-pool')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              selectedTier === 'trial-pool'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Trial Pool ({trialPool.length})
          </button>
        </div>

        {/* Position Filter & Search */}
        <div className="flex items-center gap-3">
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
          >
            <option value="all">All Positions</option>
            <option value="CB">Center Backs (CB)</option>
            <option value="CDM">Defensive Mid (CDM)</option>
            <option value="CAM">Attacking Mid (CAM)</option>
            <option value="CM">Central Mid (CM)</option>
            <option value="ST">Strikers (ST)</option>
            <option value="GK">Goalkeepers (GK)</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search player or build..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 w-44"
            />
          </div>
        </div>
      </div>

      {/* Players List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main List */}
        <div className={`${inspectedPlayer ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-3`}>
          {filteredPlayers.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-zinc-900/40 border border-zinc-800 text-zinc-500">
              No players found matching current filters.
            </div>
          ) : (
            filteredPlayers.map((player) => {
              const isFirst = player.tier === 'first-xi';
              const isDev = player.tier === 'dev-squad';
              const isTrial = player.tier === 'trial-pool';

              return (
                <div
                  key={player.id}
                  className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  {/* Left info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-zinc-950 border border-rose-900/40 flex flex-col items-center justify-center shrink-0">
                      <span className="text-base font-black text-white tabular-nums leading-none">
                        {player.overallRating}
                      </span>
                      <span className="text-[10px] font-bold text-rose-400 uppercase leading-none mt-0.5">
                        {player.position}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm tracking-wide truncate">
                          {player.gamertag}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase ${
                            isFirst
                              ? 'bg-amber-950/60 border-amber-600/40 text-amber-300'
                              : isDev
                              ? 'bg-rose-950/60 border-rose-600/40 text-rose-300'
                              : 'bg-blue-950/60 border-blue-600/40 text-blue-300'
                          }`}
                        >
                          {isFirst ? 'First XI' : isDev ? 'Dev Squad' : 'Trial Pool'}
                        </span>
                        {player.vocalMic && (
                          <span className="text-[10px] text-emerald-400 font-mono">
                            🎙️ Vocal
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-zinc-400 mt-0.5 truncate">
                        <span className="text-zinc-300 font-medium">{player.archetype}</span>
                        <span className="mx-1 text-zinc-600">•</span>
                        <span>{player.height}, {player.weight}</span>
                        <span className="mx-1 text-zinc-600">•</span>
                        <span>EA: {player.eaId}</span>
                      </div>

                      <div className="text-[11px] text-zinc-500 mt-1 line-clamp-1 italic">
                        {player.competitiveExperience}
                      </div>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Promote to Dev Squad */}
                    {isTrial && (
                      <button
                        onClick={() => onPromotePlayer(player.id, 'dev-squad')}
                        className="px-3 py-1.5 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-600/50 text-rose-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Sign to La Academia Dev Squad feeder roster"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Promote to Dev</span>
                      </button>
                    )}

                    {/* Callup to First XI */}
                    {(isDev || isTrial) && (
                      <button
                        onClick={() => onPromotePlayer(player.id, 'first-xi')}
                        className="px-3 py-1.5 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-600/50 text-amber-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Fast-track to First XI tournament roster"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Callup First XI</span>
                      </button>
                    )}

                    {/* Move back to Dev or Trial */}
                    {isFirst && (
                      <button
                        onClick={() => onPromotePlayer(player.id, 'dev-squad')}
                        className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        title="Reassign to Dev Squad for derby reps"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>Dev Squad</span>
                      </button>
                    )}

                    {/* Evaluate Button */}
                    <button
                      onClick={() => {
                        setEvaluatingPlayer(player);
                        setEvalScore(player.trialScore || 8.8);
                        setEvalNotes(player.notes || '');
                        setEvalTierDecision('keep');
                      }}
                      className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-rose-300 text-xs font-medium cursor-pointer border border-zinc-700/80 transition-colors"
                      title="Officially rate and log scouting evaluation"
                    >
                      Evaluate
                    </button>

                    {/* View Card */}
                    <button
                      onClick={() => setInspectedPlayer(inspectedPlayer?.id === player.id ? null : player)}
                      className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs cursor-pointer"
                    >
                      {inspectedPlayer?.id === player.id ? 'Close Card' : 'Inspect Card'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Inspected Player Drawer (Right) */}
        {inspectedPlayer && (
          <div className="lg:col-span-4 sticky top-24">
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-rose-900/60 shadow-xl">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Inspected FC27 Card
                </span>
                <button
                  onClick={() => setInspectedPlayer(null)}
                  className="text-xs text-zinc-500 hover:text-white cursor-pointer"
                >
                  &times; Close
                </button>
              </div>

              <FC27CardVisual player={inspectedPlayer} />

              <div className="mt-4 pt-3 border-t border-zinc-800 text-xs space-y-2">
                <div>
                  <span className="text-zinc-500 font-mono text-[10px] block uppercase">Discord ID</span>
                  <span className="text-zinc-200 font-mono">{inspectedPlayer.discordTag}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-mono text-[10px] block uppercase">Contract Status</span>
                  <span className="text-rose-400 font-medium">{inspectedPlayer.contractStatus}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-mono text-[10px] block uppercase">Scouting Notes</span>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {inspectedPlayer.notes || 'Under review for tactical fit in high-tempo AFH tournament matches.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scout Evaluation Dialog Modal */}
      {evaluatingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono text-rose-500 uppercase tracking-widest block">
                  Scout Directorate Review
                </span>
                <h3 className="text-lg font-bold text-white">
                  Evaluate: {evaluatingPlayer.gamertag} ({evaluatingPlayer.position})
                </h3>
              </div>
              <button
                onClick={() => setEvaluatingPlayer(null)}
                className="text-zinc-400 hover:text-white text-sm cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold text-zinc-300">
                  <span>Trial Evaluation Rating (1.0 - 10.0)</span>
                  <span className="text-rose-400 font-mono text-sm">{evalScore.toFixed(1)} / 10</span>
                </div>
                <input
                  type="range"
                  min="5.0"
                  max="10.0"
                  step="0.1"
                  value={evalScore}
                  onChange={(e) => setEvalScore(parseFloat(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Contract Recommendation &amp; Squad Assignment
                </label>
                <select
                  value={evalTierDecision}
                  onChange={(e) => setEvalTierDecision(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="keep">Keep in Current Tier ({evaluatingPlayer.tier.toUpperCase()})</option>
                  <option value="dev-squad">Sign to La Academia Dev Squad (Feeder Contract)</option>
                  <option value="first-xi">Fast-Track Callup to First XI (Championship Roster)</option>
                  <option value="trial-pool">Reassign to Trial Evaluation Pool</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Scout Review Notes &amp; Tactical Fit
                </label>
                <textarea
                  rows={3}
                  value={evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                  placeholder="Record tactical remarks on aerial duels, press retention, half-space vision, or vocal line communication..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEvaluatingPlayer(null)}
                  className="px-4 py-2 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium cursor-pointer border border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onEvaluatePlayer) {
                      onEvaluatePlayer(
                        evaluatingPlayer.id,
                        evalScore,
                        evalNotes,
                        evalTierDecision === 'keep' ? undefined : (evalTierDecision as SquadTier)
                      );
                    }
                    setEvaluatingPlayer(null);
                  }}
                  className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors shadow"
                >
                  Submit Official Evaluation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
