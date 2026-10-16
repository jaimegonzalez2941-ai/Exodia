export type SquadTier = 'first-xi' | 'dev-squad' | 'trial-pool';

export type Position = 'CB' | 'CDM' | 'CAM' | 'CM' | 'ST' | 'LW' | 'RW' | 'LB' | 'RB' | 'GK';

export interface PlayStyle {
  id: string;
  name: string;
  category: 'Defending' | 'Passing' | 'Physical' | 'Ball Control' | 'Shooting' | 'Goalkeeping';
  isPlus?: boolean;
  description: string;
}

export interface PlayerTrialCard {
  id: string;
  gamertag: string;
  discordTag: string;
  eaId: string;
  tier: SquadTier;
  position: Position;
  secondaryPosition?: Position;
  archetype: string;
  overallRating: number;
  height: string; // e.g. "6'3\""
  weight: string; // e.g. "190 lbs"
  stats: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  };
  playstyles: string[]; // e.g. ["Aerial+", "Anticipate+", "Bruiser", "Block"]
  competitiveExperience: string; // e.g. "Ex-Horror XI CB, AFH Premier Div 1, ACL Semi-Finalist"
  vocalMic: boolean;
  notes?: string;
  contractStatus: 'Active First XI' | 'Development Contract' | 'Evaluating' | 'Trial Cleared' | 'Released';
  trialScore?: number; // e.g. 9.1
  submittedAt: string;
  avatarUrl?: string;
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number; // integer color, e.g., 0xE11D48
  fields?: DiscordEmbedField[];
  author?: {
    name: string;
    icon_url?: string;
    url?: string;
  };
  footer?: {
    text: string;
    icon_url?: string;
  };
  thumbnail?: {
    url: string;
  };
  timestamp?: string;
}

export interface DiscordMessage {
  id: string;
  author: {
    name: string;
    avatar: string;
    isBot?: boolean;
    roleColor?: string;
    tag?: string;
  };
  content?: string;
  embeds?: DiscordEmbed[];
  channelId: string;
  timestamp: string;
  reactions?: { emoji: string; count: number; users: string[] }[];
  actionButtons?: {
    id: string;
    label: string;
    style: 'primary' | 'secondary' | 'success' | 'danger';
    action: string;
    playerId?: string;
  }[];
}

export interface TacticalDirective {
  position: string;
  roleTitle: string;
  buildSpecs: string;
  keyPlayStyles: string[];
  tacticalInstruction: string;
  scoutingPriority: 'High' | 'Critical' | 'Medium';
}

export type RoleCategory = 
  | 'Management & Staff'
  | 'Competitive Squad Tiers'
  | 'Position Tags'
  | 'Community & Utility'
  | 'Game Interests'
  | 'Notifications'
  | 'Position'
  | 'Platform';

export interface SelfAssignableRole {
  id: string;
  name: string;
  category: RoleCategory;
  color: string;
  emoji: string;
  description: string;
  isSelfAssignable: boolean;
  memberCount?: number;
}

export interface DiscordMember {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  roles: string[]; // array of role IDs
  isAdmin?: boolean;
}

export interface RoleAuditEntry {
  id: string;
  action: 'add' | 'remove' | 'self_join' | 'self_leave';
  actor: string;
  targetUser: string;
  roleId: string;
  roleName: string;
  timestamp: string;
}

export interface ModerationAuditEntry {
  id: string;
  action: 'kick' | 'ban' | 'clear' | 'warn' | 'mute' | 'unmute';
  actor: string;
  targetUser?: string;
  reason: string;
  channelId?: string;
  count?: number;
  duration?: string;
  timestamp: string;
}

export interface FC27ClubStats {
  clubId: string;
  name: string;
  tag: string;
  division: number;
  skillRating: number;
  overallRecord: {
    wins: number;
    ties: number;
    losses: number;
    matches: number;
    winRate: number;
  };
  goalsScored: number;
  goalsConceded: number;
  goalDifference: number;
  cleanSheets: number;
  form: ('W' | 'D' | 'L')[];
  currentStreak: string;
  bestDivision: number;
  platform: string;
  membersCount: number;
  tierClassification: 'First XI Championship' | 'La Academia Development' | 'Open Lobby';
  seasonPoints: number;
  reputation: string;
}

export interface FC27PlayerStats {
  eaId: string;
  gamertag: string;
  discordTag?: string;
  position: Position;
  favoritePosition: string;
  overallRating: number;
  matchesPlayed: number;
  goals: number;
  assists: number;
  averageMatchRating: number;
  tacklesMade: number;
  tacklesSuccessRate: number;
  interceptions: number;
  passesMade: number;
  passSuccessRate: number;
  cleanSheets: number;
  manOfTheMatch: number;
  archetype: string;
  playstyles: string[];
  recentFormRating: number[];
  contractTier: SquadTier;
}

export interface FC27MatchResult {
  matchId: string;
  timestamp: string;
  opponentClub: string;
  opponentDivision: number;
  scoreHome: number;
  scoreAway: number;
  result: 'win' | 'loss' | 'draw';
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  passAccuracy: { home: number; away: number };
  competition: 'AFH Premier Division' | 'Major Tournament Cup' | 'Squad Scrim';
  topPerformer: { gamertag: string; rating: number; role: string; contribution: string };
}

