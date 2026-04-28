// ═══════════════════════════════════════════════════════════════════════════
// LUMINAE — Core Type Definitions
// ═══════════════════════════════════════════════════════════════════════════

export type CreatureArchetype = 'Lumis' | 'Umbra' | 'Vex' | 'Wraith';

export type Affinity = 'fire' | 'water' | 'void' | 'storm' | 'bloom' | 'stone';

export type EvolutionStage = {
  id: 1 | 2 | 3 | 4 | 5;
  name: string;
  minDays: number;
  maxDays: number;
  requirements: string[];
  description: string;
};

export type Emotion =
  | 'breathing'
  | 'happy'
  | 'hungry'
  | 'sleeping'
  | 'excited'
  | 'sick'
  | 'feral'
  | 'neutral';

export type Trait =
  | 'Merciless'
  | 'Radiant'
  | 'Capricious'
  | 'Ancient'
  | 'Feral'
  | 'None';

export interface CreatureGenome {
  archetype: CreatureArchetype;
  baseHue: number;
  bodyMorphSeed: Uint8Array;
  innateAffinity: Affinity;
  birthmark: string;
}

export interface CreatureStats {
  vitality: number;
  force: number;
  resonance: number;
  reflex: number;
  presence: number;
  bond: number;
}

export interface DerivedStats {
  hp: number;
  maxHp: number;
  speed: number;
  critChance: number;
  socialBoost: number;
}

export interface CreatureNeeds {
  hunger: number;
  energy: number;
  happiness: number;
  health: number;
  stimulation: number;
}

export interface CreatureState {
  genome: CreatureGenome;
  name: string;
  stage: number;
  alignment: number; // -100 Shadow to +100 Light
  stats: CreatureStats;
  needs: CreatureNeeds;
  traits: Trait[];
  wins: number;
  losses: number;
  xp: number;
  xpToNext: number;
  lumens: number;
  birthTimestamp: number;
  lastInteraction: number;
  isSleeping: boolean;
  sleepOffset: number; // hours from midnight (0-24)
  lastUpdate: number;
  isEvolving: boolean;
  evolutionProgress: number;
  godAlignment: number;
}

export interface GodDecreeOption {
  label: string;
  alignmentDelta: number;
  happinessDelta: number;
  forceDelta: number;
  empathyDelta: number;
  traitHint: string;
}

export interface GodDecree {
  id: string;
  scenario: string;
  options: GodDecreeOption[];
  archetype: CreatureArchetype;
  chosenIndex: number | null;
  timestamp: number;
  expiresAt: number;
}

export type MoveCategory = 'Luminant' | 'Void' | 'Elemental' | 'Physical' | 'Resonant';

export interface BattleMove {
  id: string;
  name: string;
  category: MoveCategory;
  power: number;
  accuracy: number;
  cooldown: number;
  description: string;
  affinity?: Affinity;
}

export interface BattleParticipant {
  npub: string;
  creature: CreatureState;
  moves: BattleMove[];
  currentHp: number;
  adrenaline: number;
  moveSequence: number[];
  ready: boolean;
}

export interface BattleState {
  id: string;
  participants: [BattleParticipant, BattleParticipant];
  round: number;
  turn: number;
  isComplete: boolean;
  winner: string | null;
  spectators: string[];
  totalZaps: number;
  battleLog: BattleLogEntry[];
  public: boolean;
  phase: 'challenge' | 'prep' | 'active' | 'resolve' | 'done';
}

export interface BattleLogEntry {
  turn: number;
  actor: string;
  move: string;
  damage: number;
  crit: boolean;
  dodged: boolean;
  newHp: number;
  timestamp: number;
}

export interface Food {
  id: string;
  name: string;
  cost: number;
  hungerRestore: number;
  alignmentDelta: number;
  statBoost: Partial<CreatureStats>;
  glowColor: string;
  description: string;
}

export interface ItemDrop {
  id: string;
  name: string;
  rarity: 'Common' | 'Rare' | 'Mythic';
  effect: string;
}

export interface DreamEvent {
  id: string;
  text: string;
  archetype: CreatureArchetype;
  stage: number;
  timestamp: number;
  published: boolean;
}

export interface PersonProfile {
  npub: string;
  creatureName: string;
  stage: number;
  archetype: CreatureArchetype;
  alignment: number;
  wins: number;
  losses: number;
  bond: number;
  elo: number;
  hue: number;
  traits: Trait[];
}

export type NotificationType =
  | 'hunger'
  | 'sick'
  | 'challenge'
  | 'evolution'
  | 'sleep'
  | 'decree';

export interface DecisionRecord {
  decreeId: string;
  optionIndex: number;
  timestamp: number;
  alignmentDelta: number;
}

export interface LeaderboardEntry {
  npub: string;
  name: string;
  archetype: CreatureArchetype;
  stage: number;
  elo: number;
  wins: number;
  losses: number;
  hue: number;
}
