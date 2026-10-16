import React, { useState, useEffect } from 'react';
import { FC27ClubStats, FC27PlayerStats, FC27MatchResult } from '../types';
import { 
  Trophy, 
  Search, 
  Flame, 
  Shield, 
  Activity, 
  Zap, 
  CheckCircle2, 
  Copy, 
  Send, 
  ExternalLink, 
  TrendingUp, 
  Calendar, 
  Terminal, 
  ChevronRight,
  UserCheck,
  Star,
  RefreshCw,
  Layers,
  Award
} from 'lucide-react';
import { sendDiscordWebhook } from '../utils/discordEmbed';

interface FC27StatsExplorerProps {
  onAutoFillTrialCard?: (playerStats: FC27PlayerStats) => void;
  onPostToSimulator?: (channelId: string, content: string, embed: any) => void;
  webhookUrl?: string;
}

export const FC27StatsExplorer: React.FC<FC27StatsExplorerProps> = ({
  onAutoFillTrialCard,
  onPostToSimulator,
  webhookUrl = '',
}) => {
  // Tabs: 'club' | 'player-search' | 'matches' | 'leaderboard' | 'api-docs'
  const [activeTab, setActiveTab] = useState<'club' | 'player-search' | 'matches' | 'leaderboard' | 'api-docs'>('club');

  // Club Stats State
  const [clubStats, setClubStats] = useState<FC27ClubStats | null>(null);
  const [isLoadingClub, setIsLoadingClub] = useState(false);

  // Player Search State
  const [searchQuery, setSearchQuery] = useState('Vortex_Anchor');
  const [playerResult, setPlayerResult] = useState<FC27PlayerStats | null>(null);
  const [isSearchingPlayer, setIsSearchingPlayer] = useState(false);
  const [playerSearchError, setPlayerSearchError] = useState<string | null>(null);

  // Matches State
  const [matches, setMatches] = useState<FC27MatchResult[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // Leaderboard State
  const [leaderboardCategory, setLeaderboardCategory] = useState<'amr' | 'goals' | 'assists' | 'tackles' | 'cleansheets'>('amr');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // API Docs Runner State
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/fc27/club/stats');
  const [apiResponse, setApiResponse] = useState<string>('Loading live endpoint response...');
  const [isCallingApi, setIsCallingApi] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  // Fetch Club Stats
  const fetchClubStats = async () => {
    setIsLoadingClub(true);
    try {
      const res = await fetch('/api/fc27/club/stats');
      const json = await res.json();
      if (json.success) {
        setClubStats(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch club stats:', err);
    } finally {
      setIsLoadingClub(false);
    }
  };

  // Fetch Player Stats
  const handleSearchPlayer = async (queryToSearch?: string) => {
    const q = queryToSearch !== undefined ? queryToSearch : searchQuery;
    if (!q.trim()) return;

    setIsSearchingPlayer(true);
    setPlayerSearchError(null);
    try {
      const res = await fetch(`/api/fc27/player/stats?gamertag=${encodeURIComponent(q.trim())}`);
      const json = await res.json();
      if (json.success && json.player) {
        setPlayerResult(json.player);
      } else {
        setPlayerSearchError(json.error || 'Player not found in FC27 Pro Clubs network.');
      }
    } catch (err) {
      setPlayerSearchError('Network error connecting to /api/fc27/player/stats');
    } finally {
      setIsSearchingPlayer(false);
    }
  };

  // Fetch Matches
  const fetchMatches = async () => {
    setIsLoadingMatches(true);
    try {
      const res = await fetch('/api/fc27/club/matches');
      const json = await res.json();
      if (json.success && json.matches) {
        setMatches(json.matches);
      }
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  // Fetch Leaderboard
  const fetchLeaderboard = async (cat: string) => {
    setIsLoadingLeaderboard(true);
    try {
      const res = await fetch(`/api/fc27/leaderboard?category=${cat}`);
      const json = await res.json();
      if (json.success && json.leaderboard) {
        setLeaderboardData(json.leaderboard);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  // Execute API Endpoint in Docs Runner
  const runApiEndpoint = async (endpoint: string) => {
    setIsCallingApi(true);
    setApiResponse('Sending HTTP GET request...');
    try {
      const res = await fetch(endpoint);
      const json = await res.json();
      setApiResponse(JSON.stringify(json, null, 2));
    } catch (err: any) {
      setApiResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsCallingApi(false);
    }
  };

  // Initial loads
  useEffect(() => {
    fetchClubStats();
    handleSearchPlayer('Vortex_Anchor');
    fetchMatches();
    fetchLeaderboard(leaderboardCategory);
    runApiEndpoint(selectedEndpoint);
  }, []);

  useEffect(() => {
    fetchLeaderboard(leaderboardCategory);
  }, [leaderboardCategory]);

  useEffect(() => {
    runApiEndpoint(selectedEndpoint);
  }, [selectedEndpoint]);

  // Dispatch Club Stats Embed to Discord
  const handleDispatchClubStats = async () => {
    if (!clubStats) return;

    const embed = {
      title: '🏆 LA ACADEMIA // OFFICIAL FC27 PRO CLUBS RECORD',
      description: `Current competitive standing in **Division ${clubStats.division}** (${clubStats.platform}).`,
      color: 0xE11D48,
      fields: [
        { name: '🔥 Current Streak', value: clubStats.currentStreak, inline: true },
        { name: '⭐ Skill Rating', value: `${clubStats.skillRating} SR`, inline: true },
        { name: '📊 Overall Record', value: `${clubStats.overallRecord.wins}W - ${clubStats.overallRecord.ties}D - ${clubStats.overallRecord.losses}L (${clubStats.overallRecord.winRate}%)`, inline: true },
        { name: '⚽ Goals Scored / Conceded', value: `${clubStats.goalsScored} GF / ${clubStats.goalsConceded} GA (+${clubStats.goalDifference})`, inline: true },
        { name: '🧤 Clean Sheets', value: `${clubStats.cleanSheets} Clean Sheets`, inline: true },
        { name: '📈 Recent Form', value: clubStats.form.join(' • '), inline: true },
      ],
      footer: { text: 'La Academia Performance Directorate • FC27 Pro Clubs Network' },
      timestamp: new Date().toISOString(),
    };

    if (onPostToSimulator) {
      onPostToSimulator(
        'announcements',
        '🚨 **OFFICIAL FC27 STATS API SYNC COMPLETE**',
        embed
      );
    }

    if (webhookUrl.trim()) {
      const res = await sendDiscordWebhook(webhookUrl.trim(), {
        username: 'Academia Stats Bot',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=stats-bot',
        content: '🚨 **OFFICIAL FC27 CLUB STATS SYNC DISPATCHED**',
        embeds: [embed],
      });
      if (res.success) {
        setDispatchStatus('Stats embed dispatched to Discord & Simulator #announcements!');
      } else {
        setDispatchStatus(`Simulator posted, but Webhook returned: ${res.message}`);
      }
    } else {
      setDispatchStatus('Dispatched to Simulator #announcements channel! (Connect Webhook to send to live Discord).');
    }

    setTimeout(() => setDispatchStatus(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-rose-950/40 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-[11px] font-mono font-semibold text-rose-400">
              EA SPORTS FC27 PRO CLUBS API
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-zinc-400 font-mono">Real-Time Club &amp; Career Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            FC27 Stats API &amp; Telemetry
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Direct API connection to EA Sports FC27 Pro Clubs servers. Inspect official club records, lookup recruit career metrics, stream match fixtures, and auto-populate trial cards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDispatchClubStats}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch Club Record to Discord</span>
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

      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-zinc-800 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('club')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'club'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Club Overview &amp; Division 1 Record</span>
        </button>

        <button
          onClick={() => setActiveTab('player-search')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'player-search'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Player Career Stats Lookup</span>
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'matches'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Recent Fixture History</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'leaderboard'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Roster Leaderboards</span>
        </button>

        <button
          onClick={() => setActiveTab('api-docs')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'api-docs'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>API Explorer &amp; Endpoints</span>
        </button>
      </div>

      {/* TAB 1: CLUB OVERVIEW */}
      {activeTab === 'club' && (
        <div className="space-y-6">
          {clubStats ? (
            <>
              {/* Highlight Stats Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-1 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-rose-500" />
                  <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
                    <span>Division Level</span>
                    <Trophy className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-3xl font-black text-white">Division {clubStats.division}</div>
                  <div className="text-[11px] text-rose-400 font-mono">
                    {clubStats.skillRating} Skill Rating (Elite)
                  </div>
                </div>

                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-1 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />
                  <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
                    <span>Overall Record</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    {clubStats.overallRecord.wins}W - {clubStats.overallRecord.losses}L
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono">
                    {clubStats.overallRecord.winRate}% Win Rate ({clubStats.overallRecord.matches} Matches)
                  </div>
                </div>

                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-1 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500" />
                  <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
                    <span>Goal Difference</span>
                    <Flame className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-white">+{clubStats.goalDifference}</div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {clubStats.goalsScored} GF • {clubStats.goalsConceded} GA
                  </div>
                </div>

                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-1 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />
                  <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
                    <span>Clean Sheets</span>
                    <Shield className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-3xl font-black text-white">{clubStats.cleanSheets}</div>
                  <div className="text-[11px] text-blue-400 font-mono">
                    {clubStats.currentStreak}
                  </div>
                </div>
              </div>

              {/* Detailed Club Details */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <Shield className="w-4 h-4 text-rose-500" />
                      <span>{clubStats.name} [ACD] // Official Telemetry</span>
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                      {clubStats.platform}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
                      <span className="text-zinc-500 block text-[11px] uppercase tracking-wider font-semibold">Tier Classification</span>
                      <span className="font-bold text-rose-400 text-sm mt-0.5 block">{clubStats.tierClassification}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
                      <span className="text-zinc-500 block text-[11px] uppercase tracking-wider font-semibold">Season Points</span>
                      <span className="font-bold text-white text-sm mt-0.5 block">{clubStats.seasonPoints} PTS</span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
                      <span className="text-zinc-500 block text-[11px] uppercase tracking-wider font-semibold">Registered Roster</span>
                      <span className="font-bold text-emerald-400 text-sm mt-0.5 block">{clubStats.membersCount} Players</span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
                      <span className="text-zinc-500 block text-[11px] uppercase tracking-wider font-semibold">Draws / Ties</span>
                      <span className="font-bold text-zinc-300 text-sm mt-0.5 block">{clubStats.overallRecord.ties} Matches</span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
                      <span className="text-zinc-500 block text-[11px] uppercase tracking-wider font-semibold">Best Division</span>
                      <span className="font-bold text-amber-400 text-sm mt-0.5 block">Division 1 (Championship)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
                      <span className="text-zinc-500 block text-[11px] uppercase tracking-wider font-semibold">Current Form</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {clubStats.form.map((f, i) => (
                          <span
                            key={i}
                            className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${
                              f === 'W'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                                : f === 'D'
                                ? 'bg-zinc-800 text-zinc-300'
                                : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                            }`}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-zinc-200">API Endpoint Source:</span>{' '}
                      <code className="text-rose-400 font-mono">GET /api/fc27/club/stats?clubId=la-academia-fc27</code>
                    </div>
                    <button
                      onClick={fetchClubStats}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingClub ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Competitive Status</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                      <span className="font-bold text-zinc-300">AFH League Championship</span>
                      <p className="text-[11px] text-zinc-400">
                        First XI squad registered for Season 6 Premier Division fixtures. Mic communication mandatory.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                      <span className="font-bold text-blue-400">Feeder Squad Pipeline</span>
                      <p className="text-[11px] text-zinc-400">
                        La Academia Dev Squad competes in reserve tournaments and evaluation fixtures.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                      <span className="font-bold text-amber-400">Recruit Scouting Targets</span>
                      <p className="text-[11px] text-zinc-400">
                        High scouting priority for Anchor CBs (&gt;6&apos;2&quot;, Aerial+) and Relentless CDMs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-zinc-500 font-mono text-sm">
              Loading FC27 Pro Clubs Club telemetry...
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PLAYER SEARCH & CAREER STATS */}
      {activeTab === 'player-search' && (
        <div className="space-y-6">
          {/* Search Box */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Search className="w-4 h-4 text-rose-500" />
                  <span>FC27 Player Career Stats Lookup</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Query verified Pro Clubs player metrics by EA ID or Gamertag to evaluate trial recruits.
                </p>
              </div>

              {/* Preset buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-zinc-500 text-[11px]">Quick try:</span>
                {['Vortex_Anchor', 'Kinetix_Press', 'Silva_Maestro', 'Grimm_Apex', 'ShadowPress_99'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setSearchQuery(preset);
                      handleSearchPlayer(preset);
                    }}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchPlayer();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Gamertag or EA ID (e.g. Vortex_Anchor, GrimmApex_ST)..."
                className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 font-mono"
              />
              <button
                type="submit"
                disabled={isSearchingPlayer}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs cursor-pointer transition-colors shadow disabled:opacity-50"
              >
                {isSearchingPlayer ? 'Searching...' : 'Fetch FC27 Stats'}
              </button>
            </form>

            {playerSearchError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
                {playerSearchError}
              </div>
            )}
          </div>

          {/* Player Card Display */}
          {playerResult && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">
              {/* Header profile info */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-900 to-zinc-900 border border-rose-500/40 flex items-center justify-center text-xl font-black text-white shadow-lg">
                    {playerResult.overallRating}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-white">{playerResult.gamertag}</h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {playerResult.position}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        playerResult.contractTier === 'first-xi'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                          : playerResult.contractTier === 'dev-squad'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800/50'
                          : 'bg-yellow-950 text-yellow-300 border border-yellow-800/50'
                      }`}>
                        {playerResult.contractTier === 'first-xi' ? 'First XI Starter' : playerResult.contractTier === 'dev-squad' ? 'Dev Squad' : 'Trial Candidate'}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 font-mono mt-0.5">
                      EA ID: {playerResult.eaId} • Archetype: <strong className="text-zinc-200">{playerResult.archetype}</strong>
                    </div>
                  </div>
                </div>

                {onAutoFillTrialCard && (
                  <button
                    onClick={() => onAutoFillTrialCard(playerResult)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow transition-colors cursor-pointer"
                    title="Populate recruit card builder with these verified FC27 stats"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Import Stats to Trial Card</span>
                  </button>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">Matches</span>
                  <span className="text-xl font-black text-white mt-0.5 block">{playerResult.matchesPlayed}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Caps</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">Avg Match Rating</span>
                  <span className="text-xl font-black text-rose-400 mt-0.5 block">{playerResult.averageMatchRating}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">1.0 - 10.0 scale</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">Goals / Assists</span>
                  <span className="text-xl font-black text-amber-400 mt-0.5 block">{playerResult.goals}G • {playerResult.assists}A</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Contributions</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">Tackles Won</span>
                  <span className="text-xl font-black text-emerald-400 mt-0.5 block">{playerResult.tacklesMade}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">{playerResult.tacklesSuccessRate}% success</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">Pass Accuracy</span>
                  <span className="text-xl font-black text-blue-400 mt-0.5 block">{playerResult.passSuccessRate}%</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{playerResult.passesMade} passes</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">MOTM Awards</span>
                  <span className="text-xl font-black text-purple-400 mt-0.5 block">{playerResult.manOfTheMatch}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{playerResult.cleanSheets} clean sheets</span>
                </div>
              </div>

              {/* PlayStyles and Recent Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Equipped PlayStyles</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {playerResult.playstyles.map((ps) => (
                      <span
                        key={ps}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          ps.includes('+')
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-600/50 font-bold'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}
                      >
                        {ps}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                    <span>Recent 5 Matches Form (AMR)</span>
                  </span>
                  <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                    {playerResult.recentFormRating.map((r, i) => (
                      <div key={i} className="flex-1 p-2 rounded bg-zinc-900 border border-zinc-800 text-center">
                        <span className="text-[10px] text-zinc-500 block">M{5 - i}</span>
                        <span className="font-bold text-white text-xs">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RECENT MATCH FIXTURES */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-500" />
                <span>Verified Matchday Fixture Telemetry</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Live match results fetched from `/api/fc27/club/matches`.
              </p>
            </div>
            <button
              onClick={fetchMatches}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMatches ? 'animate-spin' : ''}`} />
              <span>Refresh Matches</span>
            </button>
          </div>

          <div className="space-y-3">
            {matches.map((match) => (
              <div
                key={match.matchId}
                className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-3 hover:border-zinc-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      match.result === 'win'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                        : match.result === 'draw'
                        ? 'bg-zinc-800 text-zinc-300'
                        : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                    }`}>
                      {match.result.toUpperCase()}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">{match.competition}</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {new Date(match.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                {/* Scoreline */}
                <div className="flex items-center justify-between py-1">
                  <div className="flex-1">
                    <span className="font-bold text-sm text-white">LA ACADEMIA FC27</span>
                    <span className="text-[11px] text-zinc-500 block">Division 1 • Home</span>
                  </div>

                  <div className="px-5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 font-mono font-black text-xl text-white tracking-widest shadow-inner">
                    {match.scoreHome} - {match.scoreAway}
                  </div>

                  <div className="flex-1 text-right">
                    <span className="font-bold text-sm text-zinc-300">{match.opponentClub}</span>
                    <span className="text-[11px] text-zinc-500 block">Division {match.opponentDivision} • Away</span>
                  </div>
                </div>

                {/* Match Details Strip */}
                <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span>Possession: <strong className="text-white">{match.possession.home}%</strong> - {match.possession.away}%</span>
                    <span>•</span>
                    <span>Shots: <strong className="text-white">{match.shots.home}</strong> - {match.shots.away}</span>
                    <span>•</span>
                    <span>Pass Acc: <strong className="text-white">{match.passAccuracy.home}%</strong></span>
                  </div>

                  <div className="text-[11px]">
                    <span className="text-zinc-500">Star Performer:</span>{' '}
                    <strong className="text-amber-400">{match.topPerformer.gamertag}</strong> ({match.topPerformer.rating} AMR • {match.topPerformer.contribution})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ROSTER LEADERBOARDS */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Squad Performance Leaderboard</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Filter squad members across key tactical categories: AMR, Goals, Assists, Tackles Won, and Clean Sheets.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs font-semibold">
              {[
                { id: 'amr', label: 'Match Rating (AMR)' },
                { id: 'goals', label: 'Top Goals' },
                { id: 'assists', label: 'Top Assists' },
                { id: 'tackles', label: 'Tackles Won' },
                { id: 'cleansheets', label: 'Clean Sheets' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setLeaderboardCategory(tab.id as any)}
                  className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                    leaderboardCategory === tab.id
                      ? 'bg-rose-950 text-rose-200 border border-rose-600/50 shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-mono text-[11px] uppercase bg-zinc-950/40">
                  <th className="py-3 pl-4">Rank</th>
                  <th className="py-3">Player / EA ID</th>
                  <th className="py-3">Position</th>
                  <th className="py-3">Squad Tier</th>
                  <th className="py-3">AMR</th>
                  <th className="py-3">Goals</th>
                  <th className="py-3">Assists</th>
                  <th className="py-3">Tackles</th>
                  <th className="py-3">Clean Sheets</th>
                  <th className="py-3 pr-4 text-right">MOTM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {leaderboardData.map((row) => (
                  <tr key={row.eaId} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 pl-4 font-mono font-bold">
                      {row.rank === 1 ? (
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/50 flex items-center justify-center text-[10px]">
                          1
                        </span>
                      ) : row.rank === 2 ? (
                        <span className="w-5 h-5 rounded-full bg-zinc-400/20 text-zinc-300 border border-zinc-500/50 flex items-center justify-center text-[10px]">
                          2
                        </span>
                      ) : row.rank === 3 ? (
                        <span className="w-5 h-5 rounded-full bg-orange-700/20 text-orange-400 border border-orange-700/50 flex items-center justify-center text-[10px]">
                          3
                        </span>
                      ) : (
                        <span className="text-zinc-500 ml-1.5">{row.rank}</span>
                      )}
                    </td>
                    <td className="py-3 font-bold text-white">
                      <div>
                        <span>{row.gamertag}</span>
                        <span className="text-[10px] font-mono text-zinc-500 block">{row.eaId}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono text-[10px]">
                        {row.position}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                        row.tier === 'first-xi' ? 'text-rose-400 bg-rose-950/60' : 'text-blue-400 bg-blue-950/60'
                      }`}>
                        {row.tier}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-rose-400">{row.amr}</td>
                    <td className="py-3 font-mono text-white">{row.goals}</td>
                    <td className="py-3 font-mono text-white">{row.assists}</td>
                    <td className="py-3 font-mono text-emerald-400">{row.tackles}</td>
                    <td className="py-3 font-mono text-blue-400">{row.cleanSheets}</td>
                    <td className="py-3 pr-4 text-right font-mono font-bold text-purple-400">{row.motm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: API EXPLORER & ENDPOINTS */}
      {activeTab === 'api-docs' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Terminal className="w-4 h-4 text-rose-400" />
                <span>Interactive FC27 Stats REST API Explorer</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Use these real endpoints in your Discord bot, external scout overlays, or web hooks. Test queries live below:
              </p>
            </div>

            {/* Endpoints bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {[
                { endpoint: '/api/fc27/club/stats', label: '1. Club Overall Record' },
                { endpoint: '/api/fc27/club/matches', label: '2. Recent Match History' },
                { endpoint: '/api/fc27/player/stats?gamertag=Vortex_Anchor', label: '3. Player Stats (Vortex)' },
                { endpoint: '/api/fc27/player/stats?gamertag=Grimm_Apex', label: '4. Player Stats (Grimm)' },
                { endpoint: '/api/fc27/leaderboard?category=amr', label: '5. Leaderboard (AMR)' },
                { endpoint: '/api/fc27/meta', label: '6. FC27 Meta Builds' },
              ].map((item) => (
                <button
                  key={item.endpoint}
                  onClick={() => setSelectedEndpoint(item.endpoint)}
                  className={`p-2.5 rounded-xl border text-left font-mono transition-all cursor-pointer ${
                    selectedEndpoint === item.endpoint
                      ? 'bg-rose-950/80 border-rose-500 text-rose-200 ring-1 ring-rose-500/30'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <div className="font-bold text-white text-[11px] truncate">{item.label}</div>
                  <div className="text-[10px] text-zinc-500 truncate mt-0.5">{item.endpoint}</div>
                </button>
              ))}
            </div>

            {/* Test Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 flex items-center gap-2 overflow-x-auto">
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-[10px]">GET</span>
                <span className="truncate">{selectedEndpoint}</span>
              </div>

              <button
                onClick={() => runApiEndpoint(selectedEndpoint)}
                disabled={isCallingApi}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isCallingApi ? 'Fetching...' : 'Send Request'}
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`curl -X GET "${window.location.origin}${selectedEndpoint}"`);
                  setCopiedCurl(true);
                  setTimeout(() => setCopiedCurl(false), 2000);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                title="Copy cURL command"
              >
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>{copiedCurl ? 'Copied' : 'cURL'}</span>
              </button>
            </div>

            {/* JSON Response Window */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
              <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 py-2 flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>Response Body (200 OK • application/json)</span>
                <span className="text-[10px] text-emerald-400 font-semibold">Live Server Proxy</span>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto font-mono text-xs text-emerald-400 leading-relaxed bg-[#0c0d0e]">
                <pre>{apiResponse}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
