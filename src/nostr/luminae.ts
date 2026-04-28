import type { CreatureState, GodDecree } from '@/systems/types';

// LUMINAE custom Nostr event kinds
export const LUMINAE_KINDS = {
  CREATURE_STATE: 30042,
  BATTLE_CHALLENGE: 30043,
  GOD_DECREE: 30044,
  EVOLUTION_ANNOUNCEMENT: 30045,
  DREAM_EVENT: 30046,
} as const;

/** Publish creature state as kind 30042 parameterized replaceable event */
export async function publishCreatureState(
  publish: (partial: { kind: number; content: string; tags: string[][] }) => Promise<unknown>,
  npub: string,
  creature: CreatureState
): Promise<void> {
  const tags: string[][] = [
    ['d', npub],
    ['name', creature.name],
    ['archetype', creature.genome.archetype.toLowerCase()],
    ['stage', String(creature.stage)],
    ['alignment', String(creature.alignment)],
    ['vitality', String(Math.round(creature.stats.vitality))],
    ['force', String(Math.round(creature.stats.force))],
    ['resonance', String(Math.round(creature.stats.resonance))],
    ['reflex', String(Math.round(creature.stats.reflex))],
    ['presence', String(Math.round(creature.stats.presence))],
    ['bond', String(Math.round(creature.stats.bond))],
    ['hunger', String(Math.round(creature.needs.hunger))],
    ['energy', String(Math.round(creature.needs.energy))],
    ['happiness', String(Math.round(creature.needs.happiness))],
    ['health', String(Math.round(creature.needs.health))],
    ['stimulation', String(Math.round(creature.needs.stimulation))],
    ['traits', creature.traits.join(',') || 'none'],
    ['wins', String(creature.wins)],
    ['losses', String(creature.losses)],
    ['hue', String(Math.round(creature.genome.baseHue))],
    ['glow_intensity', String(0.5 + (creature.stats.bond / 100) * 0.5)],
  ];

  // Include alt tag as required for custom kinds
  tags.push(['alt', `LUMINAE creature ${creature.name} state`]);

  await publish({
    kind: LUMINAE_KINDS.CREATURE_STATE,
    content: JSON.stringify({
      name: creature.name,
      archetype: creature.genome.archetype,
      stage: creature.stage,
      alignment: creature.alignment,
      affinity: creature.genome.innateAffinity,
      birthmark: creature.genome.birthmark,
      wins: creature.wins,
      losses: creature.losses,
      lumens: creature.lumens,
    }),
    tags,
  });
}

/** Publish a god decree as kind 30044 */
export async function publishGodDecree(
  publish: (partial: { kind: number; content: string; tags: string[][] }) => Promise<unknown>,
  npub: string,
  decree: GodDecree,
  chosenIndex: number
): Promise<void> {
  const option = decree.options[chosenIndex];
  if (!option) return;

  const tags: string[][] = [
    ['d', npub],
    ['scenario', decree.id],
    ['choice', String(chosenIndex)],
    ['alignment_delta', String(option.alignmentDelta)],
    ['alt', `LUMINAE god decree: ${decree.scenario.split(':')[0]}`],
  ];

  await publish({
    kind: LUMINAE_KINDS.GOD_DECREE,
    content: JSON.stringify({
      scenario: decree.scenario,
      choice: option.label,
      alignment_delta: option.alignmentDelta,
      timestamp: Date.now(),
    }),
    tags,
  });
}

/** Publish evolution announcement kind 30045 */
export async function publishEvolution(
  publish: (partial: { kind: number; content: string; tags: string[][] }) => Promise<unknown>,
  npub: string,
  fromStage: number,
  toStage: number,
  creature: CreatureState
): Promise<void> {
  const stageNames = ['', 'Wisp', 'Sprite', 'Familiar', 'Guardian', 'Eternal'];
  const tags: string[][] = [
    ['d', npub],
    ['from', String(fromStage)],
    ['to', String(toStage)],
    ['alt', `LUMINAE: ${creature.name} evolved to ${stageNames[toStage]}!`],
  ];

  await publish({
    kind: LUMINAE_KINDS.EVOLUTION_ANNOUNCEMENT,
    content: JSON.stringify({
      name: creature.name,
      from: stageNames[fromStage],
      to: stageNames[toStage],
      archetype: creature.genome.archetype,
      alignment: creature.alignment,
      timestamp: Date.now(),
    }),
    tags,
  });
}

/** Publish dream event kind 30046 */
export async function publishDream(
  publish: (partial: { kind: number; content: string; tags: string[][] }) => Promise<unknown>,
  npub: string,
  dreamText: string,
  creature: CreatureState
): Promise<void> {
  const tags: string[][] = [
    ['d', npub],
    ['dream', 'true'],
    ['stage', String(creature.stage)],
    ['alt', `LUMINAE dream from ${creature.name}`],
  ];

  await publish({
    kind: LUMINAE_KINDS.DREAM_EVENT,
    content: dreamText,
    tags,
  });
}

/** Publish battle challenge kind 30043 */
export async function publishBattleChallenge(
  publish: (partial: { kind: number; content: string; tags: string[][] }) => Promise<unknown>,
  fromNpub: string,
  toNpub: string,
  battleId: string
): Promise<void> {
  const tags: string[][] = [
    ['d', fromNpub],
    ['p', toNpub],
    ['battle_id', battleId],
    ['alt', 'LUMINAE battle challenge'],
  ];

  await publish({
    kind: LUMINAE_KINDS.BATTLE_CHALLENGE,
    content: JSON.stringify({ from: fromNpub, to: toNpub, battle_id: battleId, timestamp: Date.now() }),
    tags,
  });
}
