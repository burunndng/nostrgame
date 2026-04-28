import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { CreatureState, CreatureNeeds, CreatureStats, Trait } from '@/systems/types';
import type { Food } from '@/systems/types';
import { summonCreature, suggestCreatureName, deriveCreatureHash } from '@/systems/genetics';
import {
  NEEDS_DECAY_RATES,
  MAX_NEED,
  MAX_SKILL,
  ARCHETYPE_BONUSES,
  DEFAULT_FOODS,
  getCreatureStageByDays,
} from '@/systems/constants';

// ──────────────────────────── State Slice ─────────────────────────────────

interface CreatureStore {
  creature: CreatureState | null;
  isEvolving: boolean;
  evolutionProgress: number;
  lastSynced: number;

  actions: {
    summon: (npub: string) => void;
    tick: (now: number) => void;
    feed: (food: Food) => void;
    pet: () => void;
    train: () => void;
    discipline: () => void;
    praise: () => void;
    cureSickness: () => void;
    evolve: () => boolean;
    setName: (name: string) => void;
    startEvolution: () => void;
    completeEvolution: () => void;
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function clampNeed(n: number): number {
  return clamp(n, 0, MAX_NEED);
}

function clampSkill(n: number): number {
  return clamp(n, 0, MAX_SKILL);
}

function createDefaultState(npub: string): CreatureState {
  const genome = summonCreature(npub);
  const hash = deriveCreatureHash(npub);
  const bonuses = ARCHETYPE_BONUSES[genome.archetype];
  const now = Math.floor(Date.now() / 1000);

  const baseStats: CreatureStats = {
    vitality: clampSkill(40 + (bonuses.vitality ?? 0)),
    force: clampSkill(45 + (bonuses.force ?? 0)),
    resonance: clampSkill(35 + (bonuses.resonance ?? 0)),
    reflex: clampSkill(40 + (bonuses.reflex ?? 0)),
    presence: 20,
    bond: 10,
  };

  return {
    genome,
    name: suggestCreatureName(hash, genome.archetype),
    stage: 1,
    alignment: 0,
    stats: baseStats,
    needs: {
      hunger: 80,
      energy: 90,
      happiness: 70,
      health: 100,
      stimulation: 60,
    },
    traits: [],
    wins: 0,
    losses: 0,
    xp: 0,
    xpToNext: 100,
    lumens: 150,
    birthTimestamp: now,
    lastInteraction: now,
    isSleeping: false,
    sleepOffset: (hash[17] % 8) + 2, // 2–9 hours offset from midnight
    lastUpdate: now,
    isEvolving: false,
    evolutionProgress: 0,
    godAlignment: 0,
  };
}

// ─────────────────────────── Decay Math ───────────────────────────────────

function decayNeeds(needs: CreatureNeeds, hoursElapsed: number, isSleeping: boolean): CreatureNeeds {
  const multiplier = isSleeping ? 0.4 : 1.0;

  const newNeeds: CreatureNeeds = {
    hunger: needs.hunger - NEEDS_DECAY_RATES.hunger * hoursElapsed * multiplier,
    energy: isSleeping
      ? Math.min(100, needs.energy + 10 * hoursElapsed)
      : needs.energy - NEEDS_DECAY_RATES.energy * hoursElapsed,
    happiness: needs.happiness - NEEDS_DECAY_RATES.happiness * hoursElapsed * multiplier,
    health: needs.hunger <= 0
      ? needs.health - NEEDS_DECAY_RATES.health * hoursElapsed * multiplier
      : clampNeed(needs.health + 2 * hoursElapsed * multiplier),
    stimulation: needs.stimulation - NEEDS_DECAY_RATES.stimulation * hoursElapsed * multiplier,
  };

  return {
    hunger: clampNeed(newNeeds.hunger),
    energy: clampNeed(newNeeds.energy),
    happiness: clampNeed(newNeeds.happiness),
    health: clampNeed(newNeeds.health),
    stimulation: clampNeed(newNeeds.stimulation),
  };
}

function derivePenaltyFromNeeds(needs: CreatureNeeds, stats: CreatureStats, hoursElapsed: number): CreatureStats {
  let penalty = { ...stats };
  if (needs.hunger <= 0) {
    penalty.vitality = clampSkill(penalty.vitality - 2 * hoursElapsed);
  }
  if (needs.health <= 0) {
    // Sickness halves effective stats temporarily
    penalty.vitality = clampSkill(penalty.vitality * 0.95);
  }
  if (needs.happiness <= 0) {
    penalty.bond = clampSkill(penalty.bond - 1 * hoursElapsed);
  }
  if (needs.stimulation <= 0) {
    // Lower reflex from boredom
    penalty.reflex = clampSkill(penalty.reflex - 0.5 * hoursElapsed);
  }
  return penalty;
}

function getEmotionFromState(state: CreatureState): import('./types').Emotion {
  if (state.needs.health === 0) return 'sick';
  if (state.isSleeping) return 'sleeping';
  if (state.needs.hunger < 20) return 'hungry';
  if (state.needs.happiness > 85 && state.needs.energy > 60) return 'happy';
  if (state.needs.energy < 20) return 'sleeping';
  if (state.needs.happiness < 20) return 'hungry'; // stressed
  if (state.bond > 80 && state.needs.happiness > 70) return 'excited';
  return 'breathing';
}

function getDaysAlive(state: CreatureState): number {
  const now = Math.floor(Date.now() / 1000);
  const diffSeconds = now - state.birthTimestamp;
  return Math.floor(diffSeconds / 86400);
}

// ─────────────────────────── Zustand Store ────────────────────────────────

export const useCreatureStore = create<CreatureStore>()(
  persist(
    (set, get) => ({
      creature: null,
      isEvolving: false,
      evolutionProgress: 0,
      lastSynced: 0,

      actions: {
        summon: (npub: string) => {
          const existing = get().creature;
          if (existing) return; // Only one creature per player
          set({ creature: createDefaultState(npub) });
        },

        tick: (now: number) => {
          const state = get().creature;
          if (!state || state.isEvolving) return;

          const elapsedSeconds = now - state.lastUpdate;
          if (elapsedSeconds < 1) return; // Don't tick every frame

          const hoursElapsed = elapsedSeconds / 3600;
          const currentHour = (new Date().getHours() + state.sleepOffset) % 24;
          const shouldSleep = currentHour >= 22 || currentHour < 6;

          const newNeeds = decayNeeds(
            state.needs,
            hoursElapsed,
            state.isSleeping || shouldSleep
          );

          const newStats = derivePenaltyFromNeeds(
            newNeeds,
            state.stats,
            hoursElapsed
          );

          // Bond very slowly decays if neglected
          const bondDecay = state.lastInteraction < now - 86400
            ? 3 * hoursElapsed
            : 0;
          newStats.bond = clampSkill(newStats.bond - bondDecay);

          set({
            creature: {
              ...state,
              needs: newNeeds,
              stats: newStats,
              isSleeping: shouldSleep,
              lastUpdate: now,
            },
          });
        },

        feed: (food: Food) => {
          const state = get().creature;
          if (!state) return;

          const cost = food.cost;
          if (state.lumens < cost) return;

          const newNeeds: CreatureNeeds = {
            ...state.needs,
            hunger: clampNeed(state.needs.hunger + food.hungerRestore),
          };

          const newStats: CreatureStats = { ...state.stats };
          for (const [key, val] of Object.entries(food.statBoost)) {
            const statKey = key as keyof CreatureStats;
            newStats[statKey] = clampSkill(newStats[statKey] + (val ?? 0));
          }

          set({
            creature: {
              ...state,
              lumens: state.lumens - cost,
              needs: newNeeds,
              stats: newStats,
              alignment: clamp(state.alignment + food.alignmentDelta, -100, 100),
              lastInteraction: Math.floor(Date.now() / 1000),
            },
          });
        },

        pet: () => {
          const state = get().creature;
          if (!state) return;
          set({
            creature: {
              ...state,
              needs: {
                ...state.needs,
                happiness: clampNeed(state.needs.happiness + 2),
              },
              stats: {
                ...state.stats,
                bond: clampSkill(state.stats.bond + 0.1),
              },
              lastInteraction: Math.floor(Date.now() / 1000),
            },
          });
        },

        train: () => {
          const state = get().creature;
          if (!state || state.needs.energy < 10) return;

          const statKeys: (keyof CreatureStats)[] = ['force', 'reflex', 'vitality', 'resonance'];
          const boosted = statKeys[Math.floor(Math.random() * statKeys.length)];

          set({
            creature: {
              ...state,
              needs: {
                ...state.needs,
                energy: clampNeed(state.needs.energy - 10),
              },
              stats: {
                ...state.stats,
                [boosted]: clampSkill(state.stats[boosted] + 3),
              },
              lastInteraction: Math.floor(Date.now() / 1000),
            },
          });
        },

        discipline: () => {
          const state = get().creature;
          if (!state) return;
          set({
            creature: {
              ...state,
              alignment: clamp(state.alignment - 3, -100, 100),
              needs: {
                ...state.needs,
                happiness: clampNeed(state.needs.happiness - 2),
              },
              lastInteraction: Math.floor(Date.now() / 1000),
            },
          });
        },

        praise: () => {
          const state = get().creature;
          if (!state) return;
          set({
            creature: {
              ...state,
              alignment: clamp(state.alignment + 5, -100, 100),
              needs: {
                ...state.needs,
                happiness: clampNeed(state.needs.happiness + 5),
              },
              lastInteraction: Math.floor(Date.now() / 1000),
            },
          });
        },

        cureSickness: () => {
          const state = get().creature;
          if (!state) return;
          const cost = 100; // 100 sats worth of lumens
          if (state.lumens < cost) return;
          set({
            creature: {
              ...state,
              lumens: state.lumens - cost,
              needs: {
                ...state.needs,
                health: MAX_NEED,
                hunger: clampNeed(state.needs.hunger + 20),
              },
              lastInteraction: Math.floor(Date.now() / 1000),
            },
          });
        },

        evolve: () => {
          const state = get().creature;
          if (!state || state.isEvolving) return false;

          const days = getDaysAlive(state);
          const nextStage = getCreatureStageByDays(days);

          if (nextStage.id <= state.stage) return false;

          // Check evolution requirements
          if (nextStage.id === 2 && state.wins < 3) return false;
          if (nextStage.id === 3 && Math.abs(state.alignment) < 60) return false;
          if (nextStage.id === 5 && state.stats.bond < 95) return false;

          set({
            creature: {
              ...state,
              stage: nextStage.id,
              isEvolving: false,
              evolutionProgress: 0,
            },
            isEvolving: false,
            evolutionProgress: 0,
          });

          return true;
        },

        setName: (name: string) => {
          const state = get().creature;
          if (!state) return;
          set({ creature: { ...state, name: name.slice(0, 24) } });
        },

        startEvolution: () => {
          set({ isEvolving: true, evolutionProgress: 0 });
        },

        completeEvolution: () => {
          const state = get().creature;
          if (!state) return;
          const nextStage = state.stage + 1;
          if (nextStage > 5) return;
          set({
            creature: {
              ...state,
              stage: nextStage,
              isEvolving: false,
              evolutionProgress: 0,
            },
            isEvolving: false,
            evolutionProgress: 0,
          });
        },
      },
    }),
    {
      name: 'luminae-creature-v1',
      partialize: (state) => ({
        creature: state.creature,
        lastSynced: state.lastSynced,
      }),
    }
  )
);

// Convenience hook for just the creature data
export function useCreature() {
  return useCreatureStore((s) => s.creature);
}

export function useCreatureActions() {
  return useCreatureStore((s) => s.actions);
}

export { getEmotionFromState, getDaysAlive };
