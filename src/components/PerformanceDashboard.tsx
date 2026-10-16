import React, { useState, useMemo } from 'react';
import { PlayerTrialCard, SquadTier, Position } from '../types';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, 
  Award, 
  Shield, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Send, 
  Activity, 
  Zap, 
  Star,
  Flame,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { sendDiscordWebhook } from '../utils/discordEmbed';

interface PerformanceDashboardProps {
  players: PlayerTrialCard[];
  onPromotePlayer: (playerId: string, targetTier: SquadTier) => void;
  onPostToSimulator?: (channelId: string, content: string, embed: any) => void;
  webhookUrl?: string;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  players,
  onPromotePlayer,
  onPostToSimulator,
  webhookUrl = '',
}) => {
  // Filters
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('30d');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  // Generate 30-day chronological progression dataset
  const timelineData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    const result = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Synthetic daily trends with realistic weekend spikes (competitive matchdays)
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const baseSubmissions = isWeekend ? 3 + (i % 3) : 1 + (i % 2);
      const evaluated = Math.max(1, Math.round(baseSubmissions * 0.85));
      const passed = Math.round(evaluated * 0.65);
      const devPromotions = Math.round(passed * 0.6);
      const firstXICallups = Math.round(passed * 0.25);

      result.push({
        date: dateStr,
        dayIndex: i,
        submissions: baseSubmissions,
        evaluated,
        cleared: passed,
        devPromotions,
        firstXICallups,
        passRate: Math.round((passed / Math.max(1, evaluated)) * 100),
      });
    }
    return result;
  }, [timeRange]);

  // Positional trial success rates
  const positionStatsData = useMemo(() => {
    const positions: { pos: string; label: string; applicants: number; passed: number; promoted: number }[] = [
      { pos: 'CB', label: 'Center Back (CB)', applicants: 14, passed: 10, promoted: 7 },
      { pos: 'CDM', label: 'Def Mid (CDM)', applicants: 12, passed: 8, promoted: 5 },
      { pos: 'CAM', label: 'Attack Mid (CAM)', applicants: 9, passed: 5, promoted: 3 },
      { pos: 'ST', label: 'Striker (ST)', applicants: 8, passed: 4, promoted: 2 },
      { pos: 'GK', label: 'Goalkeeper (GK)', applicants: 4, passed: 3, promoted: 2 },
      { pos: 'LB/RB', label: 'Fullback (LB/RB)', applicants: 6, passed: 4, promoted: 3 },
      { pos: 'CM', label: 'Central Mid (CM)', applicants: 5, passed: 3, promoted: 2 },
      { pos: 'Winger', label: 'Winger (LW/RW)', applicants: 7, passed: 4, promoted: 2 },
    ];

    return positions.map((p) => ({
      ...p,
      passRate: Math.round((p.passed / p.applicants) * 100),
      conversionRate: Math.round((p.promoted / p.applicants) * 100),
    }));
  }, []);

  // Status Funnel & Squad Tier distribution
  const tierDistributionData = useMemo(() => {
    const firstCount = players.filter((p) => p.tier === 'first-xi').length;
    const devCount = players.filter((p) => p.tier === 'dev-squad').length;
    const trialCount = players.filter((p) => p.tier === 'trial-pool').length;
    
    return [
      { name: 'First XI (Starting)', value: firstCount, color: '#e11d48' },
      { name: 'La Academia (Dev)', value: devCount, color: '#3b82f6' },
      { name: 'Trialist Pool', value: trialCount, color: '#eab308' },
    ];
  }, [players]);

  // Radar chart: Attribute comparison (First XI Starters vs Trialist Pool)
  const radarComparisonData = useMemo(() => {
    const firstXI = players.filter((p) => p.tier === 'first-xi');
    const trialists = players.filter((p) => p.tier === 'trial-pool');

    const getAvg = (list: PlayerTrialCard[], key: keyof PlayerTrialCard['stats']) => {
      if (list.length === 0) return 75;
      const total = list.reduce((sum, p) => sum + (p.stats[key] || 75), 0);
      return Math.round(total / list.length);
    };

    return [
      { attribute: 'DEFENDING', firstXI: getAvg(firstXI, 'defending'), trialPool: getAvg(trialists, 'defending'), benchmark: 90 },
      { attribute: 'PHYSICAL', firstXI: getAvg(firstXI, 'physical'), trialPool: getAvg(trialists, 'physical'), benchmark: 88 },
      { attribute: 'PASSING', firstXI: getAvg(firstXI, 'passing'), trialPool: getAvg(trialists, 'passing'), benchmark: 85 },
      { attribute: 'PACE', firstXI: getAvg(firstXI, 'pace'), trialPool: getAvg(trialists, 'pace'), benchmark: 86 },
      { attribute: 'DRIBBLING', firstXI: getAvg(firstXI, 'dribbling'), trialPool: getAvg(trialists, 'dribbling'), benchmark: 82 },
      { attribute: 'SHOOTING', firstXI: getAvg(firstXI, 'shooting'), trialPool: getAvg(trialists, 'shooting'), benchmark: 80 },
    ];
  }, [players]);

  // Aggregate Key Performance Indicators (KPIs)
  const totalSubmissions = useMemo(() => timelineData.reduce((acc, d) => acc + d.submissions, 0), [timelineData]);
  const totalEvaluated = useMemo(() => timelineData.reduce((acc, d) => acc + d.evaluated, 0), [timelineData]);
  const totalCleared = useMemo(() => timelineData.reduce((acc, d) => acc + d.cleared, 0), [timelineData]);
  const totalFirstCallups = useMemo(() => timelineData.reduce((acc, d) => acc + d.firstXICallups, 0), [timelineData]);
  const totalDevPromotions = useMemo(() => timelineData.reduce((acc, d) => acc + d.devPromotions, 0), [timelineData]);
  const overallSuccessRate = totalEvaluated > 0 ? Math.round((totalCleared / totalEvaluated) * 100) : 68;

  // Filtered Players for Historical Table
  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      if (selectedPosition !== 'all' && player.position !== selectedPosition) return false;
      if (selectedStatusFilter !== 'all') {
        if (selectedStatusFilter === 'first-xi' && player.tier !== 'first-xi') return false;
        if (selectedStatusFilter === 'dev-squad' && player.tier !== 'dev-squad') return false;
        if (selectedStatusFilter === 'trial-pool' && player.tier !== 'trial-pool') return false;
      }
      return true;
    });
  }, [players, selectedPosition, selectedStatusFilter]);

  // Dispatch Performance Dossier to Discord
  const handleDispatchDossier = async () => {
    setIsDispatching(true);
    setDispatchStatus(null);

    const embed = {
      title: '📊 LA ACADEMIA // 30-DAY PERFORMANCE & RECRUITMENT DOSSIER',
      description: 'Official analytics report on trial success rates, squad progression, and position pipeline conversion.',
      color: 0xE11D48,
      fields: [
        { name: '🎯 Total Trials Evaluated', value: `${totalEvaluated} Recruits`, inline: true },
        { name: '✅ Trial Clearance Rate', value: `${overallSuccessRate}% Success`, inline: true },
        { name: '⭐ First XI Call-ups', value: `${totalFirstCallups} Starters`, inline: true },
        { name: '🛡️ Dev Squad Promotions', value: `${totalDevPromotions} Contracts`, inline: true },
        { name: '🔥 Top Pipeline Demand', value: 'Center Back (CB) & Def Mid (CDM)', inline: true },
        { name: '📈 Squad Health Index', value: '94.2% Competitive Ready', inline: true },
      ],
      footer: { text: 'La Academia Performance Directorate • FC27 Pro Clubs' },
      timestamp: new Date().toISOString(),
    };

    if (onPostToSimulator) {
      onPostToSimulator(
        'trial-feedback',
        '📊 **30-DAY SCOUTING & PROGRESSION REPORT GENERATED**',
        embed
      );
    }

    if (webhookUrl.trim()) {
      const res = await sendDiscordWebhook(webhookUrl.trim(), {
        username: 'Academia Performance Scout',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=analytics-bot',
        content: '📊 **OFFICIAL 30-DAY RECRUITMENT & PROGRESSION DOSSIER DISPATCHED**',
        embeds: [embed],
      });
      if (res.success) {
        setDispatchStatus('Dossier delivered to Simulator #trial-feedback and Live Discord channel!');
      } else {
        setDispatchStatus(`Sent to Simulator, but Webhook error: ${res.message}`);
      }
    } else {
      setDispatchStatus('Dispatched to Simulator #trial-feedback channel! (Connect Webhook to dispatch to live Discord).');
    }

    setIsDispatching(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-rose-950/40 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-[11px] font-mono font-semibold text-rose-400">
              FC27 PRO CLUBS MULTIVERSE ANALYTICS
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-zinc-400 font-mono">Recruitment &amp; Progression Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Performance Dashboard
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Real-time analytics on 30-day recruit trial velocity, positional pass rates, and promotion funnel from Trialist to First XI starters.
          </p>
        </div>

        {/* Top Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-0.5 text-xs font-semibold">
            {(['7d', '14d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-rose-900/80 text-rose-200 border border-rose-600/50 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {range === '7d' ? 'Last 7 Days' : range === '14d' ? 'Last 14 Days' : 'Last 30 Days'}
              </button>
            ))}
          </div>

          <button
            onClick={handleDispatchDossier}
            disabled={isDispatching}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isDispatching ? 'Dispatching...' : 'Dispatch Dossier to Discord'}</span>
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

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1 */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-1 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-rose-500" />
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Evaluations</span>
            <Users className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalEvaluated}</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" />
            <span>+18.4% vs last mo.</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-1 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Trial Pass Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{overallSuccessRate}%</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" />
            <span>{totalCleared} cleared trials</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-1 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500" />
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>First XI Callups</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalFirstCallups}</div>
          <div className="text-[11px] text-amber-400 font-mono">
            {Math.round((totalFirstCallups / Math.max(1, totalEvaluated)) * 100)}% Premier conversion
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-1 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Dev Squad Feed</span>
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalDevPromotions}</div>
          <div className="text-[11px] text-blue-400 font-mono">
            {Math.round((totalDevPromotions / Math.max(1, totalEvaluated)) * 100)}% Feeder intake
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-1 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-purple-500" />
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Avg Trial Score</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">8.68</div>
          <div className="text-[11px] text-zinc-400 font-mono">
            Scale: 1.0 - 10.0 OVR
          </div>
        </div>

        {/* Card 6 */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-1 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-orange-500" />
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Active Roster</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-white">{players.length}</div>
          <div className="text-[11px] text-zinc-400 font-mono">
            {players.filter((p) => p.vocalMic).length} with Vocal Mic
          </div>
        </div>
      </div>

      {/* Row 1: 30-Day Recruitment & Progression Trend (Area Chart) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              <span>Squad Progression &amp; Trial Velocity ({timeRange === '7d' ? '7 Days' : timeRange === '14d' ? '14 Days' : '30 Days'})</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Cumulative progression comparing recruit submissions, trial evaluations, and promotions to First XI and Dev Squad.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Submissions
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Cleared Trials
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Dev Promotions
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              First XI
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorClear" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorDev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  borderColor: '#3f3f46', 
                  borderRadius: '0.75rem', 
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                }}
                labelStyle={{ color: '#f43f5e', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="submissions" name="Submissions" stroke="#e11d48" strokeWidth={2} fillOpacity={1} fill="url(#colorSub)" />
              <Area type="monotone" dataKey="cleared" name="Cleared Trials" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorClear)" />
              <Area type="monotone" dataKey="devPromotions" name="Dev Squad Contracts" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorDev)" />
              <Line type="monotone" dataKey="firstXICallups" name="First XI Call-ups" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Two-column Charts: Positional Bar Chart & Attribute Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Positional Success Rate (Composed Chart) */}
        <div className="lg:col-span-7 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Positional Trial Conversion (30 Days)</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Applicants vs Passed trials with clearance percentage line across tactical archetypes.
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              CB &amp; CDM: High Priority
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={positionStatsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="pos" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} tickLine={false} unit="%" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    borderColor: '#3f3f46', 
                    borderRadius: '0.75rem', 
                    fontSize: '12px'
                  }}
                />
                <Bar yAxisId="left" dataKey="applicants" name="Total Applicants" fill="#3f3f46" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="passed" name="Trials Passed" fill="#e11d48" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="passRate" name="Pass Rate %" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>Anchor CBs boast the highest clearance rate (71.4%)</span>
            <span className="font-mono text-zinc-500">Benchmark: &gt;60% target</span>
          </div>
        </div>

        {/* Positional Attribute Benchmark (Radar Chart) */}
        <div className="lg:col-span-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Attribute Benchmark Radar</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                First XI Starters vs Trial Pool Average
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-rose-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                First XI
              </span>
              <span className="text-yellow-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                Trials
              </span>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarComparisonData}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis dataKey="attribute" stroke="#a1a1aa" fontSize={10} />
                <PolarRadiusAxis stroke="#52525b" angle={30} domain={[40, 100]} fontSize={9} />
                <Radar name="First XI Starters" dataKey="firstXI" stroke="#e11d48" fill="#e11d48" fillOpacity={0.4} />
                <Radar name="Trialist Pool" dataKey="trialPool" stroke="#eab308" fill="#eab308" fillOpacity={0.2} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    borderColor: '#3f3f46', 
                    borderRadius: '0.75rem', 
                    fontSize: '11px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 border-t border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between">
            <span>Primary gap: Defensive positioning (+18 OVR)</span>
            <span className="font-mono text-zinc-500">FC27 Engine v1.0</span>
          </div>
        </div>
      </div>

      {/* Row 3: Squad Composition & 30-Day Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tier Distribution Donut Chart */}
        <div className="lg:col-span-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Squad Multiverse Tier Distribution</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Current roster breakdown across First XI, Dev Squad, and Trial Pool.
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-400">{players.length} Total</span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tierDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#18181b" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    borderColor: '#3f3f46', 
                    borderRadius: '0.75rem', 
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {tierDistributionData.map((tier) => (
              <div key={tier.name} className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                <div className="font-bold text-sm" style={{ color: tier.color }}>
                  {tier.value}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5 truncate">{tier.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 30-Day Conversion Funnel */}
        <div className="lg:col-span-7 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <span>Recruitment Pipeline Conversion Funnel</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Conversion rates from initial Discord trial submission to active contract signing.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
              30-Day Cohort
            </span>
          </div>

          <div className="space-y-3.5 pt-2">
            {/* Step 1: Submissions */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-zinc-300">1. Submissions (#apply-for-tryouts)</span>
                <span className="font-mono text-zinc-400">48 Applicants (100%)</span>
              </div>
              <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-400 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            {/* Step 2: Scout Evaluations */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-zinc-300">2. Staff Scrim Evaluation</span>
                <span className="font-mono text-purple-400">41 Evaluated (85.4%)</span>
              </div>
              <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '85.4%' }} />
              </div>
            </div>

            {/* Step 3: Trial Cleared */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-zinc-300">3. Trial Standard Cleared (Score &gt;8.0)</span>
                <span className="font-mono text-emerald-400">31 Cleared (64.6%)</span>
              </div>
              <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '64.6%' }} />
              </div>
            </div>

            {/* Step 4: Dev Squad Offer */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-zinc-300">4. La Academia Feeder Contract</span>
                <span className="font-mono text-blue-400">22 Signed (45.8%)</span>
              </div>
              <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '45.8%' }} />
              </div>
            </div>

            {/* Step 5: First XI Premier Call-up */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-zinc-300">5. First XI Premier Call-up</span>
                <span className="font-mono text-rose-400">8 Starters (16.7%)</span>
              </div>
              <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-600 rounded-full" style={{ width: '16.7%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Historical 30-Day Trial Ledger & Interactive Decisions */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-400" />
              <span>30-Day Roster Ledger &amp; Progression Tracker</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live roster candidates, competitive evaluations, and fast-track promotion controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Position filter */}
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="bg-transparent text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="all">All Positions</option>
                <option value="CB">Center Back (CB)</option>
                <option value="CDM">Def Mid (CDM)</option>
                <option value="CAM">Attack Mid (CAM)</option>
                <option value="ST">Striker (ST)</option>
                <option value="GK">Goalkeeper (GK)</option>
                <option value="LB">Left Back (LB)</option>
                <option value="RB">Right Back (RB)</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs">
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-transparent text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="all">All Roster Tiers</option>
                <option value="first-xi">First XI Starters</option>
                <option value="dev-squad">Dev Squad (La Academia)</option>
                <option value="trial-pool">Trialist Pool</option>
              </select>
            </div>
          </div>
        </div>

        {/* Players Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-mono text-[11px] uppercase">
                <th className="pb-3 pl-2">Player / Gamertag</th>
                <th className="pb-3">Position</th>
                <th className="pb-3">Archetype</th>
                <th className="pb-3">OVR Rating</th>
                <th className="pb-3">Evaluation Score</th>
                <th className="pb-3">Comms Mic</th>
                <th className="pb-3">Current Tier</th>
                <th className="pb-3 text-right pr-2">Scout Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500">
                    No recruits match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={player.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${player.gamertag}`}
                          alt={player.gamertag}
                          className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700"
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{player.gamertag}</span>
                            {player.tier === 'first-xi' && (
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500">{player.discordTag}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                        {player.position}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-300">{player.archetype}</td>
                    <td className="py-3 font-mono font-bold text-white">{player.overallRating}</td>
                    <td className="py-3">
                      <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                        (player.trialScore || 8.5) >= 9.0
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                          : (player.trialScore || 8.5) >= 8.0
                          ? 'bg-blue-950 text-blue-300 border border-blue-800/40'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        {player.trialScore ? `${player.trialScore}/10` : '8.5/10'}
                      </span>
                    </td>
                    <td className="py-3">
                      {player.vocalMic ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-zinc-500 italic">No mic</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        player.tier === 'first-xi'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                          : player.tier === 'dev-squad'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800/50'
                          : 'bg-yellow-950 text-yellow-300 border border-yellow-800/50'
                      }`}>
                        {player.tier === 'first-xi' ? 'First XI' : player.tier === 'dev-squad' ? 'Dev Squad' : 'Trialist'}
                      </span>
                    </td>
                    <td className="py-3 text-right pr-2">
                      <div className="flex items-center justify-end gap-1.5">
                        {player.tier !== 'first-xi' && (
                          <button
                            onClick={() => onPromotePlayer(player.id, 'first-xi')}
                            className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/40 rounded text-[10px] font-bold cursor-pointer transition-colors"
                            title="Call up to First XI starting roster"
                          >
                            First XI
                          </button>
                        )}
                        {player.tier === 'trial-pool' && (
                          <button
                            onClick={() => onPromotePlayer(player.id, 'dev-squad')}
                            className="px-2 py-1 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800/40 rounded text-[10px] font-bold cursor-pointer transition-colors"
                            title="Promote recruit to La Academia feeder squad"
                          >
                            Dev Squad
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
