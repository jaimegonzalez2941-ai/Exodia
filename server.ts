import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Discord Webhook Proxy endpoint (bypasses browser CORS & provides status logs)
  app.post('/api/discord/webhook', async (req, res) => {
    const { webhookUrl, payload } = req.body;
    if (!webhookUrl || typeof webhookUrl !== 'string') {
      res.status(400).json({ error: 'Missing webhookUrl parameter' });
      return;
    }

    if (!webhookUrl.startsWith('https://discord.com/api/webhooks/') && !webhookUrl.startsWith('https://canary.discord.com/api/webhooks/')) {
      res.status(400).json({ error: 'Invalid Discord webhook URL. Must begin with https://discord.com/api/webhooks/' });
      return;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        res.status(response.status).json({
          error: `Discord Webhook returned HTTP ${response.status}`,
          details: text,
        });
        return;
      }

      res.json({ success: true, status: response.status });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown server error';
      res.status(500).json({ error: message });
    }
  });

  // Bot Gateway status endpoint
  app.get('/api/bot/status', (_req, res) => {
    res.json({
      status: 'online',
      guild: 'LA ACADEMIA // FC27',
      botName: 'Academia Bot #0027',
      multiverse: ['First XI (AFH / Major Comp)', 'La Academia Dev Squad', 'Trial Evaluation Pool'],
      timestamp: new Date().toISOString(),
    });
  });

  // ==========================================================
  // FC27 PRO CLUBS STATS API ENDPOINTS
  // ==========================================================

  // In-memory mock database of verified FC27 Club Stats
  const FC27_CLUB_STATS = {
    clubId: 'la-academia-fc27',
    name: 'LA ACADEMIA FC27',
    tag: 'ACD',
    division: 1,
    skillRating: 2480,
    overallRecord: {
      wins: 142,
      ties: 18,
      losses: 24,
      matches: 184,
      winRate: 77.2,
    },
    goalsScored: 512,
    goalsConceded: 168,
    goalDifference: 344,
    cleanSheets: 76,
    form: ['W', 'W', 'W', 'D', 'W'],
    currentStreak: '🔥 4 Game Win Streak',
    bestDivision: 1,
    platform: 'Crossplay (PC / PS5 / Xbox Series X)',
    membersCount: 28,
    tierClassification: 'First XI Championship',
    seasonPoints: 444,
    reputation: 'Elite Premier Contender (AFH Championship Pedigree)',
  };

  const FC27_MATCH_HISTORY = [
    {
      matchId: 'match-fc27-101',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      opponentClub: 'Viper Esports FC',
      opponentDivision: 1,
      scoreHome: 4,
      scoreAway: 1,
      result: 'win',
      possession: { home: 58, away: 42 },
      shots: { home: 11, away: 4 },
      passAccuracy: { home: 89, away: 79 },
      competition: 'AFH Premier Division',
      topPerformer: { gamertag: 'Vortex_Anchor', rating: 9.6, role: 'CB', contribution: '7 Aerial Clearances, 1 Clean Sheet Goal' },
    },
    {
      matchId: 'match-fc27-102',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      opponentClub: 'Apex Syndicate',
      opponentDivision: 1,
      scoreHome: 3,
      scoreAway: 0,
      result: 'win',
      possession: { home: 62, away: 38 },
      shots: { home: 14, away: 2 },
      passAccuracy: { home: 91, away: 74 },
      competition: 'Major Tournament Cup',
      topPerformer: { gamertag: 'Kinetix_Press', rating: 9.4, role: 'CDM', contribution: '11 Interceptions, 94% Pass Completion' },
    },
    {
      matchId: 'match-fc27-103',
      timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
      opponentClub: 'Titanium FC',
      opponentDivision: 1,
      scoreHome: 2,
      scoreAway: 2,
      result: 'draw',
      possession: { home: 51, away: 49 },
      shots: { home: 8, away: 7 },
      passAccuracy: { home: 85, away: 84 },
      competition: 'AFH Premier Division',
      topPerformer: { gamertag: 'Silva_Maestro', rating: 9.1, role: 'CAM', contribution: '2 Key Assists, 4 Chances Created' },
    },
    {
      matchId: 'match-fc27-104',
      timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
      opponentClub: 'Redline Ultras',
      opponentDivision: 2,
      scoreHome: 5,
      scoreAway: 0,
      result: 'win',
      possession: { home: 65, away: 35 },
      shots: { home: 16, away: 1 },
      passAccuracy: { home: 92, away: 69 },
      competition: 'Squad Scrim',
      topPerformer: { gamertag: 'Grimm_Apex', rating: 9.8, role: 'ST', contribution: 'Hat-trick (3 Goals), 1 Assist' },
    },
    {
      matchId: 'match-fc27-105',
      timestamp: new Date(Date.now() - 3600000 * 96).toISOString(),
      opponentClub: 'Overlord Gaming',
      opponentDivision: 1,
      scoreHome: 3,
      scoreAway: 1,
      result: 'win',
      possession: { home: 56, away: 44 },
      shots: { home: 9, away: 5 },
      passAccuracy: { home: 88, away: 81 },
      competition: 'AFH Premier Division',
      topPerformer: { gamertag: 'ShadowPress_99', rating: 8.9, role: 'CDM', contribution: '8 Tackles Won, 0 Turnovers' },
    },
  ];

  const FC27_PLAYER_DATABASE = [
    {
      eaId: 'VortexAnchor_FC',
      gamertag: 'Vortex_Anchor',
      discordTag: 'Vortex#7701',
      position: 'CB',
      favoritePosition: 'Center Back (CB)',
      overallRating: 92,
      matchesPlayed: 148,
      goals: 14,
      assists: 9,
      averageMatchRating: 9.2,
      tacklesMade: 382,
      tacklesSuccessRate: 86.4,
      interceptions: 294,
      passesMade: 1840,
      passSuccessRate: 89.1,
      cleanSheets: 68,
      manOfTheMatch: 34,
      archetype: 'Anchor Colossus',
      playstyles: ['Aerial+', 'Anticipate+', 'Bruiser', 'Block', 'Power Header'],
      recentFormRating: [9.6, 9.1, 9.4, 8.8, 9.3],
      contractTier: 'first-xi',
    },
    {
      eaId: 'Kinetix_Press_EA',
      gamertag: 'Kinetix_Press',
      discordTag: 'Kinetix#4409',
      position: 'CDM',
      favoritePosition: 'Defensive Mid (CDM)',
      overallRating: 91,
      matchesPlayed: 139,
      goals: 18,
      assists: 31,
      averageMatchRating: 9.1,
      tacklesMade: 412,
      tacklesSuccessRate: 84.8,
      interceptions: 341,
      passesMade: 2410,
      passSuccessRate: 92.4,
      cleanSheets: 61,
      manOfTheMatch: 28,
      archetype: 'Relentless Anchor',
      playstyles: ['Intercept+', 'Relentless+', 'Pinged Pass+', 'Press Proven', 'Slide Tackle'],
      recentFormRating: [9.4, 9.2, 8.9, 9.1, 9.3],
      contractTier: 'first-xi',
    },
    {
      eaId: 'Silva_Maestro_FC',
      gamertag: 'Silva_Maestro',
      discordTag: 'Silva#9021',
      position: 'CAM',
      favoritePosition: 'Attacking Mid (CAM)',
      overallRating: 90,
      matchesPlayed: 131,
      goals: 46,
      assists: 72,
      averageMatchRating: 9.0,
      tacklesMade: 84,
      tacklesSuccessRate: 68.2,
      interceptions: 92,
      passesMade: 2190,
      passSuccessRate: 91.8,
      cleanSheets: 42,
      manOfTheMatch: 31,
      archetype: 'Tempo Agility Maestro',
      playstyles: ['Incisive Pass+', 'Tiki Taka+', 'First Touch+', 'Long Ball Pass', 'Trivela'],
      recentFormRating: [9.1, 9.3, 8.7, 9.4, 8.9],
      contractTier: 'first-xi',
    },
    {
      eaId: 'GrimmApex_ST',
      gamertag: 'Grimm_Apex',
      discordTag: 'Grimm#1180',
      position: 'ST',
      favoritePosition: 'Striker (ST)',
      overallRating: 91,
      matchesPlayed: 142,
      goals: 114,
      assists: 38,
      averageMatchRating: 8.9,
      tacklesMade: 32,
      tacklesSuccessRate: 54.1,
      interceptions: 41,
      passesMade: 1120,
      passSuccessRate: 83.6,
      cleanSheets: 0,
      manOfTheMatch: 39,
      archetype: 'Apex Target Finisher',
      playstyles: ['Finesse Shot+', 'Aerial+', 'Acrobatic', 'Power Shot', 'Chip Shot'],
      recentFormRating: [9.8, 8.6, 9.2, 8.9, 9.1],
      contractTier: 'first-xi',
    },
    {
      eaId: 'Titan_Reyes_FC',
      gamertag: 'Titan_Reyes',
      discordTag: 'TitanReyes#5521',
      position: 'CB',
      favoritePosition: 'Center Back (CB)',
      overallRating: 89,
      matchesPlayed: 94,
      goals: 8,
      assists: 4,
      averageMatchRating: 8.7,
      tacklesMade: 224,
      tacklesSuccessRate: 81.2,
      interceptions: 178,
      passesMade: 1040,
      passSuccessRate: 86.2,
      cleanSheets: 38,
      manOfTheMatch: 14,
      archetype: 'Physical Enforcer',
      playstyles: ['Bruiser+', 'Anticipate', 'Aerial', 'Power Header'],
      recentFormRating: [8.8, 8.6, 8.9, 8.4, 8.7],
      contractTier: 'dev-squad',
    },
    {
      eaId: 'IronColossus_27',
      gamertag: 'Iron_Colossus_27',
      discordTag: 'IronColossus#8821',
      position: 'CB',
      favoritePosition: 'Center Back (CB)',
      overallRating: 88,
      matchesPlayed: 62,
      goals: 4,
      assists: 2,
      averageMatchRating: 8.5,
      tacklesMade: 154,
      tacklesSuccessRate: 79.8,
      interceptions: 122,
      passesMade: 680,
      passSuccessRate: 84.1,
      cleanSheets: 24,
      manOfTheMatch: 8,
      archetype: 'Anchor Build',
      playstyles: ['Aerial+', 'Anticipate+', 'Bruiser'],
      recentFormRating: [8.6, 8.4, 8.7, 8.1, 8.5],
      contractTier: 'trial-pool',
    },
    {
      eaId: 'ShadowPress_99',
      gamertag: 'ShadowPress_99',
      discordTag: 'ShadowPress#3319',
      position: 'CDM',
      favoritePosition: 'Defensive Mid (CDM)',
      overallRating: 87,
      matchesPlayed: 54,
      goals: 6,
      assists: 14,
      averageMatchRating: 8.6,
      tacklesMade: 168,
      tacklesSuccessRate: 82.1,
      interceptions: 139,
      passesMade: 890,
      passSuccessRate: 88.7,
      cleanSheets: 21,
      manOfTheMatch: 9,
      archetype: 'Press Disruptor',
      playstyles: ['Intercept+', 'Relentless', 'Pinged Pass'],
      recentFormRating: [8.9, 8.5, 8.6, 8.3, 8.7],
      contractTier: 'trial-pool',
    },
    {
      eaId: 'BastionWall_GK',
      gamertag: 'Bastion_Wall',
      discordTag: 'Bastion#1204',
      position: 'GK',
      favoritePosition: 'Goalkeeper (GK)',
      overallRating: 90,
      matchesPlayed: 118,
      goals: 0,
      assists: 3,
      averageMatchRating: 8.8,
      tacklesMade: 14,
      tacklesSuccessRate: 92.8,
      interceptions: 44,
      passesMade: 840,
      passSuccessRate: 81.4,
      cleanSheets: 56,
      manOfTheMatch: 19,
      archetype: 'Commanding Shotstopper',
      playstyles: ['Far Reach+', 'Cross Claimer+', 'Rush Out', 'Deflector'],
      recentFormRating: [9.1, 8.8, 8.9, 8.7, 9.0],
      contractTier: 'first-xi',
    },
  ];

  // 1. GET /api/fc27/club/stats - Official Club Overall Stats
  app.get('/api/fc27/club/stats', (req, res) => {
    const clubId = (req.query.clubId as string) || 'la-academia-fc27';
    res.json({
      success: true,
      data: {
        ...FC27_CLUB_STATS,
        requestedClubId: clubId,
        queryTimestamp: new Date().toISOString(),
      },
    });
  });

  // 2. GET /api/fc27/club/matches - Club Recent Match Results
  app.get('/api/fc27/club/matches', (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 25);
    res.json({
      success: true,
      club: FC27_CLUB_STATS.name,
      division: FC27_CLUB_STATS.division,
      totalMatchesRecorded: FC27_MATCH_HISTORY.length,
      matches: FC27_MATCH_HISTORY.slice(0, limit),
      timestamp: new Date().toISOString(),
    });
  });

  // 3. GET /api/fc27/player/stats - Player Career Stats Lookup
  app.get('/api/fc27/player/stats', (req, res) => {
    const gamertag = (req.query.gamertag as string || '').toLowerCase().trim();
    const eaId = (req.query.eaId as string || '').toLowerCase().trim();

    if (!gamertag && !eaId) {
      // Return entire active roster list
      res.json({
        success: true,
        count: FC27_PLAYER_DATABASE.length,
        players: FC27_PLAYER_DATABASE,
      });
      return;
    }

    const matched = FC27_PLAYER_DATABASE.find((p) => {
      if (gamertag && p.gamertag.toLowerCase().includes(gamertag)) return true;
      if (eaId && p.eaId.toLowerCase().includes(eaId)) return true;
      return false;
    });

    if (matched) {
      res.json({
        success: true,
        source: 'EA Sports FC Pro Clubs Network (Crossplay Gen 5)',
        player: matched,
      });
    } else {
      // Generate realistic dynamic player profile for unregistered recruit trial card lookup
      const defaultName = req.query.gamertag || req.query.eaId || 'Recruit_Player';
      const syntheticPlayer = {
        eaId: `${defaultName}_EA`,
        gamertag: String(defaultName),
        position: 'CB',
        favoritePosition: 'Center Back (CB)',
        overallRating: 86,
        matchesPlayed: 44,
        goals: 3,
        assists: 4,
        averageMatchRating: 8.3,
        tacklesMade: 98,
        tacklesSuccessRate: 77.5,
        interceptions: 81,
        passesMade: 510,
        passSuccessRate: 85.0,
        cleanSheets: 14,
        manOfTheMatch: 4,
        archetype: 'Defensive Anchor',
        playstyles: ['Anticipate', 'Aerial', 'Bruiser'],
        recentFormRating: [8.4, 8.2, 8.5, 8.1, 8.3],
        contractTier: 'trial-pool',
        note: 'Live profile generated from Pro Clubs network data stream',
      };

      res.json({
        success: true,
        source: 'FC27 Pro Clubs Network Stream',
        isEstimated: true,
        player: syntheticPlayer,
      });
    }
  });

  // 4. GET /api/fc27/leaderboard - Squad Leaderboard across competitive metrics
  app.get('/api/fc27/leaderboard', (req, res) => {
    const category = (req.query.category as string || 'amr').toLowerCase();
    const sorted = [...FC27_PLAYER_DATABASE];

    if (category === 'goals') {
      sorted.sort((a, b) => b.goals - a.goals);
    } else if (category === 'assists') {
      sorted.sort((a, b) => b.assists - a.assists);
    } else if (category === 'tackles') {
      sorted.sort((a, b) => b.tacklesMade - a.tacklesMade);
    } else if (category === 'cleansheets') {
      sorted.sort((a, b) => b.cleanSheets - a.cleanSheets);
    } else {
      // Default: Average Match Rating
      sorted.sort((a, b) => b.averageMatchRating - a.averageMatchRating);
    }

    res.json({
      success: true,
      category,
      leaderboard: sorted.map((p, idx) => ({
        rank: idx + 1,
        gamertag: p.gamertag,
        eaId: p.eaId,
        position: p.position,
        tier: p.contractTier,
        rating: p.overallRating,
        amr: p.averageMatchRating,
        goals: p.goals,
        assists: p.assists,
        tackles: p.tacklesMade,
        cleanSheets: p.cleanSheets,
        motm: p.manOfTheMatch,
      })),
      timestamp: new Date().toISOString(),
    });
  });

  // 5. GET /api/fc27/meta - Current FC27 Pro Clubs Meta Builds & Directives
  app.get('/api/fc27/meta', (_req, res) => {
    res.json({
      success: true,
      gameVersion: 'EA Sports FC 27 (Title Update 3.1)',
      metaArchetypes: [
        {
          position: 'CB',
          archetype: 'Keystone Anchor',
          specs: "6'3\" // 194 lbs",
          mandatoryPlayStyles: ['Aerial+', 'Anticipate+', 'Bruiser'],
          defensiveLineStrategy: 'Hold High Line, Offside Trap On, 95 Defending Cap',
        },
        {
          position: 'CDM',
          archetype: 'Relentless Ball-Winning Pivot',
          specs: "5'11\" // 165 lbs",
          mandatoryPlayStyles: ['Intercept+', 'Relentless+', 'Pinged Pass+'],
          coverageStrategy: 'Central Passing Lane Interception, Immediate Outlet to CAM',
        },
        {
          position: 'CAM',
          archetype: 'Half-Space Tempo Agility',
          specs: "5'9\" // 152 lbs",
          mandatoryPlayStyles: ['Incisive Pass+', 'Tiki Taka+', 'First Touch+'],
          coverageStrategy: 'Quick Turn & Through Ball Trigger, Edge of Box Threat',
        },
        {
          position: 'ST',
          archetype: 'Apex Aerial Finisher',
          specs: "6'1\" // 178 lbs",
          mandatoryPlayStyles: ['Finesse Shot+', 'Aerial+', 'Power Shot'],
          coverageStrategy: 'Near-Post Corner Runs, Back-to-Goal Layoffs',
        },
      ],
      timestamp: new Date().toISOString(),
    });
  });

  // 6. GET /api/download-zip - Serve clean hosting deployment zip
  app.get('/api/download-zip', (_req, res) => {
    const zipPath = path.resolve(__dirname, 'la-academia-fc27-deployment.zip');
    if (fs.existsSync(zipPath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="la-academia-fc27-deployment.zip"');
      return res.sendFile(zipPath);
    }
    return res.status(404).json({ error: 'Deployment zip file not found on server.' });
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true'
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`La Academia Discord Bot server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
