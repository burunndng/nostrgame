// ═══════════════════════════════════════════════════════════════════════════
// LUMINAE — Game Constants & Archetype Definitions
// ═══════════════════════════════════════════════════════════════════════════

import type { EvolutionStage, Affinity, CreatureArchetype, Food, BattleMove, Trait } from './types';

export const ARCHETYPES: CreatureArchetype[] = ['Lumis', 'Umbra', 'Vex', 'Wraith'];

export const AFFINITIES: Affinity[] = ['fire', 'water', 'void', 'storm', 'bloom', 'stone'];

export const TRAIT_DEFINITIONS: Record<Trait, { description: string; effect: string }> = {
  Merciless: {
    description: 'Force +10, unable to learn healing moves',
    effect: 'force+10,no-heal',
  },
  Radiant: {
    description: 'AOE glow aura in battle, heals self on kill',
    effect: 'glow-aura,kill-heal',
  },
  Capricious: {
    description: 'Random stat doubles and halves each battle',
    effect: 'random-double,random-half',
  },
  Ancient: {
    description: 'Immune to one-hit kills',
    effect: 'safety-net',
  },
  Feral: {
    description: 'Attacks random targets including allies',
    effect: 'wild-strike',
  },
  None: {
    description: 'No trait active',
    effect: 'none',
  },
};

export const EVOLUTION_STAGES: EvolutionStage[] = [
  {
    id: 1,
    name: 'Wisp',
    minDays: 0,
    maxDays: 6,
    requirements: ['Hatched'],
    description: 'A flickering spark of consciousness, barely more than a will-o-wisp.',
  },
  {
    id: 2,
    name: 'Sprite',
    minDays: 7,
    maxDays: 20,
    requirements: ['Survive 7 days', 'Win 3 battles'],
    description: 'The creature gains form and intent, its glow beginning to pulse with rhythm.',
  },
  {
    id: 3,
    name: 'Familiar',
    minDays: 21,
    maxDays: 49,
    requirements: ['Survive 21 days', 'Alignment ≥ 60 in any direction'],
    description: 'A distinct identity emerges. The creature speaks in dreams.',
  },
  {
    id: 4,
    name: 'Guardian',
    minDays: 50,
    maxDays: 99,
    requirements: ['Survive 50 days', 'Witness 3 evolution events'],
    description: 'Majestic and ancient, radiating power. Its presence reshapes the sanctuary.',
  },
  {
    id: 5,
    name: 'Eternal',
    minDays: 100,
    maxDays: Infinity,
    requirements: ['Survive 100 days', 'Achieve perfect bond (95+)'],
    description: 'Ascended beyond mortality. A legend walking the void between worlds.',
  },
];

export const DEFAULT_FOODS: Food[] = [
  {
    id: 'starbloom',
    name: 'Starbloom Fruit',
    cost: 15,
    hungerRestore: 25,
    alignmentDelta: 5,
    statBoost: { resonance: 2 },
    glowColor: '#ffd700',
    description: 'A fruit that fell from the sky. Boosts Resonance.',
  },
  {
    id: 'void-crystal',
    name: 'Void Crystal',
    cost: 20,
    hungerRestore: 20,
    alignmentDelta: -5,
    statBoost: { force: 3 },
    glowColor: '#7b2cbf',
    description: 'Compressed darkness. Harsh but potent. Boosts Force.',
  },
  {
    id: 'moss-pearl',
    name: 'Moss Pearl',
    cost: 10,
    hungerRestore: 15,
    alignmentDelta: 3,
    statBoost: { vitality: 2 },
    glowColor: '#a8e6cf',
    description: 'Gentle nourishment. Restores Vitality.',
  },
  {
    id: 'ember-root',
    name: 'Ember Root',
    cost: 12,
    hungerRestore: 18,
    alignmentDelta: -2,
    statBoost: { reflex: 2 },
    glowColor: '#e63946',
    description: 'Underground fire. Energizes movement.',
  },
  {
    id: 'heart-nectar',
    name: 'Heart Nectar',
    cost: 30,
    hungerRestore: 35,
    alignmentDelta: 8,
    statBoost: { bond: 3 },
    glowColor: '#ff99c8',
    description: 'Rare and precious. Deeply strengthens the bond between you.',
  },
];

