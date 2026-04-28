import type { CreatureGenome, CreatureArchetype, Affinity } from './types';
import { ARCHETYPES, AFFINITIES } from './constants';

function seededBytes(seed: string, count: number): number[] {
  const result: number[] = [];
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    state ^= seed.charCodeAt(i);
    state += (state << 1) + (state << 4) + (state << 7) + (state << 8) + (state << 24);
  }
  for (let i = 0; i < count; i++) {
    state = (state * 16807 + 0) % 2147483647;
    result.push((state >>> 0) % 256);
  }
  return result;
}

export function deriveCreatureHash(npub: string): number[] {
  return seededBytes(npub, 32);
}

export function deriveArchetype(hash: number[]): CreatureArchetype {
  return ARCHETYPES[hash[0] % ARCHETYPES.length];
}

export function deriveBaseHue(hash: number[]): number {
  return (hash[1] * 360) / 255;
}

export function deriveBodyMorphSeed(hash: number[]): Uint8Array {
  return new Uint8Array(hash.slice(2, 10));
}

export function deriveAffinity(hash: number[]): Affinity {
  return AFFINITIES[hash[10] % AFFINITIES.length];
}

export function deriveBirthmark(hash: number[]): string {
  const hexChars = '0123456789abcdef';
  let hexString = '';
  for (let i = 11; i < Math.min(31, hash.length); i++) {
    hexString += hexChars[hash[i] >>> 4] + hexChars[hash[i] & 0xf];
  }

  const glyphs = ['◆', '◉', '◇', '⬡', '✦', '◎', '◈', '⬢', '✶', '◊', '⟁', '⬣', '✹', '◐', '◑', '⬤'];

  const sigilParts: string[] = [];
  for (let i = 0; i < hexString.length; i += 4) {
    const chunk = hexString.slice(i, i + 4);
    if (chunk.length === 4) {
      const val = parseInt(chunk, 16);
      if (!Number.isNaN(val)) {
        sigilParts.push(glyphs[val % glyphs.length]);
      }
    }
  }

  return [
    sigilParts[0] ?? '◆',
    '·',
    sigilParts[1] ?? '◇',
    '·',
    sigilParts[2] ?? '✦',
    '·',
    sigilParts[3] ?? '◉',
    '·',
    sigilParts[4] ?? '◎',
  ].join('');
}

export function summonCreature(npub: string): CreatureGenome {
  const hash = deriveCreatureHash(npub);
  return {
    archetype: deriveArchetype(hash),
    baseHue: deriveBaseHue(hash),
    bodyMorphSeed: deriveBodyMorphSeed(hash),
    innateAffinity: deriveAffinity(hash),
    birthmark: deriveBirthmark(hash),
  };
}

export function suggestCreatureName(hash: number[], archetype: CreatureArchetype): string {
  const prefixMap: Record<CreatureArchetype, string[]> = {
    Lumis: ['Sol', 'Lux', 'Dawn', 'Cele', 'Ari', 'El', 'Or'],
    Umbra: ['Nyx', 'Umb', 'Mor', 'Shad', 'At', 'Ves', 'Noc'],
    Vex: ['Trisk', 'Jinx', 'Chaos', 'Rift', 'Mys', 'Glit', 'Flux'],
    Wraith: ['Aeth', 'Ves', 'Tom', 'Eld', 'Sages', 'Wis', 'Kael'],
  };

  const suffixMap: Record<CreatureArchetype, string[]> = {
    Lumis: ['ara', 'iel', 'aris', 'on', 'is', 'ara', 'ius'],
    Umbra: ['ara', 'is', 'on', 'iel', 'os', 'a', 'um'],
    Vex: ['is', 'ix', 'os', 'a', 'on', 'um', 'el'],
    Wraith: ['ra', 'on', 'is', 'um', 'iel', 'os', 'a'],
  };

  const prefixes = prefixMap[archetype];
  const suffixes = suffixMap[archetype];

  const prefixIndex = hash[12] % prefixes.length;
  const suffixIndex = hash[13] % suffixes.length;

  if (hash[14] % 5 === 0) {
    const prefix2 = prefixes[hash[15] % prefixes.length];
    const secondSuffix = suffixes[hash[16] % suffixes.length];
    return `${prefixes[prefixIndex]}${suffixes[suffixIndex]}${prefix2.charAt(0).toUpperCase()}${prefix2.slice(1)}${secondSuffix}`.toLowerCase();
  }

  return `${prefixes[prefixIndex]}${suffixes[suffixIndex]}`.toLowerCase();
}

export function generateDreamText(hash: number[], stage: number): string {
  const fragments = [
    'the silence between stars',
    'a garden of glass flowers',
    'a door that opens inward',
    'the memory of a forgotten sun',
    'wings made of static',
    'twilight that never ends',
    'a tower of mirrored rooms',
    'soft footsteps in deep water',
    'a compass that points to yesterday',
    'teeth of silver, tongue of flame',
    'the last color before the void',
    'a place where gravity weeps',
    'thirteen candles and no wind',
    'the shape of your own echo',
    'roots drinking from a dreamless sleep',
    'a throne abandoned by time',
  ];

  const verbs = ['walked through', 'saw', 'touched', 'heard', 'became', 'waited in', 'fled from', 'sang to'];
  const begin = ['I dreamt that I', 'Last night I', 'In my rest I', 'A vision came — I did', 'The dark showed me — I did'];
  const end = [
    'and there was peace.',
    'and it knew my name.',
    'but I could not stay.',
    'and I woke changed.',
    'and something followed me back.',
  ];

  const idx = hash[stage % hash.length] % fragments.length;
  const vIdx = hash[(stage + 2) % hash.length] % verbs.length;
  const bIdx = hash[(stage + 3) % hash.length] % begin.length;
  const eIdx = hash[(stage + 5) % hash.length] % end.length;

  return `${begin[bIdx]} ${verbs[vIdx]} ${fragments[idx]}, ${end[eIdx]}`;
}
