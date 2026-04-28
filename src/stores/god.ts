import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { GodDecree, Trait } from '@/systems/types';
import { ARCHETYPES } from '@/systems/constants';

interface GodDecreeStore {
  // Current active decree
  activeDecree: GodDecree | null;
  // History of decrees
  history: GodDecree[];
  // Cumulative alignment
  alignment: number;
  // When the next decree is available
  nextDecreeAt: number;

  actions: {
    generateDecree: (archetype: string) => void;
    chooseOption: (decreeId: string, optionIndex: number) => void;
    eligibleVehicles: () => number;
  };
}

// Pre-written scenario bank
const SCENARIOS: Array<{
  scenario: string;
  options: Array<{ label: string; alignment: number; happiness: number; force: number; empathy: number; trait: string }>;
  archetypes: string[];
}> = [
  {
    scenario: 'Your creature encountered a wounded stray in the wild. What do you decree?',
    options: [
      { label: 'Protect it', alignment: 8, happiness: 5, force: 0, empathy: 3, trait: 'Radiant' },
      { label: 'Devour it', alignment: -12, happiness: 2, force: 6, empathy: -2, trait: 'Merciless' },
      { label: 'Let it be', alignment: 2, happiness: 0, force: 0, empathy: 0, trait: 'None' },
    ],
    archetypes: ['Lumis', 'Umbra', 'Wraith'],
  },
  {
    scenario: 'A rival creature blocks the path. What do you decree?',
    options: [
      { label: 'Negotiate', alignment: 5, happiness: 2, force: -1, empathy: 2, trait: 'Radiant' },
      { label: 'Fight', alignment: -8, happiness: 4, force: 5, empathy: -1, trait: 'Merciless' },
      { label: 'Sneak past', alignment: -2, happiness: 3, force: 0, empathy: 0, trait: 'Capricious' },
    ],
    archetypes: ['Vex', 'Umbra', 'Lumis'],
  },
  {
    scenario: 'The void offers forbidden knowledge. Do you accept?',
    options: [
      { label: 'Accept', alignment: -5, happiness: 0, force: 3, empathy: -2, trait: 'Ancient' },
      { label: 'Refuse', alignment: 3, happiness: 2, force: -1, empathy: 2, trait: 'Radiant' },
      { label: 'Twist it', alignment: -3, happiness: 5, force: 0, empathy: -1, trait: 'Capricious' },
    ],
    archetypes: ['Wraith', 'Vex', 'Umbra'],
  },
  {
    scenario: 'A storm approaches the sanctuary. What shields your creature?',
    options: [
      { label: 'Light of dawn', alignment: 10, happiness: 3, force: 0, empathy: 2, trait: 'Radiant' },
      { label: 'Shadow cloak', alignment: -10, happiness: 0, force: 4, empathy: -1, trait: 'Merciless' },
      { label: 'Both at once', alignment: 0, happiness: 0, force: 2, empathy: 0, trait: 'Capricious' },
    ],
    archetypes: ['Lumis', 'Umbra', 'Vex'],
  },
  {
    scenario: 'Time itself asks a question of your creature. What does it answer?',
    options: [
      { label: 'I serve light', alignment: 7, happiness: 2, force: 0, empathy: 2, trait: 'Radiant' },
      { label: 'I am shadow', alignment: -7, happiness: 0, force: 3, empathy: -2, trait: 'Merciless' },
      { label: 'Silence', alignment: 0, happiness: 1, force: 0, empathy: 1, trait: 'Ancient' },
    ],
    archetypes: ['Wraith'],
  },
];

function selectScenario(archetype: string): (typeof SCENARIOS)[number] {
  const archetypeScenarios = SCENARIOS.filter(
    (s) => s.archetypes.length === 0 || s.archetypes.includes(archetype)
  );
  if (archetypeScenarios.length === 0) return SCENARIOS[0];
  return archetypeScenarios[Math.floor(Math.random() * archetypeScenarios.length)];
}

const HOURS_BETWEEN_DECREES = 0.01; // Real 12 hours in production, short for demo
// 12 * 3600 * 1000 for 12 hours; using a shorter gap for playability

function canGenerateNewDecree(nextDecreeAt: number): boolean {
  return Date.now() >= nextDecreeAt;
}

export const useGodDecreeStore = create<GodDecreeStore>()(
  persist(
    (set, get) => ({
      activeDecree: null,
      history: [],
      alignment: 0,
      nextDecreeAt: 0,

      actions: {
        generateDecree: (archetype: string) => {
          if (!canGenerateNewDecree(get().nextDecreeAt)) return;

          const selected = selectScenario(archetype);
          const decree: GodDecree = {
            id: `decree-${Date.now()}`,
            scenario: selected.scenario,
            options: selected.options.map((opt) => ({
              label: opt.label,
              alignmentDelta: opt.alignment,
              happinessDelta: opt.happiness,
              forceDelta: opt.force,
              empathyDelta: opt.empathy,
              traitHint: opt.trait,
            })),
            archetype: archetype as any,
            chosenIndex: null,
            timestamp: Date.now(),
            expiresAt: Date.now() + 3600 * 1000, // 1 hour to decide
          };

          set({
            activeDecree: decree,
            nextDecreeAt: Date.now() + HOURS_BETWEEN_DECREES * 1000,
          });
        },

        chooseOption: (decreeId: string, optionIndex: number) => {
          const state = get();
          if (!state.activeDecree || state.activeDecree.id !== decreeId) return;
          if (state.activeDecree.chosenIndex !== null) return;

          const option = state.activeDecree.options[optionIndex];
          if (!option) return;

          const resolved: GodDecree = {
            ...state.activeDecree,
            chosenIndex: optionIndex,
          };

          set({
            activeDecree: resolved,
            history: [...state.history, resolved],
            alignment: state.alignment + option.alignmentDelta,
          });
        },

        eligibleVehicles: () =>
          get().history.filter((d) => d.chosenIndex !== null).length,
      },
    }),
    {
      name: 'luminae-decrees-v1',
      partialize: (state) => ({
        history: state.history,
        alignment: state.alignment,
        nextDecreeAt: state.nextDecreeAt,
      }),
    }
  )
);

export function useGodDecrees() {
  return useGodDecreeStore((s) => s.activeDecree);
}

export function useGodDecreeActions() {
  return useGodDecreeStore((s) => s.actions);
}

// ──────────────────────── Trait Derivation ──────────────────────────────

export function calculateTraits(history: GodDecree[]): Trait[] {
  const traits: Trait[] = [];

  // Count consecutive light/shadow choices
  let lightStreak = 0;
  let shadowStreak = 0;
  let chaosChoices = 0;

  for (const decree of history) {
    if (decree.chosenIndex === null) continue;
    const opt = decree.options[decree.chosenIndex];
    if (opt.alignmentDelta > 0) {
      lightStreak++;
      shadowStreak = 0;
    } else if (opt.alignmentDelta < 0) {
      shadowStreak++;
      lightStreak = 0;
    }
    if (opt.alignmentDelta === 0) chaosChoices++;
  }

  if (lightStreak >= 5) traits.push('Radiant');
  if (shadowStreak >= 5) traits.push('Merciless');
  if (chaosChoices >= 15) traits.push('Capricious');

  return traits.length > 0 ? traits : ['None'];
}