export const BASE_MOVES: BattleMove[] = [
  {
    id: 'luminant-veil',
    name: 'Luminant Veil',
    category: 'Luminant',
    power: 35,
    accuracy: 100,
    cooldown: 0,
    description: 'A shimmering light cloaks the creature, restoring a sliver of health.',
  },
  {
    id: 'void-claw',
    name: 'Void Claw',
    category: 'Void',
    power: 45,
    accuracy: 95,
    cooldown: 0,
    description: 'Shadow rends the target, leaving a lingering wound.',
  },
  {
    id: 'elemental-surge',
    name: 'Elemental Surge',
    category: 'Elemental',
    power: 55,
    accuracy: 85,
    cooldown: 1,
    description: 'A burst of raw elemental power. Devastating but risky.',
  },
  {
    id: 'body-slam',
    name: 'Body Slam',
    category: 'Physical',
    power: 40,
    accuracy: 100,
    cooldown: 0,
    description: 'A reliable physical strike. No frills, no fail.',
  },
  {
    id: 'resonant-blast',
    name: 'Resonant Blast',
    category: 'Resonant',
    power: 50,
    accuracy: 90,
    cooldown: 1,
    description: 'A psychic pulse that bypasses physical defenses.',
  },
];

export const ARCHETYPE_BONUSES: Record<CreatureArchetype, Partial<{ [K in keyof import('./types').CreatureStats]: number }>> = {
  Lumis: { resonance: 15, force: -5 },
  Umbra: { force: 15, resonance: -5 },
  Vex: { reflex: 10, vitality: -3 },
  Wraith: { vitality: 5, resonance: 5 },
};

export const NEEDS_DECAY_RATES = {
  hunger: 8,
  energy: 5,
  happiness: 3,
  health: 2,
  stimulation: 4,
};

export const MAX_SKILL = 100;
export const MAX_NEED = 100;

export const ALIGNMENT_COLORS = {
  light: '#a8e6ff',
  neutral: '#7fffd4',
  shadow: '#8b1a4a',
};

export const AFFINITY_COLORS: Record<Affinity, string> = {
  fire: '#e63946',
  water: '#457b9d',
  void: '#7b2cbf',
  storm: '#ffbe0b',
  bloom: '#a8e6cf',
  stone: '#8d99ae',
};

export const GENESIS_PHRASES = [
  'Born from the void, shaped by your soul.',
  'A fragment of starlight given form.',
  'The abyss looked back, and it was beautiful.',
  'Ancient as silence, new as dawn.',
  'A whisper made flesh in the dark.',
  'The cosmos exhaled, and here you are.',
];

export function getCreatureStageByDays(days: number): EvolutionStage {
  for (const stage of EVOLUTION_STAGES) {
    if (days >= stage.minDays && days <= stage.maxDays) return stage;
  }
  return EVOLUTION_STAGES[EVOLUTION_STAGES.length - 1];
}

export function getAlignmentColor(alignment: number): string {
  if (alignment > 30) return ALIGNMENT_COLORS.light;
  if (alignment < -30) return ALIGNMENT_COLORS.shadow;
  return ALIGNMENT_COLORS.neutral;
}

export function getArchetypeDescription(archetype: CreatureArchetype): string {
  switch (archetype) {
    case 'Lumis':
      return 'Healers of light. High Resonance, low Force. They seek harmony.';
    case 'Umbra':
      return 'Predators of shadow. High Force, low Empathy. They know survival.';
    case 'Vex':
      return 'Tricksters of chaos. High Reflex and Luck. They defy prediction.';
    case 'Wraith':
      return 'Sages of neutrality. High Wisdom. They grow with time.';
    default:
      return 'An ancient soul, beyond classification.';
  }
}
